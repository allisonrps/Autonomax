import axios from 'axios';
import { getToken, clearAuthSession } from '../utils/auth';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor para capturar erros da API
api.interceptors.response.use(
  (response) => response, 
  (error) => {
    // Se a API retornar 401 (Não autorizado / token expirado ou inválido)
    if (error.response?.status === 401) {
      clearAuthSession();
      
      // Só redireciona se já não estiver na página de login ou apresentação
      if (window.location.pathname !== '/login' && window.location.pathname !== '/') {
        window.location.href = '/login'; 
      }
    }
    return Promise.reject(error);
  }
);

export default api;
