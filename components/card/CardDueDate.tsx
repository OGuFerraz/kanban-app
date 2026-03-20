'use client'
import { useState, useRef } from 'react'
import { Card } from '@/types'
import { useClickOutside } from '@/hooks/useClickOutside'

interface Props {
  card: Pick<Card, 'id' | 'dueDate' | 'isComplete'>
  onUpdated: (patch: Partial<Card>) => void
}

export default function CardDueDate({ card, onUpdated }: Props) {
  const [open, setOpen] = useState(false)
  const [value, setValue] = useState(card.dueDate ? card.dueDate.split('T')[0] : '')
  const ref = useRef<HTMLDivElement>(null)
  useClickOutside(ref, () => setOpen(false))

  async function save() {
    const dueDate = value ? new Date(value + 'T00:00:00').toISOString() : null
    await fetch(`/api/cards/${card.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dueDate }),
    })
    onUpdated({ dueDate: dueDate ?? undefined })
    setOpen(false)
  }

  async function clear() {
    await fetch(`/api/cards/${card.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dueDate: null }),
    })
    setValue('')
    onUpdated({ dueDate: undefined })
    setOpen(false)
  }

  return (
    <div style={{ position: 'relative', marginBottom: 4 }} ref={ref}>
      <button className="btn-ghost" style={{ width: '100%', textAlign: 'left', fontSize: 13 }} onClick={() => setOpen(!open)}>
        📅 Data
      </button>
      {open && (
        <div className="popover" style={{ position: 'absolute', right: 0, top: '100%', width: 200, padding: 12, zIndex: 200 }}>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8, fontWeight: 600, textTransform: 'uppercase' }}>Data de Vencimento</p>
          <input
            type="date"
            className="input-field"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            style={{ marginBottom: 8, colorScheme: 'dark' }}
          />
          <div style={{ display: 'flex', gap: 6 }}>
            <button className="btn-primary" style={{ flex: 1, fontSize: 13 }} onClick={save}>Salvar</button>
            {card.dueDate && <button className="btn-ghost" style={{ fontSize: 13 }} onClick={clear}>Remover</button>}
          </div>
        </div>
      )}
    </div>
  )
}
