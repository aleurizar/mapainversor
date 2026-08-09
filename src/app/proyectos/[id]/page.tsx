import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createServerClient } from '@/lib/supabase'
import LeadForm from '@/components/LeadForm'

const ESTADO_LABEL: Record<string, string> = {
  en_pozo:         'En pozo',
  en_construccion: 'En construcción',
  terminado:       'Terminado',
  entregado:       'Entregado',
}

const ESTADO_COLOR: Record<string, string> = {
  en_pozo:         'bg-amber-100 text-amber-800',
  en_construccion: 'bg-blue-100 text-blue-800',
  terminado:       'bg-green-100 text-green-800',
  entregado:       'bg-gray-100 text-gray-700',
}

const TIPO_LABEL: Record<string, string> = {
  residencial: 'Residencial',
  comercial:   'Comercial',
  mixto:       'Mixto',
  oficinas:    'Oficinas',
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = createServerClient()
  const { data } = await supabase
    .from('proyectos')
    .select('nombre, ciudad')
    .eq('id', id)
    .single()

  if (!data) return { title: 'Proyecto no encontrado' }
  return {
    title: `${data.nombre} — MapaInversor.ar`,
    description: `Proyecto en ${data.ciudad}. Consultá precio, detalles y contacto.`,
  }
}

