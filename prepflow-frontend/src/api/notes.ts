import api from './axios'
import type { Note, NotesResponse } from '@/types'

export interface ListParams {
  q?: string
  starred?: boolean
  page?: number
  limit?: number
}

export const listNotes = (params: ListParams = {}) =>
  api.get<NotesResponse>('/api/notes', { params })

export const getNote = (id: string) =>
  api.get<Note>(`/api/notes/${id}`)

export const createNote = (data: Partial<Pick<Note, 'title' | 'content' | 'tags'>>) =>
  api.post<Note>('/api/notes', data)

export const updateNote = (id: string, data: Partial<Pick<Note, 'title' | 'content' | 'tags'>>) =>
  api.patch<Note>(`/api/notes/${id}`, data)

export const deleteNote = (id: string) =>
  api.delete(`/api/notes/${id}`)

export const toggleStar = (id: string) =>
  api.patch<{ starred: boolean }>(`/api/notes/${id}/star`)

export const addCollaborator = (id: string, email: string) =>
  api.post<{ message: string; collaborator: { id: string; name: string; email: string } }>(
    `/api/notes/${id}/collaborators`,
    { email }
  )
