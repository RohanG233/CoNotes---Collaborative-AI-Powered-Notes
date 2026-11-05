import http from 'http'
import mongoose from 'mongoose'
import app from './app'
import { env } from './config/env'

mongoose
  .connect(env.MONGO_URI)
  .then(() => {
    console.log('MongoDB connected [auth-service]')
    const server = http.createServer(app)
    server.listen(env.PORT, () => console.log(`auth-service running on port ${env.PORT}`))

    const shutdown = (signal: string) => {
      console.log(`[auth-service] ${signal} received — shutting down gracefully`)
      server.close(() => {
        mongoose.connection.close().then(() => {
          console.log('[auth-service] MongoDB connection closed')
          process.exit(0)
        })
      })
      setTimeout(() => { console.error('[auth-service] Forced shutdown'); process.exit(1) }, 10000)
    }

    process.on('SIGTERM', () => shutdown('SIGTERM'))
    process.on('SIGINT',  () => shutdown('SIGINT'))
  })
  .catch((err) => {
    console.error('MongoDB connection failed [auth-service]:', err.message)
    process.exit(1)
  })
