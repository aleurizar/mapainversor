import { createClient } from '@/lib/supabase'
import Link from 'next/link'
import ProyectoFiltros from '@/components/ProyectoFiltros'
import type { ProyectoMarker } from '@/types/proyecto'

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
    .returns<ProyectoMarker[]>()

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-3 bg-white border-b border-gray-100 shadow-sm z-10">
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold tracking-tight text-gray-900">MapaInversor</span>
          <span className="text-xs text-gray-400 font-medium">.ar</span>
        </div>
        <nav className="flex items-center gap-4">
          <Link href="/" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
            Mapa
          </Link>
          <Link
            href="/dashboard"
            className="text-sm font-medium bg-gray-900 text-white px-4 py-1.5 rounded-full hover:bg-gray-700 transition-colors"
          >
            Para desarrolladoras
          </Link>
        </nav>
      </header>

      {/* Mapa + filtros */}
      <ProyectoFiltros proyectos={proyectos ?? []} />
    </div>
  )
}
