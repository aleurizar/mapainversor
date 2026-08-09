import { vi } from 'vitest'

// Helpers shared para tests que quieran reusar mocks configurables.
// Cada test file define su propio vi.mock('@/lib/supabase') y usa estos vi.fn.

const mockInsert = vi.fn().mockResolvedValue({ data: null, error: null })
const mockUpdate = vi.fn().mockResolvedValue({ data: null, error: null })
const mockUpsert = vi.fn().mockResolvedValue({ data: null, error: null })

const mockFrom = vi.fn(() => createChainable())

const mockSelectReturn = {
  eq: vi.fn().mockReturnThis(),
  neq: vi.fn().mockReturnThis(),
  order: vi.fn().mockReturnThis(),
  returns: vi.fn(),
  single: vi.fn(),
}

function createChainable() {
  return {
    select: vi.fn().mockReturnValue(mockSelectReturn),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    single: vi.fn(),
  }
}

const mockAuth = {
  getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
  signInWithPassword: vi.fn().mockResolvedValue({ error: null }),
  signUp: vi.fn().mockResolvedValue({ error: null }),
  signOut: vi.fn().mockResolvedValue({ error: null }),
  onAuthStateChange: vi.fn().mockReturnValue({
    data: { subscription: { unsubscribe: vi.fn() } },
  }),
}

const mockSupabase = {
  auth: mockAuth,
  from: mockFrom,
  storage: { from: vi.fn() },
  rpc: vi.fn().mockResolvedValue({ data: null, error: null }),
}

export { mockSupabase, mockInsert, mockUpdate, mockUpsert, mockFrom, mockAuth }
