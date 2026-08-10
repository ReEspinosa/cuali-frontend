import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [react(), tailwindcss()],
  // En producción, nginx (dentro del contenedor del frontend) sirve el build
  // bajo /cuali.ai/. En local (npm run dev) seguimos en la raíz "/".
  base: mode === 'production' ? '/cuali.ai/' : '/',
}))