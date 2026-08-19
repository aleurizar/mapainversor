# Admin + Carga de Desarrollos con Revisión — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Agregar rol admin, auto-registro de desarrolladores y carga de desarrollos que quedan en estado de revisión hasta aprobación del admin.

**Architecture:** Migración SQL (tabla `admins`, columna `estado_revision`, RLS, trigger) + Server Actions de Next.js para crear/editar/aprobar/rechazar. La visibilidad pública se restringe por RLS a `activo = true AND estado_revision = 'aprobado'`. Un trigger de base de datos fuerza que solo el admin pueda cambiar `estado_revision`.

**Tech Stack:** Next.js 16.2.6 (App Router, Server Actions), React 19, Supabase (Postgres + Auth + RLS), react-map-gl / Mapbox, Vitest, Playwright.

---

## Archivos

**Nuevos**
- `supabase/migrations/004_admin_y_revision.sql`
- `src/lib/auth.ts`
- `src/lib/proyecto-form.ts`
- `src/components/RegistroForm.tsx`
- `src/app/registro/page.tsx`
- `src/components/MapCoordenadas.tsx`
- `src/components/ProyectoForm.tsx`
- `src/app/dashboard/proyectos/actions.ts`
- `src/app/dashboard/proyectos/nuevo/page.tsx`
- `src/app/dashboard/proyectos/[id]/editar/page.tsx`
- `src/app/admin/layout.tsx`
- `src/app/admin/page.tsx`
- `src/app/admin/actions.ts`
- `src/app/admin/proyectos/nuevo/page.tsx`
- `src/app/admin/proyectos/[id]/editar/page.tsx`
- `e2e/registro.spec.ts`
- `e2e/admin.spec.ts`

**Modificados**
- `.gitignore`
- `src/types/proyecto.ts`
- `src/app/page.tsx`
- `src/app/proyectos/[id]/page.tsx`
- `src/app/dashboard/page.tsx`
- `src/app/dashboard/layout.tsx`
- `src/app/login/page.tsx`

---

### Task 1: Preparación — branch + .gitignore

**Files:**
- Modify: `.gitignore`

- [ ] **Step 1: Crear branch de trabajo**

```bash
git checkout -b feat/admin-y-carga-proyectos
```

- [ ] **Step 2: Restaurar .gitignore sano** (hoy fue reducido a `node_modules` + `.vercel`; evita commitear `.env.local`, `.next`, artefactos de test)

Escribir en `.gitignore`:

```gitignore
# dependencies
node_modules

# next.js
.next/
out/
next-env.d.ts
*.tsbuildinfo

# env files
.env*
!.env.example

# vercel
.vercel

# testing artifacts
test-results/
playwright-report/
coverage

# misc
.DS_Store
```

- [ ] **Step 3: Commit**

```bash
git add .gitignore
git commit -m "chore: restore sane .gitignore"
```

---

### Task 2: Migración SQL 004

**Files:**
- Create: `supabase/migrations/004_admin_y_revision.sql`

- [ ] **Step 1: Escribir la migración**

```sql
-- =============================================
-- ADMIN (tabla separada de desarrolladoras)
-- =============================================
create table admins (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table admins enable row level security;

create policy "admins_read_self" on admins for select
  using (user_id = auth.uid());

create policy "admins_admin_all" on admins for all
  using (exists (select 1 from admins a where a.user_id = auth.uid()))
  with check (exists (select 1 from admins a where a.user_id = auth.uid()));

-- =============================================
-- ESTADO DE REVISION EN PROYECTOS
-- =============================================
alter table proyectos add column if not exists estado_revision text not null default 'pendiente'
  check (estado_revision in ('pendiente', 'aprobado', 'rechazado'));
alter table proyectos add column if not exists motivo_rechazo text;

-- Los desarrollos existentes quedan aprobados (visibles)
update proyectos set estado_revision = 'aprobado' where estado_revision = 'pendiente';

-- =============================================
-- RLS PROYECTOS
-- =============================================
-- Admin puede todo sobre todos los proyectos
create policy "proyectos_admin_all" on proyectos for all
  using (exists (select 1 from admins a where a.user_id = auth.uid()))
  with check (exists (select 1 from admins a where a.user_id = auth.uid()));

-- Lectura pública: solo activos Y aprobados
drop policy if exists "proyectos_public_read" on proyectos;
create policy "proyectos_public_read" on proyectos for select
  using (activo = true and estado_revision = 'aprobado');

-- =============================================
-- RLS DESARROLLADORAS (auto-registro)
-- =============================================
create policy "desarrolladoras_self_insert" on desarrolladoras for insert
  with check (user_id = auth.uid());

-- =============================================
-- TRIGGER: solo admin cambia estado_revision
-- =============================================
create or replace function enforce_revision_for_dev()
returns trigger language plpgsql as $$
begin
  if not exists (select 1 from admins a where a.user_id = auth.uid())
     and new.estado_revision is distinct from 'pendiente' then
    raise exception 'Solo el admin puede cambiar el estado de revision';
  end if;
  if not exists (select 1 from admins a where a.user_id = auth.uid()) then
    new.estado_revision := 'pendiente';
  end if;
  return new;
end;
$$;

create trigger proyectos_enforce_revision before insert or update on proyectos
  for each row execute function enforce_revision_for_dev();
```

- [ ] **Step 2: Commit**

```bash
git add supabase/migrations/004_admin_y_revision.sql
git commit -m "feat: admin table, review state on proyectos, RLS + trigger"
```

