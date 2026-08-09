import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { createAuthServerClient } from '@/lib/supabase-server'

const LEAD_ESTADO_COLOR: Record<string, string> = {
  nuevo:       'bg-blue-100 text-blue-700',
  contactado:  'bg-amber-100 text-amber-700',
  calificado:  'bg-green-100 text-green-700',
  descartado:  'bg-gray-100 text-gray-500',
}

const LEAD_ESTADO_LABEL: Record<string, string> = {
  nuevo:      'Nuevo',
  contactado: 'Contactado',
  calificado: 'Calificado',
  descartado: 'Descartado',
}

export default async function ProyectoLeadsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createAuthServerClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Verificar que el proyecto pertenece a la desarrolladora del usuario
  const { data: proyecto } = await supabase
    .from('proyectos')
    .select('id, nombre, ciudad, estado, desarrolladoras!inner(user_id)')
    .eq('id', id)
    .single()

  if (!proyecto) notFound()

  const dev = proyecto.desarrolladoras as unknown as { user_id: string | null }
  if (dev.user_id !== user.id) notFound()

  const { data: leads } = await supabase
    .from('leads')
    .select('id, nombre, email, telefono, mensaje, estado, created_at')
    .eq('proyecto_id', id)
    .order('created_at', { ascending: false })

  return (
    <div className="px-8 py-8 max-w-5xl">
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/dashboard"
          className="text-sm text-gray-400 hover:text-gray-700 transition-colors"
        >
          ← Mis proyectos
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 mt-2">{proyecto.nombre}</h1>
        <p className="text-sm text-gray-500 mt-0.5">{proyecto.ciudad}</p>
      </div>

      {/* Stat */}
      <div className="mb-6">
        <div className="inline-flex items-center gap-2 bg-white border border-gray-100 rounded-xl px-4 py-2.5">
          <span className="text-2xl font-bold text-gray-900">{leads?.length ?? 0}</span>
          <span className="text-sm text-gray-400">leads recibidos</span>
        </div>
      </div>

      {/* Tabla de leads */}
      {leads && leads.length > 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-widest text-gray-400">
                  Contacto
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-widest text-gray-400 hidden md:table-cell">
                  Mensaje
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-widest text-gray-400">
                  Estado
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-widest text-gray-400 hidden sm:table-cell">
                  Fecha
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {leads.map((lead) => (
                <tr key={lead.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-4">
                    <p className="font-medium text-gray-900">{lead.nombre}</p>
                    <a
                      href={`mailto:${lead.email}`}
                      className="text-xs text-gray-500 hover:text-gray-900 transition-colors"
                    >
                      {lead.email}
                    </a>
                    {lead.telefono && (
                      <p className="text-xs text-gray-400">{lead.telefono}</p>
                    )}
                  </td>
                  <td className="px-4 py-4 text-gray-500 hidden md:table-cell max-w-xs">
                    <p className="truncate">{lead.mensaje ?? '—'}</p>
                  </td>
                  <td className="px-4 py-4">
                    <span className={`inline-block text-xs font-semibold px-2.5 py-1 rounded-full ${LEAD_ESTADO_COLOR[lead.estado] ?? 'bg-gray-100 text-gray-600'}`}>
                      {LEAD_ESTADO_LABEL[lead.estado] ?? lead.estado}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-gray-400 text-xs hidden sm:table-cell whitespace-nowrap">
                    {new Date(lead.created_at).toLocaleDateString('es-AR', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 py-16 text-center">
          <p className="text-gray-400 text-sm">Todavía no recibiste leads para este proyecto.</p>
          <Link
            href={`/proyectos/${proyecto.id}`}
            className="mt-3 inline-block text-sm text-gray-900 underline underline-offset-2"
          >
            Ver ficha pública
          </Link>
        </div>
      )}
    </div>
  )
}
