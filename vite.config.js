import { defineConfig } from 'vite';
import { readFileSync, writeFileSync } from 'fs';
import { resolve } from 'path';

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
      closeBundle() {
        // After build completes, update the service worker in dist
        const swPath = resolve(process.cwd(), 'dist/service-worker.js');

        try {
          const originalSource = readFileSync(swPath, 'utf-8');
          const buildTime = Date.now();
          const updatedSource = originalSource.replace(
            /__BUILD_TIME__/g,
            buildTime,
          );

          // Verify replacement actually happened
          if (originalSource === updatedSource) {
            this.error(
              '__BUILD_TIME__ placeholder not found in service-worker.js. Check the file contains the placeholder.',
            );
          }

          writeFileSync(swPath, updatedSource, 'utf-8');
          console.log(
            `✓ Service worker cache version set to: bp-tracker-${buildTime}`,
          );
        } catch (error) {
          this.error(`Failed to update service-worker.js: ${error.message}`);
        }
      },
    },
  ],
});