**Nota de deploy:** aplicar la migración al Supabase remoto (`supabase db push` o SQL Editor) y registrar al admin:
```sql
insert into admins (user_id) values ('<user_id_de_la_cuenta_admin>');
```

---

### Task 3: Tipos y labels de revisión

**Files:**
- Modify: `src/types/proyecto.ts`

- [ ] **Step 1: Agregar tipo y labels**

```ts
export type EstadoRevision = 'pendiente' | 'aprobado' | 'rechazado'

export const REVISION_LABEL: Record<string, string> = {
  pendiente: 'En revisión',
  aprobado: 'Aprobado',
  rechazado: 'Rechazado',
}

export const REVISION_COLOR_BADGE: Record<string, string> = {
  pendiente: 'bg-amber-100 text-amber-700',
  aprobado: 'bg-emerald-100 text-emerald-700',
  rechazado: 'bg-red-100 text-red-700',
}
```

- [ ] **Step 2: Agregar campos a `Proyecto`**

```ts
  estado_revision: EstadoRevision
  motivo_rechazo: string | null
```

- [ ] **Step 3: Unit test para labels** — Create: `src/types/__tests__/revision.test.ts`

```ts
import { describe, it, expect } from 'vitest'
import { REVISION_LABEL, REVISION_COLOR_BADGE } from '@/types/proyecto'

describe('REVISION_LABEL', () => {
  it('mapea los tres estados', () => {
    expect(REVISION_LABEL['pendiente']).toBe('En revisión')
    expect(REVISION_LABEL['aprobado']).toBe('Aprobado')
    expect(REVISION_LABEL['rechazado']).toBe('Rechazado')
  })
})

describe('REVISION_COLOR_BADGE', () => {
  it('tiene color para cada estado', () => {
    for (const k of ['pendiente', 'aprobado', 'rechazado']) {
      expect(REVISION_COLOR_BADGE[k]).toBeDefined()
    }
  })
})
```

- [ ] **Step 4: Correr tests**

Run: `npm run test:run`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/types/proyecto.ts src/types/__tests__/revision.test.ts
git commit -m "feat: revision state types and labels"
```

---

### Task 4: Helpers de auth y parseo de formulario

**Files:**
- Create: `src/lib/auth.ts`
- Create: `src/lib/proyecto-form.ts`
- Test: `src/lib/__tests__/proyecto-form.test.ts`

- [ ] **Step 1: Escribir `src/lib/auth.ts`**

```ts
import { createAuthServerClient } from '@/lib/supabase-server'

export async function getSessionUser() {
  const supabase = await createAuthServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user ?? null
}

export async function isAdmin(userId: string) {
  const supabase = await createAuthServerClient()
  const { data } = await supabase
    .from('admins')
    .select('user_id')
    .eq('user_id', userId)
    .maybeSingle()
  return !!data
}
```

- [ ] **Step 2: Escribir `src/lib/proyecto-form.ts`** (parseo puro)

```ts
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
```

- [ ] **Step 3: Test de parseo** — Create: `src/lib/__tests__/proyecto-form.test.ts`

```ts
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
```

- [ ] **Step 4: Correr tests**

Run: `npm run test:run`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/auth.ts src/lib/proyecto-form.ts src/lib/__tests__/proyecto-form.test.ts
git commit -m "feat: auth helpers and proyecto form parsing"
```

---

### Task 5: Auto-registro de desarrolladores

**Files:**
- Create: `src/components/RegistroForm.tsx`
- Create: `src/app/registro/page.tsx`
- Modify: `src/app/login/page.tsx`

- [ ] **Step 1: Escribir `src/components/RegistroForm.tsx`**

```tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'

type Status = 'idle' | 'loading' | 'success' | 'error'

export default function RegistroForm() {
  const router = useRouter()
  const [form, setForm] = useState({ nombre: '', email: '', password: '' })
  const [status, setStatus] = useState<Status>('idle')
  const [message, setMessage] = useState<string | null>(null)

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setStatus('loading')
    setMessage(null)

    const supabase = createClient()

    const { data: sessionData, error: signUpError } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
    })

    if (signUpError) {
      setStatus('error')
      setMessage(signUpError.message)
      return
    }

    const userId = sessionData.user?.id

    if (userId) {
      const { error: insertError } = await supabase.from('desarrolladoras').insert({
        nombre: form.nombre,
        email: form.email,
        user_id: userId,
      })
      if (insertError) {
        setStatus('error')
        setMessage(insertError.message)
        return
      }
    }

    setStatus('success')
    router.push('/dashboard')
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="nombre" className="block text-sm font-medium text-gray-700 mb-1">
          Nombre de la desarrolladora *
        </label>
        <input
          id="nombre"
          name="nombre"
          type="text"
          required
          value={form.nombre}
          onChange={handleChange}
          placeholder="Ej: Grupo Alvear"
          className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900 transition-colors"
        />
      </div>

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
          Email *
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          value={form.email}
          onChange={handleChange}
          placeholder="contacto@tuempresa.com"
          className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900 transition-colors"
        />
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
          Contraseña *
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          minLength={6}
          value={form.password}
          onChange={handleChange}
          placeholder="Mínimo 6 caracteres"
          className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900 transition-colors"
        />
      </div>

      {message && (
        <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{message}</p>
      )}

      <button
        type="submit"
        disabled={status === 'loading'}
        className="w-full rounded-xl bg-gray-900 px-4 py-3 text-sm font-semibold text-white hover:bg-gray-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
      >
        {status === 'loading' ? 'Creando cuenta…' : 'Crear cuenta'}
      </button>

      <p className="text-xs text-gray-400 text-center">
        Si tu cuenta requiere confirmación de email, primero confirmala y luego ingresá a{' '}
        <Link href="/dashboard" className="underline underline-offset-2">
          tu panel
        </Link>{' '}
        para completar el perfil.
      </p>
    </form>
  )
}
```

