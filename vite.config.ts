import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return {
    plugins: [react()],
    server: {
      proxy: {
        // 더 구체적인 경로를 먼저: Q5 복습(CrewAI) → 나머지 /api 는 Spring 백엔드
        '/api/review': 'http://127.0.0.1:8001',
        '/api': env.VITE_API_PROXY || 'http://localhost:8080',
      },
    },
  }
})
