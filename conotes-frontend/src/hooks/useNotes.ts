import { useCallback, useEffect, useState } from 'react'
import { listNotes, toggleStar, deleteNote, createNote } from '@/api/notes'
import type { NoteListItem, Pagination } from '@/types'

interface UseNotesOptions {
  q?: string
  starred?: boolean
  page?: number
}

export function useNotes(options: UseNotesOptions = {}) {
  const [notes, setNotes] = useState<NoteListItem[]>([])
  const [pagination, setPagination] = useState<Pagination | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetch = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const { data } = await listNotes(options)
      setNotes(data.notes)
      setPagination(data.pagination)
    } catch {
      setError('Failed to load notes')
    } finally {
      setIsLoading(false)
    }
  }, [options.q, options.starred, options.page])

  useEffect(() => { fetch() }, [fetch])

  const star = useCallback(async (id: string) => {
    const { data } = await toggleStar(id)
    setNotes((prev) =>
      options.starred && !data.starred
        ? prev.filter((n) => n._id !== id)
        : prev.map((n) => (n._id === id ? { ...n, starred: data.starred } : n))
    )
  }, [options.starred])

  const remove = useCallback(async (id: string) => {
    await deleteNote(id)
    setNotes((prev) => prev.filter((n) => n._id !== id))
  }, [])

  const create = useCallback(async () => {
    const { data } = await createNote({ title: 'Untitled note' })
    return data
  }, [])

  return { notes, pagination, isLoading, error, refetch: fetch, star, remove, create }
}
