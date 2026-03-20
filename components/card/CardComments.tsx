'use client'
import { useState } from 'react'
import { Card, Comment } from '@/types'
import Avatar from '@/components/ui/Avatar'

interface Props {
  card: Pick<Card, 'id' | 'comments'>
  currentUserId: string | null
  onUpdated: () => void
}

export default function CardComments({ card, currentUserId, onUpdated }: Props) {
  const [comment, setComment] = useState('')
  const [loading, setLoading] = useState(false)

  async function addComment() {
    if (!comment.trim() || !currentUserId) return
    setLoading(true)
    await fetch(`/api/cards/${card.id}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: comment.trim(), authorId: currentUserId }),
    })
    setComment('')
    onUpdated()
    setLoading(false)
  }

  return (
    <div style={{ marginTop: 16 }}>
      <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 12 }}>💬 Comentários e Atividade</p>

      {currentUserId && (
        <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
          <textarea
            className="input-field"
            placeholder="Escrever um comentário..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={2}
            style={{ resize: 'none', fontSize: 14 }}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); addComment() } }}
          />
          <button
            className="btn-primary"
            style={{ flexShrink: 0, alignSelf: 'flex-end', fontSize: 13 }}
            onClick={addComment}
            disabled={loading || !comment.trim()}
          >
            Salvar
          </button>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {card.comments?.map((c) => (
          <CommentItem key={c.id} comment={c} />
        ))}
      </div>
    </div>
  )
}

function CommentItem({ comment }: { comment: Comment }) {
  return (
    <div style={{ display: 'flex', gap: 10 }}>
      <Avatar user={comment.author} size="md" />
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 4 }}>
          <span style={{ fontSize: 14, fontWeight: 600, color: '#e2e8f0' }}>{comment.author.name}</span>
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            {new Date(comment.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
        <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 8, padding: '8px 12px', fontSize: 14, color: '#cbd5e1', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>
          {comment.content}
        </div>
      </div>
    </div>
  )
}
