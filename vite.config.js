import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // Add a plugin to set the necessary headers for FFmpeg
    // {
    //   name: 'configure-response-headers',
    //   configureServer: server => {
    //     server.middlewares.use((_req, res, next) => {
    //       res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
    //       res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
    //       next();
    //     });
    //   }
    // }
  ],
  // This is the main fix: tell Vite not to optimize these packages
  optimizeDeps: {
    exclude: ['@ffmpeg/ffmpeg', '@ffmpeg/util']
  },
})
