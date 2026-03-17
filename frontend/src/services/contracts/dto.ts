type DeckDto = {
  id: string
  name: string
  description: string
}

type CardDto = {
  id: string
  deckId: string
  front: string
  back: string
  tags: string[]
}

export type DeckContract = {
  decks: DeckDto[]
}

export type CardContract = {
  cards: CardDto[]
}

export function validateDeckContract(input: DeckContract): boolean {
  return input.decks.every((deck) => Boolean(deck.id && deck.name))
}

export function validateCardContract(input: CardContract): boolean {
  return input.cards.every((card) => Boolean(card.id && card.deckId && card.front && card.back))
}
