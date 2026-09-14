import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

/**
 * Endpoints that should NOT trigger the refresh flow when they 401.
 * Keep this list narrow — anything broad like '/tenants' will silently
 * skip refresh for most of the app.
 *
 * Anything listed here will:
 *   1. Skip the automatic token-refresh attempt.
 *   2. Never trigger the hard redirect to /login.
 *   3. Propagate the raw error to the calling code, which is expected
 *      to handle it (usually via getErrorMessage()).
 */
const skipRefreshEndpoints = [
  '/auth/refresh',
  '/auth/login',
  '/auth/register',
  '/auth/forgot-password',
  '/auth/reset-password',
  '/tenants/current',
  '/tenants/public',
  '/tenants/validate-code',
  '/tenants/create-school',
  // Public student verification endpoints — used during registration
  // while the user has no session. The global 401-handler must not
  // see these or it will bounce the register flow to /login.
  '/students/verify-identity',
  '/students/verify-rollno',
  '/students/tenant/',
];

// ─── Request interceptor ───
api.interceptors.request.use(
  config => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  error => Promise.reject(error),
);

// ─── Response interceptor ───
api.interceptors.response.use(
  response => response,
  async error => {
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

    // Nothing to refresh — the user was never logged in. Don't force
    // a redirect; let the calling page decide what to do. This is what
    // prevents public flows (register, verify, password reset) from
    // bouncing to /login on a benign 401.
    const hasRefreshCookie = document.cookie.includes('refreshToken');
    const hasStoredToken = !!localStorage.getItem('accessToken');
    if (!hasRefreshCookie && !hasStoredToken) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    console.log('🔁 Access token expired, attempting refresh…');

    try {
      const response = await api.post('/auth/refresh');
      const newToken = response.data.data?.accessToken;

      if (newToken) {
        localStorage.setItem('accessToken', newToken);
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        console.log('✅ Token refreshed, retrying request');
        return api(originalRequest);
      }

      throw new Error('No token received from refresh');
    } catch (refreshError) {
      console.warn('❌ Token refresh failed, logging out');
      localStorage.removeItem('accessToken');
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
      return Promise.reject(refreshError);
    }
  },
);

export default api;