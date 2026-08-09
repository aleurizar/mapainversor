import type { ProyectoMarker } from '@/types/proyecto'
import { ESTADO_HEX } from '@/types/proyecto'

export function proyectosToGeoJSON(proyectos: ProyectoMarker[]) {
  return {
    type: 'FeatureCollection' as const,
    features: proyectos.map((p) => ({
      type: 'Feature' as const,
      geometry: { type: 'Point' as const, coordinates: [p.longitud, p.latitud] },
      properties: {
        id: p.id,
        nombre: p.nombre,
        descripcion: p.descripcion,
        estado: p.estado,
        tipo: p.tipo,
        direccion: p.direccion,
        ciudad: p.ciudad,
        latitud: p.latitud,
        longitud: p.longitud,
        precio_desde: p.precio_desde,
        moneda: p.moneda,
        marker_color: ESTADO_HEX[p.estado] ?? '#6b7280',
      },
    })),
  }
}
