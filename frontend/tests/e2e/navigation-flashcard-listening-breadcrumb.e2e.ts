import { expect, test } from '@playwright/test'

test('flashcard sidebar, listening tab, and breadcrumb deck name flow', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem(
      'khaleo-auth-session',
      JSON.stringify({
        currentUser: {
          id: 'user-1',
          email: 'learner@khaleo.app',
          role: 'USER',
          verified: true,
          banned: false,
        },
        accessToken: 'mock-token',
        refreshToken: 'mock-refresh',
      }),
    )
  })

  await page.route('**/api/v1/public/decks**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        items: [
          {
            id: 'deck-public-1',
            name: 'Public Biology',
            ownerName: 'owner@khaleo.app',
            description: 'Cells and genes',
            tags: ['bio'],
            cardCount: 20,
            updatedAt: new Date().toISOString(),
          },
        ],
        page: 0,
        size: 50,
        totalElements: 1,
        totalPages: 1,
      }),
    })
  })

  await page.route('**/api/v1/private/decks**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        content: [
          {
            id: 'deck-private-1',
            name: 'Biology Deck 01',
            description: 'Private deck',
            isPublic: false,
          },
        ],
      }),
    })
  })

  await page.route('**/api/v1/private/decks/*/stats', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        deckId: 'deck-private-1',
        learning: 1,
        review: 2,
        new_cards: 3,
      }),
    })
  })

  await page.route('**/api/v1/study-session/decks/*/next-cards**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        items: [
          {
            cardId: 'card-1',
            deckId: 'deck-private-1',
            frontText: 'Front text',
            backText: 'Back text',
            state: 'NEW',
            nextReviewDate: null,
            sourceTier: 'NEW',
          },
        ],
        nextContinuationToken: null,
        hasMore: false,
      }),
    })
  })

  await page.goto('/flashcard/decks')

  await expect(page.getByRole('link', { name: 'Decks' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Cards' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Study' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Settings' })).toBeVisible()

  await page.getByRole('link', { name: 'Listening' }).click()
  await expect(page.getByRole('heading', { name: 'Listening' })).toBeVisible()
  await expect(page.getByText('Home')).toBeVisible()
  await expect(page.getByText('Listening')).toBeVisible()

  await page.goto('/flashcard/study')
  await expect(page.getByRole('heading', { name: 'Study Workspace' })).toBeVisible()
  await expect(page.getByText('Biology Deck 01')).toBeVisible()
  await page.getByRole('link', { name: 'Start session' }).click()

  await expect(page.getByRole('heading', { name: 'Study Session' })).toBeVisible()
  await expect(page.getByText('Biology Deck 01')).toBeVisible()
  await expect(page.getByText('Flashcard')).toBeVisible()
  await expect(page.getByText('Study')).toBeVisible()
})
