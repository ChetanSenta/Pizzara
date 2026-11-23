import axios from 'axios';

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5001/api',
});

// Attach token to every request
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 errors
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Auth
export const registerUser = (data) => API.post('/auth/register', data);
export const loginUser = (data) => API.post('/auth/login', data);
export const verifyEmail = (token) => API.get(`/auth/verify-email/${token}`);
export const forgotPassword = (data) => API.post('/auth/forgot-password', data);
export const resetPassword = (token, data) => API.post(`/auth/reset-password/${token}`, data);
export const getMe = () => API.get('/auth/me');

// Pizza options
export const getBases = () => API.get('/pizza/bases');
export const getSauces = () => API.get('/pizza/sauces');
export const getCheeses = () => API.get('/pizza/cheeses');
export const getVeggies = () => API.get('/pizza/veggies');
export const getMeats = () => API.get('/pizza/meats');

// Orders
export const getMyOrders = (params = {}) => API.get('/orders/my-orders', { params });
export const getAllOrders = (params = {}) => API.get('/orders', { params });
export const getAdminOrderSummary = (params) => API.get('/orders/summary', { params });
export const updateOrderStatus = (id, status) => API.put(`/orders/${id}/status`, { status });
export const cancelOrder = (id) => API.post(`/orders/${id}/cancel`);

// Payment
export const createPaymentOrder = (data) => API.post('/payment/create-order', data);
export const quoteCheckout = (items) => createPaymentOrder({ items, quoteOnly: true });
export const verifyPayment = (data) => API.post('/payment/verify', data);
export const placeCodOrder = (data) => API.post('/payment/cod', data);

// Inventory
export const getInventory = () => API.get('/inventory');
export const addInventoryItem = (data) => API.post('/inventory', data);
export const updateInventoryItem = (id, data) => API.put(`/inventory/${id}`, data);
export const deleteInventoryItem = (id) => API.delete(`/inventory/${id}`);

export default API;
