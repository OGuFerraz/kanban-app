'use client'
import { useEffect, useState } from 'react'
import Modal from '@/components/ui/Modal'
import { useUIStore } from '@/store/uiStore'
import { useBoardStore } from '@/store/boardStore'
import { Card, Label } from '@/types'
import Avatar from '@/components/ui/Avatar'
import CardDescription from './CardDescription'
import CardChecklist from './CardChecklist'
import CardComments from './CardComments'
import CardLabelsSection from './CardLabelsSection'
import CardMembersSection from './CardMembersSection'
import CardDueDate from './CardDueDate'
import CardAttachments from './CardAttachments'
import { formatDate, getDueDateStatus } from '@/lib/utils'

export default function CardModal() {
  const { activeCardId, isCardModalOpen, closeCardModal, currentUserId } = useUIStore()
  const { board, refreshCard, updateCard, deleteCard } = useBoardStore()
  const [card, setCard] = useState<Card | null>(null)
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [titleValue, setTitleValue] = useState('')

  useEffect(() => {
    if (!activeCardId || !board) return
    const found = board.lists.flatMap((l) => l.cards).find((c) => c.id === activeCardId)
    if (found) { setCard(found); setTitleValue(found.title) }

    // Fetch full card data (with checklists, comments, attachments)
    fetch(`/api/cards/${activeCardId}`)
      .then((r) => r.json())
      .then((fullCard) => { setCard(fullCard); setTitleValue(fullCard.title) })
  }, [activeCardId, board])

  if (!isCardModalOpen || !card) return null

  const coverImg = card.attachments?.find((a) => a.isCover)?.url ?? card.coverImage
  const listName = board?.lists.find((l) => l.id === card.listId)?.title ?? ''
  const boardLabels = board?.labels ?? []
  const boardMembers = board?.team?.members ?? []
  const dueStatus = getDueDateStatus(card.dueDate ?? null, card.isComplete)

  async function saveTitle() {
    if (!titleValue.trim() || titleValue === card!.title) { setIsEditingTitle(false); return }
    await fetch(`/api/cards/${card!.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: titleValue.trim() }),
    })
    updateCard(card!.id, { title: titleValue.trim() })
    setCard((c) => c ? { ...c, title: titleValue.trim() } : c)
    setIsEditingTitle(false)
  }

  async function handleDelete() {
    if (!confirm('Excluir este cartão?')) return
    deleteCard(card!.id, card!.listId)
    closeCardModal()
  }

  async function toggleComplete() {
    const newVal = !card!.isComplete
    await fetch(`/api/cards/${card!.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isComplete: newVal }),
    })
    updateCard(card!.id, { isComplete: newVal })
    setCard((c) => c ? { ...c, isComplete: newVal } : c)
  }

  function onCardUpdated(patch: Partial<Card>) {
    setCard((c) => c ? { ...c, ...patch } : c)
    updateCard(card!.id, patch)
  }

  async function reloadCard() {
    await refreshCard(card!.id)
    const res = await fetch(`/api/cards/${card!.id}`)
    const full = await res.json()
    setCard(full)
  }

  return (
    <Modal onClose={closeCardModal}>
      {/* Cover */}
      {coverImg && (
        <div style={{ height: 160, borderRadius: '12px 12px 0 0', overflow: 'hidden' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={coverImg} alt="cover" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
      )}
      {!coverImg && card.coverColor && (
        <div style={{ height: 48, borderRadius: '12px 12px 0 0', background: card.coverColor }} />
      )}

      {/* Close button */}
      <button
        className="btn-ghost"
        style={{ position: 'absolute', top: 12, right: 12, fontSize: 20, lineHeight: 1, zIndex: 10 }}
        onClick={closeCardModal}
      >
        ×
      </button>

      <div style={{ display: 'flex', gap: 0 }}>
        {/* Left: main content */}
        <div style={{ flex: 1, padding: '20px 24px 24px', minWidth: 0 }}>
          {/* List breadcrumb */}
          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>
            Em: <span style={{ textDecoration: 'underline', cursor: 'default' }}>{listName}</span>
          </p>

          {/* Title */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 16 }}>
            <button
              onClick={toggleComplete}
              style={{ marginTop: 2, flexShrink: 0, background: 'transparent', border: `2px solid ${card.isComplete ? '#61bd4f' : 'rgba(255,255,255,0.3)'}`, borderRadius: '50%', width: 22, height: 22, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: card.isComplete ? '#61bd4f' : 'transparent', fontSize: 12 }}
              title={card.isComplete ? 'Marcar como incompleto' : 'Marcar como completo'}
            >
              {card.isComplete ? '✓' : ''}
            </button>
            {isEditingTitle ? (
              <textarea
                autoFocus
                className="input-field"
                value={titleValue}
                onChange={(e) => setTitleValue(e.target.value)}
                onBlur={saveTitle}
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); saveTitle() }; if (e.key === 'Escape') { setTitleValue(card.title); setIsEditingTitle(false) } }}
                rows={2}
                style={{ fontSize: 18, fontWeight: 700, resize: 'none', flex: 1 }}
              />
            ) : (
              <h2
                style={{ fontSize: 18, fontWeight: 700, color: '#e2e8f0', cursor: 'pointer', lineHeight: 1.3, textDecoration: card.isComplete ? 'line-through' : 'none', opacity: card.isComplete ? 0.6 : 1 }}
                onClick={() => setIsEditingTitle(true)}
              >
                {card.title}
              </h2>
            )}
          </div>

          {/* Labels + Members + Due Date row */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, marginBottom: 20 }}>
            {card.labels && card.labels.length > 0 && (
              <div>
                <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6, textTransform: 'uppercase' }}>Etiquetas</p>
                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                  {card.labels.map((cl) => (
                    <span key={cl.labelId} style={{ background: cl.label.color, borderRadius: 4, padding: '4px 10px', fontSize: 12, fontWeight: 600, color: 'white' }}>
                      {cl.label.name || '​'}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {card.members && card.members.length > 0 && (
              <div>
                <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6, textTransform: 'uppercase' }}>Membros</p>
                <div style={{ display: 'flex', gap: 4 }}>
                  {card.members.map((m) => <Avatar key={m.userId} user={m.user} size="md" />)}
                </div>
              </div>
            )}
            {card.dueDate && (
              <div>
                <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6, textTransform: 'uppercase' }}>Vencimento</p>
                <span style={{
                  fontSize: 13, padding: '4px 10px', borderRadius: 4, fontWeight: 500,
                  background: dueStatus === 'overdue' ? 'rgba(235,90,70,0.3)' : dueStatus === 'due-soon' ? 'rgba(242,214,0,0.3)' : dueStatus === 'complete' ? 'rgba(97,189,79,0.3)' : 'rgba(255,255,255,0.1)',
                  color: dueStatus === 'overdue' ? '#eb5a46' : dueStatus === 'due-soon' ? '#f2d600' : dueStatus === 'complete' ? '#61bd4f' : 'var(--text-primary)',
                }}>
                  {formatDate(card.dueDate)}
                </span>
              </div>
            )}
          </div>

          {/* Description */}
          <CardDescription card={card} onUpdated={onCardUpdated} />

          {/* Checklists */}
          {card.checklists?.map((cl) => (
            <CardChecklist key={cl.id} checklist={cl} onUpdated={reloadCard} />
          ))}

          {/* Attachments */}
          {card.attachments && card.attachments.length > 0 && (
            <CardAttachments card={card} onUpdated={reloadCard} />
          )}

          {/* Comments */}
          <CardComments card={card} currentUserId={currentUserId} onUpdated={reloadCard} />
        </div>

        {/* Right sidebar */}
        <div style={{ width: 168, padding: '20px 16px 24px 0', flexShrink: 0 }}>
          <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 8 }}>Adicionar ao cartão</p>
          <CardMembersSection card={card} boardMembers={boardMembers} onUpdated={reloadCard} />
          <CardLabelsSection card={card} boardLabels={boardLabels} onUpdated={reloadCard} />
          <ChecklistButton cardId={card.id} onCreated={reloadCard} />
          <CardDueDate card={card} onUpdated={onCardUpdated} />
          <AttachmentButton cardId={card.id} onCreated={reloadCard} />

          <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 8, marginTop: 20 }}>Ações</p>
          <button className="btn-ghost" style={{ width: '100%', textAlign: 'left', marginBottom: 4, fontSize: 13 }} onClick={handleDelete}>
            🗑 Excluir
          </button>
        </div>
      </div>
    </Modal>
  )
}