export default async function ProyectoPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = createServerClient()

  const { data: proyecto } = await supabase
    .from('proyectos')
    .select(`
      id, nombre, descripcion, estado, tipo,
      direccion, ciudad, provincia,
      precio_desde, moneda,
      superficie_desde, superficie_hasta,
      ambientes_min, ambientes_max,
      amenities,
      desarrolladoras (
        nombre, logo_url, sitio_web, telefono, descripcion
      )
    `)
    .eq('id', id)
    .eq('activo', true)
    .single()

  if (!proyecto) notFound()

  const dev = proyecto.desarrolladoras as unknown as {
    nombre: string
    logo_url: string | null
    sitio_web: string | null
    telefono: string | null
    descripcion: string | null
  } | null

  const amenities: string[] = (proyecto.amenities as string[] | null) ?? []

  const precioStr = proyecto.precio_desde
    ? `${proyecto.moneda} ${Number(proyecto.precio_desde).toLocaleString('es-AR')}`
    : null

  const superficieStr =
    proyecto.superficie_desde || proyecto.superficie_hasta
      ? [
          proyecto.superficie_desde && `${proyecto.superficie_desde} m²`,
          proyecto.superficie_hasta &&
            proyecto.superficie_hasta !== proyecto.superficie_desde &&
            `${proyecto.superficie_hasta} m²`,
        ]
          .filter(Boolean)
          .join(' – ')
      : null

  const ambientesStr =
    proyecto.ambientes_min || proyecto.ambientes_max
      ? proyecto.ambientes_min === proyecto.ambientes_max
        ? `${proyecto.ambientes_min} amb.`
        : `${proyecto.ambientes_min ?? '?'} a ${proyecto.ambientes_max ?? '?'} amb.`
      : null

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center justify-between h-14">
          <Link
            href="/"
            className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
          >
            <span aria-hidden>←</span>
            Volver al mapa
          </Link>
          <span className="text-sm font-bold tracking-tight text-gray-900">
            MapaInversor<span className="text-gray-400 font-medium">.ar</span>
          </span>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {/* Título y badges */}
        <div className="mb-6">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <span
              className={`text-xs font-semibold px-3 py-1 rounded-full ${ESTADO_COLOR[proyecto.estado] ?? 'bg-gray-100 text-gray-700'}`}
            >
              {ESTADO_LABEL[proyecto.estado] ?? proyecto.estado}
            </span>
            <span className="text-xs font-medium px-3 py-1 rounded-full bg-gray-100 text-gray-600">
              {TIPO_LABEL[proyecto.tipo] ?? proyecto.tipo}
            </span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-1">{proyecto.nombre}</h1>
          <p className="text-gray-500 text-sm">
            {proyecto.direccion}, {proyecto.ciudad}, {proyecto.provincia}
          </p>
        </div>

        {/* Layout dos columnas */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Columna izquierda — detalles */}
          <div className="lg:col-span-2 space-y-6">
            {/* Precio y datos clave */}
            <section className="bg-white rounded-2xl border border-gray-100 p-6">
              <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-4">
                Datos del proyecto
              </h2>
              <dl className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-4">
                {precioStr && (
                  <div>
                    <dt className="text-xs text-gray-400 mb-0.5">Precio desde</dt>
                    <dd className="text-lg font-bold text-emerald-700">{precioStr}</dd>
                  </div>
                )}
                {ambientesStr && (
                  <div>
                    <dt className="text-xs text-gray-400 mb-0.5">Ambientes</dt>
                    <dd className="font-semibold text-gray-800">{ambientesStr}</dd>
                  </div>
                )}
                {superficieStr && (
                  <div>
                    <dt className="text-xs text-gray-400 mb-0.5">Superficie</dt>
                    <dd className="font-semibold text-gray-800">{superficieStr}</dd>
                  </div>
                )}
                <div>
                  <dt className="text-xs text-gray-400 mb-0.5">Estado</dt>
                  <dd className="font-semibold text-gray-800">
                    {ESTADO_LABEL[proyecto.estado] ?? proyecto.estado}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-gray-400 mb-0.5">Tipo</dt>
                  <dd className="font-semibold text-gray-800">
                    {TIPO_LABEL[proyecto.tipo] ?? proyecto.tipo}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-gray-400 mb-0.5">Ciudad</dt>
                  <dd className="font-semibold text-gray-800">{proyecto.ciudad}</dd>
                </div>
              </dl>
            </section>

            {/* Descripción */}
            {proyecto.descripcion && (
              <section className="bg-white rounded-2xl border border-gray-100 p-6">
                <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3">
                  Descripción
                </h2>
                <p className="text-gray-700 leading-relaxed text-sm">{proyecto.descripcion}</p>
              </section>
            )}

            {/* Amenities */}
            {amenities.length > 0 && (
              <section className="bg-white rounded-2xl border border-gray-100 p-6">
                <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-4">
                  Amenities
                </h2>
                <ul className="flex flex-wrap gap-2">
                  {amenities.map((amenity) => (
                    <li
                      key={amenity}
                      className="text-sm bg-gray-50 border border-gray-200 rounded-full px-4 py-1.5 text-gray-700"
                    >
                      {amenity}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* Desarrolladora */}
            {dev && (
              <section className="bg-white rounded-2xl border border-gray-100 p-6">
                <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-4">
                  Desarrolladora
                </h2>
                <div className="flex items-start gap-4">
                  {dev.logo_url && (
                    <img
                      src={dev.logo_url}
                      alt={dev.nombre}
                      className="w-12 h-12 rounded-xl object-contain border border-gray-100"
                    />
                  )}
                  <div>
                    <p className="font-semibold text-gray-900">{dev.nombre}</p>
                    {dev.descripcion && (
                      <p className="text-sm text-gray-500 mt-0.5">{dev.descripcion}</p>
                    )}
                    <div className="flex flex-wrap gap-3 mt-2">
                      {dev.sitio_web && (
                        <a
                          href={dev.sitio_web}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-gray-900 underline underline-offset-2 hover:text-gray-600 transition-colors"
                        >
                          Sitio web
                        </a>
                      )}
                      {dev.telefono && (
                        <a
                          href={`tel:${dev.telefono}`}
                          className="text-sm text-gray-900 underline underline-offset-2 hover:text-gray-600 transition-colors"
                        >
                          {dev.telefono}
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </section>
            )}
          </div>

          {/* Columna derecha — formulario sticky */}
          <div className="lg:col-span-1">
            <div className="sticky top-20 bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
              <h2 className="font-semibold text-gray-900 mb-1">Quiero más información</h2>
              <p className="text-sm text-gray-500 mb-5">
                Completá tus datos y te contactamos.
              </p>
              <LeadForm proyectoId={proyecto.id} />
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
