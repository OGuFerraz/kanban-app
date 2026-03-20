'use client'
import { useEffect, useState, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import CreateBoardModal from '@/components/dashboard/CreateBoardModal'
import CreateTeamModal from '@/components/dashboard/CreateTeamModal'
import { useUIStore } from '@/store/uiStore'
import { Board, Team } from '@/types'
import Avatar from '@/components/ui/Avatar'

export default function BoardsPage() {
  const router = useRouter()
  const { currentUserId, currentUserName, logout, setCurrentUser } = useUIStore()

  // Restore session from localStorage & guard route
  useEffect(() => {
    const saved = localStorage.getItem('kanban_user')
    if (!saved) { router.replace('/login'); return }
    const u = JSON.parse(saved)
    setCurrentUser(u.id, u.name)
  }, [router, setCurrentUser])

  function handleLogout() {
    logout()
    router.push('/login')
  }
  const [boards, setBoards] = useState<Board[]>([])
  const [teams, setTeams] = useState<Team[]>([])
  const [showCreateBoard, setShowCreateBoard] = useState(false)
  const [showCreateTeam, setShowCreateTeam] = useState(false)
  const [selectedTeam, setSelectedTeam] = useState<string | 'all'>('all')

  async function load() {
    const [boardsRes, teamsRes] = await Promise.all([
      fetch('/api/boards'),
      fetch('/api/teams'),
    ])
    setBoards(await boardsRes.json())
    setTeams(await teamsRes.json())
  }

  useEffect(() => { load() }, [])

  const filteredBoards = selectedTeam === 'all'
    ? boards
    : boards.filter((b) => b.teamId === selectedTeam)

  const grouped = teams.reduce<Record<string, Board[]>>((acc, team) => {
    acc[team.id] = filteredBoards.filter((b) => b.teamId === team.id)
    return acc
  }, {})

  return (
    <div style={{ minHeight: '100vh', background: 'var(--board-bg)', display: 'flex', flexDirection: 'column' }}>
      {/* Nav */}
      <nav style={{ background: 'rgba(15,25,35,0.95)', borderBottom: '1px solid rgba(255,255,255,0.08)', padding: '0 24px', height: 50, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 40, backdropFilter: 'blur(10px)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 28, height: 28, background: 'var(--accent)', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
              <rect x="3" y="3" width="7" height="18" rx="2"/><rect x="14" y="3" width="7" height="11" rx="2"/>
            </svg>
          </div>
          <span style={{ fontWeight: 700, fontSize: 16, color: '#e2e8f0' }}>Kanban</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button className="btn-secondary" style={{ fontSize: 13, padding: '5px 12px' }} onClick={() => setShowCreateTeam(true)}>+ Equipe</button>
          <button className="btn-primary" style={{ fontSize: 13, padding: '5px 12px' }} onClick={() => setShowCreateBoard(true)}>+ Board</button>
          <button className="btn-ghost" style={{ fontSize: 13, padding: '5px 12px' }} onClick={() => router.push('/canvas')}>🎨 Canvas</button>
          {currentUserName && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 4, paddingLeft: 12, borderLeft: '1px solid rgba(255,255,255,0.1)' }}>
              <Avatar user={{ name: currentUserName, color: '#6366f1' }} size="sm" />
              <span style={{ fontSize: 13, color: '#94a3b8', maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{currentUserName}</span>
              <button
                className="btn-ghost"
                onClick={handleLogout}
                style={{ fontSize: 12, padding: '4px 8px', color: '#64748b' }}
                title="Sair"
              >
                Sair
              </button>
            </div>
          )}
        </div>
      </nav>

      <div style={{ display: 'flex', flex: 1 }}>
        {/* Sidebar */}
        <aside style={{ width: 220, background: 'rgba(26,37,53,0.6)', borderRight: '1px solid rgba(255,255,255,0.06)', padding: '20px 12px', flexShrink: 0 }}>
          <div style={{ marginBottom: 20 }}>
            <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8, padding: '0 8px' }}>Espaços de Trabalho</p>
            <div
              className={`sidebar-item ${selectedTeam === 'all' ? 'active' : ''}`}
              onClick={() => setSelectedTeam('all')}
            >
              Todos os Boards
            </div>
            {teams.map((team) => (
              <TeamSidebarItem
                key={team.id}
                team={team}
                isActive={selectedTeam === team.id}
                onSelect={() => setSelectedTeam(team.id)}
                onRenamed={load}
              />
            ))}
            <div className="sidebar-item" onClick={() => setShowCreateTeam(true)} style={{ color: 'var(--text-muted)', fontSize: 13 }}>
              + Nova Equipe
            </div>
          </div>
        </aside>

        {/* Main */}
        <main style={{ flex: 1, padding: '28px 32px', overflowY: 'auto' }}>
          {selectedTeam === 'all' ? (
            teams.map((team) => {
              const teamBoards = grouped[team.id] ?? []
              return (
                <section key={team.id} style={{ marginBottom: 40 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                    <div style={{ width: 28, height: 28, borderRadius: 6, background: '#4f8ef7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700 }}>
                      {team.name[0].toUpperCase()}
                    </div>
                    <h2 style={{ fontSize: 16, fontWeight: 700, color: '#e2e8f0' }}>{team.name}</h2>
                  </div>
                  <BoardGrid boards={teamBoards} onAddBoard={() => setShowCreateBoard(true)} onRenamed={load} />
                </section>
              )
            })
          ) : (
            <section>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: '#e2e8f0', marginBottom: 16 }}>
                {teams.find((t) => t.id === selectedTeam)?.name}
              </h2>
              <BoardGrid boards={filteredBoards} onAddBoard={() => setShowCreateBoard(true)} onRenamed={load} />
            </section>
          )}

          {boards.length === 0 && (
            <div style={{ textAlign: 'center', padding: '80px 20px', color: 'var(--text-muted)' }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>📋</div>
              <p style={{ fontSize: 16, marginBottom: 8 }}>Nenhum board ainda</p>
              <p style={{ fontSize: 14, marginBottom: 24 }}>Crie um board para começar a organizar suas tarefas</p>
              <button className="btn-primary" onClick={() => setShowCreateBoard(true)}>Criar primeiro board</button>
            </div>
          )}
        </main>
      </div>

      {showCreateBoard && (
        <CreateBoardModal
          teams={teams.map((t) => ({ id: t.id, name: t.name }))}
          onClose={() => setShowCreateBoard(false)}
          onCreated={load}
        />
      )}
      {showCreateTeam && (
        <CreateTeamModal onClose={() => setShowCreateTeam(false)} onCreated={load} />
      )}
    </div>
  )
}

function BoardGrid({ boards, onAddBoard, onRenamed }: { boards: Board[]; onAddBoard: () => void; onRenamed: () => void }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 14 }}>
      {boards.map((board) => (
        <BoardCard key={board.id} board={board} onRenamed={onRenamed} />
      ))}
      <button
        onClick={onAddBoard}
        style={{
          background: 'rgba(255,255,255,0.06)',
          border: '2px dashed rgba(255,255,255,0.15)',
          borderRadius: 10, height: 120,
          color: 'var(--text-muted)', fontSize: 14,
          cursor: 'pointer', transition: 'background 0.15s, color 0.15s',
        }}
        onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = '#e2e8f0' }}
        onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = 'var(--text-muted)' }}
      >
        + Criar Board
      </button>
    </div>
  )
}

