import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
    port: 5173,
    proxy: {
      // ─────────────────────────────────────────────────────────────────────
      // Java Servlet backend (Tomcat, port 8080)
      //   /java-api/* → http://127.0.0.1:8080/*  (prefix stripped)
      //   e.g. POST /java-api/api/auth/login → POST http://127.0.0.1:8080/api/auth/login
      // ─────────────────────────────────────────────────────────────────────
      '/java-api': {
        target: 'http://127.0.0.1:8080',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/java-api/, ''),
        configure: (proxy) => {
          proxy.on('error', (err) => {
            console.error('[Vite→Tomcat Proxy Error]', err.message);
          });
          proxy.on('proxyReq', (_, req) => {
            console.log(`[Proxy→Tomcat] ${req.method} ${req.url}`);
          });
        },
      },

      // ─────────────────────────────────────────────────────────────────────
      // Direct /api/health → Tomcat (no prefix stripping needed)
      // This allows http://localhost:8080/api/health to be tested from
      // the Vite dev server at http://localhost:5173/api/health too.
      // ─────────────────────────────────────────────────────────────────────
      '/api/health': {
        target: 'http://127.0.0.1:8080',
        changeOrigin: true,
        secure: false,
        configure: (proxy) => {
          proxy.on('error', (err) => {
            console.error('[Vite→Tomcat /api/health Error]', err.message);
          });
        },
      },

      // ─────────────────────────────────────────────────────────────────────
      // Node.js backend (Express, port 5000)
      //   These are Node-specific routes that do NOT conflict with /java-api
      // ─────────────────────────────────────────────────────────────────────
      '/api/auth': {
        target: 'http://127.0.0.1:5000',
        changeOrigin: true,
        secure: false,
      },
      '/api/admin': {
        target: 'http://127.0.0.1:5000',
        changeOrigin: true,
        secure: false,
      },
      '/api/v1': {
        target: 'http://127.0.0.1:5000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
})

