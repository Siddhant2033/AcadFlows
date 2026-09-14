import api from './api';

export const approvalsApi = {
  /* Counts for sidebar badge */
  getCounts: () => api.get('/approvals/pending-counts'),

  /* Lists */
  listPendingTeachers: () => api.get('/approvals/pending/teachers'),
  listPendingStudents: () => api.get('/approvals/pending/students'),
  listPendingGuardians: () => api.get('/approvals/pending/guardians'),

  /* Actions */
  approveTeacher: (id: string) =>
    api.post(`/approvals/teachers/${id}/approve`),
  rejectTeacher: (id: string, reason: string) =>
    api.post(`/approvals/teachers/${id}/reject`, { reason }),

  approveStudent: (id: string) =>
    api.post(`/approvals/students/${id}/approve`),
  rejectStudent: (id: string, reason: string) =>
    api.post(`/approvals/students/${id}/reject`, { reason }),

  approveGuardian: (userId: string) =>
    api.post(`/approvals/guardians/${userId}/approve`),
  rejectGuardian: (userId: string, reason: string) =>
    api.post(`/approvals/guardians/${userId}/reject`, { reason }),
};

export default approvalsApi;