'use client'

import { useEffect, useRef, useState } from 'react'
import Map, { Marker } from 'react-map-gl/mapbox'
import type { MapRef } from '@vis.gl/react-mapbox'
import 'mapbox-gl/dist/mapbox-gl.css'

interface Props {
  latitud: number
  longitud: number
  onChange: (lat: number, lng: number) => void
}

export default function MapCoordenadas({ latitud, longitud, onChange }: Props) {
  const mapRef = useRef<MapRef>(null)
  const [view, setView] = useState({
    longitude: longitud,
    latitude: latitud,
    zoom: 12,
  })

  useEffect(() => {
    setView((v) => ({ ...v, longitude: longitud, latitude: latitud }))
  }, [latitud, longitud])

  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN

  if (!token) {
    return (
      <p className="text-xs text-gray-400">
        Configurá NEXT_PUBLIC_MAPBOX_TOKEN para elegir la ubicación en el mapa.
      </p>
    )
  }

  return (
    <div className="h-64 rounded-xl overflow-hidden border border-gray-200">
      <Map
        ref={mapRef}
        mapboxAccessToken={token}
        initialViewState={view}
        mapStyle="mapbox://styles/mapbox/light-v11"
        onClick={(e) => {
          onChange(e.lngLat.lat, e.lngLat.lng)
        }}
        style={{ width: '100%', height: '100%' }}
      >
        <Marker longitude={longitud} latitude={latitud} color="#185FA5" />
      </Map>
    </div>
  )
}
