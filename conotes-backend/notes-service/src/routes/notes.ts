import { Router, Response } from 'express'
import Note from '../models/Note'
import User from '../models/User'
import { verifyJWT, AuthRequest } from '../middleware/verifyJWT'

const router = Router()
router.use(verifyJWT)

const accessRoleFor = (owner: unknown, userId: string) =>
  String(owner) === userId ? 'owner' : 'collaborator'

router.get('/', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { q, starred, page = '1', limit = '20' } = req.query as Record<string, string>
    const filter: Record<string, any> = {
      $or: [{ owner: req.user!.id }, { collaborators: req.user!.id }],
    }
    if (q?.trim()) filter.$text = { $search: q.trim() }
    if (starred === 'true') filter.starred = true

    const safeLimit = Math.min(parseInt(limit), 50)
    const skip = (parseInt(page) - 1) * safeLimit

    const [notes, total] = await Promise.all([
      Note.find(filter)
        .sort({ starred: -1, updatedAt: -1 })
        .skip(skip)
        .limit(safeLimit)
        .select('title starred tags owner updatedAt createdAt')
        .lean(),
      Note.countDocuments(filter),
    ])

    const notesWithAccess = notes.map((note) => ({
      ...note,
      accessRole: accessRoleFor(note.owner, req.user!.id),
    }))

    res.json({
      notes: notesWithAccess,
      pagination: { total, page: parseInt(page), pages: Math.ceil(total / safeLimit), limit: safeLimit },
    })
  } catch {
    res.status(500).json({ error: 'Failed to fetch notes' })
  }
})

router.post('/', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { title, content, tags } = req.body
    const note = await Note.create({
      title: title || 'Untitled note',
      content: content || '',
      tags: tags || [],
      owner: req.user!.id,
    })
    res.status(201).json({ ...note.toObject(), accessRole: 'owner' })
  } catch (err: any) {
    if (err.name === 'ValidationError') {
      res.status(400).json({ error: Object.values(err.errors).map((e: any) => e.message).join('. ') })
      return
    }
    res.status(500).json({ error: 'Failed to create note' })
  }
})

router.get('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const note = await Note.findOne({
      _id: req.params.id,
      $or: [{ owner: req.user!.id }, { collaborators: req.user!.id }],
    })
    if (!note) { res.status(404).json({ error: 'Note not found' }); return }
    res.json({
      ...note.toObject(),
      accessRole: accessRoleFor(note.owner, req.user!.id),
    })
  } catch (err: any) {
    if (err.name === 'CastError') { res.status(400).json({ error: 'Invalid note ID' }); return }
    res.status(500).json({ error: 'Failed to fetch note' })
  }
})

router.post('/:id/collaborators', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const email = String(req.body?.email ?? '').trim().toLowerCase()
    if (!email) {
      res.status(400).json({ error: 'email is required' })
      return
    }

    const user = await User.findOne({ email })
    if (!user) {
      res.status(404).json({ error: 'No user found with that email' })
      return
    }
    if (String(user._id) === req.user!.id) {
      res.status(400).json({ error: 'You already own this note' })
      return
    }

    const note = await Note.findOneAndUpdate(
      { _id: req.params.id, owner: req.user!.id },
      { $addToSet: { collaborators: user._id } },
      { new: true, runValidators: true }
    )
    if (!note) {
      res.status(404).json({ error: 'Note not found' })
      return
    }

    res.json({
      message: 'Collaborator added',
      collaborator: { id: user._id, name: user.name, email: user.email },
    })
  } catch (err: any) {
    if (err.name === 'CastError') { res.status(400).json({ error: 'Invalid note ID' }); return }
    res.status(500).json({ error: 'Failed to add collaborator' })
  }
})

router.patch('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { title, content, tags } = req.body
    const updates: Record<string, any> = {}
    if (title !== undefined) updates.title = title
    if (content !== undefined) updates.content = content
    if (tags !== undefined) updates.tags = tags

    const note = await Note.findOneAndUpdate(
      { _id: req.params.id, $or: [{ owner: req.user!.id }, { collaborators: req.user!.id }] },
      updates,
      { new: true, runValidators: true }
    )
    if (!note) { res.status(404).json({ error: 'Note not found' }); return }
    res.json({
      ...note.toObject(),
      accessRole: accessRoleFor(note.owner, req.user!.id),
    })
  } catch (err: any) {
    if (err.name === 'CastError') { res.status(400).json({ error: 'Invalid note ID' }); return }
    if (err.name === 'ValidationError') {
      res.status(400).json({ error: Object.values(err.errors).map((e: any) => e.message).join('. ') })
      return
    }
    res.status(500).json({ error: 'Failed to update note' })
  }
})

router.delete('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const note = await Note.findOneAndDelete({ _id: req.params.id, owner: req.user!.id })
    if (!note) { res.status(404).json({ error: 'Note not found' }); return }
    res.status(204).end()
  } catch (err: any) {
    if (err.name === 'CastError') { res.status(400).json({ error: 'Invalid note ID' }); return }
    res.status(500).json({ error: 'Failed to delete note' })
  }
})

router.patch('/:id/star', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const note = await Note.findOne({ _id: req.params.id, owner: req.user!.id })
    if (!note) { res.status(404).json({ error: 'Note not found' }); return }
    note.starred = !note.starred
    await note.save()
    res.json({ starred: note.starred })
  } catch (err: any) {
    if (err.name === 'CastError') { res.status(400).json({ error: 'Invalid note ID' }); return }
    res.status(500).json({ error: 'Failed to toggle star' })
  }
})

export default router