- [ ] **Step 2: Escribir `src/app/registro/page.tsx`**

```tsx
import Link from 'next/link'
import RegistroForm from '@/components/RegistroForm'

export const metadata = {
  title: 'Registro — MapaInversor.ar',
}

export default function RegistroPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <span className="text-2xl font-bold tracking-tight text-gray-900">
            MapaInversor<span className="text-gray-400 font-medium">.ar</span>
          </span>
          <p className="mt-2 text-sm text-gray-500">Sumá tu desarrolladora al mapa</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
          <h1 className="text-lg font-semibold text-gray-900 mb-1">Crear cuenta</h1>
          <p className="text-sm text-gray-500 mb-6">
            Los desarrollos que cargues se publican tras la revisión del equipo.
          </p>
          <RegistroForm />
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          ¿Ya tenés cuenta?{' '}
          <Link href="/login" className="hover:text-gray-600 transition-colors">
            Ingresá
          </Link>
        </p>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Agregar link de registro en el login**

En `src/app/login/page.tsx`, después del link "← Volver al mapa":

```tsx
        <p className="text-center text-xs text-gray-400 mt-4">
          ¿Representás a una desarrolladora?{' '}
          <Link href="/registro" className="hover:text-gray-600 transition-colors">
            Registrate acá
          </Link>
        </p>
```

- [ ] **Step 4: Unit test de RegistroForm** — Create: `src/components/__tests__/RegistroForm.test.tsx`

```tsx
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'

import RegistroForm from '@/components/RegistroForm'

const signUpMock = vi.fn()
const insertMock = vi.fn()
const pushMock = vi.fn()

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock, refresh: vi.fn() }),
}))

vi.mock('@/lib/supabase', () => ({
  createClient: () => ({
    auth: { signUp: signUpMock },
    from: vi.fn(() => ({ insert: insertMock })),
  }),
}))

describe('RegistroForm', () => {
  const user = userEvent.setup()

  beforeEach(() => {
    vi.clearAllMocks()
    signUpMock.mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null })
    insertMock.mockResolvedValue({ error: null })
  })

  it('crea la cuenta y vincula la desarrolladora', async () => {
    render(<RegistroForm />)

    await user.type(screen.getByLabelText(/nombre de la desarrolladora/i), 'Grupo Test')
    await user.type(screen.getByLabelText(/email/i), 'dev@test.com')
    await user.type(screen.getByLabelText(/contraseña/i), '123456')

    await user.click(screen.getByRole('button', { name: /crear cuenta/i }))

    await waitFor(() => {
      expect(signUpMock).toHaveBeenCalledWith({ email: 'dev@test.com', password: '123456' })
      expect(insertMock).toHaveBeenCalledWith({
        nombre: 'Grupo Test',
        email: 'dev@test.com',
        user_id: 'user-1',
      })
      expect(pushMock).toHaveBeenCalledWith('/dashboard')
    })
  })

  it('muestra el error de signUp', async () => {
    signUpMock.mockResolvedValueOnce({ data: null, error: { message: 'email en uso' } })
    render(<RegistroForm />)

    await user.type(screen.getByLabelText(/nombre de la desarrolladora/i), 'Grupo Test')
    await user.type(screen.getByLabelText(/email/i), 'dev@test.com')
    await user.type(screen.getByLabelText(/contraseña/i), '123456')
    await user.click(screen.getByRole('button', { name: /crear cuenta/i }))

    expect(await screen.findByText(/email en uso/i)).toBeInTheDocument()
  })
})
```

- [ ] **Step 5: Correr tests**

Run: `npm run test:run`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add src/components/RegistroForm.tsx src/components/__tests__/RegistroForm.test.tsx src/app/registro/page.tsx src/app/login/page.tsx
git commit -m "feat: developer self-registration"
```

---

### Task 6: Formulario de proyecto + picker de coordenadas

**Files:**
- Create: `src/components/MapCoordenadas.tsx`
- Create: `src/components/ProyectoForm.tsx`

- [ ] **Step 1: Escribir `src/components/MapCoordenadas.tsx`**

```tsx
'use client'

import { useEffect, useRef, useState } from 'react'
import Map, { Marker, type MapRef } from 'react-map-gl/mapbox'
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
    mapRef.current?.flyTo({ center: [longitud, latitud] })
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
        mapStyle="mapbox://styles/mapbox/light-v11"
        initialViewState={view}
        onClick={(e) => {
          onChange(e.lngLat.lat, e.lngLat.lng)
          mapRef.current?.flyTo({ center: [e.lngLat.lng, e.lngLat.lat] })
        }}
        style={{ width: '100%', height: '100%' }}
      >
        <Marker longitude={longitud} latitude={latitud} color="#185FA5" />
      </Map>
    </div>
  )
}
```

- [ ] **Step 2: Escribir `src/components/ProyectoForm.tsx`**

```tsx
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
```

- [ ] **Step 3: Correr typecheck**

