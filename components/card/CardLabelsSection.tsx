'use client'
import { useState, useRef } from 'react'
import { Card, Label } from '@/types'
import { useClickOutside } from '@/hooks/useClickOutside'
import { LABEL_COLORS } from '@/lib/utils'

interface Props {
  card: Card
  boardLabels: Label[]
  onUpdated: () => void
}

export default function CardLabelsSection({ card, boardLabels, onUpdated }: Props) {
  const [open, setOpen] = useState(false)
  const [newLabelName, setNewLabelName] = useState('')
  const [newLabelColor, setNewLabelColor] = useState(LABEL_COLORS[0].value)
  const [creatingLabel, setCreatingLabel] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  useClickOutside(ref, () => setOpen(false))

  const attachedIds = new Set(card.labels?.map((cl) => cl.labelId))

  async function toggleLabel(labelId: string) {
    if (attachedIds.has(labelId)) {
      await fetch(`/api/cards/${card.id}/labels`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ labelId }),
      })
    } else {
      await fetch(`/api/cards/${card.id}/labels`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ labelId }),
      })
    }
    onUpdated()
  }

  async function createLabel() {
    if (!newLabelColor) return
    const res = await fetch(`/api/boards/${card.id.slice(0, 0)}labels`, { method: 'GET' })
    // We need boardId — pass it via card's list context, let's get it from the board
    // For now: create via a dedicated endpoint
    // Actually we need boardId. Let's use card.id to fetch board.
    // Simplification: we use the labels API differently:
    const boardId = await getBoardId(card.id)
    if (!boardId) return
    const labelRes = await fetch(`/api/boards/${boardId}/labels`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newLabelName, color: newLabelColor }),
    })
    const label = await labelRes.json()
    await fetch(`/api/cards/${card.id}/labels`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ labelId: label.id }),
    })
    setNewLabelName('')
    setCreatingLabel(false)
    onUpdated()
  }

  return (
    <div style={{ position: 'relative', marginBottom: 4 }} ref={ref}>
      <button className="btn-ghost" style={{ width: '100%', textAlign: 'left', fontSize: 13 }} onClick={() => setOpen(!open)}>
        🏷 Etiquetas
      </button>
      {open && (
        <div className="popover" style={{ position: 'absolute', right: 0, top: '100%', width: 240, padding: 12, zIndex: 200 }}>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8, fontWeight: 600, textTransform: 'uppercase' }}>Etiquetas</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 200, overflowY: 'auto', marginBottom: 8 }}>
            {boardLabels.map((label) => (
              <div
                key={label.id}
                onClick={() => toggleLabel(label.id)}
                style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 8px', borderRadius: 6, cursor: 'pointer', background: attachedIds.has(label.id) ? 'rgba(255,255,255,0.1)' : 'transparent', transition: 'background 0.1s' }}
                onMouseEnter={(e) => { if (!attachedIds.has(label.id)) e.currentTarget.style.background = 'rgba(255,255,255,0.06)' }}
                onMouseLeave={(e) => { if (!attachedIds.has(label.id)) e.currentTarget.style.background = 'transparent' }}
              >
                <div style={{ width: 36, height: 24, borderRadius: 4, background: label.color, flexShrink: 0 }} />
                <span style={{ fontSize: 13, flex: 1, color: '#e2e8f0' }}>{label.name || '—'}</span>
                {attachedIds.has(label.id) && <span style={{ fontSize: 14 }}>✓</span>}
              </div>
            ))}
          </div>

          {!creatingLabel ? (
            <button className="btn-secondary" style={{ width: '100%', fontSize: 13 }} onClick={() => setCreatingLabel(true)}>
              + Criar etiqueta
            </button>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <input className="input-field" placeholder="Nome (opcional)" value={newLabelName} onChange={(e) => setNewLabelName(e.target.value)} style={{ fontSize: 13 }} />
              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                {LABEL_COLORS.map((c) => (
                  <button
                    key={c.value}
                    type="button"
                    onClick={() => setNewLabelColor(c.value)}
                    title={c.name}
                    style={{ width: 28, height: 28, borderRadius: 4, background: c.value, border: newLabelColor === c.value ? '3px solid white' : '3px solid transparent', cursor: 'pointer' }}
                  />
                ))}
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <button className="btn-primary" style={{ fontSize: 13, flex: 1 }} onClick={createLabel}>Criar</button>
                <button className="btn-ghost" onClick={() => setCreatingLabel(false)}>Cancelar</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

async function getBoardId(cardId: string): Promise<string | null> {
  const res = await fetch(`/api/cards/${cardId}`)
  if (!res.ok) return null
  const card = await res.json()
  // We need boardId from listId — let's get it via list
  const listRes = await fetch(`/api/lists/${card.listId}`)
  if (!listRes.ok) return null
  const list = await listRes.json()
  return list.boardId
}
