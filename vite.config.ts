import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// GitHub Pages needs relative asset paths, while Vercel should serve from root.
const base = process.env.GITHUB_ACTIONS === 'true' ? './' : '/'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base,
})
