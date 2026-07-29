import { defineConfig } from 'vite';

export default defineConfig({
  // 相对路径，方便部署到 GitHub Pages 子路径
  base: './',
  server: {
    host: true,
    port: 5173,
  },
  build: {
    target: 'es2022',
    chunkSizeWarningLimit: 4096,
  },
});
