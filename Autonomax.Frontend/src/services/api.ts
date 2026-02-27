import axios from 'axios';

const api = axios.create({
  // O Vite injeta automaticamente a URL correta dependendo de como você inicia o app
  baseURL: import.meta.env.VITE_API_URL,
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