'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createAuthServerClient } from '@/lib/supabase-server'

export async function actualizarPerfil(formData: FormData) {
  const supabase = await createAuthServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: desarrolladora } = await supabase
    .from('desarrolladoras')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!desarrolladora) redirect('/registro')

  const payload = {
    nombre: String(formData.get('nombre') ?? '').trim(),
    sitio_web: String(formData.get('sitio_web') ?? '').trim() || null,
    telefono: String(formData.get('telefono') ?? '').trim() || null,
    descripcion: String(formData.get('descripcion') ?? '').trim() || null,
  }

  if (!payload.nombre) {
    throw new Error('El nombre es obligatorio')
  }

  const { error } = await supabase
    .from('desarrolladoras')
    .update(payload)
    .eq('id', desarrolladora.id)

  if (error) throw new Error(error.message)

  revalidatePath('/dashboard')
  revalidatePath('/dashboard/perfil')
  redirect('/dashboard/perfil')
}
