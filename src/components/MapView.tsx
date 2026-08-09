'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import Map, { Popup, NavigationControl } from 'react-map-gl/mapbox'
import mapboxgl from 'mapbox-gl'
import type { MapRef } from '@vis.gl/react-mapbox'
import 'mapbox-gl/dist/mapbox-gl.css'

import type { ProyectoMarker } from '@/types/proyecto'
import { ESTADO_COLOR_MARKER, ESTADO_LABEL, clusterColor } from '@/types/proyecto'
import { proyectosToGeoJSON } from '@/lib/mapbox'

const SOURCE_ID = 'proyectos-cluster'

interface Props {
  proyectos: ProyectoMarker[]
  showHeatmap?: boolean
}

export default function MapView({ proyectos, showHeatmap = false }: Props) {
  const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN!
  const [popup, setPopup] = useState<ProyectoMarker | null>(null)
  const mapRef = useRef<MapRef>(null)

  const addLayers = useCallback((map: mapboxgl.Map) => {
    map.addSource(SOURCE_ID, {
      type: 'geojson',
      data: proyectosToGeoJSON(proyectos),
      cluster: true,
      clusterMaxZoom: 14,
      clusterRadius: 50,
    })

    map.addLayer({
      id: 'clusters',
      type: 'circle',
      source: SOURCE_ID,
      filter: ['has', 'point_count'],
      paint: {
        'circle-color': [
          'step',
          ['get', 'point_count'],
          clusterColor(10),
          15,
          clusterColor(15),
          30,
          clusterColor(30),
          50,
          clusterColor(50),
        ],
        'circle-radius': ['step', ['get', 'point_count'], 15, 20, 25, 40, 30],
        'circle-stroke-width': 2,
        'circle-stroke-color': '#ffffff',
        'circle-stroke-opacity': 0.9,
        'circle-opacity': 0.85,
      },
    })

    map.addLayer({
      id: 'cluster-count',
      type: 'symbol',
      source: SOURCE_ID,
      filter: ['has', 'point_count'],
      layout: { 'text-field': '{point_count}', 'text-size': 12, 'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS'] },
      paint: { 'text-color': '#ffffff' },
    })

    map.addLayer({
      id: 'unclustered-points',
      type: 'circle',
      source: SOURCE_ID,
      filter: ['!', ['has', 'point_count']],
      paint: {
        'circle-radius': 6,
        'circle-color': ['get', 'marker_color'],
        'circle-stroke-color': '#ffffff',
        'circle-stroke-width': 1.5,
        'circle-stroke-opacity': 1,
        'circle-opacity': 1,
      },
    })

    map.addLayer({
      id: 'proyectos-heat',
      type: 'heatmap',
      source: SOURCE_ID,
      layout: { visibility: 'none' },
      paint: {
        'heatmap-weight': ['interpolate', ['linear'], ['get', 'point_count'], 0, 0, 10, 1],
        'heatmap-intensity': ['interpolate', ['linear'], ['zoom'], 0, 0, 9, 1],
        'heatmap-color': [
          'interpolate',
          ['linear'],
          ['heatmap-density'],
          0,
          'rgba(59,130,246,0)',
          0.2,
          '#3b82f6',
          0.5,
          '#22c55e',
          0.8,
          '#f59e0b',
        ],
        'heatmap-opacity': ['interpolate', ['linear'], ['zoom'], 10, 0, 12, 0.6, 18, 0],
        'heatmap-radius': ['interpolate', ['linear'], ['zoom'], 0, 2, 10, 5, 22, 20],
      },
    })

    map.on('click', 'unclustered-points', (e: mapboxgl.MapLayerMouseEvent) => {
      const props = e.features?.[0]?.properties
      if (!props) return
      map.panTo([Number(props.longitud), Number(props.latitud)], { animate: true })
      setPopup({
        id: props.id as string,
        nombre: props.nombre as string,
        descripcion: (props.descripcion as string | null) ?? null,
        estado: props.estado as ProyectoMarker['estado'],
        tipo: props.tipo as ProyectoMarker['tipo'],
        direccion: props.direccion as string,
        ciudad: props.ciudad as string,
        latitud: props.latitud as number,
        longitud: props.longitud as number,
        precio_desde: props.precio_desde as number | null,
        moneda: props.moneda as string,
      })
    })

    map.on('click', 'clusters', (e: mapboxgl.MapLayerMouseEvent) => {
      const clusterId = e.features?.[0]?.properties?.cluster_id
      if (!clusterId) return
      const source = map.getSource(SOURCE_ID) as mapboxgl.GeoJSONSource
      if (!source || !source.getClusterExpansionZoom) return
      source.getClusterExpansionZoom(clusterId, (err, zoom) => {
        if (err || zoom == null) return
        map.setZoom(zoom)
        map.panTo(e.lngLat)
      })
    })

    map.on('mouseenter', 'clusters', () => map.getCanvas().style.cursor = 'pointer')
    map.on('mouseleave', 'clusters', () => map.getCanvas().style.cursor = '')
    map.on('mouseenter', 'unclustered-points', () => map.getCanvas().style.cursor = 'pointer')
    map.on('mouseleave', 'unclustered-points', () => map.getCanvas().style.cursor = '')
  }, [proyectos])

  const removeLayers = useCallback((map: mapboxgl.Map) => {
    ;['clusters', 'cluster-count', 'unclustered-points'].forEach((id) => {
      if (map.getLayer(id)) map.removeLayer(id)
    })
    if (map.getSource(SOURCE_ID)) map.removeSource(SOURCE_ID)
  }, [])

  useEffect(() => {
    const map = mapRef.current?.getMap()
    if (!map) return

    const setup = () => {
      removeLayers(map)
      addLayers(map)
    }

    if (map.loaded()) setup()
    else map.once('load', setup)

    return () => {
      map.off('load', setup)
      removeLayers(map)
      map.getCanvas().style.cursor = ''
    }
  }, [addLayers, removeLayers])

  useEffect(() => {
    const map = mapRef.current?.getMap()
    if (!map) return

    const apply = () => {
      const heatVisible = showHeatmap ? 'visible' : 'none'
      const ptsVisible = showHeatmap ? 'none' : 'visible'
      ;['proyectos-heat'].forEach((id) => {
        if (map.getLayer(id)) map.setLayoutProperty(id, 'visibility', heatVisible)
      })
      ;['clusters', 'cluster-count', 'unclustered-points'].forEach((id) => {
        if (map.getLayer(id)) map.setLayoutProperty(id, 'visibility', ptsVisible)
      })
    }

    if (map.loaded()) apply()
    else map.once('load', apply)

    return () => {
      map.off('load', apply)
      ;['proyectos-heat', 'clusters', 'cluster-count', 'unclustered-points'].forEach((id) => {
        if (map.getLayer(id)) map.setLayoutProperty(id, 'visibility', 'visible')
      })
    }
  }, [showHeatmap, proyectos])

  return (
    <>
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
      </Map>

      {popup && (
        <Popup
          longitude={popup.longitud}
          latitude={popup.latitud}
          anchor="bottom"
          offset={20}
          onClose={() => setPopup(null)}
          closeOnClick={false}
          closeButton={false}
          className="rounded-xl shadow-xl"
        >
          <div className="p-3 min-w-[200px] max-w-[280px]">
            <span className={`inline-block text-xs font-semibold text-white px-2 py-0.5 rounded-full mb-2 ${ESTADO_COLOR_MARKER[popup.estado] ?? 'bg-gray-500'}`}>
              {ESTADO_LABEL[popup.estado] ?? popup.estado}
            </span>
            <h3 className="font-bold text-gray-900 text-sm leading-snug mb-1">{popup.nombre}</h3>
            <p className="text-xs text-gray-500 mb-2">{popup.direccion}, {popup.ciudad}</p>
            {popup.precio_desde && (
              <p className="text-sm font-semibold text-emerald-700">
                Desde {popup.moneda} {Number(popup.precio_desde).toLocaleString('es-AR')}
              </p>
            )}
          </div>
        </Popup>
      )}
    </>
  )
}
