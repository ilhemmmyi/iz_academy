import { apiClient } from './client';

export const projectsApi = {
  getByCourse: (courseId: string) => apiClient(`/courses/${courseId}/projects`),
  submit: (projectId: string, data: { githubUrl: string; comment?: string }) =>
    apiClient(`/projects/${projectId}/submit`, { method: 'POST', body: JSON.stringify(data) }),
  mySubmissions: () => apiClient('/projects/my-submissions'),
  teacherSubmissions: () => apiClient('/projects/teacher/submissions'),
  review: (submissionId: string, data: { status: string; feedback?: string }) =>
    apiClient(`/projects/submissions/${submissionId}/review`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteSubmission: (submissionId: string) =>
    apiClient(`/projects/submissions/${submissionId}`, { method: 'DELETE' }),
  listPendingApproval: () => apiClient('/projects/submissions/pending-approval'),
  adminApprove: (submissionId: string) =>
    apiClient(`/projects/submissions/${submissionId}/admin-approve`, { method: 'PUT' }),
};

