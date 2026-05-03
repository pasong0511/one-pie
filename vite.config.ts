import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// GitHub Pages 배포 시 'https://<user>.github.io/one-pie/' 로 서빙되므로 base 가 필요.
// 로컬 dev 에선 '/' 로 두려고 mode 분기.
export default defineConfig(({ command }) => ({
  plugins: [react()],
  base: command === 'build' ? '/one-pie/' : '/',
  server: { port: 5173, open: true },
}));
