import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const r = (p) => resolve(__dirname, p);

// Single-page renderer. One BrowserWindow loads this app; a top nav bar
// switches between the "Enregistrement" and "Suivi de Distribution" views.
// `base: './'` keeps asset URLs relative so Electron's loadFile() resolves them.
export default defineConfig({
  root: r('src/renderer'),
  base: './',
  plugins: [react()],
  server: {
    port: 5173,
    strictPort: true
  },
  build: {
    outDir: r('dist/renderer'),
    emptyOutDir: true,
    target: 'chrome120'
  }
});
