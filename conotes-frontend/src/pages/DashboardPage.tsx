import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useNotes } from '@/hooks/useNotes'
import { useDebounce } from '@/hooks/useDebounce'
import { NoteCard } from '@/components/NoteCard'
import { Sidebar } from '@/components/Sidebar'
import { RetroGrid } from '@/components/ui/retro-grid'
import ExpandableSearchBar from '@/components/ui/21stdev/search-bar'
import styles from './DashboardPage.module.css'

export function DashboardPage() {
  const navigate = useNavigate()
  const [filter, setFilter] = useState<'all' | 'starred'>('all')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [isCreating, setIsCreating] = useState(false)

  const debouncedSearch = useDebounce(search, 400)

  const { notes, pagination, isLoading, error, star, remove, create } = useNotes({
    q: debouncedSearch || undefined,
    starred: filter === 'starred' ? true : undefined,
    page,
  })

  const handleNew = async () => {
    setIsCreating(true)
    try {
      const note = await create()
      navigate(`/editor/${note._id}`)
    } catch {
      // create failed — likely auth issue, axios interceptor will handle refresh
    } finally {
      setIsCreating(false)
    }
  }

  const handleFilterChange = (f: 'all' | 'starred') => {
    setFilter(f)
    setPage(1)
  }

  const handleSearch = (val: string) => {
    setSearch(val)
    setPage(1)
  }

  return (
    <div className={styles.layout}>
      <RetroGrid
        angle={65}
        cellSize={60}
        opacity={0.7}
        lightLineColor="rgba(91,81,245,0.8)"
        darkLineColor="rgba(108,99,255,0.5)"
      />
      <Sidebar
        filter={filter}
        onFilterChange={handleFilterChange}
        onNewNote={handleNew}
        isCreating={isCreating}
      />

      <main className={styles.main}>
        <header className={styles.header}>
          <h1 className={styles.heading}>
            {filter === 'starred' ? 'Starred Notes' : 'All Notes'}
          </h1>
          <ExpandableSearchBar
            expandDirection="left"
            width={300}
            placeholder="Search notes…"
            value={search}
            onChange={handleSearch}
            onSearch={handleSearch}
          />
        </header>

        {isLoading && (
          <div className={styles.state} aria-live="polite" aria-busy="true">
            <div className={styles.spinner} aria-label="Loading notes" />
          </div>
        )}

        {error && (
          <div className={styles.state}>
            <p className={styles.errorMsg} role="alert">{error}</p>
          </div>
        )}

        {!isLoading && !error && notes.length === 0 && (
          <div className={styles.state}>
            <p className={styles.empty}>
              {search ? 'No notes match your search.' : 'No notes yet. Create your first one!'}
            </p>
          </div>
        )}

        {!isLoading && notes.length > 0 && (
          <div className={styles.grid}>
            {notes.map((note) => (
              <NoteCard
                key={note._id}
                note={note}
                onOpen={(id) => navigate(`/editor/${id}`)}
                onStar={star}
                onDelete={remove}
              />
            ))}
          </div>
        )}

        {pagination && pagination.pages > 1 && (
          <nav className={styles.pagination} aria-label="Pagination">
            <button
              className={styles.pageBtn}
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              aria-label="Previous page"
            >
              ← Prev
            </button>
            <span className={styles.pageInfo}>
              {page} / {pagination.pages}
            </span>
            <button
              className={styles.pageBtn}
              disabled={page >= pagination.pages}
              onClick={() => setPage((p) => p + 1)}
              aria-label="Next page"
            >
              Next →
            </button>
          </nav>
        )}
      </main>
    </div>
  )
}
