import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'

import RegistroForm from '@/components/RegistroForm'

const signUpMock = vi.fn()
const insertMock = vi.fn()
const pushMock = vi.fn()

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock, refresh: vi.fn() }),
}))

vi.mock('@/lib/supabase', () => ({
  createClient: () => ({
    auth: { signUp: signUpMock },
    from: vi.fn(() => ({ insert: insertMock })),
  }),
}))

describe('RegistroForm', () => {
  const user = userEvent.setup()

  beforeEach(() => {
    vi.clearAllMocks()
    signUpMock.mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null })
    insertMock.mockResolvedValue({ error: null })
  })

  it('crea la cuenta y vincula la desarrolladora', async () => {
    render(<RegistroForm />)

    await user.type(screen.getByLabelText(/nombre de la desarrolladora/i), 'Grupo Test')
    await user.type(screen.getByLabelText(/email/i), 'dev@test.com')
    await user.type(screen.getByLabelText(/contraseña/i), '123456')

    await user.click(screen.getByRole('button', { name: /crear cuenta/i }))

    await waitFor(() => {
      expect(signUpMock).toHaveBeenCalledWith({ email: 'dev@test.com', password: '123456' })
      expect(insertMock).toHaveBeenCalledWith({
        nombre: 'Grupo Test',
        email: 'dev@test.com',
        user_id: 'user-1',
      })
      expect(pushMock).toHaveBeenCalledWith('/dashboard')
    })
  })

  it('muestra el error de signUp', async () => {
    signUpMock.mockResolvedValueOnce({ data: null, error: { message: 'email en uso' } })
    render(<RegistroForm />)

    await user.type(screen.getByLabelText(/nombre de la desarrolladora/i), 'Grupo Test')
    await user.type(screen.getByLabelText(/email/i), 'dev@test.com')
    await user.type(screen.getByLabelText(/contraseña/i), '123456')
    await user.click(screen.getByRole('button', { name: /crear cuenta/i }))

    expect(await screen.findByText(/email en uso/i)).toBeInTheDocument()
  })
})
