import { test, expect } from '@playwright/test'

test.describe('auth proxy', () => {
  test('redirects unauthenticated /dashboard to /login', async ({ page }) => {
    await page.goto('/dashboard')
    await expect(page).toHaveURL(/\/login$/)
    await expect(page.getByRole('heading', { name: /Ingresá a tu cuenta/ })).toBeVisible()
  })

  test('unauthenticated /dashboard/proyectos redirects to /login', async ({ page }) => {
    await page.goto('/dashboard/proyectos/00000000-0000-0000-0000-000000000000')
    await expect(page).toHaveURL(/\/login$/)
  })

  test('serves /login for unauthenticated users', async ({ page }) => {
    await page.goto('/login')
    await expect(page).toHaveURL(/\/login$/)
    await expect(page.getByLabel('Email')).toBeVisible()
    await expect(page.getByLabel('Contraseña')).toBeVisible()
  })
})
