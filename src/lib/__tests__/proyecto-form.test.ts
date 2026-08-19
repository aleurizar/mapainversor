import { describe, it, expect } from 'vitest'
import { parseProyectoForm } from '@/lib/proyecto-form'

function fd(obj: Record<string, string | null>) {
  const f = new FormData()
  for (const [k, v] of Object.entries(obj)) {
    if (v != null) f.set(k, v)
  }
  return f
}

const valid = {
  nombre: 'Torre Sol',
  descripcion: 'Desc',
  estado: 'en_construccion',
  tipo: 'residencial',
  direccion: 'Av. Siempre Viva 742',
  ciudad: 'CABA',
  provincia: 'Buenos Aires',
  latitud: '-34.6',
  longitud: '-58.38',
  precio_desde: '95000',
  moneda: 'USD',
  superficie_desde: '45',
  superficie_hasta: '80',
  ambientes_min: '2',
  ambientes_max: '4',
  imagen_url: 'https://img.example.com/a.jpg',
  imagenes: 'https://img.example.com/a.jpg, https://img.example.com/b.jpg',
  amenities: 'Pileta, Gimnasio',
}

describe('parseProyectoForm', () => {
  it('parsea un form válido', () => {
    const { data, errors } = parseProyectoForm(fd(valid))
    expect(errors).toEqual({})
    expect(data).toMatchObject({
      nombre: 'Torre Sol',
      latitud: -34.6,
      longitud: -58.38,
      precio_desde: 95000,
      moneda: 'USD',
      imagenes: ['https://img.example.com/a.jpg', 'https://img.example.com/b.jpg'],
      amenities: ['Pileta', 'Gimnasio'],
    })
  })

  it('rechaza sin nombre ni coordenadas', () => {
    const { data, errors } = parseProyectoForm(fd({ ...valid, nombre: '  ', latitud: '', longitud: '' }))
    expect(data).toBeNull()
    expect(errors.nombre).toBeDefined()
    expect(errors.latitud).toBeDefined()
  })

  it('rechaza estado inválido', () => {
    const { data, errors } = parseProyectoForm(fd({ ...valid, estado: 'fantasma' }))
    expect(data).toBeNull()
    expect(errors.estado).toBe('Estado inválido')
  })

  it('permite números vacíos como null', () => {
    const { data, errors } = parseProyectoForm(fd({ ...valid, precio_desde: '', superficie_desde: '' }))
    expect(errors).toEqual({})
    expect(data!.precio_desde).toBeNull()
    expect(data!.superficie_desde).toBeNull()
  })
})
