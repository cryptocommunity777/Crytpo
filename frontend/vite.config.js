import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // Is line ka matlab hai ki jab bhi koi file "api/axios" maange, 
      // toh Vite seedha src/api/ folder mein chala jaye
      'api': path.resolve(__dirname, './src/api'),
      'components': path.resolve(__dirname, './src/components')
    },
  },
})