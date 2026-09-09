import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Skip refresh for these endpoints
const skipRefreshEndpoints = [
  '/auth/refresh',
  '/auth/login',
  '/auth/register',
  '/tenants/current',
  '/tenants',
];

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const url = originalRequest?.url || '';
    
    // Skip refresh for specific endpoints
    if (skipRefreshEndpoints.some(endpoint => url.includes(endpoint))) {
      return Promise.reject(error);
    }
    
    // Only handle 401 errors
    if (error.response?.status !== 401) {
      return Promise.reject(error);
    }
    
    // Skip if already retried
    if (originalRequest._retry) {
      return Promise.reject(error);
    }
    
    originalRequest._retry = true;
    
    try {
      const response = await api.post('/auth/refresh');
      const newToken = response.data.data?.accessToken;
      
      if (newToken) {
        localStorage.setItem('accessToken', newToken);
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return api(originalRequest);
      }
      
      throw new Error('No token received');
    } catch (refreshError) {
      localStorage.removeItem('accessToken');
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
      return Promise.reject(refreshError);
    }
  }
);

export default api;