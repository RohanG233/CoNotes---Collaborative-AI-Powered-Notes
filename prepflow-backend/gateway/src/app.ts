import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import { createProxyMiddleware } from 'http-proxy-middleware'
import { env } from './config/env'

const app = express()

app.disable('x-powered-by')
app.set('trust proxy', 1)
app.use(helmet())
app.use(morgan(env.NODE_ENV === 'production' ? 'combined' : 'dev'))
app.use(cors({ origin: env.CLIENT_URL, credentials: true }))

// No cookie-parser: raw Cookie header must pass through to upstream services unchanged.

const proxy = (target: string, pathPrefix: string) =>
  createProxyMiddleware({
    target,
    changeOrigin: true,
    pathRewrite: { [`^${pathPrefix}`]: '' },
    on: {
      proxyRes: (proxyRes, _req, res) => {
        const setCookie = proxyRes.headers['set-cookie']
        if (setCookie) {
          res.setHeader('set-cookie', setCookie)
        }
      },
      error: (_err, _req, res) => {
        (res as express.Response).status(502).json({ error: 'Service unavailable' })
      },
    },
  })

app.use('/api/auth', proxy(env.AUTH_SERVICE_URL, '/api/auth'))
app.use('/api/notes', proxy(env.NOTES_SERVICE_URL, '/api/notes'))
app.use('/api/ai', proxy(env.AI_SERVICE_URL, '/api/ai'))

app.get('/health', (_req, res) => {
  res.json({
    ok: true,
    service: 'gateway',
    ts: Date.now(),
    upstreams: {
      auth: env.AUTH_SERVICE_URL,
      notes: env.NOTES_SERVICE_URL,
      ai: env.AI_SERVICE_URL,
    },
  })
})

app.use((_req, res) => res.status(404).json({ error: 'Route not found' }))

export default app
