import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'

// GitHub Pages 프로젝트 사이트 하위경로 대응 → 상대경로 빌드.
// SPA 라우팅은 HashRouter 사용(404 회피)이라 base './' 로 충분.
export default defineConfig({
  base: './',
  plugins: [react()],
  resolve: {
    alias: {
      '@app': path.resolve(__dirname, 'src/app'),
      '@pages': path.resolve(__dirname, 'src/pages'),
      '@widgets': path.resolve(__dirname, 'src/widgets'),
      '@features': path.resolve(__dirname, 'src/features'),
      '@entities': path.resolve(__dirname, 'src/entities'),
      '@shared': path.resolve(__dirname, 'src/shared'),
    },
  },
})
