import http from 'http'
import app from './app'
import { env } from './config/env'

const server = http.createServer(app)

server.listen(env.PORT, () => console.log(`ai-service running on port ${env.PORT}`))

const shutdown = (signal: string) => {
  console.log(`[ai-service] ${signal} received — shutting down gracefully`)
  server.close(() => {
    console.log('[ai-service] HTTP server closed')
    process.exit(0)
  })
  setTimeout(() => { console.error('[ai-service] Forced shutdown'); process.exit(1) }, 10000)
}

process.on('SIGTERM', () => shutdown('SIGTERM'))
process.on('SIGINT',  () => shutdown('SIGINT'))
