import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import cookieParser from 'cookie-parser'
import mongoSanitize from 'express-mongo-sanitize'
import { env } from './config/env'
import authRoutes from './routes/auth'

const app = express()

app.disable('x-powered-by')
app.set('trust proxy', 1)
app.use(helmet())
app.use(morgan(env.NODE_ENV === 'production' ? 'combined' : 'dev'))
app.use(cors({ origin: env.CLIENT_URL, credentials: true }))
app.use(express.json({ limit: '10kb' }))
app.use(cookieParser())
app.use(mongoSanitize())

app.use('/', authRoutes)
app.get('/health', (_req, res) => res.json({ ok: true, service: 'auth', ts: Date.now() }))

app.use((_req, res) => res.status(404).json({ error: 'Route not found' }))
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  const status = err.status || 500
  if (status >= 500) console.error('[auth-service error]', err)
  res.status(status).json({ error: err.message || 'Server error' })
})

export default app
