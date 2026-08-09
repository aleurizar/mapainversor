'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import Link from 'next/link'
import Map, { Marker, Popup, NavigationControl } from 'react-map-gl/mapbox'
import type { MapRef } from '@vis.gl/react-mapbox'
import 'mapbox-gl/dist/mapbox-gl.css'

export interface Proyecto {
  id: string
  nombre: string
  descripcion: string | null
  estado: string
  tipo: string
  direccion: string
  ciudad: string
  latitud: number
  longitud: number
  precio_desde: number | null
  moneda: string
}

const ESTADO_COLOR: Record<string, string> = {
  en_pozo:        'bg-amber-500',
  en_construccion: 'bg-blue-500',
  terminado:      'bg-green-500',
  entregado:      'bg-gray-400',
}

const ESTADO_LABEL: Record<string, string> = {
  en_pozo:        'En pozo',
  en_construccion: 'En construcción',
  terminado:      'Terminado',
  entregado:      'Entregado',
}

interface Props {
  proyectos: Proyecto[]
}

export default function MapView({ proyectos }: Props) {
  const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN!
  const [popup, setPopup] = useState<Proyecto | null>(null)
  const mapRef = useRef<MapRef>(null)

  useEffect(() => {
    const raf = requestAnimationFrame(() => {
      mapRef.current?.getMap().resize()
    })
    return () => cancelAnimationFrame(raf)
  }, [])

  const handleMarkerClick = useCallback((p: Proyecto) => {
    setPopup(p)
  }, [])

  return (
    <Map
      ref={mapRef}
      mapboxAccessToken={mapboxToken}
      initialViewState={{
        longitude: -58.3816,
        latitude: -34.6037,
        zoom: 11,
      }}
      style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
      mapStyle="mapbox://styles/mapbox/light-v11"
    >
      <NavigationControl position="top-right" />

      {proyectos.map((p) => (
        <Marker
          key={p.id}
          longitude={p.longitud}
          latitude={p.latitud}
          anchor="bottom"
          onClick={() => handleMarkerClick(p)}
        >
          <div
            className={`w-4 h-4 rounded-full border-2 border-white shadow-md cursor-pointer transition-transform hover:scale-125 ${ESTADO_COLOR[p.estado] ?? 'bg-gray-500'}`}
            title={p.nombre}
          />
        </Marker>
      ))}

      {popup && (
        <Popup
          longitude={popup.longitud}
          latitude={popup.latitud}
          anchor="bottom"
          offset={20}
          onClose={() => setPopup(null)}
          closeOnClick={false}
          className="rounded-xl shadow-xl"
        >
          <div className="p-3 min-w-[200px] max-w-[280px]">
            <span className={`inline-block text-xs font-semibold text-white px-2 py-0.5 rounded-full mb-2 ${ESTADO_COLOR[popup.estado]}`}>
              {ESTADO_LABEL[popup.estado] ?? popup.estado}
            </span>
            <h3 className="font-bold text-gray-900 text-sm leading-snug mb-1">{popup.nombre}</h3>
            <p className="text-xs text-gray-500 mb-2">{popup.direccion}, {popup.ciudad}</p>
            {popup.precio_desde && (
              <p className="text-sm font-semibold text-emerald-700">
                Desde {popup.moneda} {popup.precio_desde.toLocaleString('es-AR')}
              </p>
            )}
            <Link
              href={`/proyectos/${popup.id}`}
              className="mt-3 block text-center text-xs font-medium bg-gray-900 text-white rounded-lg py-1.5 hover:bg-gray-700 transition-colors"
            >
              Ver proyecto
            </Link>
          </div>
        </Popup>
      )}
    </Map>
  )
}