function ChecklistButton({ cardId, onCreated }: { cardId: string; onCreated: () => void }) {
  const [loading, setLoading] = useState(false)

  async function create() {
    setLoading(true)
    await fetch(`/api/cards/${cardId}/checklists`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Checklist' }),
    })
    onCreated()
    setLoading(false)
  }

  return (
    <button className="btn-ghost" style={{ width: '100%', textAlign: 'left', marginBottom: 4, fontSize: 13 }} onClick={create} disabled={loading}>
      ☑ Checklist
    </button>
  )
}

function AttachmentButton({ cardId, onCreated }: { cardId: string; onCreated: () => void }) {
  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const fd = new FormData()
    fd.append('file', file)
    const uploadRes = await fetch('/api/upload', { method: 'POST', body: fd })
    const { url, name, mimeType, size } = await uploadRes.json()
    await fetch(`/api/cards/${cardId}/attachments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url, name, mimeType, size }),
    })
    onCreated()
  }

  return (
    <label style={{ display: 'block', marginBottom: 4 }}>
      <span className="btn-ghost" style={{ width: '100%', textAlign: 'left', fontSize: 13, display: 'block', padding: '6px 10px', cursor: 'pointer' }}>📎 Anexo</span>
      <input type="file" style={{ display: 'none' }} onChange={handleFile} />
    </label>
  )
}
