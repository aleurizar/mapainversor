import { describe, it, expect } from 'vitest'

describe('test setup', () => {
  it('environment is configured', () => {
    expect(typeof window).toBe('object')
  })
})
