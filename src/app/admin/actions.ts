'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createAuthServerClient } from '@/lib/supabase-server'
import { isAdmin } from '@/lib/auth'

async function requireAdmin() {
  const supabase = await createAuthServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const admin = await isAdmin(user.id)
  if (!admin) redirect('/dashboard')
  return supabase
}

function getProyectoId(formData: FormData): string {
  const id = String(formData.get('proyecto_id') ?? '')
  if (!id) throw new Error('Falta el id del proyecto')
  return id
}

export async function aprobarProyecto(formData: FormData) {
  const supabase = await requireAdmin()
  const id = getProyectoId(formData)

  const { error } = await supabase
    .from('proyectos')
    .update({ estado_revision: 'aprobado', motivo_rechazo: null })
    .eq('id', id)

  if (error) throw new Error(error.message)

  revalidatePath('/admin')
  revalidatePath('/admin/proyectos')
  revalidatePath('/')
}

export async function rechazarProyecto(formData: FormData) {
  const supabase = await requireAdmin()
  const id = getProyectoId(formData)
  const motivo = String(formData.get('motivo') ?? '').trim()

  if (!motivo) {
    throw new Error('El motivo de rechazo es obligatorio')
  }

  const { error } = await supabase
    .from('proyectos')
    .update({ estado_revision: 'rechazado', motivo_rechazo: motivo })
    .eq('id', id)

  if (error) throw new Error(error.message)

  revalidatePath('/admin')
  revalidatePath('/admin/proyectos')
}

export async function toggleActivoProyecto(formData: FormData) {
  const supabase = await requireAdmin()
  const id = getProyectoId(formData)
  const activo = formData.get('activo') === 'true'

  const { error } = await supabase
    .from('proyectos')
    .update({ activo })
    .eq('id', id)

  if (error) throw new Error(error.message)

  revalidatePath('/admin')
  revalidatePath('/admin/proyectos')
  revalidatePath('/')
}
