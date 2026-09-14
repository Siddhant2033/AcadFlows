import api from './api';

export const platformApi = {
  /* Dashboard */
  getStats: () => api.get('/platform/stats'),
  getRecentActivity: () => api.get('/platform/recent-activity'),
  getPendingCounts: () => api.get('/platform/pending-counts'),

  /* Schools */
  listSchools: (params?: {
    status?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) => {
    const qs = new URLSearchParams();
    if (params?.status) qs.set('status', params.status);
    if (params?.search) qs.set('search', params.search);
    if (params?.page) qs.set('page', String(params.page));
    if (params?.limit) qs.set('limit', String(params.limit));
    return api.get(`/platform/schools?${qs}`);
  },
  listPendingSchools: () => api.get('/platform/schools/pending'),
  getSchool: (tenantId: string) => api.get(`/platform/schools/${tenantId}`),
  approveSchool: (tenantId: string) =>
    api.post(`/platform/schools/${tenantId}/approve`),
  rejectSchool: (tenantId: string, reason: string) =>
    api.post(`/platform/schools/${tenantId}/reject`, { reason }),
  suspendSchool: (tenantId: string, reason: string) =>
    api.post(`/platform/schools/${tenantId}/suspend`, { reason }),
  reactivateSchool: (tenantId: string) =>
    api.post(`/platform/schools/${tenantId}/reactivate`),
  deleteSchool: (tenantId: string) =>
    api.delete(`/platform/schools/${tenantId}`),

  /* Users */
  listUsers: (params?: {
    tenantId?: string;
    role?: string;
    status?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) => {
    const qs = new URLSearchParams();
    if (params?.tenantId) qs.set('tenantId', params.tenantId);
    if (params?.role) qs.set('role', params.role);
    if (params?.status) qs.set('status', params.status);
    if (params?.search) qs.set('search', params.search);
    if (params?.page) qs.set('page', String(params.page));
    if (params?.limit) qs.set('limit', String(params.limit));
    return api.get(`/platform/users?${qs}`);
  },
  getUser: (userId: string) => api.get(`/platform/users/${userId}`),
  approveUser: (userId: string) => api.post(`/platform/users/${userId}/approve`),
  rejectUser: (userId: string, reason: string) =>
    api.post(`/platform/users/${userId}/reject`, { reason }),
  suspendUser: (userId: string, reason: string) =>
    api.post(`/platform/users/${userId}/suspend`, { reason }),
  reactivateUser: (userId: string) =>
    api.post(`/platform/users/${userId}/reactivate`),
};

export default platformApi;