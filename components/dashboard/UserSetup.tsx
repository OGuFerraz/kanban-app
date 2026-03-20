'use client'
import { useState, useEffect } from 'react'
import { useUIStore } from '@/store/uiStore'

export default function UserSetup() {
  const { currentUserId, setCurrentUser } = useUIStore()
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem('kanban_user')
    if (saved) {
      const u = JSON.parse(saved)
      setCurrentUser(u.id, u.name)
    }
  }, [setCurrentUser])

  if (currentUserId) return null

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    setLoading(true)
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), email: `${Date.now()}@kanban.local` }),
      })
      const user = await res.json()
      localStorage.setItem('kanban_user', JSON.stringify({ id: user.id, name: user.name }))
      setCurrentUser(user.id, user.name)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200,
    }}>
      <div style={{ background: '#1e2d40', borderRadius: 12, padding: 32, width: 360, boxShadow: '0 20px 60px rgba(0,0,0,0.8)' }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8, color: '#e2e8f0' }}>Bem-vindo ao Kanban!</h2>
        <p style={{ color: '#94a3b8', fontSize: 14, marginBottom: 24 }}>Como você quer ser chamado?</p>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <input
            className="input-field"
            placeholder="Seu nome..."
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
          />
          <button className="btn-primary" type="submit" disabled={loading || !name.trim()}>
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  )
}
