import dotenv from 'dotenv'
dotenv.config()

export const env = {
  PORT: parseInt(process.env.PORT || '3000', 10),
  NODE_ENV: process.env.NODE_ENV || 'development',
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:5173',
  AUTH_SERVICE_URL: process.env.AUTH_SERVICE_URL || 'http://localhost:3001',
  NOTES_SERVICE_URL: process.env.NOTES_SERVICE_URL || 'http://localhost:3002',
  AI_SERVICE_URL: process.env.AI_SERVICE_URL || 'http://localhost:3003',
}
