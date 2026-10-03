import axios from 'axios';

const getBaseURL = () => {
  const envUrl = import.meta.env.VITE_BACKEND_URL || import.meta.env.VITE_API_URL;
  if (!envUrl) return '/api';
  const cleanUrl = envUrl.replace(/\/+$/, '');
  return cleanUrl.endsWith('/api') ? cleanUrl : `${cleanUrl}/api`;
};

const api = axios.create({
  baseURL: getBaseURL(),
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('foodshare_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Handle 401 globally
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('foodshare_token');
      localStorage.removeItem('foodshare_user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;
