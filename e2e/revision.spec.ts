import { test, expect } from '@playwright/test'

test.describe('admin y carga de proyectos — auth guards', () => {
  test('redirects unauthenticated /admin to /login', async ({ page }) => {
    await page.goto('/admin')
    await expect(page).toHaveURL(/\/login$/)
  })

  test('redirects unauthenticated /admin/proyectos to /login', async ({ page }) => {
    await page.goto('/admin/proyectos/00000000-0000-0000-0000-000000000000')
    await expect(page).toHaveURL(/\/login$/)
  })

  test('redirects unauthenticated /dashboard/proyectos/nuevo to /login', async ({ page }) => {
    await page.goto('/dashboard/proyectos/nuevo')
    await expect(page).toHaveURL(/\/login$/)
  })

  test('redirects unauthenticated /dashboard/perfil to /login', async ({ page }) => {
    await page.goto('/dashboard/perfil')
    await expect(page).toHaveURL(/\/login$/)
  })

  test('redirects unauthenticated /dashboard/proyectos/:id/editar to /login', async ({ page }) => {
    await page.goto('/dashboard/proyectos/00000000-0000-0000-0000-000000000000/editar')
    await expect(page).toHaveURL(/\/login$/)
  })
})
