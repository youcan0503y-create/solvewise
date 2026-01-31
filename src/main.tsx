import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx' // 만약 App.tsx가 src/app 안에 있다면 경로 수정 필요
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)