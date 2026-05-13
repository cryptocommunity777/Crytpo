import axios from 'axios';
import NProgress from 'nprogress';
import 'nprogress/nprogress.css';

// Loading bar ki setting
NProgress.configure({ showSpinner: false, speed: 400, minimum: 0.2 });

// ✅ UPDATE 1: Ab ye 'localhost' aur 'good.localhost' dono ko Local manega
const isLocal = window.location.hostname.includes("localhost");

const api = axios.create({
  // Local par seedha port 5000 hit karega. 
  // LIVE ke liye 'https://yourdomain.com/api' daalna best hai taki subdomain se API cross-origin fail na ho
  baseURL: isLocal ? 'http://localhost:5000/api' : 'https:// cryptocommunity.live/api',
  
  // 🔥 CACHE FIX (GLOBAL): Ye 3 lines poori website se 304 Cache error hamesha ke liye khatam kar dengi
  headers: {
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0'
  }
});

// ✅ 1. EKLAUTA SMART REQUEST INTERCEPTOR 
api.interceptors.request.use((config) => {
  NProgress.start(); 

  // Agar component se pehle hi Authorization header bheja gaya hai, toh wahi use karo
  if (config.headers && config.headers.Authorization) {
    return config;
  }

  // ✅ UPDATE 2: Pata karo ki route admin ka hai YA user admin SUBDOMAIN ('good.') par hai
  const isAdminRoute = config.url && config.url.startsWith('/admin');
  const isAdminPanel = window.location.hostname.startsWith('good.'); // 👈 Ab ye path ki jagah subdomain check karega

  if (isAdminRoute || isAdminPanel) {
    // Agar admin page par hai, toh sirf adminToken bhejo
    const adminToken = localStorage.getItem('adminToken');
    if (adminToken) {
      config.headers.Authorization = `Bearer ${adminToken}`;
    }
  } else {
    // Warna normal user ka token bhejo
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  
  return config;
}, (error) => {
  NProgress.done(); 
  return Promise.reject(error);
});

// ✅ 2. RESPONSE INTERCEPTOR (401 Error handle karne ke liye)
api.interceptors.response.use(
  (response) => {
    NProgress.done(); 
    return response;
  },
  (error) => {
    NProgress.done(); 

    const originalRequest = error.config;

    if (error.response && error.response.status === 401) {
      if (originalRequest.url.includes('/login') || window.location.pathname === '/login') {
        return Promise.reject(error);
      }

      // ✅ NAYA LOGIC: Pata karo ki Token Admin ka expire hua hai ya User ka
      const isAdminPanel = window.location.hostname.startsWith('good.');

      if (isAdminPanel) {
        // ADMIN SESSION EXPIRE
        localStorage.removeItem('adminToken');
        // 👇 Yahan apne admin login ka sahi route daal dein
        window.location.href = '/community-access?Key=SuperSuper'; 
      } else {
        // USER SESSION EXPIRE
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;