import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
      '/tiles-dl': {
        target: 'https://a.basemaps.cartocdn.com',
        changeOrigin: true,
        rewrite: (path: string) => path.replace(/^\/tiles-dl/, ''),
      },
    },
  },
})
