import { describe, it, expect } from 'vitest'
import { proyectosToGeoJSON } from '@/components/MapView'
import type { ProyectoMarker } from '@/types/proyecto'

const sample: ProyectoMarker[] = [
  {
    id: '1',
    nombre: 'Proyecto A',
    descripcion: 'desc',
    estado: 'en_construccion',
    tipo: 'residencial',
    direccion: 'Calle Falsa 123',
    ciudad: 'Buenos Aires',
    latitud: -34.6,
    longitud: -58.38,
    precio_desde: 95000,
    moneda: 'USD',
  },
  {
    id: '2',
    nombre: 'Proyecto B',
    descripcion: null,
    estado: 'terminado',
    tipo: 'oficinas',
    direccion: 'Av. Siempre Viva 742',
    ciudad: 'Córdoba',
    latitud: -31.42,
    longitud: -62.08,
    precio_desde: null,
    moneda: 'USD',
  },
]

describe('proyectosToGeoJSON', () => {
  it('genera una FeatureCollection válida', () => {
    const geo = proyectosToGeoJSON(sample)
    expect(geo.type).toBe('FeatureCollection')
    expect(geo.features).toHaveLength(2)
  })

  it('usa coordenadas [longitud, latitud] en la geometría', () => {
    const geo = proyectosToGeoJSON(sample)
    const [feat] = geo.features
    expect(feat.geometry.type).toBe('Point')
    expect(feat.geometry.coordinates).toEqual([-58.38, -34.6])
  })

  it('incluye las propiedades del proyecto y color del estado', () => {
    const geo = proyectosToGeoJSON(sample)
    const props = geo.features[0].properties
    expect(props!.id).toBe('1')
    expect(props!.nombre).toBe('Proyecto A')
    expect(props!.estado).toBe('en_construccion')
    expect(props!.marker_color).toBe('#3b82f6')
  })

  it('mapea null precio_desde sin error', () => {
    const geo = proyectosToGeoJSON(sample)
    expect(geo.features[1].properties!.precio_desde).toBeNull()
  })
})
