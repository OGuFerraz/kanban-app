'use client'
import { useState } from 'react'
import Modal from '@/components/ui/Modal'

interface Props {
  onClose: () => void
  onCreated: () => void
}

export default function CreateTeamModal({ onClose, onCreated }: Props) {
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    setLoading(true)
    try {
      const slug = name.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') + '-' + Date.now()
      await fetch('/api/teams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), slug }),
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
        <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 20, color: '#e2e8f0' }}>Criar nova equipe</h2>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 6, display: 'block', fontWeight: 600, textTransform: 'uppercase' }}>Nome da Equipe</label>
            <input
              className="input-field"
              placeholder="Ex: Marketing, Vendas, Produção..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
          </div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button type="button" className="btn-secondary" onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn-primary" disabled={loading || !name.trim()}>
              {loading ? 'Criando...' : 'Criar Equipe'}
            </button>
          </div>
        </form>
      </div>
    </Modal>
  )
}
