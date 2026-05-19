import dotenv from 'dotenv'
dotenv.config()

export const env = {
  PORT: parseInt(process.env.PORT || '3003', 10),
  NODE_ENV: process.env.NODE_ENV || 'development',
  JWT_SECRET: process.env.JWT_SECRET!,
  OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY!,
  OPENROUTER_MODEL: process.env.OPENROUTER_MODEL || 'anthropic/claude-3.5-sonnet',
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:5173',
  AI_RATE_LIMIT_MAX: parseInt(process.env.AI_RATE_LIMIT_MAX || '10', 10),
  AI_RATE_LIMIT_WINDOW_MS: parseInt(process.env.AI_RATE_LIMIT_WINDOW_MS || String(60 * 60 * 1000), 10),
}

const required = ['JWT_SECRET', 'OPENROUTER_API_KEY'] as const
for (const key of required) {
  if (!env[key]) throw new Error(`Missing required env var: ${key}`)
}
