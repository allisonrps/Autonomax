import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('@Autonomax:token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor para capturar erros da API
api.interceptors.response.use(
  (response) => response, 
  (error) => {
    // Se a API retornar 401 (Token inválido/expirado)
    if (error.response?.status === 401) {
      localStorage.removeItem('@Autonomax:token'); // Remove o token
      
      // Redireciona para a raiz para disparar a tela de "Acesso Restrito"
      window.location.href = '/'; 
    }
    return Promise.reject(error);
  }
);

export default api;