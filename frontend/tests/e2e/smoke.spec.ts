import { expect, test } from '@playwright/test'

test('guest is redirected to login and admin guard blocks non-admin', async ({ page }) => {
  await page.goto('/study')
  await expect(page.getByRole('heading', { name: 'Login' })).toBeVisible()

  await page.getByLabel('Email').fill('user@khaleo.app')
  await page.getByLabel('Password').fill('123456')
  await page.getByRole('button', { name: 'Sign in' }).click()

  await expect(page.getByRole('heading', { name: 'Public Deck Discovery' })).toBeVisible()

  await page.goto('/admin')
  await expect(page.getByRole('heading', { name: 'Public Deck Discovery' })).toBeVisible()
})

test('authenticated user can create deck and card', async ({ page }) => {
  await page.goto('/login')
  await page.getByLabel('Email').fill('user2@khaleo.app')
  await page.getByLabel('Password').fill('123456')
  await page.getByRole('button', { name: 'Sign in' }).click()

  await page.goto('/flashcard/decks')
  await page.getByLabel('Deck name').fill('Chemistry')
  await page.getByLabel('Deck description').fill('Acids and bases')
  await page.getByRole('button', { name: 'Create deck' }).click()
  await expect(page.getByText('Chemistry')).toBeVisible()

  await page.goto('/flashcard/cards')
  await page.getByLabel('Card front').fill('pH of water')
  await page.getByLabel('Card back').fill('7')
  await page.getByRole('button', { name: 'Create card' }).click()
  await expect(page.getByText('pH of water')).toBeVisible()
})
