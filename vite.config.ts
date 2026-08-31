import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  build: {
    chunkSizeWarningLimit: 800,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('react-router-dom') || id.includes('react-dom') || id.includes('react')) return 'react'
            if (id.includes('recharts') || id.includes('lucide-react')) return 'charts'
            if (id.includes('@tanstack') || id.includes('zustand') || id.includes('axios')) return 'vendor'
          }
        },
      },
    },
  },
})
