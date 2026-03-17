import { create } from 'zustand'
import type { Card, Deck, StudyRating } from '../types'

type LearningState = {
  decks: Deck[]
  cards: Card[]
  createDeck: (name: string, description: string) => void
  updateDeck: (deckId: string, name: string, description: string) => void
  deleteDeck: (deckId: string) => void
  createCard: (deckId: string, front: string, back: string, tags: string[]) => void
  updateCard: (cardId: string, front: string, back: string, tags: string[]) => void
  deleteCard: (cardId: string) => void
  attachMedia: (cardId: string, mediaUrl: string) => void
  rateCard: (cardId: string, rating: StudyRating) => void
}

const initialDecks: Deck[] = [
  { id: 'deck-1', name: 'English Basics', description: 'Daily vocabulary' },
  { id: 'deck-2', name: 'Biology', description: 'Cell and DNA quick notes' },
]

const initialCards: Card[] = [
  {
    id: 'card-1',
    deckId: 'deck-1',
    front: 'abandon',
    back: 'to leave behind',
    tags: ['verb', 'b1'],
    due: true,
  },
  {
    id: 'card-2',
    deckId: 'deck-1',
    front: 'resilient',
    back: 'able to recover quickly',
    tags: ['adjective', 'b2'],
    due: true,
  },
  {
    id: 'card-3',
    deckId: 'deck-2',
    front: 'Mitochondria',
    back: 'Powerhouse of the cell',
    tags: ['biology'],
    due: true,
  },
]

export const useLearningStore = create<LearningState>((set) => ({
  decks: initialDecks,
  cards: initialCards,
  createDeck: (name, description) => {
    set((state) => ({
      decks: [...state.decks, { id: crypto.randomUUID(), name, description }],
    }))
  },
  updateDeck: (deckId, name, description) => {
    set((state) => ({
      decks: state.decks.map((deck) =>
        deck.id === deckId ? { ...deck, name, description } : deck,
      ),
    }))
  },
  deleteDeck: (deckId) => {
    set((state) => ({
      decks: state.decks.filter((deck) => deck.id !== deckId),
      cards: state.cards.filter((card) => card.deckId !== deckId),
    }))
  },
  createCard: (deckId, front, back, tags) => {
    set((state) => ({
      cards: [
        ...state.cards,
        { id: crypto.randomUUID(), deckId, front, back, tags, due: true },
      ],
    }))
  },
  updateCard: (cardId, front, back, tags) => {
    set((state) => ({
      cards: state.cards.map((card) =>
        card.id === cardId ? { ...card, front, back, tags } : card,
      ),
    }))
  },
  deleteCard: (cardId) => {
    set((state) => ({ cards: state.cards.filter((card) => card.id !== cardId) }))
  },
  attachMedia: (cardId, mediaUrl) => {
    set((state) => ({
      cards: state.cards.map((card) =>
        card.id === cardId ? { ...card, mediaUrl } : card,
      ),
    }))
  },
  rateCard: (cardId, rating) => {
    set((state) => ({
      cards: state.cards.map((card) => {
        if (card.id !== cardId) {
          return card
        }
        return {
          ...card,
          due: rating === 'Again',
        }
      }),
    }))
  },
}))
