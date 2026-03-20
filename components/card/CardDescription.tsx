'use client'
import { useState } from 'react'
import { Card } from '@/types'

interface Props {
  card: Pick<Card, 'id' | 'description'>
  onUpdated: (patch: Partial<Card>) => void
}

export default function CardDescription({ card, onUpdated }: Props) {
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState(card.description ?? '')

  async function save() {
    await fetch(`/api/cards/${card.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ description: value }),
    })
    onUpdated({ description: value })
    setEditing(false)
  }

  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-secondary)' }}>≡ Descrição</span>
        {!editing && (
          <button className="btn-ghost" style={{ fontSize: 12, padding: '2px 8px' }} onClick={() => setEditing(true)}>
            Editar
          </button>
        )}
      </div>
      {editing ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <textarea
            autoFocus
            className="input-field"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            rows={5}
            placeholder="Adicione uma descrição mais detalhada..."
            style={{ resize: 'vertical', fontSize: 14 }}
          />
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn-primary" onClick={save}>Salvar</button>
            <button className="btn-ghost" onClick={() => { setValue(card.description ?? ''); setEditing(false) }}>Cancelar</button>
          </div>
        </div>
      ) : (
        <div
          onClick={() => setEditing(true)}
          style={{
            minHeight: 56, padding: '10px 12px', borderRadius: 6,
            background: 'rgba(255,255,255,0.05)',
            cursor: 'pointer', fontSize: 14, lineHeight: 1.6,
            color: card.description ? '#cbd5e1' : 'var(--text-muted)',
            whiteSpace: 'pre-wrap', wordBreak: 'break-word',
          }}
        >
          {card.description || 'Adicione uma descrição...'}
        </div>
      )}
    </div>
  )
}
