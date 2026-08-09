export type EstadoProyecto =
  | 'en_pozo'
  | 'en_construccion'
  | 'terminado'
  | 'entregado'

export type TipoProyecto =
  | 'residencial'
  | 'comercial'
  | 'mixto'
  | 'oficinas'

export interface Proyecto {
  id: string
  nombre: string
  descripcion: string | null
  estado: EstadoProyecto
  tipo: TipoProyecto
  direccion: string
  ciudad: string
  provincia: string
  latitud: number
  longitud: number
  precio_desde: number | null
  moneda: string
  superficie_desde: number | null
  superficie_hasta: number | null
  ambientes_min: number | null
  ambientes_max: number | null
  imagen_url: string | null
  imagenes: string[]
  amenities: string[]
  activo: boolean
  created_at: string
  updated_at: string
  desarrolladora_id: string
}

export interface ProyectoMarker {
  id: string
  nombre: string
  descripcion: string | null
  estado: EstadoProyecto
  tipo: TipoProyecto
  direccion: string
  ciudad: string
  latitud: number
  longitud: number
  precio_desde: number | null
  moneda: string
}

export interface Desarrolladora {
  id: string
  nombre: string
  email: string
  logo_url: string | null
  sitio_web: string | null
  telefono: string | null
  descripcion: string | null
  user_id: string | null
  created_at: string
}

export interface Lead {
  id: string
  proyecto_id: string | null
  nombre: string
  email: string
  telefono: string | null
  mensaje: string | null
  estado: 'nuevo' | 'contactado' | 'calificado' | 'descartado'
  created_at: string
}

export const ESTADOS: { value: EstadoProyecto; label: string }[] = [
  { value: 'en_pozo', label: 'En pozo' },
  { value: 'en_construccion', label: 'En construcción' },
  { value: 'terminado', label: 'Terminado' },
  { value: 'entregado', label: 'Entregado' },
]

export const TIPOS: { value: TipoProyecto; label: string }[] = [
  { value: 'residencial', label: 'Residencial' },
  { value: 'comercial', label: 'Comercial' },
  { value: 'mixto', label: 'Mixto' },
  { value: 'oficinas', label: 'Oficinas' },
]

export const ESTADO_COLOR_MARKER: Record<string, string> = {
  en_pozo: 'bg-amber-500',
  en_construccion: 'bg-blue-500',
  terminado: 'bg-green-500',
  entregado: 'bg-gray-400',
}

export const ESTADO_HEX: Record<string, string> = {
  en_pozo: '#f59e0b',
  en_construccion: '#3b82f6',
  terminado: '#22c55e',
  entregado: '#9ca3af',
}

export const CLUSTER_COLORS = ['#51bbd3', '#92a8d1', '#ecb32e', '#f0ad4e', '#e47949']

export function clusterColor(count: number): string {
  if (count < 20) return CLUSTER_COLORS[0]
  if (count < 50) return CLUSTER_COLORS[1]
  if (count < 100) return CLUSTER_COLORS[2]
  if (count < 300) return CLUSTER_COLORS[3]
  return CLUSTER_COLORS[4]
}

export const ESTADO_COLOR_BADGE: Record<string, string> = {
  en_pozo: 'bg-amber-100 text-amber-700',
  en_construccion: 'bg-blue-100 text-blue-700',
  terminado: 'bg-green-100 text-green-700',
  entregado: 'bg-gray-100 text-gray-600',
}

export const ESTADO_LABEL: Record<string, string> = {
  en_pozo: 'En pozo',
  en_construccion: 'En construcción',
  terminado: 'Terminado',
  entregado: 'Entregado',
}

export const TIPO_LABEL: Record<string, string> = {
  residencial: 'Residencial',
  comercial: 'Comercial',
  mixto: 'Mixto',
  oficinas: 'Oficinas',
}

export const LEAD_ESTADO_COLOR: Record<string, string> = {
  nuevo: 'bg-blue-100 text-blue-700',
  contactado: 'bg-amber-100 text-amber-700',
  calificado: 'bg-green-100 text-green-700',
  descartado: 'bg-gray-100 text-gray-500',
}

export const LEAD_ESTADO_LABEL: Record<string, string> = {
  nuevo: 'Nuevo',
  contactado: 'Contactado',
  calificado: 'Calificado',
  descartado: 'Descartado',
}
