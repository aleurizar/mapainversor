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