function BoardCard({ board, onRenamed }: { board: Board; onRenamed: () => void }) {
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState(board.title)
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  useEffect(() => {
    if (editing) inputRef.current?.select()
  }, [editing])

  async function save() {
    const trimmed = value.trim()
    if (trimmed && trimmed !== board.title) {
      await fetch(`/api/boards/${board.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: trimmed }),
      })
      onRenamed()
    } else {
      setValue(board.title)
    }
    setEditing(false)
  }

  return (
    <div style={{ position: 'relative', borderRadius: 10, overflow: 'hidden', height: 120 }}>
      <div
        style={{
          background: board.coverColor,
          borderRadius: 10,
          height: 120,
          padding: 14,
          cursor: 'pointer',
          transition: 'transform 0.15s, box-shadow 0.15s',
          position: 'relative',
          overflow: 'hidden',
        }}
        onClick={() => !editing && router.push(`/boards/${board.id}`)}
        onMouseEnter={(e) => { if (!editing) { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.4)' } }}
        onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none' }}
      >
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.2)', borderRadius: 10 }} />
        <div style={{ position: 'relative', zIndex: 1, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          {editing ? (
            <input
              ref={inputRef}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onBlur={save}
              onKeyDown={(e) => {
                if (e.key === 'Enter') save()
                if (e.key === 'Escape') { setValue(board.title); setEditing(false) }
              }}
              onClick={(e) => e.stopPropagation()}
              style={{
                background: 'rgba(0,0,0,0.5)',
                border: '1px solid rgba(255,255,255,0.4)',
                borderRadius: 4,
                color: 'white',
                fontWeight: 700,
                fontSize: 15,
                padding: '2px 6px',
                width: '100%',
                outline: 'none',
              }}
            />
          ) : (
            <span
              style={{ fontWeight: 700, fontSize: 15, color: 'white', lineHeight: 1.3, cursor: 'text' }}
              onClick={(e) => { e.stopPropagation(); e.preventDefault(); setValue(board.title); setEditing(true) }}
            >
              {board.title}
            </span>
          )}
          {board.team && <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)' }}>{board.team.name}</span>}
        </div>
      </div>
    </div>
  )
}

function TeamSidebarItem({ team, isActive, onSelect, onRenamed }: {
  team: Team
  isActive: boolean
  onSelect: () => void
  onRenamed: () => void
}) {
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState(team.name)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (editing) inputRef.current?.select()
  }, [editing])

  async function save() {
    const trimmed = value.trim()
    if (trimmed && trimmed !== team.name) {
      await fetch(`/api/teams/${team.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: trimmed }),
      })
      onRenamed()
    } else {
      setValue(team.name)
    }
    setEditing(false)
  }

  if (editing) {
    return (
      <div style={{ padding: '4px 8px' }}>
        <input
          ref={inputRef}
          className="input-field"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onBlur={save}
          onKeyDown={(e) => {
            if (e.key === 'Enter') save()
            if (e.key === 'Escape') { setValue(team.name); setEditing(false) }
          }}
          style={{ padding: '4px 8px', fontSize: 13 }}
        />
      </div>
    )
  }

  return (
    <div
      className={`sidebar-item ${isActive ? 'active' : ''}`}
      onClick={onSelect}
      style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 4 }}
    >
      <span style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 0 }}>
        <span style={{ width: 20, height: 20, borderRadius: 4, background: '#4f8ef7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, flexShrink: 0 }}>
          {team.name[0].toUpperCase()}
        </span>
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{team.name}</span>
      </span>
      <button
        className="btn-ghost"
        title="Renomear equipe"
        onClick={(e) => { e.stopPropagation(); setValue(team.name); setEditing(true) }}
        style={{ padding: '2px 5px', fontSize: 12, opacity: 0.5, flexShrink: 0 }}
      >
        ✏
      </button>
    </div>
  )
}
