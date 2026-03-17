import { useMemo } from 'react'
import { useLearningStore } from '../../store/learningStore'

export function useCards(deckFilter: string) {
  const cards = useLearningStore((state) => state.cards)
  const createCard = useLearningStore((state) => state.createCard)
  const updateCard = useLearningStore((state) => state.updateCard)
  const deleteCard = useLearningStore((state) => state.deleteCard)

  const filtered = useMemo(() => {
    if (!deckFilter) {
      return cards
    }
    return cards.filter((card) => card.deckId === deckFilter)
  }, [cards, deckFilter])

  return { cards: filtered, createCard, updateCard, deleteCard }
}
