'use client'
import { useState, useRef } from 'react'
import { Droppable, Draggable } from '@hello-pangea/dnd'
import { List } from '@/types'
import { useBoardStore } from '@/store/boardStore'
import { getNewPosition } from '@/lib/reorder'
import CardItem from './CardItem'

interface Props {
  list: List
  index: number
}

export default function ListColumn({ list, index }: Props) {
  const { addCard, renameList, deleteList } = useBoardStore()
  const [isAddingCard, setIsAddingCard] = useState(false)
  const [newCardTitle, setNewCardTitle] = useState('')
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [titleValue, setTitleValue] = useState(list.title)
  const [showMenu, setShowMenu] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  async function handleAddCard() {
    if (!newCardTitle.trim()) { setIsAddingCard(false); return }
    const position = getNewPosition(list.cards, list.cards.length)
    await addCard(list.id, newCardTitle.trim(), position)
    setNewCardTitle('')
    setIsAddingCard(false)
  }

  async function handleRenameList() {
    if (titleValue.trim() && titleValue !== list.title) {
      await renameList(list.id, titleValue.trim())
    }
    setIsEditingTitle(false)
  }

  return (
    <Draggable draggableId={`list-${list.id}`} index={index}>
      {(provided) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          className="list-column"
          style={{ ...provided.draggableProps.style }}
        >
          {/* Header */}
          <div
            {...provided.dragHandleProps}
            style={{ padding: '12px 12px 8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}
          >
            {isEditingTitle ? (
              <input
                autoFocus
                className="input-field"
                value={titleValue}
                onChange={(e) => setTitleValue(e.target.value)}
                onBlur={handleRenameList}
                onKeyDown={(e) => { if (e.key === 'Enter') handleRenameList(); if (e.key === 'Escape') { setTitleValue(list.title); setIsEditingTitle(false) } }}
                style={{ padding: '4px 8px', fontWeight: 700, fontSize: 14 }}
              />
            ) : (
              <h3
                style={{ fontSize: 14, fontWeight: 700, color: '#e2e8f0', cursor: 'pointer', flex: 1 }}
                onClick={() => setIsEditingTitle(true)}
              >
                {list.title}
                <span style={{ marginLeft: 8, fontSize: 12, color: 'var(--text-muted)', fontWeight: 400 }}>{list.cards.length}</span>
              </h3>
            )}
            <div style={{ position: 'relative' }}>
              <button
                className="btn-ghost"
                style={{ padding: '4px 8px' }}
                onClick={() => setShowMenu(!showMenu)}
              >
                ···
              </button>
              {showMenu && (
                <div ref={menuRef} className="popover" style={{ position: 'absolute', right: 0, top: '100%', minWidth: 160, padding: 4 }}>
                  <button className="btn-ghost" style={{ width: '100%', textAlign: 'left', padding: '8px 12px', display: 'block' }} onClick={() => { setIsEditingTitle(true); setShowMenu(false) }}>Renomear</button>
                  <button className="btn-ghost" style={{ width: '100%', textAlign: 'left', padding: '8px 12px', display: 'block', color: '#eb5a46' }} onClick={() => { deleteList(list.id); setShowMenu(false) }}>
                    Excluir Lista
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Cards */}
          <Droppable droppableId={list.id} type="CARD">
            {(provided, snapshot) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                style={{
                  flex: 1,
                  overflowY: 'auto',
                  padding: '0 8px',
                  minHeight: 20,
                  background: snapshot.isDraggingOver ? 'rgba(79,142,247,0.05)' : 'transparent',
                  transition: 'background 0.15s',
                  borderRadius: 6,
                }}
              >
                {list.cards.map((card, i) => (
                  <CardItem key={card.id} card={card} index={i} />
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>

          {/* Add Card */}
          <div style={{ padding: '8px', flexShrink: 0 }}>
            {isAddingCard ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <textarea
                  autoFocus
                  className="input-field"
                  placeholder="Título do cartão..."
                  value={newCardTitle}
                  onChange={(e) => setNewCardTitle(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleAddCard() }; if (e.key === 'Escape') setIsAddingCard(false) }}
                  rows={2}
                  style={{ resize: 'none', fontSize: 13 }}
                />
                <div style={{ display: 'flex', gap: 6 }}>
                  <button className="btn-primary" style={{ fontSize: 13, padding: '5px 12px' }} onClick={handleAddCard}>Adicionar</button>
                  <button className="btn-ghost" onClick={() => setIsAddingCard(false)}>×</button>
                </div>
              </div>
            ) : (
              <button
                className="btn-ghost"
                style={{ width: '100%', textAlign: 'left', fontSize: 13, color: 'var(--text-muted)', padding: '8px' }}
                onClick={() => setIsAddingCard(true)}
              >
                + Adicionar cartão
              </button>
            )}
          </div>
        </div>
      )}
    </Draggable>
  )
}
