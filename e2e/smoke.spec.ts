import { test, expect } from '@playwright/test'

test('basic smoke: app loads', async ({ page }) => {
  await page.goto('/')
  await expect(page).toHaveTitle(/MapaInversor/)
})