Run: `npm run typecheck`
Expected: PASS (verificar que `react-map-gl/mapbox` y `MapRef` existan en esta versión; si no, ajustar el import según `node_modules/react-map-gl`)

- [ ] **Step 4: Commit**

```bash
git add src/components/MapCoordenadas.tsx src/components/ProyectoForm.tsx
git commit -m "feat: proyecto form with map coordinate picker"
```

---

### Task 7: Server actions de crear/editar (developer)

**Files:**
- Create: `src/app/dashboard/proyectos/actions.ts`
- Create: `src/app/dashboard/proyectos/nuevo/page.tsx`
- Create: `src/app/dashboard/proyectos/[id]/editar/page.tsx`

- [ ] **Step 1: Escribir `src/app/dashboard/proyectos/actions.ts`**

```ts
'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createAuthServerClient } from '@/lib/supabase-server'
import { parseProyectoForm } from '@/lib/proyecto-form'

async function getDesarrolladoraId(): Promise<string> {
  const supabase = await createAuthServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data } = await supabase
    .from('desarrolladoras')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!data) redirect('/registro')
  return data.id
}

export async function crearProyecto(formData: FormData) {
  const desarrolladoraId = await getDesarrolladoraId()
  const { data, errors } = parseProyectoForm(formData)

  if (!data) {
    throw new Error(Object.values(errors).join('. '))
  }

  const supabase = await createAuthServerClient()
  const { error } = await supabase.from('proyectos').insert({
    desarrolladora_id: desarrolladoraId,
    ...data,
    estado_revision: 'pendiente',
    activo: true,
  })

  if (error) throw new Error(error.message)

  revalidatePath('/dashboard')
  revalidatePath('/')
  redirect('/dashboard')
}

export async function editarProyecto(proyectoId: string, formData: FormData) {
  const desarrolladoraId = await getDesarrolladoraId()
  const { data, errors } = parseProyectoForm(formData)

  if (!data) {
    throw new Error(Object.values(errors).join('. '))
  }

  const supabase = await createAuthServerClient()

  // Verificar ownership
  const { data: existing } = await supabase
    .from('proyectos')
    .select('id, desarrolladora_id')
    .eq('id', proyectoId)
    .single()

  if (!existing || existing.desarrolladora_id !== desarrolladoraId) {
    redirect('/dashboard')
  }

  const { error } = await supabase
    .from('proyectos')
    .update({ ...data, estado_revision: 'pendiente', motivo_rechazo: null })
    .eq('id', proyectoId)

  if (error) throw new Error(error.message)

  revalidatePath('/dashboard')
  revalidatePath('/proyectos/[id]')
  revalidatePath('/')
  redirect('/dashboard')
}
```

- [ ] **Step 2: Escribir `src/app/dashboard/proyectos/nuevo/page.tsx`**

```tsx
import Link from 'next/link'
import ProyectoForm from '@/components/ProyectoForm'
import { crearProyecto } from '@/app/dashboard/proyectos/actions'

export const metadata = { title: 'Nuevo desarrollo — MapaInversor.ar' }

export default function NuevoProyectoPage() {
  return (
    <div className="px-8 py-8 max-w-3xl">
      <Link href="/dashboard" className="text-sm text-gray-400 hover:text-gray-700 transition-colors">
        ← Mis proyectos
      </Link>
      <h1 className="text-2xl font-bold text-gray-900 mt-2 mb-6">Cargar nuevo desarrollo</h1>
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <p className="text-sm text-amber-700 bg-amber-50 rounded-lg px-3 py-2 mb-6">
          Tu desarrollo quedará <strong>en revisión</strong> hasta que el equipo lo apruebe.
        </p>
        <ProyectoForm action={crearProyecto} pendingLabel="Cargar desarrollo" />
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Escribir `src/app/dashboard/proyectos/[id]/editar/page.tsx`**

```tsx
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { createAuthServerClient } from '@/lib/supabase-server'
import ProyectoForm from '@/components/ProyectoForm'
import { editarProyecto } from '@/app/dashboard/proyectos/actions'

