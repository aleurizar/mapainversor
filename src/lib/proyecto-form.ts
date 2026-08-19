import type { EstadoProyecto, TipoProyecto } from '@/types/proyecto'

export interface ProyectoFormData {
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
}

export interface FormErrors {
  [key: string]: string
}

const ESTADO_VALUES = ['en_pozo', 'en_construccion', 'terminado', 'entregado']
const TIPO_VALUES = ['residencial', 'comercial', 'mixto', 'oficinas']

function toNum(v: FormDataEntryValue | null): number | null {
  if (v == null) return null
  const s = String(v).trim()
  if (!s) return null
  const n = Number(s)
  return Number.isFinite(n) ? n : null
}

function splitList(v: FormDataEntryValue | null): string[] {
  if (v == null) return []
  return String(v)
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
}

export function parseProyectoForm(formData: FormData): {
  data: ProyectoFormData | null
  errors: FormErrors
} {
  const errors: FormErrors = {}

  const nombre = String(formData.get('nombre') ?? '').trim()
  if (!nombre) errors.nombre = 'El nombre es obligatorio'

  const direccion = String(formData.get('direccion') ?? '').trim()
  if (!direccion) errors.direccion = 'La dirección es obligatoria'

  const ciudad = String(formData.get('ciudad') ?? 'Buenos Aires').trim()
  const provincia = String(formData.get('provincia') ?? 'Buenos Aires').trim()

  const estado = String(formData.get('estado') ?? '')
  if (!ESTADO_VALUES.includes(estado)) {
    errors.estado = 'Estado inválido'
  }

  const tipo = String(formData.get('tipo') ?? '')
  if (!TIPO_VALUES.includes(tipo)) {
    errors.tipo = 'Tipo inválido'
  }

  const latitud = toNum(formData.get('latitud'))
  const longitud = toNum(formData.get('longitud'))
  if (latitud == null || longitud == null || latitud < -90 || latitud > 90 || longitud < -180 || longitud > 180) {
    errors.latitud = 'Coordenadas inválidas (marcá el punto en el mapa)'
  }

  const precio_desde = toNum(formData.get('precio_desde'))
  const moneda = String(formData.get('moneda') ?? 'USD').trim() || 'USD'

  if (Object.keys(errors).length > 0) {
    return { data: null, errors }
  }

  const imagen_url = String(formData.get('imagen_url') ?? '').trim() || null
  const imagenes = splitList(formData.get('imagenes'))

  return {
    data: {
      nombre,
      descripcion: String(formData.get('descripcion') ?? '').trim() || null,
      estado: estado as EstadoProyecto,
      tipo: tipo as TipoProyecto,
      direccion,
      ciudad,
      provincia,
      latitud: latitud as number,
      longitud: longitud as number,
      precio_desde,
      moneda,
      superficie_desde: toNum(formData.get('superficie_desde')),
      superficie_hasta: toNum(formData.get('superficie_hasta')),
      ambientes_min: toNum(formData.get('ambientes_min')),
      ambientes_max: toNum(formData.get('ambientes_max')),
      imagen_url,
      imagenes,
      amenities: splitList(formData.get('amenities')),
    },
    errors: {},
  }
}
