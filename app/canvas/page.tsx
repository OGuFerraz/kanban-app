'use client'
import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useUIStore } from '@/store/uiStore'
import { Team } from '@/types'
import Avatar from '@/components/ui/Avatar'

interface CanvasItem {
  id: string
  title: string
  teamId: string
  team?: { name: string }
  createdAt: string
  updatedAt: string
}

export default function CanvasPage() {
  const router = useRouter()
  const { currentUserId, currentUserName, logout, setCurrentUser } = useUIStore()

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

  const [canvases, setCanvases] = useState<CanvasItem[]>([])
  const [teams, setTeams] = useState<Team[]>([])
  const [selectedTeam, setSelectedTeam] = useState<string | 'all'>('all')
  const [showCreate, setShowCreate] = useState(false)

  async function load() {
    const [canvasRes, teamsRes] = await Promise.all([
      fetch('/api/canvas'),
      fetch('/api/teams'),
    ])
    setCanvases(await canvasRes.json())
    setTeams(await teamsRes.json())
  }

  useEffect(() => { load() }, [])

  const filtered = selectedTeam === 'all'
    ? canvases
    : canvases.filter((c) => c.teamId === selectedTeam)

  const grouped = teams.reduce<Record<string, CanvasItem[]>>((acc, team) => {
    acc[team.id] = filtered.filter((c) => c.teamId === team.id)
    return acc
  }, {})

  return (
    <div style={{ minHeight: '100vh', background: 'var(--board-bg)', display: 'flex', flexDirection: 'column' }}>
      {/* Nav */}
      <nav style={{ background: 'rgba(15,25,35,0.95)', borderBottom: '1px solid rgba(255,255,255,0.08)', padding: '0 24px', height: 50, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 40, backdropFilter: 'blur(10px)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 28, height: 28, background: '#4f8ef7', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
              <circle cx="6" cy="6" r="2"/><circle cx="18" cy="6" r="2"/><circle cx="6" cy="18" r="2"/><circle cx="18" cy="18" r="2"/>
              <line x1="8" y1="6" x2="16" y2="6"/><line x1="8" y1="18" x2="16" y2="18"/>
              <line x1="6" y1="8" x2="6" y2="16"/><line x1="18" y1="8" x2="18" y2="16"/>
            </svg>
          </div>
          <span style={{ fontWeight: 700, fontSize: 16, color: '#e2e8f0' }}>Canvas</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button
            className="btn-ghost"
            style={{ fontSize: 13, padding: '5px 12px' }}
            onClick={() => router.push('/boards')}
          >
            ← Boards
          </button>
          <button
            className="btn-primary"
            style={{ fontSize: 13, padding: '5px 12px' }}
            onClick={() => setShowCreate(true)}
          >
            + Canvas
          </button>
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
              Todos os Canvas
            </div>
            {teams.map((team) => (
              <div
                key={team.id}
                className={`sidebar-item ${selectedTeam === team.id ? 'active' : ''}`}
                onClick={() => setSelectedTeam(team.id)}
                style={{ display: 'flex', alignItems: 'center', gap: 8 }}
              >
                <span style={{ width: 20, height: 20, borderRadius: 4, background: '#4f8ef7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, flexShrink: 0 }}>
                  {team.name[0].toUpperCase()}
                </span>
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{team.name}</span>
              </div>
            ))}
          </div>
        </aside>

        {/* Main */}
        <main style={{ flex: 1, padding: '28px 32px', overflowY: 'auto' }}>
          {selectedTeam === 'all' ? (
            teams.map((team) => {
              const teamCanvases = grouped[team.id] ?? []
              return (
                <section key={team.id} style={{ marginBottom: 40 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                    <div style={{ width: 28, height: 28, borderRadius: 6, background: '#4f8ef7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700 }}>
                      {team.name[0].toUpperCase()}
                    </div>
                    <h2 style={{ fontSize: 16, fontWeight: 700, color: '#e2e8f0' }}>{team.name}</h2>
                  </div>
                  <CanvasGrid canvases={teamCanvases} onAdd={() => setShowCreate(true)} onRefresh={load} />
                </section>
              )
            })
          ) : (
            <section>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: '#e2e8f0', marginBottom: 16 }}>
                {teams.find((t) => t.id === selectedTeam)?.name}
              </h2>
              <CanvasGrid canvases={filtered} onAdd={() => setShowCreate(true)} onRefresh={load} />
            </section>
          )}

          {canvases.length === 0 && (
            <div style={{ textAlign: 'center', padding: '80px 20px', color: 'var(--text-muted)' }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>🎨</div>
              <p style={{ fontSize: 16, marginBottom: 8 }}>Nenhum canvas ainda</p>
              <p style={{ fontSize: 14, marginBottom: 24 }}>Crie um canvas para começar a criar diagramas e fluxos</p>
              <button className="btn-primary" onClick={() => setShowCreate(true)}>Criar primeiro canvas</button>
            </div>
          )}
        </main>
      </div>

      {showCreate && (
        <CreateCanvasModal
          teams={teams}
          onClose={() => setShowCreate(false)}
          onCreated={(id) => { load(); router.push(`/canvas/${id}`) }}
        />
      )}
    </div>
  )
}

function CanvasGrid({ canvases, onAdd, onRefresh }: { canvases: CanvasItem[]; onAdd: () => void; onRefresh: () => void }) {
  const router = useRouter()
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 14 }}>
      {canvases.map((canvas) => (
        <CanvasCard key={canvas.id} canvas={canvas} onRefresh={onRefresh} />
      ))}
      <button
        onClick={onAdd}
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
        + Criar Canvas
      </button>
    </div>
  )
}

function CanvasCard({ canvas, onRefresh }: { canvas: CanvasItem; onRefresh: () => void }) {
  const router = useRouter()
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState(canvas.title)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { if (editing) inputRef.current?.select() }, [editing])

  async function save() {
    const trimmed = value.trim()
    if (trimmed && trimmed !== canvas.title) {
      await fetch(`/api/canvas/${canvas.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: trimmed }),
      })
      onRefresh()
    } else {
      setValue(canvas.title)
    }
    setEditing(false)
  }

  async function del() {
    if (!confirm(`Apagar "${canvas.title}"?`)) return
    await fetch(`/api/canvas/${canvas.id}`, { method: 'DELETE' })
    onRefresh()
  }

  return (
    <div
      style={{
        background: 'rgba(26,37,53,0.9)',
        border: '1px solid rgba(79,142,247,0.2)',
        borderRadius: 10,
        height: 120,
        padding: 14,
        cursor: editing ? 'default' : 'pointer',
        transition: 'transform 0.15s, box-shadow 0.15s, border-color 0.15s',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        position: 'relative',
      }}
      onClick={() => !editing && router.push(`/canvas/${canvas.id}`)}
      onMouseEnter={(e) => { if (!editing) { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.4)'; e.currentTarget.style.borderColor = 'rgba(79,142,247,0.5)' } }}
      onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.borderColor = 'rgba(79,142,247,0.2)' }}
    >
      {/* Delete button */}
      <button
        onClick={(e) => { e.stopPropagation(); del() }}
        title="Apagar canvas"
        style={{ position: 'absolute', top: 8, right: 8, background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: 14, padding: '2px 4px', borderRadius: 4, opacity: 0, transition: 'opacity 0.15s' }}
        onMouseEnter={(e) => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.color = '#f43f5e' }}
        onMouseLeave={(e) => { e.currentTarget.style.opacity = '0'; e.currentTarget.style.color = '#64748b' }}
        className="canvas-delete-btn"
      >✕</button>

      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
        <div style={{ width: 32, height: 32, borderRadius: 6, background: 'rgba(79,142,247,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#4f8ef7" strokeWidth="2">
            <circle cx="5" cy="5" r="2"/><circle cx="19" cy="5" r="2"/><circle cx="5" cy="19" r="2"/><circle cx="19" cy="19" r="2"/>
            <line x1="7" y1="5" x2="17" y2="5"/><line x1="7" y1="19" x2="17" y2="19"/>
            <line x1="5" y1="7" x2="5" y2="17"/><line x1="19" y1="7" x2="19" y2="17"/>
          </svg>
        </div>
        {editing ? (
          <input
            ref={inputRef}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onBlur={save}
            onKeyDown={(e) => { if (e.key === 'Enter') save(); if (e.key === 'Escape') { setValue(canvas.title); setEditing(false) } }}
            onClick={(e) => e.stopPropagation()}
            style={{ fontWeight: 700, fontSize: 14, color: '#e2e8f0', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(79,142,247,0.5)', borderRadius: 4, padding: '2px 6px', outline: 'none', flex: 1 }}
          />
        ) : (
          <span
            style={{ fontWeight: 700, fontSize: 14, color: '#e2e8f0', lineHeight: 1.3, flex: 1, cursor: 'text' }}
            onClick={(e) => { e.stopPropagation(); setValue(canvas.title); setEditing(true) }}
          >
            {canvas.title}
          </span>
        )}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        {canvas.team && <span style={{ fontSize: 12, color: '#4f8ef7' }}>{canvas.team.name}</span>}
        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
          {new Date(canvas.updatedAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
        </span>
      </div>
    </div>
  )
}

function CreateCanvasModal({ teams, onClose, onCreated }: {
  teams: Team[]
  onClose: () => void
  onCreated: (id: string) => void
}) {
  const [title, setTitle] = useState('')
  const [teamId, setTeamId] = useState(teams[0]?.id ?? '')
  const [loading, setLoading] = useState(false)

  async function handleCreate() {
    if (!title.trim() || !teamId) return
    setLoading(true)
    try {
      const res = await fetch('/api/canvas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: title.trim(), teamId }),
      })
      const canvas = await res.json()
      onCreated(canvas.id)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}
      onClick={onClose}
    >
      <div
        style={{ background: '#1a2535', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: 28, width: 380, maxWidth: '90vw' }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 style={{ fontSize: 17, fontWeight: 700, color: '#e2e8f0', marginBottom: 20 }}>Novo Canvas</h3>

        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 13, color: '#94a3b8', display: 'block', marginBottom: 6 }}>Título</label>
          <input
            className="input-field"
            placeholder="Nome do canvas..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleCreate() }}
            autoFocus
            style={{ width: '100%' }}
          />
        </div>

        <div style={{ marginBottom: 24 }}>
          <label style={{ fontSize: 13, color: '#94a3b8', display: 'block', marginBottom: 6 }}>Equipe</label>
          <select
            className="input-field"
            value={teamId}
            onChange={(e) => setTeamId(e.target.value)}
            style={{ width: '100%' }}
          >
            {teams.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </div>

        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button className="btn-ghost" onClick={onClose}>Cancelar</button>
          <button
            className="btn-primary"
            onClick={handleCreate}
            disabled={loading || !title.trim() || !teamId}
          >
            {loading ? 'Criando...' : 'Criar Canvas'}
          </button>
        </div>
      </div>
    </div>
  )
}
