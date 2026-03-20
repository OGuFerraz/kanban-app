export interface Team {
  id: string
  name: string
  slug: string
  createdAt: string
  members: TeamMember[]
}

export interface User {
  id: string
  name: string
  email: string
  avatarUrl?: string
  color: string
}

export interface TeamMember {
  id: string
  role: string
  userId: string
  user: User
}

export interface Board {
  id: string
  title: string
  description?: string
  coverColor: string
  coverImage?: string
  isStarred: boolean
  teamId: string
  team?: { name: string }
  createdAt: string
  _count?: { lists: number }
}

export interface Label {
  id: string
  name: string
  color: string
  boardId: string
}

export interface List {
  id: string
  title: string
  position: number
  boardId: string
  cards: Card[]
}

export interface Card {
  id: string
  title: string
  description?: string
  position: number
  coverColor?: string
  coverImage?: string
  dueDate?: string
  isComplete: boolean
  isArchived: boolean
  listId: string
  labels: CardLabelFull[]
  members: CardMemberFull[]
  checklists: Checklist[]
  attachments: Attachment[]
  comments: Comment[]
  _count?: {
    checklists: number
    attachments: number
    comments: number
  }
}

export interface CardLabelFull {
  cardId: string
  labelId: string
  label: Label
}

export interface CardMemberFull {
  cardId: string
  userId: string
  user: User
}

export interface Checklist {
  id: string
  title: string
  position: number
  cardId: string
  items: ChecklistItem[]
}

export interface ChecklistItem {
  id: string
  title: string
  isChecked: boolean
  position: number
  checklistId: string
}

export interface Attachment {
  id: string
  name: string
  url: string
  mimeType: string
  size: number
  isCover: boolean
  cardId: string
  createdAt: string
}

export interface Comment {
  id: string
  content: string
  cardId: string
  authorId: string
  author: User
  createdAt: string
  updatedAt: string
}

export interface BoardFull extends Board {
  lists: List[]
  labels: Label[]
  team?: {
    id: string
    name: string
    members: TeamMember[]
  }
}
