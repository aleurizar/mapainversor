import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createAuthServerClient } from '@/lib/supabase-server'
import { isAdmin } from '@/lib/auth'
import LogoutButton from '@/components/LogoutButton'

export const metadata = {
  title: 'Dashboard — MapaInversor.ar',
}

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createAuthServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  if (await isAdmin(user.id)) redirect('/admin')

  const { data: desarrolladora } = await supabase
    .from('desarrolladoras')
    .select('nombre')
    .eq('user_id', user.id)
    .single()

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Sidebar */}
      <aside className="w-56 shrink-0 bg-white border-r border-gray-100 flex flex-col">
        <div className="px-5 py-5 border-b border-gray-100">
          <Link href="/" className="block">
            <span className="text-base font-bold tracking-tight text-gray-900">
              MapaInversor<span className="text-gray-400 font-medium">.ar</span>
            </span>
          </Link>
          {desarrolladora && (
            <p className="text-xs text-gray-400 mt-1 truncate">{desarrolladora.nombre}</p>
          )}
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          <Link
            href="/dashboard"
            className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors"
          >
            <span className="text-base">▤</span>
            Mis proyectos
          </Link>
        </nav>

        <div className="px-3 py-4 border-t border-gray-100">
          <p className="text-xs text-gray-400 px-3 mb-2 truncate">{user.email}</p>
          <LogoutButton />
        </div>
      </aside>

      {/* Contenido */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  )
}
