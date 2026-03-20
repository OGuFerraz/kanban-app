'use client'
import { DragDropContext, Droppable, DropResult } from '@hello-pangea/dnd'
import { useState } from 'react'
import { useBoardStore } from '@/store/boardStore'
import { getNewPosition } from '@/lib/reorder'
import ListColumn from './ListColumn'

export default function BoardCanvas() {
  const { board, addList, moveCard, syncMoveCard } = useBoardStore()
  const [isAddingList, setIsAddingList] = useState(false)
  const [newListTitle, setNewListTitle] = useState('')

  if (!board) return null

  function onDragEnd(result: DropResult) {
    if (!result.destination || !board) return
    const { source, destination, draggableId, type } = result

    if (source.droppableId === destination.droppableId && source.index === destination.index) return

    if (type === 'LIST') {
      const listId = draggableId.replace('list-', '')
      const lists = [...board.lists]
      const [moved] = lists.splice(source.index, 1)
      lists.splice(destination.index, 0, moved)
      const newPos = getNewPosition(
        lists.filter((l) => l.id !== listId).map((l) => ({ position: l.position })),
        destination.index
      )
      fetch(`/api/lists/${listId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ position: newPos }),
      })
      return
    }

    if (type === 'CARD') {
      const fromListId = source.droppableId
      const toListId = destination.droppableId
      const destList = board.lists.find((l) => l.id === toListId)
      if (!destList) return

      const destCards = destList.cards.filter((c) => c.id !== draggableId)
      const newPos = getNewPosition(destCards, destination.index)

      moveCard(draggableId, fromListId, toListId, newPos)
      syncMoveCard(draggableId, toListId, newPos)
    }
  }

  async function handleAddList() {
    if (!newListTitle.trim() || !board) return
    const position = getNewPosition(board.lists, board.lists.length)
    await addList(board.id, newListTitle.trim(), position)
    setNewListTitle('')
    setIsAddingList(false)
  }

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <Droppable droppableId="board" type="LIST" direction="horizontal">
        {(provided) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            style={{
              display: 'flex',
              gap: 12,
              padding: '12px 20px 20px',
              overflowX: 'auto',
              alignItems: 'flex-start',
              minHeight: 'calc(100vh - 100px)',
            }}
          >
            {board.lists.map((list, index) => (
              <ListColumn key={list.id} list={list} index={index} />
            ))}
            {provided.placeholder}

            {/* Add List */}
            <div style={{ minWidth: 272, flexShrink: 0 }}>
              {isAddingList ? (
                <div style={{ background: '#1a2535', borderRadius: 12, padding: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <input
                    autoFocus
                    className="input-field"
                    placeholder="Nome da lista..."
                    value={newListTitle}
                    onChange={(e) => setNewListTitle(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleAddList(); if (e.key === 'Escape') setIsAddingList(false) }}
                  />
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button className="btn-primary" style={{ fontSize: 13 }} onClick={handleAddList}>Adicionar Lista</button>
                    <button className="btn-ghost" onClick={() => setIsAddingList(false)}>×</button>
                  </div>
                </div>
              ) : (
                <button
                  className="btn-ghost"
                  style={{ width: '100%', background: 'rgba(255,255,255,0.08)', borderRadius: 12, padding: '12px 16px', fontSize: 14, textAlign: 'left', color: 'var(--text-secondary)' }}
                  onClick={() => setIsAddingList(true)}
                >
                  + Adicionar outra lista
                </button>
              )}
            </div>
          </div>
        )}
      </Droppable>
    </DragDropContext>
  )
}
