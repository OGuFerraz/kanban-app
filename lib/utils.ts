import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string | Date) {
  const d = new Date(date)
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
}

export function getDueDateStatus(dueDate: string | Date | null | undefined, isComplete: boolean) {
  if (!dueDate) return null
  if (isComplete) return 'complete'
  const now = new Date()
  const due = new Date(dueDate)
  const diffDays = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  if (diffDays < 0) return 'overdue'
  if (diffDays <= 1) return 'due-soon'
  return 'upcoming'
}

export function getInitials(name: string) {
  return name
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase()
}

export const LABEL_COLORS = [
  { name: 'Verde', value: '#61bd4f' },
  { name: 'Amarelo', value: '#f2d600' },
  { name: 'Laranja', value: '#ff9f1a' },
  { name: 'Vermelho', value: '#eb5a46' },
  { name: 'Roxo', value: '#c377e0' },
  { name: 'Azul', value: '#0079bf' },
  { name: 'Ciano', value: '#00c2e0' },
  { name: 'Lima', value: '#51e898' },
  { name: 'Rosa', value: '#ff78cb' },
  { name: 'Cinza', value: '#344563' },
]

export const BOARD_COLORS = [
  '#1e3a5f', '#1e5f4e', '#5f1e1e', '#3d1e5f', '#1e4d5f',
  '#5f4a1e', '#5f1e4a', '#1e5f2a', '#2a1e5f', '#5f3d1e',
]
