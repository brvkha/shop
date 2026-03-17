import { describe, expect, it } from 'vitest'
import { validateCardContract, validateDeckContract } from './dto'

describe('contract drift checks', () => {
  it('accepts valid deck contract and rejects missing names', () => {
    expect(
      validateDeckContract({
        decks: [{ id: 'd1', name: 'Deck', description: 'Description' }],
      }),
    ).toBe(true)

    expect(
      validateDeckContract({
        decks: [{ id: 'd2', name: '', description: 'Broken' }],
      }),
    ).toBe(false)
  })

  it('accepts valid card contract and rejects missing fields', () => {
    expect(
      validateCardContract({
        cards: [
          {
            id: 'c1',
            deckId: 'd1',
            front: 'Front',
            back: 'Back',
            tags: ['core'],
          },
        ],
      }),
    ).toBe(true)

    expect(
      validateCardContract({
        cards: [
          {
            id: 'c2',
            deckId: '',
            front: 'Front',
            back: 'Back',
            tags: [],
          },
        ],
      }),
    ).toBe(false)
  })
})
