import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
export const setAuthToken = (token) => {
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common['Authorization'];
  }
};

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

// Health check
export const checkHealth = () => api.get('/health');

// User endpoints
export const getCurrentUser = () => api.get('/users/me');
export const createUser = (userData) => api.post('/users', userData);
export const updateUser = (userData) => api.put('/users/me', userData);

// Problem endpoints
export const getProblems = (params = {}) => api.get('/problems', { params });
export const getProblemById = (id) => api.get(`/problems/${id}`);
export const getProblemBySlug = (slug) => api.get(`/problems/slug/${slug}`);
export const createProblem = (problemData) => api.post('/problems', problemData);

// Pattern endpoints
export const getPatterns = () => api.get('/patterns');

// Submission endpoints
export const runCode = (data) => api.post('/submissions/run', data);
export const submitCode = (data) => api.post('/submissions', data);

// Hint endpoints
export const requestHint = (data) => api.post('/hints/request', data);

// Test endpoints
export const getTests = (params = {}) => api.get('/tests', { params });
export const getTestById = (id) => api.get(`/tests/${id}`);
export const createTest = (testData) => api.post('/tests', testData);
export const startTest = (testId) => api.post(`/tests/${testId}/start`);

// Dashboard endpoints
export const getStudentDashboard = () => api.get('/dashboard/student');
export const getInstructorDashboard = () => api.get('/dashboard/instructor');

export default api;