export default async function EditarProyectoPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createAuthServerClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: proyecto } = await supabase
    .from('proyectos')
    .select('id, nombre, descripcion, estado, tipo, direccion, ciudad, provincia, latitud, longitud, precio_desde, moneda, superficie_desde, superficie_hasta, ambientes_min, ambientes_max, imagen_url, imagenes, amenities, desarrolladora_id, estado_revision, motivo_rechazo')
    .eq('id', id)
    .single()

  if (!proyecto) notFound()

  const { data: dev } = await supabase
    .from('desarrolladoras')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (!dev || dev.id !== proyecto.desarrolladora_id) notFound()

  const action = editarProyecto.bind(null, id)

  return (
    <div className="px-8 py-8 max-w-3xl">
      <Link href="/dashboard" className="text-sm text-gray-400 hover:text-gray-700 transition-colors">
        ← Mis proyectos
      </Link>
      <h1 className="text-2xl font-bold text-gray-900 mt-2 mb-6">Editar desarrollo</h1>

      {proyecto.estado_revision === 'rechazado' && (
        <div className="text-sm text-red-700 bg-red-50 rounded-lg px-3 py-2 mb-6">
          <strong>Rechazado:</strong> {proyecto.motivo_rechazo ?? 'sin motivo.'} Corregí y volvé a enviar.
        </div>
      )}

      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <ProyectoForm
          action={action}
          pendingLabel="Guardar cambios"
          initial={{
            nombre: proyecto.nombre,
            descripcion: proyecto.descripcion ?? '',
            estado: proyecto.estado,
            tipo: proyecto.tipo,
            direccion: proyecto.direccion,
            ciudad: proyecto.ciudad,
            provincia: proyecto.provincia,
            latitud: proyecto.latitud,
            longitud: proyecto.longitud,
            precio_desde: proyecto.precio_desde != null ? String(proyecto.precio_desde) : '',
            moneda: proyecto.moneda,
            superficie_desde: proyecto.superficie_desde != null ? String(proyecto.superficie_desde) : '',
            superficie_hasta: proyecto.superficie_hasta != null ? String(proyecto.superficie_hasta) : '',
            ambientes_min: proyecto.ambientes_min != null ? String(proyecto.ambientes_min) : '',
            ambientes_max: proyecto.ambientes_max != null ? String(proyecto.ambientes_max) : '',
            imagen_url: proyecto.imagen_url ?? '',
            imagenes: (proyecto.imagenes ?? []).join(', '),
            amenities: (proyecto.amenities ?? []).join(', '),
          }}
        />
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Correr typecheck + build**

Run: `npm run typecheck`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/app/dashboard/proyectos/actions.ts src/app/dashboard/proyectos/nuevo/page.tsx "src/app/dashboard/proyectos/[id]/editar/page.tsx"
git commit -m "feat: create and edit proyecto actions and pages"
```

---

### Task 8: Dashboard del desarrollador

**Files:**
- Modify: `src/app/dashboard/page.tsx`
- Modify: `src/app/dashboard/layout.tsx`

- [ ] **Step 1: Actualizar `src/app/dashboard/page.tsx`** — agregar badge de revisión, botones "Nuevo desarrollo" y "Editar", y perfil.

Agregar a la query de proyectos:
```ts
    .select('id, nombre, estado, ciudad, precio_desde, moneda, estado_revision, motivo_rechazo, leads(count)')
```

En el estado "sin desarrolladora" (líneas 17-24), reemplazar por link a `/registro`:
```tsx
  if (!desarrolladora) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-32 text-center">
        <p className="text-gray-500 text-sm mb-2">Tu cuenta no está vinculada a ninguna desarrolladora.</p>
        <Link
          href="/registro"
          className="mt-2 text-sm font-medium text-gray-900 border border-gray-200 rounded-lg px-4 py-2 hover:bg-gray-50 transition-colors"
        >
          Completá tu perfil de desarrolladora
        </Link>
      </div>
    )
  }
```

En el header, agregar el botón "Nuevo desarrollo":
```tsx
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mis proyectos</h1>
          <p className="text-sm text-gray-500 mt-1">{desarrolladora.nombre}</p>
        </div>
        <Link
          href="/dashboard/proyectos/nuevo"
          className="text-sm font-medium bg-gray-900 text-white px-4 py-2 rounded-full hover:bg-gray-700 transition-colors"
        >
          + Nuevo desarrollo
        </Link>
      </div>
```

En la tabla, columna Estado (líneas ~89-93), agregar badge de revisión debajo del estado de obra y enlaces editar:
```tsx
                    <td className="px-4 py-4">
                      <span className={`inline-block text-xs font-semibold px-2.5 py-1 rounded-full ${ESTADO_COLOR_BADGE[proyecto.estado] ?? 'bg-gray-100 text-gray-600'}`}>
                        {ESTADO_LABEL[proyecto.estado] ?? proyecto.estado}
                      </span>
                      <div className="mt-1">
                        <span className={`inline-block text-xs font-semibold px-2.5 py-0.5 rounded-full ${REVISION_COLOR_BADGE[proyecto.estado_revision] ?? 'bg-gray-100 text-gray-600'}`}>
                          {REVISION_LABEL[proyecto.estado_revision] ?? proyecto.estado_revision}
                        </span>
                        {proyecto.estado_revision === 'rechazado' && (
                          <p className="text-xs text-red-600 mt-1">{proyecto.motivo_rechazo}</p>
                        )}
                      </div>
                    </td>
```

En la última celda (líneas ~102-109), agregar link "Editar":
```tsx
                    <td className="px-4 py-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/dashboard/proyectos/${proyecto.id}/editar`}
                          className="text-xs font-medium text-gray-600 border border-gray-200 rounded-lg px-3 py-1.5 hover:bg-gray-50 transition-colors"
                        >
                          Editar
                        </Link>
                        <Link
                          href={`/dashboard/proyectos/${proyecto.id}`}
                          className="text-xs font-medium text-gray-900 border border-gray-200 rounded-lg px-3 py-1.5 hover:bg-gray-50 transition-colors"
                        >
                          Ver leads
                        </Link>
                      </div>
                    </td>
```

Imports a actualizar en el archivo:
```tsx
import { ESTADO_LABEL, ESTADO_COLOR_BADGE, REVISION_LABEL, REVISION_COLOR_BADGE } from '@/types/proyecto'
```

- [ ] **Step 2: Actualizar `src/app/dashboard/layout.tsx`** — nav "Nuevo desarrollo" y link "Admin" si es admin.

Agregar en el `<nav>`:
```tsx
          <Link
            href="/dashboard/proyectos/nuevo"
            className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors"
          >
            <span className="text-base">＋</span>
            Nuevo desarrollo
          </Link>
```

Y verificar admin en el layout (agregar la query y el link condicional):
```tsx
  const { data: adminRow } = await supabase
    .from('admins')
    .select('user_id')
    .eq('user_id', user.id)
    .maybeSingle()
