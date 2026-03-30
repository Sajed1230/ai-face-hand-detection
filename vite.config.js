import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  worker: {
    // هذا السطر هو الأهم لحل مشكلة الـ Import
    format: 'es', 
  },
  optimizeDeps: {
    // إجبار Vite على معالجة مكتبة MediaPipe مسبقاً
    include: ['@mediapipe/tasks-vision']
  }
})