import http from 'http'
import app from './app'
import { env } from './config/env'

const server = http.createServer(app)

server.listen(env.PORT, () => console.log(`gateway running on port ${env.PORT}`))

const shutdown = (signal: string) => {
  console.log(`[gateway] ${signal} received — shutting down gracefully`)
  server.close(() => {
    console.log('[gateway] HTTP server closed')
    process.exit(0)
  })
  setTimeout(() => { console.error('[gateway] Forced shutdown'); process.exit(1) }, 10000)
}

process.on('SIGTERM', () => shutdown('SIGTERM'))
process.on('SIGINT',  () => shutdown('SIGINT'))
