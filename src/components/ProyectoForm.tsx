'use client'

import { useState } from 'react'
import MapCoordenadas from '@/components/MapCoordenadas'
import { ESTADOS, TIPOS } from '@/types/proyecto'
import type { EstadoProyecto, TipoProyecto } from '@/types/proyecto'

export interface ProyectoFormValues {
  nombre: string
  descripcion: string
  estado: EstadoProyecto
  tipo: TipoProyecto
  direccion: string
  ciudad: string
  provincia: string
  latitud: number
  longitud: number
  precio_desde: string
  moneda: string
  superficie_desde: string
  superficie_hasta: string
  ambientes_min: string
  ambientes_max: string
  imagen_url: string
  imagenes: string
  amenities: string
}

interface Props {
  action: (formData: FormData) => void | Promise<void>
  initial?: Partial<ProyectoFormValues>
  pendingLabel?: string
}

const EMPTY: ProyectoFormValues = {
  nombre: '',
  descripcion: '',
  estado: 'en_pozo',
  tipo: 'residencial',
  direccion: '',
  ciudad: 'Buenos Aires',
  provincia: 'Buenos Aires',
  latitud: -34.6,
  longitud: -58.38,
  precio_desde: '',
  moneda: 'USD',
  superficie_desde: '',
  superficie_hasta: '',
  ambientes_min: '',
  ambientes_max: '',
  imagen_url: '',
  imagenes: '',
  amenities: '',
}

const inputCls =
  'w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900 transition-colors'
const labelCls = 'block text-sm font-medium text-gray-700 mb-1'

export default function ProyectoForm({ action, initial = {}, pendingLabel = 'Guardar' }: Props) {
  const [values, setValues] = useState<ProyectoFormValues>({
    ...EMPTY,
    ...initial,
  })
  const [pending, setPending] = useState(false)

  function set<K extends keyof ProyectoFormValues>(key: K, value: ProyectoFormValues[K]) {
    setValues((prev) => ({ ...prev, [key]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setPending(true)
    const formData = new FormData(e.currentTarget as HTMLFormElement)
    formData.set('latitud', String(values.latitud))
    formData.set('longitud', String(values.longitud))
    await action(formData)
    setPending(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label htmlFor="nombre" className={labelCls}>Nombre del desarrollo *</label>
        <input id="nombre" name="nombre" required value={values.nombre} onChange={(e) => set('nombre', e.target.value)} className={inputCls} placeholder="Ej: Torres del Plata Norte" />
      </div>

      <div>
        <label htmlFor="descripcion" className={labelCls}>Descripción</label>
        <textarea id="descripcion" name="descripcion" rows={4} value={values.descripcion} onChange={(e) => set('descripcion', e.target.value)} className={`${inputCls} resize-none`} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="estado" className={labelCls}>Estado de obra</label>
          <select id="estado" name="estado" value={values.estado} onChange={(e) => set('estado', e.target.value as EstadoProyecto)} className={inputCls}>
            {ESTADOS.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="tipo" className={labelCls}>Tipo</label>
          <select id="tipo" name="tipo" value={values.tipo} onChange={(e) => set('tipo', e.target.value as TipoProyecto)} className={inputCls}>
            {TIPOS.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label htmlFor="direccion" className={labelCls}>Dirección *</label>
        <input id="direccion" name="direccion" required value={values.direccion} onChange={(e) => set('direccion', e.target.value)} className={inputCls} placeholder="Av. Siempre Viva 742" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="ciudad" className={labelCls}>Ciudad</label>
          <input id="ciudad" name="ciudad" value={values.ciudad} onChange={(e) => set('ciudad', e.target.value)} className={inputCls} />
        </div>
        <div>
          <label htmlFor="provincia" className={labelCls}>Provincia</label>
          <input id="provincia" name="provincia" value={values.provincia} onChange={(e) => set('provincia', e.target.value)} className={inputCls} />
        </div>
      </div>

      <div>
        <label className={labelCls}>Ubicación en el mapa *</label>
        <MapCoordenadas
          latitud={values.latitud}
          longitud={values.longitud}
          onChange={(lat, lng) => {
            set('latitud', lat)
            set('longitud', lng)
          }}
        />
        <p className="text-xs text-gray-400 mt-1">
          {values.latitud.toFixed(5)}, {values.longitud.toFixed(5)} — hacé clic en el mapa para ajustar.
        </p>
        <input type="hidden" name="latitud" value={values.latitud} />
        <input type="hidden" name="longitud" value={values.longitud} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label htmlFor="precio_desde" className={labelCls}>Precio desde</label>
          <input id="precio_desde" name="precio_desde" type="number" value={values.precio_desde} onChange={(e) => set('precio_desde', e.target.value)} className={inputCls} />
        </div>
        <div>
          <label htmlFor="moneda" className={labelCls}>Moneda</label>
          <input id="moneda" name="moneda" value={values.moneda} onChange={(e) => set('moneda', e.target.value)} className={inputCls} />
        </div>
        <div className="flex items-end pb-1">
          <span className="text-xs text-gray-400">Dejá vacío si no hay precio</span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="superficie_desde" className={labelCls}>Superficie desde (m²)</label>
          <input id="superficie_desde" name="superficie_desde" type="number" value={values.superficie_desde} onChange={(e) => set('superficie_desde', e.target.value)} className={inputCls} />
        </div>
        <div>
          <label htmlFor="superficie_hasta" className={labelCls}>Superficie hasta (m²)</label>
          <input id="superficie_hasta" name="superficie_hasta" type="number" value={values.superficie_hasta} onChange={(e) => set('superficie_hasta', e.target.value)} className={inputCls} />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="ambientes_min" className={labelCls}>Ambientes mín</label>
          <input id="ambientes_min" name="ambientes_min" type="number" value={values.ambientes_min} onChange={(e) => set('ambientes_min', e.target.value)} className={inputCls} />
        </div>
        <div>
          <label htmlFor="ambientes_max" className={labelCls}>Ambientes máx</label>
          <input id="ambientes_max" name="ambientes_max" type="number" value={values.ambientes_max} onChange={(e) => set('ambientes_max', e.target.value)} className={inputCls} />
        </div>
      </div>

      <div>
        <label htmlFor="amenities" className={labelCls}>Amenities (separados por coma)</label>
        <input id="amenities" name="amenities" value={values.amenities} onChange={(e) => set('amenities', e.target.value)} className={inputCls} placeholder="Pileta, Gimnasio, Cochera" />
      </div>

      <div>
        <label htmlFor="imagen_url" className={labelCls}>URL de imagen principal</label>
        <input id="imagen_url" name="imagen_url" type="url" value={values.imagen_url} onChange={(e) => set('imagen_url', e.target.value)} className={inputCls} />
      </div>

      <div>
        <label htmlFor="imagenes" className={labelCls}>URLs de imágenes (separadas por coma)</label>
        <input id="imagenes" name="imagenes" value={values.imagenes} onChange={(e) => set('imagenes', e.target.value)} className={inputCls} />
      </div>

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-xl bg-gray-900 px-4 py-3 text-sm font-semibold text-white hover:bg-gray-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
      >
        {pending ? 'Guardando…' : pendingLabel}
      </button>
    </form>
  )
}
