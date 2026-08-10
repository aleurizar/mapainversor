import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createAuthServerClient } from '@/lib/supabase-server'
import { actualizarPerfil } from './actions'

const inputCls =
  'w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900 transition-colors'
const labelCls = 'block text-sm font-medium text-gray-700 mb-1'

export default async function PerfilPage() {
  const supabase = await createAuthServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: desarrolladora } = await supabase
    .from('desarrolladoras')
    .select('id, nombre, email, logo_url, sitio_web, telefono, descripcion')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!desarrolladora) redirect('/registro')

  return (
    <div className="px-8 py-8 max-w-2xl">
      <Link href="/dashboard" className="text-sm text-gray-400 hover:text-gray-700 transition-colors">
        ← Mis proyectos
      </Link>
      <h1 className="text-2xl font-bold text-gray-900 mt-2 mb-1">Perfil de la desarrolladora</h1>
      <p className="text-sm text-gray-400 mb-6">Esta información se muestra en la ficha pública de tus proyectos.</p>

      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <form action={actualizarPerfil} className="space-y-5">
          <div>
            <label htmlFor="nombre" className={labelCls}>Nombre *</label>
            <input id="nombre" name="nombre" required defaultValue={desarrolladora.nombre} className={inputCls} />
          </div>

          <div>
            <label htmlFor="email" className={labelCls}>Email</label>
            <input id="email" name="email" disabled defaultValue={desarrolladora.email} className={`${inputCls} bg-gray-50 text-gray-400`} />
            <p className="text-xs text-gray-400 mt-1">El email se usa para recibir leads y no se puede cambiar acá.</p>
          </div>

          <div>
            <label htmlFor="sitio_web" className={labelCls}>Sitio web</label>
            <input id="sitio_web" name="sitio_web" type="url" defaultValue={desarrolladora.sitio_web ?? ''} className={inputCls} placeholder="https://…" />
          </div>

          <div>
            <label htmlFor="telefono" className={labelCls}>Teléfono</label>
            <input id="telefono" name="telefono" defaultValue={desarrolladora.telefono ?? ''} className={inputCls} />
          </div>

          <div>
            <label htmlFor="descripcion" className={labelCls}>Descripción</label>
            <textarea id="descripcion" name="descripcion" rows={4} defaultValue={desarrolladora.descripcion ?? ''} className={`${inputCls} resize-none`} />
          </div>

          <button
            type="submit"
            className="w-full rounded-xl bg-gray-900 px-4 py-3 text-sm font-semibold text-white hover:bg-gray-700 transition-colors"
          >
            Guardar perfil
          </button>
        </form>
      </div>
    </div>
  )
}
