'use client'
import { Card } from '@/types'

interface Props {
  card: Pick<Card, 'id' | 'attachments'>
  onUpdated: () => void
}

export default function CardAttachments({ card, onUpdated }: Props) {
  async function setCover(attachmentId: string) {
    // Remove cover from all, then set new
    for (const a of card.attachments) {
      if (a.isCover || a.id === attachmentId) {
        await fetch(`/api/attachments/${a.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ isCover: a.id === attachmentId }),
        })
      }
    }
    onUpdated()
  }

  async function deleteAttachment(attachmentId: string) {
    await fetch(`/api/attachments/${attachmentId}`, { method: 'DELETE' })
    onUpdated()
  }

  if (!card.attachments?.length) return null

  return (
    <div style={{ marginBottom: 20 }}>
      <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 10 }}>📎 Anexos</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {card.attachments.map((a) => (
          <div key={a.id} style={{ display: 'flex', gap: 10, alignItems: 'center', padding: 8, borderRadius: 6, background: 'rgba(255,255,255,0.04)' }}>
            {a.mimeType.startsWith('image/') ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={a.url} alt={a.name} style={{ width: 60, height: 40, objectFit: 'cover', borderRadius: 4 }} />
            ) : (
              <div style={{ width: 60, height: 40, background: 'rgba(255,255,255,0.1)', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>📄</div>
            )}
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 13, color: '#e2e8f0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.name}</p>
              <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>{new Date(a.createdAt).toLocaleDateString('pt-BR')}</p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {a.mimeType.startsWith('image/') && (
                <button className="btn-ghost" style={{ fontSize: 11, padding: '2px 6px' }} onClick={() => setCover(a.id)}>
                  {a.isCover ? '⭐ Capa' : 'Capa'}
                </button>
              )}
              <button className="btn-ghost" style={{ fontSize: 11, padding: '2px 6px', color: '#eb5a46' }} onClick={() => deleteAttachment(a.id)}>
                Excluir
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