```

```tsx
          {adminRow && (
            <Link
              href="/admin"
              className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors"
            >
              <span className="text-base">⚙</span>
              Admin
            </Link>
          )}
```

- [ ] **Step 3: Correr typecheck**

Run: `npm run typecheck`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add src/app/dashboard/page.tsx src/app/dashboard/layout.tsx
git commit -m "feat: dashboard dev with revision badges and nuevo desarrollo"
```

---

### Task 9: Panel admin (listado + aprobar/rechazar)

**Files:**
- Create: `src/app/admin/layout.tsx`
- Create: `src/app/admin/actions.ts`
- Create: `src/app/admin/page.tsx`
- Create: `src/app/admin/proyectos/nuevo/page.tsx`
- Create: `src/app/admin/proyectos/[id]/editar/page.tsx`

- [ ] **Step 1: Escribir `src/app/admin/layout.tsx`**

```tsx
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createAuthServerClient } from '@/lib/supabase-server'

export const metadata = { title: 'Admin — MapaInversor.ar' }

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createAuthServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: adminRow } = await supabase
    .from('admins')
    .select('user_id')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!adminRow) redirect('/dashboard')

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <span className="text-sm font-bold tracking-tight text-gray-900">
            Admin — MapaInversor<span className="text-gray-400 font-medium">.ar</span>
          </span>
          <nav className="flex items-center gap-4">
            <Link href="/admin" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">Desarrollos</Link>
            <Link href="/dashboard" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">Mi panel</Link>
            <Link href="/" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">Mapa</Link>
          </nav>
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-6 py-8">{children}</main>
    </div>
  )
}
```

- [ ] **Step 2: Escribir `src/app/admin/actions.ts`**

```ts
'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createAuthServerClient } from '@/lib/supabase-server'

async function requireAdmin() {
  const supabase = await createAuthServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: adminRow } = await supabase
    .from('admins')
    .select('user_id')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!adminRow) redirect('/dashboard')
  return supabase
}

export async function aprobarProyecto(proyectoId: string) {
  const supabase = await requireAdmin()
  const { error } = await supabase
    .from('proyectos')
    .update({ estado_revision: 'aprobado', motivo_rechazo: null })
    .eq('id', proyectoId)
  if (error) throw new Error(error.message)

  revalidatePath('/admin')
  revalidatePath('/')
  revalidatePath('/proyectos/[id]')
}

export async function rechazarProyecto(formData: FormData) {
  const supabase = await requireAdmin()
  const proyectoId = String(formData.get('proyectoId') ?? '')
  const motivo = String(formData.get('motivo') ?? '').trim()

  const { error } = await supabase
    .from('proyectos')
    .update({ estado_revision: 'rechazado', motivo_rechazo: motivo || null })
    .eq('id', proyectoId)
  if (error) throw new Error(error.message)

  revalidatePath('/admin')
  revalidatePath('/dashboard')
}
```

- [ ] **Step 3: Escribir `src/app/admin/page.tsx`**

```tsx
import Link from 'next/link'
import { createAuthServerClient } from '@/lib/supabase-server'
import { ESTADO_LABEL, REVISION_LABEL, REVISION_COLOR_BADGE } from '@/types/proyecto'
import { aprobarProyecto, rechazarProyecto } from '@/app/admin/actions'

export const dynamic = 'force-dynamic'

export default async function AdminPage() {
  const supabase = await createAuthServerClient()

  const { data: proyectos } = await supabase
    .from('proyectos')
    .select('id, nombre, ciudad, estado, estado_revision, motivo_rechazo, desarrolladoras(nombre), created_at')
    .order('created_at', { ascending: false })

  const grupos: { key: 'pendiente' | 'aprobado' | 'rechazado'; title: string }[] = [
    { key: 'pendiente', title: 'Pendientes de revisión' },
    { key: 'aprobado', title: 'Aprobados' },
    { key: 'rechazado', title: 'Rechazados' },
  ]

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Desarrollos</h1>
        <Link
          href="/admin/proyectos/nuevo"
          className="text-sm font-medium bg-gray-900 text-white px-4 py-2 rounded-full hover:bg-gray-700 transition-colors"
        >
          + Cargar desarrollo
        </Link>
      </div>

      {grupos.map((g) => {
        const items = proyectos?.filter((p) => p.estado_revision === g.key) ?? []
        return (
          <section key={g.key} className="mb-10">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3">
              {g.title} ({items.length})
            </h2>
            {items.length === 0 ? (
              <p className="text-sm text-gray-400 mb-4">Sin desarrollos.</p>
            ) : (
              <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden mb-4">
                <table className="w-full text-sm">
                  <tbody className="divide-y divide-gray-50">
                    {items.map((p) => {
                      const dev = (p.desarrolladoras as unknown as { nombre: string } | null)?.nombre
                      return (
                        <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-5 py-4">
                            <p className="font-medium text-gray-900">{p.nombre}</p>
                            <p className="text-xs text-gray-400">
                              {p.ciudad} · {ESTADO_LABEL[p.estado] ?? p.estado}
                              {dev ? ` · ${dev}` : ''}
                            </p>
                            {p.motivo_rechazo && (
                              <p className="text-xs text-red-600 mt-1">Motivo: {p.motivo_rechazo}</p>
                            )}
                          </td>
                          <td className="px-4 py-4">
                            <span className={`inline-block text-xs font-semibold px-2.5 py-1 rounded-full ${REVISION_COLOR_BADGE[p.estado_revision] ?? 'bg-gray-100 text-gray-600'}`}>
                              {REVISION_LABEL[p.estado_revision] ?? p.estado_revision}
                            </span>
                          </td>
                          <td className="px-4 py-4 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-2">
                              {p.estado_revision !== 'aprobado' && (
                                <form action={aprobarProyecto.bind(null, p.id)}>
                                  <button
                                    type="submit"
                                    className="text-xs font-medium text-white bg-emerald-600 rounded-lg px-3 py-1.5 hover:bg-emerald-500 transition-colors"
                                  >
                                    Aprobar
                                  </button>
                                </form>
                              )}
                              {p.estado_revision !== 'rechazado' && (
                                <form action={rechazarProyecto}>
                                  <input type="hidden" name="proyectoId" value={p.id} />
                                  <input
                                    type="text"
                                    name="motivo"
                                    placeholder="Motivo del rechazo"
                                    className="text-xs rounded-lg border border-gray-200 px-2 py-1.5 w-40"
                                  />
                                  <button
                                    type="submit"
                                    className="text-xs font-medium text-white bg-red-600 rounded-lg px-3 py-1.5 hover:bg-red-500 transition-colors ml-1"
                                  >
                                    Rechazar
                                  </button>
                                </form>
                              )}
                              <Link
                                href={`/admin/proyectos/${p.id}/editar`}
                                className="text-xs font-medium text-gray-600 border border-gray-200 rounded-lg px-3 py-1.5 hover:bg-gray-50 transition-colors"
                              >
                                Editar
                              </Link>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )
      })}
    </div>
  )
}
```

