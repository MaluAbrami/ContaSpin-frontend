import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8080',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para repassar mensagens de erro detalhadas do backend
api.interceptors.response.use(
  response => response,
  error => {
    if (error.response && error.response.data) {
      const data = error.response.data;
      // Tenta pegar mensagem em vários campos comuns
      const msg = data.message || data.error || data.errors || data.detail || (typeof data === 'string' ? data : null);
      if (msg) {
        // Se for array de erros, junta tudo
        if (Array.isArray(msg)) {
          return Promise.reject(new Error(msg.join(' ')));
        }
        return Promise.reject(new Error(msg));
      }
      // Se for string direta
      if (typeof data === 'string') {
        return Promise.reject(new Error(data));
      }
    }
    // Se não houver mensagem específica, repassa o erro original
    return Promise.reject(error);
  }
);

export default api;