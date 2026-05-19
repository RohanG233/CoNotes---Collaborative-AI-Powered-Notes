import { Server as HttpServer } from 'http'
import { Server, Socket } from 'socket.io'
import jwt from 'jsonwebtoken'
import Note from '../models/Note'
import { env } from '../config/env'

interface SocketUser {
  id: string
  name: string
}

interface AuthSocket extends Socket {
  user?: SocketUser
}

export function initSocket(httpServer: HttpServer): void {
  const io = new Server(httpServer, {
    cors: { origin: env.CLIENT_URL, credentials: true },
  })

  io.use(async (socket: AuthSocket, next) => {
    const cookieHeader = socket.handshake.headers?.cookie ?? ''
    const match = cookieHeader.match(/(?:^|;\s*)accessToken=([^;]+)/)
    const token = match?.[1]
    if (!token) return next(new Error('Authentication required'))
    try {
      const payload = jwt.verify(token, env.JWT_SECRET) as { id: string; name?: string }
      socket.user = { id: payload.id, name: payload.name || 'Anonymous' }
      next()
    } catch {
      next(new Error('Invalid token'))
    }
  })

  const roomPresence = new Map<string, Map<string, SocketUser>>()

  io.on('connection', (socket: AuthSocket) => {
    socket.on('joinRoom', async (noteId: string) => {
      try {
        const note = await Note.findOne({
          _id: noteId,
          $or: [{ owner: socket.user!.id }, { collaborators: socket.user!.id }],
        })
        if (!note) { socket.emit('error', { message: 'Access denied' }); return }

        socket.join(noteId)
        if (!roomPresence.has(noteId)) roomPresence.set(noteId, new Map())
        roomPresence.get(noteId)!.set(socket.id, socket.user!)
        io.to(noteId).emit('presence', Array.from(roomPresence.get(noteId)!.values()))
      } catch {
        socket.emit('error', { message: 'Failed to join room' })
      }
    })

    socket.on('leaveRoom', (noteId: string) => {
      socket.leave(noteId)
      roomPresence.get(noteId)?.delete(socket.id)
      io.to(noteId).emit('presence', Array.from(roomPresence.get(noteId)?.values() ?? []))
    })

    socket.on('noteUpdate', ({ noteId, content }: { noteId: string; content: string }) => {
      socket.to(noteId).emit('noteUpdate', { content, from: socket.user!.name, userId: socket.user!.id, ts: Date.now() })
    })

    socket.on('cursorMove', ({ noteId, position }: { noteId: string; position: unknown }) => {
      socket.to(noteId).emit('cursorUpdate', { userId: socket.user!.id, name: socket.user!.name, position })
    })

    socket.on('typing', ({ noteId, isTyping }: { noteId: string; isTyping: boolean }) => {
      socket.to(noteId).emit('userTyping', { userId: socket.user!.id, name: socket.user!.name, isTyping })
    })

    socket.on('disconnect', () => {
      for (const [noteId, users] of roomPresence.entries()) {
        if (users.has(socket.id)) {
          users.delete(socket.id)
          io.to(noteId).emit('presence', Array.from(users.values()))
        }
      }
    })
  })
}
