import { useEffect, useRef, useState, useCallback } from 'react'
import { io, Socket } from 'socket.io-client'
import { getAccessToken } from '@/api/axios'
import type { PresenceUser, NoteUpdatePayload, UserTypingPayload } from '@/types'

interface UseSocketOptions {
  noteId: string | null
  onRemoteUpdate: (payload: NoteUpdatePayload) => void
  onTyping: (payload: UserTypingPayload) => void
}

export function useSocket({ noteId, onRemoteUpdate, onTyping }: UseSocketOptions) {
  const socketRef = useRef<Socket | null>(null)
  const [presence, setPresence] = useState<PresenceUser[]>([])
  const [connected, setConnected] = useState(false)

  useEffect(() => {
    const socket = io(import.meta.env.VITE_SOCKET_URL ?? 'http://localhost:3002', {
      withCredentials: true,
      auth: { token: getAccessToken() },
      transports: ['websocket', 'polling'],
    })

    socketRef.current = socket

    socket.on('connect', () => setConnected(true))
    socket.on('disconnect', () => { setConnected(false); setPresence([]) })
    socket.on('presence', (users: PresenceUser[]) => setPresence(users))
    socket.on('noteUpdate', onRemoteUpdate)
    socket.on('userTyping', onTyping)

    return () => {
      socket.disconnect()
      socketRef.current = null
    }
  }, [])

  useEffect(() => {
    const socket = socketRef.current
    if (!socket || !noteId) return
    socket.emit('joinRoom', noteId)
    return () => { socket.emit('leaveRoom', noteId) }
  }, [noteId])

  const emitUpdate = useCallback((content: string) => {
    if (!socketRef.current || !noteId) return
    socketRef.current.emit('noteUpdate', { noteId, content })
  }, [noteId])

  const emitTyping = useCallback((isTyping: boolean) => {
    if (!socketRef.current || !noteId) return
    socketRef.current.emit('typing', { noteId, isTyping })
  }, [noteId])

  const emitCursor = useCallback((position: unknown) => {
    if (!socketRef.current || !noteId) return
    socketRef.current.emit('cursorMove', { noteId, position })
  }, [noteId])

  return { presence, connected, emitUpdate, emitTyping, emitCursor }
}
