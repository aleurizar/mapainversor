import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createAuthServerClient } from '@/lib/supabase-server'
import { isAdmin } from '@/lib/auth'
import { REVISION_LABEL, REVISION_COLOR_BADGE } from '@/types/proyecto'
import { aprobarProyecto, toggleActivoProyecto } from './actions'
import RechazoForm from './RechazoForm'

export default async function AdminPage() {
  const supabase = await createAuthServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const admin = await isAdmin(user.id)
  if (!admin) redirect('/dashboard')

  const { data: proyectos } = await supabase
    .from('proyectos')
    .select(`
      id, nombre, estado, tipo, ciudad, estado_revision, motivo_rechazo, activo, created_at,
      desarrolladoras!inner(nombre)
    `)
    .order('created_at', { ascending: false })

  const pendientes = proyectos?.filter((p) => p.estado_revision === 'pendiente') ?? []
  const resto = proyectos?.filter((p) => p.estado_revision !== 'pendiente') ?? []

  return (
    <div className="px-8 py-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Panel de administración</h1>
        <p className="text-sm text-gray-500 mt-1">Revisá y aprobá los proyectos cargados por las desarrolladoras.</p>
      </div>

      {pendientes.length > 0 && (
        <section className="mb-10">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-gray-400 mb-3">
            Pendientes de revisión ({pendientes.length})
          </h2>
          <ProyectosTable proyectos={pendientes} showAcciones />
        </section>
      )}

      <section>
        <h2 className="text-sm font-semibold uppercase tracking-widest text-gray-400 mb-3">
          Todos los proyectos
        </h2>
        <ProyectosTable proyectos={resto} showAcciones />
      </section>
    </div>
  )
}

function ProyectosTable({
  proyectos,
  showAcciones,
}: {
  proyectos: Array<Record<string, unknown> & {
    id: string
    nombre: string
    estado_revision: string
    motivo_rechazo: string | null
    activo: boolean
    desarrolladoras: { nombre: string } | { nombre: string }[]
  }>
  showAcciones: boolean
}) {
  if (proyectos.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 py-12 text-center">
        <p className="text-gray-400 text-sm">Sin proyectos acá por ahora.</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-100 bg-gray-50">
            <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-widest text-gray-400">Proyecto</th>
            <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-widest text-gray-400 hidden md:table-cell">Desarrolladora</th>
            <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-widest text-gray-400">Revisión</th>
            <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-widest text-gray-400 hidden sm:table-cell">Activo</th>
            <th className="px-4 py-3" />
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {proyectos.map((proyecto) => {
            const devs = Array.isArray(proyecto.desarrolladoras)
              ? proyecto.desarrolladoras
              : [proyecto.desarrolladoras]
            return (
              <tr key={proyecto.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-5 py-4">
                  <Link href={`/admin/proyectos/${proyecto.id}`} className="font-medium text-gray-900 hover:text-gray-600 transition-colors">
                    {proyecto.nombre}
                  </Link>
                  {proyecto.motivo_rechazo && (
                    <p className="text-xs text-red-500 mt-0.5 max-w-xs">{proyecto.motivo_rechazo}</p>
                  )}
                </td>
                <td className="px-4 py-4 text-gray-500 hidden md:table-cell">
                  {devs.map((d) => d.nombre).join(', ')}
                </td>
                <td className="px-4 py-4">
                  <span className={`inline-block text-xs font-semibold px-2.5 py-1 rounded-full ${REVISION_COLOR_BADGE[proyecto.estado_revision] ?? 'bg-gray-100 text-gray-600'}`}>
                    {REVISION_LABEL[proyecto.estado_revision] ?? proyecto.estado_revision}
                  </span>
                </td>
                <td className="px-4 py-4 hidden sm:table-cell">
                  <span className={`text-xs font-semibold ${proyecto.activo ? 'text-emerald-600' : 'text-gray-400'}`}>
                    {proyecto.activo ? 'Sí' : 'No'}
                  </span>
                </td>
                {showAcciones && (
                  <td className="px-4 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <form action={aprobarProyecto}>
                        <input type="hidden" name="proyecto_id" value={proyecto.id} />
                        <button
                          type="submit"
                          className="text-xs font-medium text-emerald-700 border border-emerald-200 rounded-lg px-3 py-1.5 hover:bg-emerald-50 transition-colors"
                        >
                          Aprobar
                        </button>
                      </form>
                      <RechazoForm proyectoId={proyecto.id} />
                      <form action={toggleActivoProyecto}>
                        <input type="hidden" name="proyecto_id" value={proyecto.id} />
                        <input type="hidden" name="activo" value={proyecto.activo ? 'false' : 'true'} />
                        <button
                          type="submit"
                          title={proyecto.activo ? 'Ocultar del mapa' : 'Mostrar en el mapa'}
                          className="text-xs font-medium text-gray-600 border border-gray-200 rounded-lg px-3 py-1.5 hover:bg-gray-50 transition-colors"
                        >
                          {proyecto.activo ? 'Ocultar' : 'Mostrar'}
                        </button>
                      </form>
                    </div>
                  </td>
                )}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
