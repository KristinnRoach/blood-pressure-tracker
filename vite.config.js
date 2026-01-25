import { defineConfig } from 'vite';

export default defineConfig({
  base: '/blood-pressure-tracker/',
  root: 'src',
  publicDir: '../public',
  build: {
    outDir: '../dist',
    emptyOutDir: true,
  },
  test: {
    globals: true,
    environment: 'jsdom',
  },
  plugins: [
    {
      name: 'service-worker-cache-version',
      apply: 'build',
      transformIndexHtml: {
        order: 'post',
        handler() {
          // This runs during build
          return [];
        },
      },
      generateBundle(options, bundle) {
        // Replace __BUILD_TIME__ in service-worker.js with actual timestamp
        const swFile = bundle['service-worker.js'];
        if (swFile && swFile.type === 'asset') {
          const buildTime = Date.now();
          swFile.source = swFile.source
            .toString()
            .replace('__BUILD_TIME__', buildTime);
        }
      },
    },
  ],
});
