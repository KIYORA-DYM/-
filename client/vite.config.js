import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Dev requests go to "/api" on the Vite server and are forwarded to the
    // local API, so the app keeps working when this PC's LAN IP changes.
    proxy: {
      '/api': {
        target: 'http://localhost:4000',
        configure: (proxy) => {
          // Forwarded requests are server-to-server; drop the browser's Origin
          // so the API's CORS allowlist doesn't need every LAN address.
          proxy.on('proxyReq', (proxyReq) => proxyReq.removeHeader('origin'))
        },
      },
    },
  },
})
