import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  server: {
    port: 5173,
    watch: {
      usePolling: true,
      interval: 100,
      binaryInterval: 300,
      ignored: ['**/node_modules/**', '**/.git/**']
    }
  }
})
