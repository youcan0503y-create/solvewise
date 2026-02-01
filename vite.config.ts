import { defineConfig } from 'vite'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['apple-touch-icon.png'],
      manifest: {
        name: 'SolveWise',
        short_name: 'SolveWise',
        description: 'AI 수학 & 경제학 풀이',
        theme_color: '#ffffff',
        background_color: '#ffffff',
        display: 'standalone', // 🟢 주소창을 없애주는 핵심 설정
        orientation: 'portrait',
        icons: [
          {
            src: 'apple-touch-icon.png',
            sizes: '180x180',
            type: 'image/png'
          },
          {
            src: 'apple-touch-icon.png', // 안드로이드 호환을 위해 같은 파일을 큰 사이즈로도 등록
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      }
    })
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})