'use client'
import { useState, useRef } from 'react'
import { Card, TeamMember } from '@/types'
import Avatar from '@/components/ui/Avatar'
import { useClickOutside } from '@/hooks/useClickOutside'

interface Props {
  card: Card
  boardMembers: TeamMember[]
  onUpdated: () => void
}

export default function CardMembersSection({ card, boardMembers, onUpdated }: Props) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  useClickOutside(ref, () => setOpen(false))

  const assignedIds = new Set(card.members?.map((m) => m.userId))

  async function toggleMember(userId: string) {
    if (assignedIds.has(userId)) {
      await fetch(`/api/cards/${card.id}/members`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      })
    } else {
      await fetch(`/api/cards/${card.id}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      })
    }
    onUpdated()
  }

  return (
    <div style={{ position: 'relative', marginBottom: 4 }} ref={ref}>
      <button className="btn-ghost" style={{ width: '100%', textAlign: 'left', fontSize: 13 }} onClick={() => setOpen(!open)}>
        👤 Membros
      </button>
      {open && (
        <div className="popover" style={{ position: 'absolute', right: 0, top: '100%', width: 220, padding: 12, zIndex: 200 }}>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8, fontWeight: 600, textTransform: 'uppercase' }}>Membros</p>
          {boardMembers.length === 0 && (
            <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Nenhum membro na equipe</p>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {boardMembers.map((tm) => (
              <div
                key={tm.userId}
                onClick={() => toggleMember(tm.userId)}
                style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 8px', borderRadius: 6, cursor: 'pointer', background: assignedIds.has(tm.userId) ? 'rgba(255,255,255,0.1)' : 'transparent', transition: 'background 0.1s' }}
                onMouseEnter={(e) => { if (!assignedIds.has(tm.userId)) e.currentTarget.style.background = 'rgba(255,255,255,0.06)' }}
                onMouseLeave={(e) => { if (!assignedIds.has(tm.userId)) e.currentTarget.style.background = assignedIds.has(tm.userId) ? 'rgba(255,255,255,0.1)' : 'transparent' }}
              >
                <Avatar user={tm.user} size="sm" />
                <span style={{ fontSize: 13, flex: 1, color: '#e2e8f0' }}>{tm.user.name}</span>
                {assignedIds.has(tm.userId) && <span style={{ fontSize: 14, color: '#61bd4f' }}>✓</span>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
