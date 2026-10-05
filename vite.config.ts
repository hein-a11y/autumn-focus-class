import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  server: {
    host: true,
    port: 5173,
    open: false
  },
  build: {
    target: 'esnext',
    assetsInlineLimit: 0
  }
});
