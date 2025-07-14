import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'


export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['ymaps3', '@yandex/ymaps3-types']
  },
  resolve: {
    alias: {
      'ymaps3': './src/types/ymaps3.d.ts' // Путь к вашим декларациям
    }
  }
});