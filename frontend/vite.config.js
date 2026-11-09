import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    // Listen on all interfaces so the dev server is reachable from outside the Docker container
    host: '0.0.0.0',
    port: 5173,
    strictPort: true,
    watch: {
      // Docker on Windows/macOS doesn't forward file-change events into the container,
      // so poll for changes (set by docker-compose.yml, see root .env.example)
      usePolling: process.env.VITE_USE_POLLING === 'true',
      interval: 300,
    },
  },
})
