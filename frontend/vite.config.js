import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],

  build: {
    // Dossier de sortie — copié dans /usr/share/nginx/html par le Dockerfile
    outDir: 'dist',
    emptyOutDir: true,

    // Sépare react/react-dom dans un chunk vendor pour un meilleur cache navigateur
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
        },
      },
    },
  },
})
