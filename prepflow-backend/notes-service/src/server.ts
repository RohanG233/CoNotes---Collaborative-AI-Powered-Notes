import http from 'http'
import mongoose from 'mongoose'
import app from './app'
import { initSocket } from './socket'
import { env } from './config/env'

mongoose
  .connect(env.MONGO_URI)
  .then(() => {
    console.log('MongoDB connected [notes-service]')
    const httpServer = http.createServer(app)
    initSocket(httpServer)
    httpServer.listen(env.PORT, () => console.log(`notes-service running on port ${env.PORT}`))

    const shutdown = (signal: string) => {
      console.log(`[notes-service] ${signal} received — shutting down gracefully`)
      httpServer.close(() => {
        mongoose.connection.close().then(() => {
          console.log('[notes-service] MongoDB connection closed')
          process.exit(0)
        })
      })
      setTimeout(() => { console.error('[notes-service] Forced shutdown'); process.exit(1) }, 10000)
    }

    process.on('SIGTERM', () => shutdown('SIGTERM'))
    process.on('SIGINT',  () => shutdown('SIGINT'))
  })
  .catch((err) => {
    console.error('MongoDB connection failed [notes-service]:', err.message)
    process.exit(1)
  })
