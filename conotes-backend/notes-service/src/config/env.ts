import dotenv from 'dotenv'
dotenv.config()

export const env = {
  PORT: parseInt(process.env.PORT || '3002', 10),
  NODE_ENV: process.env.NODE_ENV || 'development',
  MONGO_URI: process.env.MONGO_URI!,
  JWT_SECRET: process.env.JWT_SECRET!,
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:5173',
}

const required = ['MONGO_URI', 'JWT_SECRET'] as const
for (const key of required) {
  if (!env[key]) throw new Error(`Missing required env var: ${key}`)
}
