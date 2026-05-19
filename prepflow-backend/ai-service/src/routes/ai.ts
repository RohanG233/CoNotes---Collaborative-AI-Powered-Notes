import { Router, Response } from 'express'
import OpenAI from 'openai'
import rateLimit from 'express-rate-limit'
import { verifyJWT, AuthRequest } from '../middleware/verifyJWT'
import { PROMPTS, ActionKey } from '../prompts'
import { env } from '../config/env'

const router = Router()

const openai = new OpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: env.OPENROUTER_API_KEY,
  defaultHeaders: {
    'HTTP-Referer': env.CLIENT_URL,
    'X-Title': 'PrepFlow',
  },
})

const aiRateLimit = rateLimit({
  windowMs: env.AI_RATE_LIMIT_WINDOW_MS,
  max: env.AI_RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: AuthRequest) => req.user?.id || req.ip || 'unknown',
  message: { error: 'AI request limit reached. You can make 10 AI requests per hour.', retryAfter: '1 hour' },
})

router.post('/', verifyJWT, aiRateLimit, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { action, title = 'Untitled', content, answer } = req.body as {
      action: ActionKey
      title?: string
      content?: string
      answer?: string
    }

    if (!action) { res.status(400).json({ error: 'action is required' }); return }
    if (!PROMPTS[action]) {
      res.status(400).json({ error: `Unknown action '${action}'. Valid: ${Object.keys(PROMPTS).join(', ')}` })
      return
    }
    if (!content || content.trim().length < 10) {
      res.status(400).json({ error: 'content must be at least 10 characters' })
      return
    }
    if (action === 'feedback' && !answer) {
      res.status(400).json({ error: 'answer is required for the feedback action' })
      return
    }

    const prompt = PROMPTS[action]({ title, content, answer })

    const completion = await openai.chat.completions.create({
      model: env.OPENROUTER_MODEL,
      max_tokens: 1000,
      messages: [{ role: 'user', content: prompt }],
    })

    const result = completion.choices[0]?.message?.content ?? ''

    res.json({ result })
  } catch (err: any) {
    console.error('[ai-service error]', err?.status, err?.message, err?.error)
    if (err.status) {
      res.status(502).json({ error: `AI service error: ${err?.error?.message || err?.message || 'Please try again.'}` })
      return
    }
    res.status(500).json({ error: 'AI request failed' })
  }
})

export default router
