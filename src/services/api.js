import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// API Methods
export const authAPI = {
  login: (credentials) => apiClient.post('/public/token', credentials),
};

export const tasksAPI = {
  getAll: () => apiClient.get('/tasks'),
  getById: (id) => apiClient.get(`/tasks/${id}`),
  create: (data) => apiClient.post('/tasks', data),
  update: (id, data) => apiClient.put(`/tasks/${id}`, data),
  delete: (id) => apiClient.delete(`/tasks/${id}`),
  search: (query) => apiClient.get(`/tasks/search?q=${query}`),
  filterByStatus: (status) => apiClient.get(`/tasks?status=${status}`),
  filterByPriority: (priority) => apiClient.get(`/tasks?priority=${priority}`),
  getStats: () => apiClient.get('/stats'),
};

export const syncAPI = {
  sync: () => apiClient.post('/sync'),
};

export const healthAPI = {
  check: () => apiClient.get('/health'),
};

export default apiClient;
