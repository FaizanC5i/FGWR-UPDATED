import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',  // This allows external access to the app from outside the container
    port: 8080,
    proxy: {
      '/api/genie-query': {
        target: 'https://genie-g6atf2bzegdeh4gj.canadacentral-01.azurewebsites.net',
        changeOrigin: true,
        secure: true,
      },
    },
  },
})
