import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'

import LeadForm from '@/components/LeadForm'
import { mockInsert } from '@/lib/test/mockSupabase'

vi.mock('@/lib/supabase', () => ({
  createClient: () => ({
    from: vi.fn(() => ({
      insert: mockInsert,
    })),
  }),
}))

describe('LeadForm', () => {
  const user = userEvent.setup()
  const proyectoId = 'test-proyecto-id'

  beforeEach(() => {
    vi.clearAllMocks()
    mockInsert.mockResolvedValue({ data: null, error: null })
  })

  it('renderiza el formulario con campos requeridos', () => {
    render(<LeadForm proyectoId={proyectoId} />)

    expect(screen.getByLabelText(/nombre/i)).toHaveAttribute('required')
    expect(screen.getByLabelText(/email/i)).toHaveAttribute('required')
    expect(screen.getByRole('button', { name: /enviar consulta/i })).toBeInTheDocument()
  })

  it('envía el lead al hacer submit con datos válidos', async () => {
    render(<LeadForm proyectoId={proyectoId} />)

    await user.type(screen.getByLabelText(/nombre/i), 'Ana Ejemplo')
    await user.type(screen.getByLabelText(/email/i), 'ana@email.com')
    await user.type(screen.getByLabelText(/Teléfono/i), '+54 11 1234-5678')
    await user.type(screen.getByLabelText(/mensaje/i), 'Quiero saber más sobre este proyecto')

    await user.click(screen.getByRole('button', { name: /enviar consulta/i }))

    await waitFor(() => {
      expect(mockInsert).toHaveBeenCalledWith({
        proyecto_id: proyectoId,
        nombre: 'Ana Ejemplo',
        email: 'ana@email.com',
        telefono: '+54 11 1234-5678',
        mensaje: 'Quiero saber más sobre este proyecto',
      })
    })

    expect(await screen.findByText(/consulta enviada/i)).toBeInTheDocument()
  })

  it('muestra error cuando Supabase falla', async () => {
    mockInsert.mockResolvedValueOnce({ data: null, error: { message: 'DB error' } })
    render(<LeadForm proyectoId={proyectoId} />)

    await user.type(screen.getByLabelText(/nombre/i), 'Ana')
    await user.type(screen.getByLabelText(/email/i), 'ana@email.com')

    await user.click(screen.getByRole('button', { name: /enviar consulta/i }))

    expect(await screen.findByText(/hubo un error/i)).toBeInTheDocument()
  })

  it('permite enviar otra consulta después del éxito', async () => {
    render(<LeadForm proyectoId={proyectoId} />)

    await user.type(screen.getByLabelText(/nombre/i), 'Ana')
    await user.type(screen.getByLabelText(/email/i), 'ana@email.com')
    await user.click(screen.getByRole('button', { name: /enviar consulta/i }))

    const otraConsultaBtn = await screen.findByRole('button', { name: /enviar otra consulta/i })
    expect(otraConsultaBtn).toBeInTheDocument()

    await user.click(otraConsultaBtn)

    expect(screen.getByLabelText(/nombre/i)).toBeInTheDocument()
  })
})
