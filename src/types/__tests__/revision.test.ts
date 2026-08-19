import { describe, it, expect } from 'vitest'
import { REVISION_LABEL, REVISION_COLOR_BADGE } from '@/types/proyecto'

describe('REVISION_LABEL', () => {
  it('mapea los tres estados', () => {
    expect(REVISION_LABEL['pendiente']).toBe('En revisión')
    expect(REVISION_LABEL['aprobado']).toBe('Aprobado')
    expect(REVISION_LABEL['rechazado']).toBe('Rechazado')
  })
})

describe('REVISION_COLOR_BADGE', () => {
  it('tiene color para cada estado', () => {
    for (const k of ['pendiente', 'aprobado', 'rechazado']) {
      expect(REVISION_COLOR_BADGE[k]).toBeDefined()
    }
  })
})
