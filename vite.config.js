import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    target: 'es2020',
    cssTarget: 'chrome87',
    assetsInlineLimit: 2048,
    reportCompressedSize: true
  },
  server: { host: '127.0.0.1', port: 5173 }
});
