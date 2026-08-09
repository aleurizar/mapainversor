'use client'

import { useState, useMemo, useCallback } from 'react'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import MapView from '@/components/MapView'
import type { ProyectoMarker, EstadoProyecto, TipoProyecto } from '@/types/proyecto'
import { ESTADOS, TIPOS, ESTADO_COLOR_MARKER } from '@/types/proyecto'

interface Props {
  proyectos: ProyectoMarker[]
}

const ALL_ESTADOS: EstadoProyecto[] = ESTADOS.map((e) => e.value)
const ALL_TIPOS: TipoProyecto[] = TIPOS.map((t) => t.value)

function parseSet(q: string | null): Set<string> {
  return q ? new Set(q.split(',').filter(Boolean)) : new Set()
}

function setToQuery(s: Set<string>): string {
  return [...s].join(',')
}

export default function ProyectoFiltros({ proyectos }: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const [estados, setEstados] = useState<Set<EstadoProyecto>>(() => {
    const q = parseSet(searchParams?.get('estados') ?? null)
    return q.size ? new Set([...q] as EstadoProyecto[]) : new Set(ALL_ESTADOS)
  })
  const [tipos, setTipos] = useState<Set<TipoProyecto>>(() => {
    const q = parseSet(searchParams?.get('tipos') ?? null)
    return q.size ? new Set([...q] as TipoProyecto[]) : new Set(ALL_TIPOS)
  })

  const syncUrl = useCallback(
    (e: Set<EstadoProyecto>, t: Set<TipoProyecto>) => {
      const params = new URLSearchParams()
      const eStr = setToQuery(e)
      const tStr = setToQuery(t)
      if (eStr) params.set('estados', eStr)
      if (tStr) params.set('tipos', tStr)
      const query = params.toString()
      router.push(`${pathname}${query ? `?${query}` : ''}`, { scroll: false })
    },
    [router, pathname],
  )

  const toggleEstado = useCallback(
    (e: EstadoProyecto) => {
      const next = new Set(estados)
      if (next.has(e)) next.delete(e)
      else next.add(e)
      setEstados(next)
      syncUrl(next, tipos)
    },
    [estados, tipos, syncUrl],
  )

  const toggleTipo = useCallback(
    (t: TipoProyecto) => {
      const next = new Set(tipos)
      if (next.has(t)) next.delete(t)
      else next.add(t)
      setTipos(next)
      syncUrl(estados, next)
    },
    [estados, tipos, syncUrl],
  )

  const toggleAllEstados = useCallback(() => {
    const next = estados.size === ALL_ESTADOS.length ? new Set<EstadoProyecto>() : new Set(ALL_ESTADOS)
    setEstados(next)
    syncUrl(next, tipos)
  }, [estados, tipos, syncUrl])

  const toggleAllTipos = useCallback(() => {
    const next = tipos.size === ALL_TIPOS.length ? new Set<TipoProyecto>() : new Set(ALL_TIPOS)
    setTipos(next)
    syncUrl(estados, next)
  }, [estados, tipos, syncUrl])

  const proyectosFiltrados = useMemo(
    () =>
      proyectos.filter(
        (p) => estados.has(p.estado) && tipos.has(p.tipo),
      ),
    [proyectos, estados, tipos],
  )

  const estadosChecked = ALL_ESTADOS.every((e) => estados.has(e))
  const estadosIndeterminate = !estadosChecked && estados.size > 0

  return (
    <div className="flex flex-1 overflow-hidden">
      <aside className="hidden md:flex flex-col w-72 bg-white border-r border-gray-100 p-4 gap-4 overflow-y-auto z-10">
        {/* Estado */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-400">
              Estado del proyecto
            </h2>
            <button
              type="button"
              onClick={toggleAllEstados}
              className="text-xs font-medium text-gray-600 hover:text-gray-900 underline underline-offset-2"
            >
              {estadosChecked ? 'Deseleccionar' : 'Seleccionar todos'}
            </button>
          </div>
          <ul className="space-y-2 text-sm">
            {ESTADOS.map((e) => {
              const checked = estados.has(e.value)
              return (
                <li key={e.value} className="flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleEstado(e.value)}
                      className="w-4 h-4 rounded border-gray-300 text-gray-900 focus:ring-gray-900"
                    />
                    <span
                      className={`w-3 h-3 rounded-full ${ESTADO_COLOR_MARKER[e.value] ?? 'bg-gray-500'}`}
                    />
                    <span className="text-gray-600">{e.label}</span>
                  </label>
                  <span className="text-xs text-gray-400">
                    {proyectos.filter((p) => p.estado === e.value).length}
                  </span>
                </li>
              )
            })}
          </ul>
          {estadosIndeterminate && (
            <p className="mt-2 text-xs text-gray-400">
              {proyectosFiltrados.length} proyectos visibles
            </p>
          )}
        </div>

        {/* Tipo */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-400">
              Tipo de proyecto
            </h2>
            <button
              type="button"
              onClick={toggleAllTipos}
              className="text-xs font-medium text-gray-600 hover:text-gray-900 underline underline-offset-2"
            >
              {tipos.size === ALL_TIPOS.length ? 'Deseleccionar' : 'Seleccionar todos'}
            </button>
          </div>
          <ul className="space-y-1.5 text-sm">
            {TIPOS.map((t) => {
              const checked = tipos.has(t.value)
              return (
                <li key={t.value}>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleTipo(t.value)}
                      className="w-4 h-4 rounded border-gray-300 text-gray-900 focus:ring-gray-900"
                    />
                    <span className="text-gray-600">{t.label}</span>
                  </label>
                </li>
              )
            })}
          </ul>
        </div>

        {/* Lista de proyectos */}
        <div className="border-t border-gray-100 pt-4">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3">
            Proyectos ({proyectosFiltrados.length})
          </h2>
          <ul className="space-y-2">
            {proyectosFiltrados.map((p) => (
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
          {proyectosFiltrados.length === 0 && (
            <p className="text-xs text-gray-400">No hay proyectos con estos filtros.</p>
          )}
        </div>
      </aside>

      <main className="flex-1 relative">
        <MapView proyectos={proyectosFiltrados} />
      </main>
    </div>
  )
}
