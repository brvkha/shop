export type Role = 'USER' | 'ADMIN'

export type User = {
  id: string
  email: string
  role: Role
  verified: boolean
  banned: boolean
}

export type Deck = {
  id: string
  name: string
  description: string
}

export type Card = {
  id: string
  deckId: string
  front: string
  back: string
  tags: string[]
  mediaUrl?: string
  due: boolean
}

export type StudyRating = 'Again' | 'Hard' | 'Good' | 'Easy'
