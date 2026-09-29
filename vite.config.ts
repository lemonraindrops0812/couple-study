import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { copyFileSync } from 'node:fs'

// Surge serves 200.html for unknown paths. Copying Vite's final index page
// lets React Router handle direct visits such as /study and /stats.
const surgeSpaFallback = () => ({
  name: 'surge-spa-fallback',
  closeBundle() {
    copyFileSync(
      new URL('./dist/index.html', import.meta.url),
      new URL('./dist/200.html', import.meta.url),
    )
  },
})

export default defineConfig({
  plugins: [react(), tailwindcss(), surgeSpaFallback()],
})
