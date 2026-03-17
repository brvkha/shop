import { useMemo } from 'react'
import { useLearningStore } from '../../store/learningStore'

export function useDecks() {
  const decks = useLearningStore((state) => state.decks)
  const createDeck = useLearningStore((state) => state.createDeck)
  const updateDeck = useLearningStore((state) => state.updateDeck)
  const deleteDeck = useLearningStore((state) => state.deleteDeck)

  const byId = useMemo(
    () => Object.fromEntries(decks.map((deck) => [deck.id, deck])),
    [decks],
  )

  return { decks, byId, createDeck, updateDeck, deleteDeck }
}
