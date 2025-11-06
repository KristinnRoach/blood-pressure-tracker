import { defineConfig } from 'vite';

export default defineConfig({
  base: '/blood-pressure-tracker/',
  root: 'src',
  build: {
    outDir: '../dist',
    emptyOutDir: true,
  },
  test: {
    globals: true,
    environment: 'jsdom',
  },
});
