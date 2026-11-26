import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

// App estática sin servidor (NFR2). `base: './'` permite servirla desde cualquier ruta.
export default defineConfig({
  base: './',
  plugins: [react()],
  build: {
    // NFR4: dos últimas versiones de Chrome, Firefox, Safari y Edge.
    target: 'es2020',
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
  },
});
