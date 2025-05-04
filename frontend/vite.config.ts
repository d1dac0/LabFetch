import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/',
  server: {
    proxy: {
      // Proxy /api requests to the backend server during development
      '/api': {
        target: 'http://backend:3001', // Use service name 'backend' and its internal port
        changeOrigin: true, // Recommended for virtual hosted sites
        secure: false,      // Set to true if backend uses HTTPS
        // rewrite: (path) => path.replace(/^\/api/, '') // Uncomment if backend doesn't expect /api prefix
      }
    }
  }
})
