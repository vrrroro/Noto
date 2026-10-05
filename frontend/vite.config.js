import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';

const backendSrc = fileURLToPath(new URL('../backend/src', import.meta.url));
const repoRoot = fileURLToPath(new URL('..', import.meta.url));

export default defineConfig({
  plugins: [react()],
  resolve: {
    // Demo mode runs the real Lambda route logic in the browser, so the
    // frontend imports the backend's AWS-free modules through this alias.
    alias: { '@backend': backendSrc },
  },
  server: {
    port: 5173,
    strictPort: true,
    fs: { allow: [repoRoot] },
  },
  test: {
    environment: 'node',
  },
});
