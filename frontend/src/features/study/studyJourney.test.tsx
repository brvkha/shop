import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { DecksPage } from '../decks/DecksPage'
import { CardsPage } from '../cards/CardsPage'
import { StudyPage } from './StudyPage'

describe('deck-card-study journey', () => {
  it('creates deck and card then rates study card', async () => {
    const user = userEvent.setup()

    render(
      <MemoryRouter>
        <DecksPage />
      </MemoryRouter>,
    )

    await user.type(screen.getByLabelText('Deck name'), 'Physics')
    await user.type(screen.getByLabelText('Deck description'), 'Motion and force')
    await user.click(screen.getByRole('button', { name: 'Create deck' }))
    expect(screen.getByText('Physics')).toBeInTheDocument()

    render(
      <MemoryRouter>
        <CardsPage />
      </MemoryRouter>,
    )
    await user.type(screen.getByLabelText('Card front'), 'What is velocity?')
    await user.type(screen.getByLabelText('Card back'), 'Speed with direction')
    await user.click(screen.getByRole('button', { name: 'Create card' }))
    expect(screen.getAllByText('What is velocity?').length).toBeGreaterThan(0)

    render(
      <MemoryRouter>
        <StudyPage />
      </MemoryRouter>,
    )
    await user.click(screen.getByRole('button', { name: 'Reveal answer' }))
    expect(screen.getAllByText('Speed with direction').length).toBeGreaterThan(0)
    await user.click(screen.getByRole('button', { name: 'Good' }))
    expect(screen.getByText(/Due cards:/)).toBeInTheDocument()
  })
})
