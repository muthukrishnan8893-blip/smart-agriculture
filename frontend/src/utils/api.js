// utils/api.js - Axios instance with base URL
import axios from 'axios';

const api = axios.create({
  baseURL: '/api',   // proxied to http://localhost:5000/api via package.json
  headers: { 'Content-Type': 'application/json' }
});

// Attach stored token on every request
api.interceptors.request.use(config => {
  const token = localStorage.getItem('agri_token');
  if (token) config.headers['Authorization'] = `Bearer ${token}`;
  return config;
});

export default api;
