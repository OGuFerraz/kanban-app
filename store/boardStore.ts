'use client'
import { create } from 'zustand'
import { BoardFull, List, Card } from '@/types'

interface BoardStore {
  board: BoardFull | null
  isLoading: boolean
  error: string | null

  loadBoard: (boardId: string) => Promise<void>
  refreshCard: (cardId: string) => Promise<void>

  // List mutations
  addList: (boardId: string, title: string, position: number) => Promise<List | null>
  renameList: (listId: string, title: string) => Promise<void>
  deleteList: (listId: string) => Promise<void>

  // Card mutations
  addCard: (listId: string, title: string, position: number) => Promise<Card | null>
  moveCard: (cardId: string, fromListId: string, toListId: string, newPosition: number) => void
  syncMoveCard: (cardId: string, toListId: string, position: number) => Promise<void>
  updateCard: (cardId: string, patch: Partial<Card>) => void
  deleteCard: (cardId: string, listId: string) => Promise<void>
}

export const useBoardStore = create<BoardStore>((set, get) => ({
  board: null,
  isLoading: false,
  error: null,

  loadBoard: async (boardId) => {
    set({ isLoading: true, error: null })
    try {
      const res = await fetch(`/api/boards/${boardId}`)
      if (!res.ok) throw new Error('Board not found')
      const board = await res.json()
      set({ board, isLoading: false })
    } catch (e: unknown) {
      set({ error: e instanceof Error ? e.message : 'Error', isLoading: false })
    }
  },

  refreshCard: async (cardId) => {
    const res = await fetch(`/api/cards/${cardId}`)
    if (!res.ok) return
    const updatedCard: Card = await res.json()
    const board = get().board
    if (!board) return
    const lists = board.lists.map((list) => ({
      ...list,
      cards: list.cards.map((c) => (c.id === cardId ? updatedCard : c)),
    }))
    set({ board: { ...board, lists } })
  },

  addList: async (boardId, title, position) => {
    const res = await fetch(`/api/boards/${boardId}/lists`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, position }),
    })
    if (!res.ok) return null
    const newList: List = await res.json()
    const board = get().board
    if (board) {
      set({ board: { ...board, lists: [...board.lists, newList] } })
    }
    return newList
  },

  renameList: async (listId, title) => {
    await fetch(`/api/lists/${listId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title }),
    })
    const board = get().board
    if (!board) return
    const lists = board.lists.map((l) => (l.id === listId ? { ...l, title } : l))
    set({ board: { ...board, lists } })
  },

  deleteList: async (listId) => {
    await fetch(`/api/lists/${listId}`, { method: 'DELETE' })
    const board = get().board
    if (!board) return
    const lists = board.lists.filter((l) => l.id !== listId)
    set({ board: { ...board, lists } })
  },

  addCard: async (listId, title, position) => {
    const res = await fetch(`/api/lists/${listId}/cards`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, position }),
    })
    if (!res.ok) return null
    const newCard: Card = await res.json()
    const board = get().board
    if (board) {
      const lists = board.lists.map((l) =>
        l.id === listId ? { ...l, cards: [...l.cards, newCard] } : l
      )
      set({ board: { ...board, lists } })
    }
    return newCard
  },

  moveCard: (cardId, fromListId, toListId, newPosition) => {
    const board = get().board
    if (!board) return

    let movingCard: Card | undefined
    const lists = board.lists.map((l) => {
      if (l.id === fromListId) {
        const filtered = l.cards.filter((c) => {
          if (c.id === cardId) { movingCard = c; return false }
          return true
        })
        return { ...l, cards: filtered }
      }
      return l
    })

    if (!movingCard) return
    const updatedCard = { ...movingCard, listId: toListId, position: newPosition }

    const finalLists = lists.map((l) => {
      if (l.id === toListId) {
        const cards = [...l.cards, updatedCard].sort((a, b) => a.position - b.position)
        return { ...l, cards }
      }
      return l
    })

    set({ board: { ...board, lists: finalLists } })
  },

  syncMoveCard: async (cardId, toListId, position) => {
    await fetch(`/api/cards/${cardId}/move`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ toListId, position }),
    })
  },

  updateCard: (cardId, patch) => {
    const board = get().board
    if (!board) return
    const lists = board.lists.map((l) => ({
      ...l,
      cards: l.cards.map((c) => (c.id === cardId ? { ...c, ...patch } : c)),
    }))
    set({ board: { ...board, lists } })
  },

  deleteCard: async (cardId, listId) => {
    await fetch(`/api/cards/${cardId}`, { method: 'DELETE' })
    const board = get().board
    if (!board) return
    const lists = board.lists.map((l) =>
      l.id === listId ? { ...l, cards: l.cards.filter((c) => c.id !== cardId) } : l
    )
    set({ board: { ...board, lists } })
  },
}))
