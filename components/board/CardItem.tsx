'use client'
import { Draggable } from '@hello-pangea/dnd'
import { Card } from '@/types'
import Avatar from '@/components/ui/Avatar'
import { getDueDateStatus, formatDate } from '@/lib/utils'
import { useUIStore } from '@/store/uiStore'

interface Props {
  card: Card
  index: number
}

export default function CardItem({ card, index }: Props) {
  const { openCardModal } = useUIStore()
  const coverImg = card.attachments?.find((a) => a.isCover)?.url ?? card.coverImage
  const dueStatus = getDueDateStatus(card.dueDate ?? null, card.isComplete)
  const totalCheckItems = card.checklists?.reduce((s, c) => s + (c.items?.length ?? 0), 0) ?? 0
  const checkedItems = card.checklists?.reduce((s, c) => s + (c.items?.filter((i) => i.isChecked).length ?? 0), 0) ?? 0

  const dueBg = dueStatus === 'overdue' ? '#eb5a46' : dueStatus === 'due-soon' ? '#f2d600' : dueStatus === 'complete' ? '#61bd4f' : 'rgba(255,255,255,0.1)'
  const dueColor = dueStatus === 'due-soon' ? '#000' : '#fff'

  return (
    <Draggable draggableId={card.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className="card-item"
          style={{
            margin: '0 0 6px 0',
            ...provided.draggableProps.style,
            ...(snapshot.isDragging ? { transform: provided.draggableProps.style?.transform + ' rotate(2deg)', boxShadow: '0 8px 24px rgba(0,0,0,0.6)', opacity: 0.95 } : {}),
          }}
          onClick={() => openCardModal(card.id)}
        >
          {/* Cover */}
          {coverImg && (
            <div style={{ height: 120, borderRadius: '8px 8px 0 0', overflow: 'hidden', position: 'relative' }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={coverImg} alt="cover" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
          )}
          {!coverImg && card.coverColor && (
            <div style={{ height: 32, borderRadius: '8px 8px 0 0', background: card.coverColor }} />
          )}

          <div style={{ padding: '10px 12px' }}>
            {/* Labels */}
            {card.labels && card.labels.length > 0 && (
              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 8 }}>
                {card.labels.map((cl) => (
                  <span key={cl.labelId} className="label-chip" style={{ background: cl.label.color, minWidth: cl.label.name ? 'auto' : 32, padding: cl.label.name ? '0 8px' : 0, height: 8, lineHeight: 1, fontSize: 10, display: 'flex', alignItems: 'center', color: 'white', fontWeight: 600 }}>
                    {cl.label.name}
                  </span>
                ))}
              </div>
            )}

            {/* Title */}
            <p style={{ fontSize: 14, color: '#e2e8f0', lineHeight: 1.4, wordBreak: 'break-word' }}>{card.title}</p>

            {/* Footer badges */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
              {card.dueDate && (
                <span style={{ fontSize: 11, padding: '2px 6px', borderRadius: 4, background: dueBg, color: dueColor, fontWeight: 500 }}>
                  📅 {formatDate(card.dueDate)}
                </span>
              )}
              {totalCheckItems > 0 && (
                <span style={{ fontSize: 11, padding: '2px 6px', borderRadius: 4, background: checkedItems === totalCheckItems ? 'rgba(97,189,79,0.2)' : 'rgba(255,255,255,0.1)', color: checkedItems === totalCheckItems ? '#61bd4f' : 'var(--text-secondary)' }}>
                  ✓ {checkedItems}/{totalCheckItems}
                </span>
              )}
              {(card._count?.attachments ?? 0) > 0 && (
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>📎 {card._count?.attachments}</span>
              )}
              {(card._count?.comments ?? 0) > 0 && (
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>💬 {card._count?.comments}</span>
              )}

              {/* Members */}
              {card.members && card.members.length > 0 && (
                <div style={{ display: 'flex', marginLeft: 'auto', gap: 2 }}>
                  {card.members.slice(0, 3).map((m) => (
                    <Avatar key={m.userId} user={m.user} size="sm" />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </Draggable>
  )
}
