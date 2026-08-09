import { createClient } from '@/lib/supabase'
import MapView, { type Proyecto } from '@/components/MapView'

export const metadata = {
  title: 'MapaInversor.ar — Desarrollos inmobiliarios en Argentina',
  description: 'Encontrá proyectos inmobiliarios en todo el país en el mapa.',
}

export default async function HomePage() {
  const supabase = createClient()

  const { data: proyectos } = await supabase
    .from('proyectos')
    .select('id, nombre, descripcion, estado, tipo, direccion, ciudad, latitud, longitud, precio_desde, moneda')
    .eq('activo', true)
    .returns<Proyecto[]>()

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-3 bg-white border-b border-gray-100 shadow-sm z-10">
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold tracking-tight text-gray-900">MapaInversor</span>
          <span className="text-xs text-gray-400 font-medium">.ar</span>
        </div>
        <nav className="flex items-center gap-4">
          <a href="/" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
            Mapa
          </a>
          <a
            href="/dashboard"
            className="text-sm font-medium bg-gray-900 text-white px-4 py-1.5 rounded-full hover:bg-gray-700 transition-colors"
          >
            Para desarrolladoras
          </a>
        </nav>
      </header>

      {/* Leyenda + Mapa */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="hidden md:flex flex-col w-72 bg-white border-r border-gray-100 p-4 gap-4 overflow-y-auto z-10">
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3">Estado del proyecto</h2>
            <ul className="space-y-2 text-sm">
              {[
                { color: 'bg-amber-500', label: 'En pozo' },
                { color: 'bg-blue-500',  label: 'En construcción' },
                { color: 'bg-green-500', label: 'Terminado' },
                { color: 'bg-gray-400',  label: 'Entregado' },
              ].map(({ color, label }) => (
                <li key={label} className="flex items-center gap-2">
                  <span className={`w-3 h-3 rounded-full ${color}`} />
                  <span className="text-gray-600">{label}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="border-t border-gray-100 pt-4">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3">
              Proyectos ({proyectos?.length ?? 0})
            </h2>
            <ul className="space-y-2">
              {(proyectos ?? []).map((p) => (
                <li key={p.id}>
                  <a
                    href={`/proyectos/${p.id}`}
                    className="block rounded-lg px-3 py-2 text-sm hover:bg-gray-50 transition-colors"
                  >
                    <p className="font-medium text-gray-800 leading-snug">{p.nombre}</p>
                    <p className="text-xs text-gray-400">{p.ciudad}</p>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </aside>

        {/* Mapa */}
        <main className="flex-1 relative">
          <MapView proyectos={proyectos ?? []} />
        </main>
      </div>
    </div>
  )
}
