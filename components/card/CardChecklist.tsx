'use client'
import { useState } from 'react'
import { Checklist } from '@/types'

interface Props {
  checklist: Checklist
  onUpdated: () => void
}

export default function CardChecklist({ checklist, onUpdated }: Props) {
  const [newItem, setNewItem] = useState('')
  const [addingItem, setAddingItem] = useState(false)

  const total = checklist.items.length
  const checked = checklist.items.filter((i) => i.isChecked).length
  const progress = total > 0 ? Math.round((checked / total) * 100) : 0

  async function toggleItem(itemId: string, isChecked: boolean) {
    await fetch(`/api/checklist-items/${itemId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isChecked }),
    })
    onUpdated()
  }

  async function addItem() {
    if (!newItem.trim()) { setAddingItem(false); return }
    await fetch(`/api/checklists/${checklist.id}/items`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: newItem.trim() }),
    })
    setNewItem('')
    setAddingItem(false)
    onUpdated()
  }

  async function deleteItem(itemId: string) {
    await fetch(`/api/checklist-items/${itemId}`, { method: 'DELETE' })
    onUpdated()
  }

  async function deleteChecklist() {
    await fetch(`/api/checklists/${checklist.id}`, { method: 'DELETE' })
    onUpdated()
  }

  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-secondary)' }}>☑ {checklist.title}</span>
        <button className="btn-ghost" style={{ fontSize: 12, padding: '2px 8px' }} onClick={deleteChecklist}>Excluir</button>
      </div>

      {/* Progress */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
        <span style={{ fontSize: 12, color: 'var(--text-muted)', minWidth: 28 }}>{progress}%</span>
        <div className="checklist-progress" style={{ flex: 1 }}>
          <div
            className="checklist-progress-fill"
            style={{ width: `${progress}%`, background: progress === 100 ? '#61bd4f' : '#4f8ef7' }}
          />
        </div>
      </div>

      {/* Items */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {checklist.items.map((item) => (
          <div
            key={item.id}
            style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '4px 8px', borderRadius: 4, transition: 'background 0.1s' }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.04)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
          >
            <input
              type="checkbox"
              checked={item.isChecked}
              onChange={(e) => toggleItem(item.id, e.target.checked)}
              style={{ width: 16, height: 16, cursor: 'pointer', accentColor: '#4f8ef7' }}
            />
            <span style={{ fontSize: 14, flex: 1, color: item.isChecked ? 'var(--text-muted)' : '#e2e8f0', textDecoration: item.isChecked ? 'line-through' : 'none' }}>
              {item.title}
            </span>
            <button
              className="btn-ghost"
              style={{ padding: '2px 6px', fontSize: 12, opacity: 0.5 }}
              onClick={() => deleteItem(item.id)}
            >
              ×
            </button>
          </div>
        ))}
      </div>

      {/* Add item */}
      {addingItem ? (
        <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
          <input
            autoFocus
            className="input-field"
            placeholder="Adicionar um item..."
            value={newItem}
            onChange={(e) => setNewItem(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') addItem(); if (e.key === 'Escape') setAddingItem(false) }}
          />
          <div style={{ display: 'flex', gap: 6 }}>
            <button className="btn-primary" style={{ fontSize: 13 }} onClick={addItem}>Adicionar</button>
            <button className="btn-ghost" onClick={() => setAddingItem(false)}>Cancelar</button>
          </div>
        </div>
      ) : (
        <button
          className="btn-ghost"
          style={{ marginTop: 8, fontSize: 13, padding: '6px 8px' }}
          onClick={() => setAddingItem(true)}
        >
          + Adicionar item
        </button>
      )}
    </div>
  )
}
