import axios from 'axios';
import NProgress from 'nprogress';
import 'nprogress/nprogress.css';

// 🎨 NAYA: Loading bar ki setting (Spinner hide kiya hai taaki clean dikhe)
NProgress.configure({ showSpinner: false, speed: 400, minimum: 0.2 });

// Automatically switch between Local and Live
const isLocal = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";

const api = axios.create({
  // Local par 5000 port use hoga, Live par sirf /api
  baseURL: isLocal ? 'http://localhost:5000/api' : '/api', 
  
  // 🔥 CACHE FIX (GLOBAL): No more 304 errors
  headers: {
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0'
  }
});

// Request Interceptor: Token automatically add karega aur loading shuru karega
api.interceptors.request.use((config) => {
  NProgress.start(); // 🔥 NAYA: API call jate hi loading shuru

  const isAdminRoute = config.url && config.url.startsWith('/admin');

  if (isAdminRoute) {
    const adminToken = localStorage.getItem('adminToken');
    if (adminToken) {
      config.headers.Authorization = `Bearer ${adminToken}`;
    }
  } else {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  
  return config;
}, (error) => {
  NProgress.done(); // 🔥 NAYA: Error aaye toh bar rok do
  return Promise.reject(error);
});

// Response Interceptor: 401 error handle karega aur loading band karega
api.interceptors.response.use(
  (response) => {
    NProgress.done(); // 🔥 NAYA: Data aate hi loading khatam
    return response;
  },
  (error) => {
    NProgress.done(); // 🔥 NAYA: Error aane par bhi bar ruk jani chahiye

    const originalRequest = error.config;

    if (error.response && error.response.status === 401) {
      if (originalRequest.url.includes('/login') || window.location.pathname === '/login') {
        return Promise.reject(error);
      }
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;