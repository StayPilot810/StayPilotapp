import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    {
      name: 'ical-proxy',
      configureServer(server) {
        server.middlewares.use('/api/ical', async (req, res) => {
          try {
            const url = new URL(req.url ?? '', 'http://localhost')
            const target = url.searchParams.get('url')?.trim()
            if (!target) {
              res.statusCode = 400
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({ error: 'Missing url parameter' }))
              return
            }
            const targetUrl = new URL(target)
            if (!['http:', 'https:'].includes(targetUrl.protocol)) {
              res.statusCode = 400
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({ error: 'Invalid protocol' }))
              return
            }
            const response = await fetch(targetUrl.toString())
            if (!response.ok) {
              res.statusCode = response.status
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({ error: 'Unable to fetch iCal' }))
              return
            }
            const text = await response.text()
            res.statusCode = 200
            res.setHeader('Content-Type', 'text/calendar; charset=utf-8')
            res.end(text)
          } catch {
            res.statusCode = 500
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ error: 'Proxy error' }))
          }
        })
      },
    },
  ],
  // Les « : » dans le chemin du dossier (ex. SAAS AIRBNB:BOOKING) peuvent casser le watcher natif
  // sur macOS : sans polling, les changements ne se rechargent pas tant qu’on ne redémarre pas le serveur.
  server: {
    host: '127.0.0.1',
    port: 5174,
    strictPort: true,
    watch: {
      usePolling: true,
      interval: 200,
    },
  },
})
