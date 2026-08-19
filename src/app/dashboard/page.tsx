import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createAuthServerClient } from '@/lib/supabase-server'
import {
  ESTADO_LABEL,
  ESTADO_COLOR_BADGE,
  REVISION_LABEL,
  REVISION_COLOR_BADGE,
} from '@/types/proyecto'

export default async function DashboardPage() {
  const supabase = await createAuthServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: desarrolladora } = await supabase
    .from('desarrolladoras')
    .select('id, nombre')
    .eq('user_id', user.id)
    .single()

  if (!desarrolladora) redirect('/registro')

  const { data: proyectos } = await supabase
    .from('proyectos')
    .select('id, nombre, estado, estado_revision, motivo_rechazo, ciudad, precio_desde, moneda, leads(count)')
    .eq('desarrolladora_id', desarrolladora.id)
    .order('created_at', { ascending: false })

  const totalLeads = proyectos?.reduce(
    (acc, p) => acc + ((p.leads as unknown as { count: number }[])[0]?.count ?? 0),
    0
  ) ?? 0

  return (
    <div className="px-8 py-8 max-w-5xl">
      {/* Header */}
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mis proyectos</h1>
          <p className="text-sm text-gray-500 mt-1">{desarrolladora.nombre}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Link
            href="/dashboard/perfil"
            className="text-xs font-medium text-gray-700 border border-gray-200 rounded-lg px-3 py-2 hover:bg-gray-50 transition-colors"
          >
            Perfil
          </Link>
          <Link
            href="/dashboard/proyectos/nuevo"
            className="text-xs font-semibold text-white bg-gray-900 rounded-lg px-3 py-2 hover:bg-gray-700 transition-colors"
          >
            + Nuevo proyecto
          </Link>
        </div>
      </div>

      {/* Stats rápidas */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
        <StatCard label="Proyectos" value={proyectos?.length ?? 0} />
        <StatCard label="Leads totales" value={totalLeads} />
        <StatCard
          label="En comercialización"
          value={proyectos?.filter((p) => p.estado === 'en_construccion' || p.estado === 'en_pozo').length ?? 0}
        />
      </div>

      {/* Tabla de proyectos */}
      {proyectos && proyectos.length > 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
              <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-widest text-gray-400">
                  Proyecto
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-widest text-gray-400">
                  Estado
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-widest text-gray-400 hidden sm:table-cell">
                  Revisión
                </th>
                <th className="text-right px-4 py-3 text-xs font-semibold uppercase tracking-widest text-gray-400">
                  Leads
                </th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {proyectos.map((proyecto) => {
                const leadCount = (proyecto.leads as unknown as { count: number }[])[0]?.count ?? 0
                return (
                  <tr key={proyecto.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-4">
                      <p className="font-medium text-gray-900">{proyecto.nombre}</p>
                      {proyecto.precio_desde && (
                        <p className="text-xs text-gray-400">
                          {proyecto.moneda} {Number(proyecto.precio_desde).toLocaleString('es-AR')}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      <span className={`inline-block text-xs font-semibold px-2.5 py-1 rounded-full ${ESTADO_COLOR_BADGE[proyecto.estado] ?? 'bg-gray-100 text-gray-600'}`}>
                        {ESTADO_LABEL[proyecto.estado] ?? proyecto.estado}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-gray-500 hidden sm:table-cell">
                      <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ${REVISION_COLOR_BADGE[proyecto.estado_revision] ?? 'bg-gray-100 text-gray-600'}`} title={proyecto.motivo_rechazo ?? undefined}>
                        {REVISION_LABEL[proyecto.estado_revision] ?? proyecto.estado_revision}
                      </span>
                      {proyecto.estado_revision === 'rechazado' && proyecto.motivo_rechazo && (
                        <p className="text-xs text-red-500 mt-1 max-w-[220px]">
                          {proyecto.motivo_rechazo}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-4 text-right">
                      <span className={`font-semibold ${leadCount > 0 ? 'text-gray-900' : 'text-gray-300'}`}>
                        {leadCount}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-2">
                        <Link
                          href={`/dashboard/proyectos/${proyecto.id}/editar`}
                          className="text-xs font-medium text-gray-700 border border-gray-200 rounded-lg px-3 py-1.5 hover:bg-gray-50 transition-colors"
                        >
                          Editar
                        </Link>
                        <Link
                          href={`/dashboard/proyectos/${proyecto.id}`}
                          className="text-xs font-medium text-gray-900 border border-gray-200 rounded-lg px-3 py-1.5 hover:bg-gray-50 transition-colors"
                        >
                          Ver leads
                        </Link>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 py-16 text-center">
          <p className="text-gray-400 text-sm">Todavía no tenés proyectos cargados.</p>
          <Link
            href="/dashboard/proyectos/nuevo"
            className="mt-3 inline-block text-sm font-medium text-white bg-gray-900 rounded-lg px-4 py-2 hover:bg-gray-700 transition-colors"
          >
            Cargar tu primer proyecto
          </Link>
        </div>
      )}
    </div>
  )
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 px-5 py-4">
      <p className="text-xs text-gray-400 mb-1">{label}</p>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
    </div>
  )
}
