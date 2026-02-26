import axios from 'axios';

const api = axios.create({
  // Se existir VITE_API_URL no ambiente (Vercel), usa ela. 
  // Caso contrário (local), usa o seu localhost padrão.
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5203/api', 
});

// Anexa o token automaticamente em todas as futuras requisições
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('@Autonomax:token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;