import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createAuthServerClient } from '@/lib/supabase-server'
import ProyectoForm from '@/components/ProyectoForm'
import { crearProyecto } from '../actions'

export default async function NuevoProyectoPage() {
  const supabase = await createAuthServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: desarrolladora } = await supabase
    .from('desarrolladoras')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!desarrolladora) redirect('/registro')

  return (
    <div className="px-8 py-8 max-w-2xl">
      <Link href="/dashboard" className="text-sm text-gray-400 hover:text-gray-700 transition-colors">
        ← Mis proyectos
      </Link>
      <h1 className="text-2xl font-bold text-gray-900 mt-2 mb-6">Cargar nuevo proyecto</h1>
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <ProyectoForm action={crearProyecto} pendingLabel="Publicar proyecto" />
      </div>
      <p className="text-xs text-gray-400 mt-3">
        Al publicar, tu proyecto entra en revisión y será visible públicamente al aprobarse.
      </p>
    </div>
  )
}
