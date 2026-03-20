'use client'
import { useState } from 'react'
import { BOARD_COLORS } from '@/lib/utils'
import Modal from '@/components/ui/Modal'

interface Props {
  teams: { id: string; name: string }[]
  onClose: () => void
  onCreated: () => void
}

export default function CreateBoardModal({ teams, onClose, onCreated }: Props) {
  const [title, setTitle] = useState('')
  const [teamId, setTeamId] = useState(teams[0]?.id ?? '')
  const [color, setColor] = useState(BOARD_COLORS[0])
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim() || !teamId) return
    setLoading(true)
    try {
      await fetch('/api/boards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: title.trim(), teamId, coverColor: color }),
      })
      onCreated()
      onClose()
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal onClose={onClose}>
      <div style={{ padding: 28 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 20, color: '#e2e8f0' }}>Criar novo board</h2>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 6, display: 'block', fontWeight: 600, textTransform: 'uppercase' }}>Título</label>
            <input
              className="input-field"
              placeholder="Nome do board..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              autoFocus
            />
          </div>

          {teams.length > 1 && (
            <div>
              <label style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 6, display: 'block', fontWeight: 600, textTransform: 'uppercase' }}>Equipe</label>
              <select
                className="input-field"
                value={teamId}
                onChange={(e) => setTeamId(e.target.value)}
                style={{ cursor: 'pointer' }}
              >
                {teams.map((t) => (
                  <option key={t.id} value={t.id} style={{ background: '#253347' }}>{t.name}</option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8, display: 'block', fontWeight: 600, textTransform: 'uppercase' }}>Cor</label>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {BOARD_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  style={{
                    width: 36, height: 36, borderRadius: 8, background: c,
                    border: color === c ? '3px solid white' : '3px solid transparent',
                    cursor: 'pointer', transition: 'transform 0.1s',
                    transform: color === c ? 'scale(1.1)' : 'scale(1)',
                  }}
                />
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 4 }}>
            <button type="button" className="btn-secondary" onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn-primary" disabled={loading || !title.trim()}>
              {loading ? 'Criando...' : 'Criar Board'}
            </button>
          </div>
        </form>
      </div>
    </Modal>
  )
}
