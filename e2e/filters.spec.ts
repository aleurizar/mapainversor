import { test, expect } from '@playwright/test'

test.describe('filtros de mapa', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('muestra la leyenda de estados y tipo de proyecto', async ({ page }) => {
    await expect(page.locator('text=Estado del proyecto')).toBeVisible()
    await expect(page.locator('text=Tipo de proyecto')).toBeVisible()

    const checkboxes = page.getByRole('checkbox')
    expect(await checkboxes.count()).toBe(8) // 4 estados + 4 tipos
  })

  test('deseleccionar un estado persiste en la URL', async ({ page }) => {
    await page.locator('label:has-text("Entregado")').click()

    await page.waitForURL(/.*\?estados=/)
  })

  test('deseleccionar un tipo persiste en la URL', async ({ page }) => {
    await page.locator('label:has-text("Oficinas")').click()

    await page.waitForURL(/.*[\?&]tipos=/)
  })
})