- [ ] **Step 4: Escribir `src/app/admin/proyectos/nuevo/page.tsx`**

```tsx
import Link from 'next/link'
import ProyectoForm from '@/components/ProyectoForm'
import { crearProyectoAdmin } from '@/app/admin/actions'

export const metadata = { title: 'Nuevo desarrollo — Admin' }

export default function AdminNuevoProyectoPage() {
  return (
    <div>
      <Link href="/admin" className="text-sm text-gray-400 hover:text-gray-700 transition-colors">
        ← Desarrollos
      </Link>
      <h1 className="text-2xl font-bold text-gray-900 mt-2 mb-6">Cargar desarrollo</h1>
      <div className="bg-white rounded-2xl border border-gray-100 p-6 max-w-3xl">
        <ProyectoForm action={crearProyectoAdmin} pendingLabel="Cargar desarrollo" />
      </div>
    </div>
  )
}
```

Agregar a `src/app/admin/actions.ts` el action `crearProyectoAdmin` (crea con `estado_revision: 'aprobado'` si el admin lo decide — usar form field `publicar`):

```ts
export async function crearProyectoAdmin(formData: FormData) {
  const supabase = await requireAdmin()
  const { data, errors } = parseProyectoForm(formData)
  if (!data) throw new Error(Object.values(errors).join('. '))

  const { data: desarrolladora } = await supabase
    .from('desarrolladoras')
    .select('id')
    .maybeSingle()

  const { error } = await supabase.from('proyectos').insert({
    desarrolladora_id: desarrolladora?.id ?? null,
    ...data,
    estado_revision: formData.get('publicar') === 'true' ? 'aprobado' : 'pendiente',
    activo: true,
  })
  if (error) throw new Error(error.message)

  revalidatePath('/admin')
  revalidatePath('/')
  redirect('/admin')
}
```

(Importar `parseProyectoForm` y `redirect` en `admin/actions.ts`.)

- [ ] **Step 5: Escribir `src/app/admin/proyectos/[id]/editar/page.tsx`**

```tsx
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createAuthServerClient } from '@/lib/supabase-server'
import ProyectoForm from '@/components/ProyectoForm'
import { editarProyectoAdmin } from '@/app/admin/actions'

export const metadata = { title: 'Editar desarrollo — Admin' }

export default async function AdminEditarProyectoPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createAuthServerClient()

  const { data: proyecto } = await supabase
    .from('proyectos')
    .select('id, nombre, descripcion, estado, tipo, direccion, ciudad, provincia, latitud, longitud, precio_desde, moneda, superficie_desde, superficie_hasta, ambientes_min, ambientes_max, imagen_url, imagenes, amenities')
    .eq('id', id)
    .single()

  if (!proyecto) notFound()

  const action = editarProyectoAdmin.bind(null, id)

  return (
    <div>
      <Link href="/admin" className="text-sm text-gray-400 hover:text-gray-700 transition-colors">
        ← Desarrollos
      </Link>
      <h1 className="text-2xl font-bold text-gray-900 mt-2 mb-6">Editar desarrollo</h1>
      <div className="bg-white rounded-2xl border border-gray-100 p-6 max-w-3xl">
        <ProyectoForm
          action={action}
          pendingLabel="Guardar cambios"
          initial={{
            nombre: proyecto.nombre,
            descripcion: proyecto.descripcion ?? '',
            estado: proyecto.estado,
            tipo: proyecto.tipo,
            direccion: proyecto.direccion,
            ciudad: proyecto.ciudad,
            provincia: proyecto.provincia,
            latitud: proyecto.latitud,
            longitud: proyecto.longitud,
            precio_desde: proyecto.precio_desde != null ? String(proyecto.precio_desde) : '',
            moneda: proyecto.moneda,
            superficie_desde: proyecto.superficie_desde != null ? String(proyecto.superficie_desde) : '',
            superficie_hasta: proyecto.superficie_hasta != null ? String(proyecto.superficie_hasta) : '',
            ambientes_min: proyecto.ambientes_min != null ? String(proyecto.ambientes_min) : '',
            ambientes_max: proyecto.ambientes_max != null ? String(proyecto.ambientes_max) : '',
            imagen_url: proyecto.imagen_url ?? '',
            imagenes: (proyecto.imagenes ?? []).join(', '),
            amenities: (proyecto.amenities ?? []).join(', '),
          }}
        />
      </div>
    </div>
  )
}
```

