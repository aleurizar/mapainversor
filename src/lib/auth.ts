import { createAuthServerClient } from '@/lib/supabase-server'

export async function getSessionUser() {
  const supabase = await createAuthServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user ?? null
}

export async function isAdmin(userId: string) {
  const supabase = await createAuthServerClient()
  const { data } = await supabase
    .from('admins')
    .select('user_id')
    .eq('user_id', userId)
    .maybeSingle()
  return !!data
}
