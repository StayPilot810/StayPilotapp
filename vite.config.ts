import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  // Les « : » dans le chemin du dossier (ex. SAAS AIRBNB:BOOKING) peuvent casser le watcher natif
  // sur macOS : sans polling, les changements ne se rechargent pas tant qu’on ne redémarre pas le serveur.
  server: {
    watch: {
      usePolling: true,
      interval: 200,
    },
  },
})
