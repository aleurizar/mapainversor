'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createAuthServerClient } from '@/lib/supabase-server'
import { parseProyectoForm } from '@/lib/proyecto-form'

async function getDesarrolladoraId(): Promise<string> {
  const supabase = await createAuthServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data } = await supabase
    .from('desarrolladoras')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!data) redirect('/registro')
  return data.id
}

export async function crearProyecto(formData: FormData) {
  const desarrolladoraId = await getDesarrolladoraId()
  const { data, errors } = parseProyectoForm(formData)

  if (!data) {
    throw new Error(Object.values(errors).join('. '))
  }

  const supabase = await createAuthServerClient()
  const { error } = await supabase.from('proyectos').insert({
    desarrolladora_id: desarrolladoraId,
    ...data,
    estado_revision: 'pendiente',
    activo: true,
  })

  if (error) throw new Error(error.message)

  revalidatePath('/dashboard')
  revalidatePath('/')
  redirect('/dashboard')
}

export async function editarProyecto(proyectoId: string, formData: FormData) {
  const desarrolladoraId = await getDesarrolladoraId()
  const { data, errors } = parseProyectoForm(formData)

  if (!data) {
    throw new Error(Object.values(errors).join('. '))
  }

  const supabase = await createAuthServerClient()

  // Verificar ownership
  const { data: existing } = await supabase
    .from('proyectos')
    .select('id, desarrolladora_id')
    .eq('id', proyectoId)
    .single()

  if (!existing || existing.desarrolladora_id !== desarrolladoraId) {
    redirect('/dashboard')
  }

  const { error } = await supabase
    .from('proyectos')
    .update({ ...data, estado_revision: 'pendiente', motivo_rechazo: null })
    .eq('id', proyectoId)

  if (error) throw new Error(error.message)

  revalidatePath('/dashboard')
  revalidatePath('/proyectos/[id]')
  revalidatePath('/')
  redirect('/dashboard')
}
