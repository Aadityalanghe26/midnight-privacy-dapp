import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test-setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
  },
  resolve: { alias: { '@': '/src' } },
  build: {
    target: 'es2020',
    rollupOptions: {
      // @midnight-ntwrk SDK packages are loaded at runtime via the Lace
      // wallet connector — they are not bundled into the frontend build.
      external: [
        /^@midnight-ntwrk\/.*/,
      ],
    },
  },
});
