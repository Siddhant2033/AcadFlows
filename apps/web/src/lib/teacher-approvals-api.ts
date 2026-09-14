import api from './api';

export const teacherApprovalsApi = {
  /* Counts for sidebar badge */
  getCounts: () => api.get('/teachers/me/pending-counts'),

  /* Lists */
  listPendingStudents: () => api.get('/teachers/me/pending-students'),
  listPendingGuardians: () => api.get('/teachers/me/pending-guardians'),
  getClassRoster: () => api.get('/teachers/me/class-roster'),

  /* Student actions */
  approveStudent: (studentId: string) =>
    api.post(`/teachers/me/students/${studentId}/approve`),
  rejectStudent: (studentId: string, reason: string) =>
    api.post(`/teachers/me/students/${studentId}/reject`, { reason }),

  /* Guardian actions */
  approveGuardian: (guardianId: string) =>
    api.post(`/teachers/me/guardians/${guardianId}/approve`),
  rejectGuardian: (guardianId: string, reason: string) =>
    api.post(`/teachers/me/guardians/${guardianId}/reject`, { reason }),
};

export default teacherApprovalsApi;