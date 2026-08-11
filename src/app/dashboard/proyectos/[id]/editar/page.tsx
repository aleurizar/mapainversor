import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { createAuthServerClient } from '@/lib/supabase-server'
import ProyectoForm from '@/components/ProyectoForm'
import type { ProyectoFormValues } from '@/components/ProyectoForm'
import { editarProyecto } from '../../actions'

function toStr(v: number | null): string {
  return v == null ? '' : String(v)
}

export default async function EditarProyectoPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createAuthServerClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: proyecto } = await supabase
    .from('proyectos')
    .select('*')
    .eq('id', id)
    .single()

  if (!proyecto) notFound()

  const { data: desarrolladora } = await supabase
    .from('desarrolladoras')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!desarrolladora || desarrolladora.id !== proyecto.desarrolladora_id) notFound()

  const initial: ProyectoFormValues = {
    nombre: proyecto.nombre,
    descripcion: proyecto.descripcion ?? '',
    estado: proyecto.estado,
    tipo: proyecto.tipo,
    direccion: proyecto.direccion,
    ciudad: proyecto.ciudad,
    provincia: proyecto.provincia,
    latitud: proyecto.latitud,
    longitud: proyecto.longitud,
    precio_desde: toStr(proyecto.precio_desde),
    moneda: proyecto.moneda,
    superficie_desde: toStr(proyecto.superficie_desde),
    superficie_hasta: toStr(proyecto.superficie_hasta),
    ambientes_min: toStr(proyecto.ambientes_min),
    ambientes_max: toStr(proyecto.ambientes_max),
    imagen_url: proyecto.imagen_url ?? '',
    imagenes: (proyecto.imagenes ?? []).join(', '),
    amenities: (proyecto.amenities ?? []).join(', '),
  }

  return (
    <div className="px-8 py-8 max-w-2xl">
      <Link href="/dashboard" className="text-sm text-gray-400 hover:text-gray-700 transition-colors">
        ← Mis proyectos
      </Link>
      <h1 className="text-2xl font-bold text-gray-900 mt-2 mb-1">Editar {proyecto.nombre}</h1>
      <p className="text-sm text-gray-400 mb-6">
        Al guardar, el proyecto vuelve a estado &quot;en revisión&quot;.
      </p>
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <ProyectoForm
          action={editarProyecto.bind(null, id)}
          initial={initial}
          pendingLabel="Guardar cambios"
        />
      </div>
    </div>
  )
}
