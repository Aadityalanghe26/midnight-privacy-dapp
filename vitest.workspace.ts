import { defineWorkspace } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineWorkspace([
  // ── Contract tests (Node environment, no DOM needed) ──────────────────
  {
    test: {
      name: 'contracts',
      include: ['contracts/**/*.test.ts'],
      environment: 'node',
      globals: true,
    },
  },

  // ── Frontend tests — root src/ (Level 1 component tests) ──────────────
  {
    plugins: [react()],
    test: {
      name: 'frontend-root',
      include: ['src/**/*.test.{ts,tsx}'],
      environment: 'jsdom',
      setupFiles: ['./src/test-setup.ts'],
      globals: true,
    },
  },

  // ── Frontend tests — frontend/ workspace (Level 2 component tests) ─────
  {
    plugins: [react()],
    test: {
      name: 'frontend',
      include: ['frontend/src/**/*.test.{ts,tsx}'],
      environment: 'jsdom',
      setupFiles: ['./frontend/src/test-setup.ts'],
      globals: true,
    },
  },
]);
