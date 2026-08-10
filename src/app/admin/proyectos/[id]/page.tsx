import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { createAuthServerClient } from '@/lib/supabase-server'
import { isAdmin } from '@/lib/auth'
import {
  ESTADO_LABEL,
  TIPO_LABEL,
  REVISION_LABEL,
  REVISION_COLOR_BADGE,
} from '@/types/proyecto'
import { aprobarProyecto, toggleActivoProyecto } from '../../actions'
import RechazoForm from '../../RechazoForm'

export default async function AdminProyectoPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createAuthServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const admin = await isAdmin(user.id)
  if (!admin) redirect('/dashboard')

  const { data: proyecto } = await supabase
    .from('proyectos')
    .select(`
      *,
      desarrolladoras!inner(nombre, email, sitio_web, telefono, descripcion)
    `)
    .eq('id', id)
    .single()

  if (!proyecto) notFound()

  const dev = Array.isArray(proyecto.desarrolladoras)
    ? proyecto.desarrolladoras[0]
    : proyecto.desarrolladoras

  const field = (label: string, value: unknown) => (
    <div>
      <dt className="text-xs uppercase tracking-widest text-gray-400 font-semibold mb-0.5">{label}</dt>
      <dd className="text-sm text-gray-900">{String(value ?? '—')}</dd>
    </div>
  )

  return (
    <div className="px-8 py-8 max-w-3xl">
      <Link href="/admin" className="text-sm text-gray-400 hover:text-gray-700 transition-colors">
        ← Panel de administración
      </Link>

      <div className="mt-2 mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{proyecto.nombre}</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {proyecto.direccion}, {proyecto.ciudad} — {proyecto.provincia}
          </p>
        </div>
        <span className={`inline-block text-xs font-semibold px-2.5 py-1 rounded-full ${REVISION_COLOR_BADGE[proyecto.estado_revision] ?? 'bg-gray-100 text-gray-600'}`}>
          {REVISION_LABEL[proyecto.estado_revision] ?? proyecto.estado_revision}
        </span>
      </div>

      {proyecto.estado_revision === 'pendiente' && (
        <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 mb-6 flex items-center justify-between gap-4 flex-wrap">
          <p className="text-sm text-amber-800">Este proyecto está esperando revisión.</p>
          <div className="flex items-center gap-2">
            <form
              action={async () => {
                const fd = new FormData()
                fd.set('proyecto_id', proyecto.id)
                await aprobarProyecto(fd)
              }}
            >
              <button
                type="submit"
                className="text-xs font-semibold text-white bg-emerald-600 rounded-lg px-4 py-2 hover:bg-emerald-700 transition-colors"
              >
                Aprobar
              </button>
            </form>
            <RechazoForm proyectoId={proyecto.id} />
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-6">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-gray-400 mb-4">Datos del proyecto</h2>
        <dl className="grid grid-cols-2 gap-4">
          {field('Estado', ESTADO_LABEL[proyecto.estado] ?? proyecto.estado)}
          {field('Tipo', TIPO_LABEL[proyecto.tipo] ?? proyecto.tipo)}
          {field('Precio desde', proyecto.precio_desde ? `${proyecto.moneda} ${Number(proyecto.precio_desde).toLocaleString('es-AR')}` : null)}
          {field('Superficie', proyecto.superficie_desde ? `${proyecto.superficie_desde}–${proyecto.superficie_hasta ?? '…'} m²` : null)}
          {field('Ambientes', proyecto.ambientes_min ? `${proyecto.ambientes_min}–${proyecto.ambientes_max ?? '…'}` : null)}
          {field('Coordenadas', `${proyecto.latitud.toFixed(5)}, ${proyecto.longitud.toFixed(5)}`)}
        </dl>
        {proyecto.descripcion && (
          <p className="text-sm text-gray-600 mt-4">{proyecto.descripcion}</p>
        )}
        {proyecto.amenities && proyecto.amenities.length > 0 && (
          <div className="mt-4">
            <p className="text-xs uppercase tracking-widest text-gray-400 font-semibold mb-1">Amenities</p>
            <div className="flex flex-wrap gap-1.5">
              {proyecto.amenities.map((a: string) => (
                <span key={a} className="text-xs bg-gray-100 text-gray-700 rounded-full px-2.5 py-1">{a}</span>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-6">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-gray-400 mb-4">Desarrolladora</h2>
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {field('Nombre', dev?.nombre)}
          {field('Email', dev?.email)}
          {field('Sitio web', dev?.sitio_web)}
          {field('Teléfono', dev?.telefono)}
        </dl>
        {dev?.descripcion && <p className="text-sm text-gray-600 mt-4">{dev.descripcion}</p>}
      </div>

      <form
        action={async () => {
          const fd = new FormData()
          fd.set('proyecto_id', proyecto.id)
          fd.set('activo', proyecto.activo ? 'false' : 'true')
          await toggleActivoProyecto(fd)
        }}
      >
        <button
          type="submit"
          className={`text-xs font-semibold rounded-lg px-4 py-2 border transition-colors ${
            proyecto.activo
              ? 'text-gray-600 border-gray-200 hover:bg-gray-50'
              : 'text-emerald-700 border-emerald-200 hover:bg-emerald-50'
          }`}
        >
          {proyecto.activo ? 'Ocultar del mapa público' : 'Mostrar en el mapa público'}
        </button>
      </form>
    </div>
  )
}
