import axios from 'axios';

const api = axios.create({
  // AJUSTE: Use a porta que aparece no terminal do seu dotnet run (ex: 5000 ou 7xxx)
  baseURL: 'http://localhost:5203/api', 
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