Agregar a `src/app/admin/actions.ts` el action `editarProyectoAdmin`:

```ts
export async function editarProyectoAdmin(proyectoId: string, formData: FormData) {
  const supabase = await requireAdmin()
  const { data, errors } = parseProyectoForm(formData)
  if (!data) throw new Error(Object.values(errors).join('. '))

  const { error } = await supabase
    .from('proyectos')
    .update(data)
    .eq('id', proyectoId)
  if (error) throw new Error(error.message)

  revalidatePath('/admin')
  revalidatePath('/')
  revalidatePath('/proyectos/[id]')
  redirect('/admin')
}
```

- [ ] **Step 6: Correr typecheck**

Run: `npm run typecheck`
Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add src/app/admin
git commit -m "feat: admin panel with approve/reject and create/edit"
```

---

### Task 10: Público — solo aprobados + dynamic

**Files:**
- Modify: `src/app/page.tsx`
- Modify: `src/app/proyectos/[id]/page.tsx`

- [ ] **Step 1: Home** — agregar `export const dynamic = 'force-dynamic'` y filtro explícito

En `src/app/page.tsx`:

```tsx
export const dynamic = 'force-dynamic'
```

Y en la query:
```ts
    .eq('activo', true)
    .eq('estado_revision', 'aprobado')
```

- [ ] **Step 2: Ficha pública** — mismo filtro

En `src/app/proyectos/[id]/page.tsx`, agregar:
```tsx
export const dynamic = 'force-dynamic'
```
Y en la query de la página (líneas ~73-74):
```ts
     .eq('activo', true)
     .eq('estado_revision', 'aprobado')
```

(Nota: `generateMetadata` no necesita el filtro; si el proyecto no está aprobado la página hace `notFound()` por RLS.)

- [ ] **Step 3: Correr build**

Run: `npm run build`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add src/app/page.tsx "src/app/proyectos/[id]/page.tsx"
git commit -m "fix: public pages only show approved proyectos and are dynamic"
```

---

### Task 11: E2E + verificación completa

**Files:**
- Create: `e2e/registro.spec.ts`
- Create: `e2e/admin.spec.ts`

- [ ] **Step 1: Escribir `e2e/registro.spec.ts`**

```ts
import { test, expect } from '@playwright/test'

test.describe('registro', () => {
  test('renderiza el formulario de registro', async ({ page }) => {
    await page.goto('/registro')
    await expect(page.getByLabel('Nombre de la desarrolladora')).toBeVisible()
    await expect(page.getByLabel(/email/i)).toBeVisible()
    await expect(page.getByLabel(/contraseña/i)).toBeVisible()
    await expect(page.getByRole('button', { name: /crear cuenta/i })).toBeVisible()
  })

  test('un usuario no admin no ve /admin', async ({ page }) => {
    await page.goto('/admin')
    await expect(page).toHaveURL(/\/login$/)
  })
})
```

- [ ] **Step 2: Escribir `e2e/admin.spec.ts`**

```ts
import { test, expect } from '@playwright/test'

test.describe('admin', () => {
  test('requiere login para /admin', async ({ page }) => {
    await page.goto('/admin')
    await expect(page).toHaveURL(/\/login$/)
  })
})
```

- [ ] **Step 3: Correr todo el pipeline**

Run: `npm run lint && npm run typecheck && npm run test:run`
Expected: PASS

- [ ] **Step 4: E2E local** (opcional, requiere Supabase + Mapbox configurados)

Run: `npm run test:e2e`
Expected: PASS (los specs nuevos solo verifican render/redirección sin auth)

- [ ] **Step 5: Commit**

```bash
git add e2e/registro.spec.ts e2e/admin.spec.ts
git commit -m "test: e2e for registro and admin guard"
```

---

### Task 12: Deploy + verificación manual

- [ ] **Step 1: Aplicar migración en Supabase** (SQL Editor o `supabase db push`) con `004_admin_y_revision.sql`.

- [ ] **Step 2: Registrar el admin**:
```sql
insert into admins (user_id) values ('<user_id_de_la_cuenta_admin>');
```

- [ ] **Step 3: Push a GitHub** → redeploy automático en Vercel.

- [ ] **Step 4: Verificación manual**
1. Ir a `/registro`, crear cuenta de desarrolladora → login → dashboard.
2. Cargar un desarrollo → aparece "En revisión" en su dashboard; NO aparece en el mapa público.
3. Entrar como admin → `/admin` → aprobar → aparece en el mapa público y ficha.
4. Editar un desarrollo aprobado como dev → vuelve a "En revisión".
5. Rechazar con motivo → el dev lo ve en su dashboard.

---

## Recordatorios
- Server Actions verifican auth en el servidor siempre.
- El trigger en DB es la última barrera (dev no puede setear `aprobado`).
- `force-dynamic` en páginas públicas para que las aprobaciones se reflejen sin redeploy.
