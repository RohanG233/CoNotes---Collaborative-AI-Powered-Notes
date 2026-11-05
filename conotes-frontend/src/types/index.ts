export interface User {
  id: string
  name: string
  email: string
  createdAt?: string
}

export interface Note {
  _id: string
  title: string
  content: string
  starred: boolean
  tags: string[]
  owner: string
  collaborators: string[]
  accessRole: 'owner' | 'collaborator'
  createdAt: string
  updatedAt: string
}

export interface NoteListItem {
  _id: string
  title: string
  starred: boolean
  tags: string[]
  owner: string
  accessRole: 'owner' | 'collaborator'
  createdAt: string
  updatedAt: string
}

export interface Pagination {
  total: number
  page: number
  pages: number
  limit: number
}

export interface NotesResponse {
  notes: NoteListItem[]
  pagination: Pagination
}

export type AIAction = 'summarize' | 'questions' | 'explain' | 'feedback'

export interface AIRequest {
  action: AIAction
  title: string
  content: string
  answer?: string
}

export interface PresenceUser {
  id: string
  name: string
}

export interface NoteUpdatePayload {
  content: string
  from: string
  userId: string
  ts: number
}

export interface CursorUpdatePayload {
  userId: string
  name: string
  position: unknown
}

export interface UserTypingPayload {
  userId: string
  name: string
  isTyping: boolean
}
