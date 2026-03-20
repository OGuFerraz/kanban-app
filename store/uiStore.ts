'use client'
import { create } from 'zustand'

interface UIStore {
  activeCardId: string | null
  isCardModalOpen: boolean
  openCardModal: (cardId: string) => void
  closeCardModal: () => void

  currentUserId: string | null
  currentUserName: string | null
  setCurrentUser: (id: string, name: string) => void
  logout: () => void
}

export const useUIStore = create<UIStore>((set) => ({
  activeCardId: null,
  isCardModalOpen: false,
  openCardModal: (cardId) => set({ activeCardId: cardId, isCardModalOpen: true }),
  closeCardModal: () => set({ activeCardId: null, isCardModalOpen: false }),

  currentUserId: null,
  currentUserName: null,
  setCurrentUser: (id, name) => set({ currentUserId: id, currentUserName: name }),
  logout: () => {
    if (typeof window !== 'undefined') localStorage.removeItem('kanban_user')
    set({ currentUserId: null, currentUserName: null })
  },
}))
