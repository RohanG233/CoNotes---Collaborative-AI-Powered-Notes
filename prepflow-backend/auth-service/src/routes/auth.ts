import { Router, Request, Response } from 'express'
import jwt from 'jsonwebtoken'
import User from '../models/User'
import { env } from '../config/env'
import { verifyJWT, AuthRequest } from '../middleware/verifyJWT'

const router = Router()

function signTokens(userId: string) {
  const accessToken = jwt.sign({ id: userId }, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN })
  const refreshToken = jwt.sign({ id: userId }, env.REFRESH_SECRET, { expiresIn: env.REFRESH_EXPIRES_IN })
  return { accessToken, refreshToken }
}

function setAccessCookie(res: Response, token: string) {
  res.cookie('accessToken', token, {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: env.NODE_ENV === 'production' ? 'none' : 'lax',
    maxAge: 15 * 60 * 1000,
  })
}

function setRefreshCookie(res: Response, token: string) {
  res.cookie('refreshToken', token, {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: env.NODE_ENV === 'production' ? 'none' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  })
}

function setBothCookies(res: Response, accessToken: string, refreshToken: string) {
  setAccessCookie(res, accessToken)
  setRefreshCookie(res, refreshToken)
}

router.post('/signup', async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, password } = req.body
    if (!name || !email || !password) {
      res.status(400).json({ error: 'name, email and password are required' })
      return
    }
    const existing = await User.findOne({ email })
    if (existing) {
      res.status(409).json({ error: 'Email already registered' })
      return
    }
    const user = await User.create({ name, email, password })
    res.status(201).json({ message: 'Account created successfully' })
  } catch (err: any) {
    console.error('[signup error]', err)
    if (err.name === 'ValidationError') {
      res.status(400).json({ error: Object.values(err.errors).map((e: any) => e.message).join('. ') })
      return
    }
    res.status(500).json({ error: err.message || 'Signup failed' })
  }
})

router.post('/login', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body
    if (!email || !password) {
      res.status(400).json({ error: 'email and password are required' })
      return
    }
    const user = await User.findOne({ email }).select('+password +refreshToken')
    if (!user || !(await user.comparePassword(password))) {
      res.status(401).json({ error: 'Invalid credentials' })
      return
    }
    const { accessToken, refreshToken } = signTokens(String(user._id))
    user.refreshToken = refreshToken
    await user.save()
    setBothCookies(res, accessToken, refreshToken)
    res.json({ user: { id: user._id, name: user.name, email: user.email } })
  } catch {
    res.status(500).json({ error: 'Login failed' })
  }
})

router.post('/refresh', async (req: Request, res: Response): Promise<void> => {
  try {
    const token = req.cookies?.refreshToken
    if (!token) {
      res.status(401).json({ error: 'Refresh token required' })
      return
    }
    let payload: any
    try {
      payload = jwt.verify(token, env.REFRESH_SECRET)
    } catch {
      res.status(401).json({ error: 'Invalid refresh token' })
      return
    }
    const user = await User.findById(payload.id).select('+refreshToken')
    if (!user || user.refreshToken !== token) {
      res.status(401).json({ error: 'Refresh token reuse detected' })
      return
    }
    const { accessToken, refreshToken } = signTokens(String(user._id))
    user.refreshToken = refreshToken
    await user.save()
    setBothCookies(res, accessToken, refreshToken)
    res.json({ ok: true })
  } catch {
    res.status(500).json({ error: 'Token refresh failed' })
  }
})

router.post('/logout', async (req: Request, res: Response): Promise<void> => {
  try {
    const token = req.cookies?.refreshToken
    if (token) {
      await User.findOneAndUpdate({ refreshToken: token }, { refreshToken: null })
    }
    res.clearCookie('accessToken', { httpOnly: true, secure: env.NODE_ENV === 'production', sameSite: env.NODE_ENV === 'production' ? 'none' : 'lax' })
    res.clearCookie('refreshToken', { httpOnly: true, secure: env.NODE_ENV === 'production', sameSite: env.NODE_ENV === 'production' ? 'none' : 'lax' })
    res.status(204).end()
  } catch {
    res.status(500).json({ error: 'Logout failed' })
  }
})

router.get('/me', verifyJWT, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await User.findById(req.user!.id)
    if (!user) {
      res.status(404).json({ error: 'User not found' })
      return
    }
    res.json({ id: user._id, name: user.name, email: user.email, createdAt: user.createdAt })
  } catch {
    res.status(500).json({ error: 'Failed to fetch user' })
  }
})

export default router