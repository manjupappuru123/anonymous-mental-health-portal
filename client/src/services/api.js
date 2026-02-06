import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth endpoints
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getCurrentCounselor: () => api.get('/auth/me')
};

// Issue endpoints
export const issueAPI = {
  submitIssue: (data) => api.post('/issues/submit', data),
  getIssueByAnonId: (anonId) => api.get(`/issues/${anonId}`),
  getAllIssues: (params) => api.get('/issues', { params }),
  assignIssue: (issueId, counselorId) => api.put(`/issues/${issueId}/assign`, { counselorId }),
  addResponse: (issueId, response) => api.put(`/issues/${issueId}/response`, { response }),
  deleteIssue: (issueId) => api.delete(`/issues/${issueId}`)
};

// Counselor endpoints
export const counselorAPI = {
  getAllCounselors: () => api.get('/counselors'),
  getCounselorById: (counselorId) => api.get(`/counselors/${counselorId}`),
  getCounselorIssues: (counselorId, params) => api.get(`/counselors/${counselorId}/issues`, { params }),
  updateProfile: (counselorId, data) => api.put(`/counselors/${counselorId}/profile`, data),
  getStats: (counselorId) => api.get(`/counselors/${counselorId}/stats`)
};

// Notification endpoints
export const notificationAPI = {
  getNotifications: (params) => api.get('/notifications', { params }),
  getUnreadCount: () => api.get('/notifications/unread-count'),
  markAsRead: (notificationId) => api.put(`/notifications/${notificationId}/read`),
  markAllAsRead: () => api.put('/notifications/read-all')
};

// Chat endpoints
export const chatAPI = {
  getStudentThread: (issueId, token) => api.get(`/chat/student/${issueId}`, { params: { t: token } }),
  getStudentMessages: (issueId, token) => api.get(`/chat/student/${issueId}/messages`, { params: { t: token } }),
  createStudentMessage: (issueId, token, body) =>
    api.post(`/chat/student/${issueId}/messages`, { body }, { params: { t: token } }),
  getCounselorThreads: () => api.get('/chat/counselor/threads'),
  getCounselorMessages: (issueId) => api.get(`/chat/counselor/${issueId}/messages`),
  createCounselorMessage: (issueId, body) => api.post(`/chat/counselor/${issueId}/messages`, { body })
};

export default api;
