import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Root-level vite config — serves src/ as the Level 2 frontend
export default defineConfig({
  plugins: [react()],
  root: '.',
  build: {
    outDir: 'dist',
    target: 'es2020',
  },
  resolve: {
    alias: { '@': '/src' },
  },
});
