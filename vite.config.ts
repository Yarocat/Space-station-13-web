import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    {
      name: 'dmi-mime-type',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          if (req.url && (req.url.endsWith('.dmi') || req.url.includes('.dmi?'))) {
            res.setHeader('Content-Type', 'image/png');
          }
          next();
        });
      },
    },
  ],
  server: {
    host: '0.0.0.0',
    port: 3000,
    allowedHosts: true,
  },
});
