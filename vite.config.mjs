import { defineConfig } from 'vite';
import { cp } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  base: './',
  build: {
    target: 'es2022',
    rollupOptions: {
      input: {
        app: fileURLToPath(new URL('./index.html', import.meta.url)),
        v2: fileURLToPath(new URL('./v2/index.html', import.meta.url)),
      },
    },
  },
  plugins: [{
    name: 'preserve-weather-assets',
    async closeBundle() {
      for (const target of ['./dist/assets/weather', './dist/v2/assets/weather']) {
        await cp(new URL('./v2/assets/weather', import.meta.url), new URL(target, import.meta.url), { recursive: true });
      }
    },
  }],
});
