import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { env } from '../config/env'

export interface AuthRequest extends Request {
  user?: { id: string; iat: number; exp: number }
}

export const verifyJWT = (req: AuthRequest, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization
  const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : undefined
  const token = (req.cookies?.accessToken as string | undefined) || bearerToken
  if (!token) {
    res.status(401).json({ error: 'Access token required' })
    return
  }
  try {
    req.user = jwt.verify(token, env.JWT_SECRET) as AuthRequest['user']
    next()
  } catch (err: any) {
    res.status(401).json({ error: err.name === 'TokenExpiredError' ? 'Token expired' : 'Invalid token' })
  }
}
