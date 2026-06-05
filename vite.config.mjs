import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const r = (p) => resolve(__dirname, p);

// Multi-page Electron renderer: a single Vite dev server hosts both window
// entry points. In production each BrowserWindow loads its own built HTML file.
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
    target: 'chrome120',
    rollupOptions: {
      input: {
        window1: r('src/renderer/window1/index.html'),
        window2: r('src/renderer/window2/index.html')
      }
    }
  }
});
