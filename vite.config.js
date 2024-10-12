import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://capstone_ai.codehit.net',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''), // Strips '/api' prefix
        secure: false, // Use this if the API is using HTTPS without a valid certificate
      }
    }
  }
})
