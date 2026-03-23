import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [react()],
  define: {
    __APP_IS_PROD__: mode === 'production',
  },
  server: {
    allowedHosts: ['localhost', '127.0.0.1'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
    extensions: ['.mjs', '.js', '.jsx', '.ts', '.tsx', '.json'],
  },
  build: {
    // manualChunks removed: Rolldown (Vite 8 bundler) does not support the
    // object form of manualChunks. Re-add once Rolldown stabilises this API.
  },
  optimizeDeps: {
    esbuildOptions: {
      loader: {
        '.js': 'jsx',
      },
    },
  },
}));
