import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // permite acesso externo
    port: 5173,
    strictPort: true,
    // libera o host remoto do túnel
    allowedHosts: [
      '14bfb776ad0147397503877208965b27.serveo.net', // coloque o host que o Serveo/ngrok te deu
      'localhost',
    ],
  },
});
