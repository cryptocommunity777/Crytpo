import axios from 'axios';

const api = axios.create({
  // Sabhi calls ke aage ye apne aap lag jayega
  baseURL: '/api', 
});

// Token ko har request mein automatically add karne ke liye
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    // Standard format: 'Bearer TOKEN_VALUE'
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Response interceptor: Agar token expire ho jaye toh logout kar de
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;