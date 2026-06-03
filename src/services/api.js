import axios from 'axios';
import { API_BASE_URL } from '../utils/constants.js';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Interceptor to attach JWT token to all requests
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

export const authAPI = {
  login: (credentials) => apiClient.post('/public/token', credentials),
  getMe: () => apiClient.get('/auth/me')
};

export const syncAPI = {
  sync: (credentials) => apiClient.post('/sync', credentials || {})
};

export const usersAPI = {
  getAll: () => apiClient.get('/users'),
  getById: (id) => apiClient.get(`/users/${id}`)
};

export const projectsAPI = {
  create: (data) => apiClient.post('/projects', data),
  getAll: (params) => apiClient.get('/projects', { params }),
  getById: (id) => apiClient.get(`/projects/${id}`),
  update: (id, data) => apiClient.patch(`/projects/${id}`, data),
  delete: (id) => apiClient.delete(`/projects/${id}`)
};

export const issuesAPI = {
  create: (data) => apiClient.post('/issues', data),
  getAll: (params) => apiClient.get('/issues', { params }),
  getById: (id) => apiClient.get(`/issues/${id}`),
  update: (id, data) => apiClient.patch(`/issues/${id}`, data),
  delete: (id) => apiClient.delete(`/issues/${id}`),
  assign: (id, assignedTo) => apiClient.patch(`/issues/${id}/assign`, { assignedTo }),
  updateStatus: (id, status) => apiClient.patch(`/issues/${id}/status`, { status })
};

export const commentsAPI = {
  create: (data) => apiClient.post('/comments', data),
  getAll: (issueId) => apiClient.get('/comments', { params: { issueId } }),
  delete: (id) => apiClient.delete(`/comments/${id}`)
};

export const analyticsAPI = {
  getIssues: () => apiClient.get('/analytics/issues'),
  getProjects: () => apiClient.get('/analytics/projects'),
  getDevelopers: () => apiClient.get('/analytics/developers')
};

export default apiClient;
