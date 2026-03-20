'use client'
import { useEffect, useState, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useBoardStore } from '@/store/boardStore'
import { useUIStore } from '@/store/uiStore'
import BoardCanvas from '@/components/board/BoardCanvas'
import CardModal from '@/components/card/CardModal'
import Avatar from '@/components/ui/Avatar'

export default function BoardPage({ params }: { params: { boardId: string } }) {
  const router = useRouter()
  const { board, isLoading, loadBoard } = useBoardStore()
  const { isCardModalOpen, currentUserName, logout, setCurrentUser } = useUIStore()
  const [starLoading, setStarLoading] = useState(false)
  const [editingTitle, setEditingTitle] = useState(false)
  const [titleValue, setTitleValue] = useState('')
  const titleInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const saved = localStorage.getItem('kanban_user')
    if (!saved) { router.replace('/login'); return }
    const u = JSON.parse(saved)
    setCurrentUser(u.id, u.name)
    loadBoard(params.boardId)
  }, [params.boardId, loadBoard, router, setCurrentUser])

  function handleLogout() {
    logout()
    router.push('/login')
  }

  useEffect(() => {
    if (editingTitle) titleInputRef.current?.select()
  }, [editingTitle])

  async function saveTitle() {
    const trimmed = titleValue.trim()
    if (trimmed && trimmed !== board?.title) {
      await fetch(`/api/boards/${board!.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: trimmed }),
      })
      loadBoard(params.boardId)
    }
    setEditingTitle(false)
  }

  async function toggleStar() {
    if (!board) return
    setStarLoading(true)
    await fetch(`/api/boards/${board.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isStarred: !board.isStarred }),
    })
    loadBoard(params.boardId)
    setStarLoading(false)
  }

  if (isLoading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--board-bg)' }}>
        <div style={{ color: 'var(--text-muted)', fontSize: 14 }}>Carregando board...</div>
      </div>
    )
  }

  if (!board) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'var(--board-bg)', gap: 12 }}>
        <p style={{ color: 'var(--text-muted)' }}>Board não encontrado</p>
        <Link href="/boards" style={{ color: 'var(--accent)', fontSize: 14 }}>← Voltar para boards</Link>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: board.coverColor ? `linear-gradient(180deg, ${board.coverColor}33 0%, var(--board-bg) 200px)` : 'var(--board-bg)' }}>
      {/* Header */}
      <div style={{ background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(10px)', borderBottom: '1px solid rgba(255,255,255,0.08)', padding: '0 16px', height: 48, display: 'flex', alignItems: 'center', gap: 12, position: 'sticky', top: 0, zIndex: 30 }}>
        <Link href="/boards" style={{ color: 'var(--text-secondary)', fontSize: 13, display: 'flex', alignItems: 'center', gap: 4, textDecoration: 'none', padding: '4px 8px', borderRadius: 4, transition: 'background 0.1s' }}>
          ← Boards
        </Link>
        <div style={{ width: 1, height: 20, background: 'rgba(255,255,255,0.2)' }} />
        {editingTitle ? (
          <input
            ref={titleInputRef}
            value={titleValue}
            onChange={(e) => setTitleValue(e.target.value)}
            onBlur={saveTitle}
            onKeyDown={(e) => {
              if (e.key === 'Enter') saveTitle()
              if (e.key === 'Escape') setEditingTitle(false)
            }}
            style={{
              fontSize: 16, fontWeight: 700, color: '#e2e8f0',
              background: 'rgba(255,255,255,0.1)',
              border: '1px solid rgba(255,255,255,0.3)',
              borderRadius: 4, padding: '2px 8px',
              outline: 'none', width: 220,
            }}
          />
        ) : (
          <h1
            style={{ fontSize: 16, fontWeight: 700, color: '#e2e8f0', cursor: 'text' }}
            onClick={() => { setTitleValue(board.title); setEditingTitle(true) }}
          >
            {board.title}
          </h1>
        )}
        {board.team && (
          <span style={{ fontSize: 13, color: 'var(--text-muted)', padding: '2px 8px', background: 'rgba(255,255,255,0.07)', borderRadius: 4 }}>
            {board.team.name}
          </span>
        )}
        <button
          className="btn-ghost"
          style={{ padding: '4px 8px', fontSize: 16, color: board.isStarred ? '#f2d600' : 'var(--text-muted)' }}
          onClick={toggleStar}
          disabled={starLoading}
          title={board.isStarred ? 'Remover favorito' : 'Favoritar'}
        >
          {board.isStarred ? '★' : '☆'}
        </button>

        {/* Spacer + user */}
        <div style={{ flex: 1 }} />
        {currentUserName && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Avatar user={{ name: currentUserName, color: '#6366f1' }} size="sm" />
            <span style={{ fontSize: 13, color: '#94a3b8' }}>{currentUserName}</span>
            <button className="btn-ghost" onClick={handleLogout} style={{ fontSize: 12, padding: '4px 8px', color: '#64748b' }}>Sair</button>
          </div>
        )}
      </div>

      {/* Board Canvas */}
      <BoardCanvas />

      {/* Card Modal */}
      {isCardModalOpen && <CardModal />}
    </div>
  )
}
