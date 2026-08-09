import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'

import LogoutButton from '@/components/LogoutButton'

const mockPush = vi.fn()
const mockRefresh = vi.fn()
const mockSignOut = vi.fn().mockResolvedValue({ error: null })

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush, refresh: mockRefresh }),
}))

vi.mock('@/lib/supabase', () => ({
  createClient: () => ({ auth: { signOut: mockSignOut } }),
}))

describe('LogoutButton', () => {
  const user = userEvent.setup()

  beforeEach(() => {
    vi.clearAllMocks()
    mockSignOut.mockResolvedValue({ error: null })
  })

  it('renderiza el botón de cerrar sesión', () => {
    render(<LogoutButton />)
    expect(screen.getByRole('button', { name: /cerrar sesión/i })).toBeInTheDocument()
  })

  it('cierra sesión y redirige al login', async () => {
    render(<LogoutButton />)

    await user.click(screen.getByRole('button', { name: /cerrar sesión/i }))

    await waitFor(() => {
      expect(mockSignOut).toHaveBeenCalledOnce()
    })
    expect(mockPush).toHaveBeenCalledWith('/login')
    expect(mockRefresh).toHaveBeenCalledOnce()
  })
})
