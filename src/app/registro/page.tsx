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
