'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'

type Status = 'idle' | 'loading' | 'success' | 'error'

export default function LeadForm({ proyectoId }: { proyectoId: string }) {
  const [form, setForm] = useState({ nombre: '', email: '', telefono: '', mensaje: '' })
  const [status, setStatus] = useState<Status>('idle')

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setStatus('loading')

    const supabase = createClient()
    const { error } = await supabase.from('leads').insert({
      proyecto_id: proyectoId,
      nombre: form.nombre,
      email: form.email,
      telefono: form.telefono || null,
      mensaje: form.mensaje || null,
    })

    if (error) {
      setStatus('error')
    } else {
      setStatus('success')
      setForm({ nombre: '', email: '', telefono: '', mensaje: '' })
    }
  }

  if (status === 'success') {
    return (
      <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-6 text-center">
        <div className="text-3xl mb-3">✓</div>
        <p className="font-semibold text-emerald-800 mb-1">¡Consulta enviada!</p>
        <p className="text-sm text-emerald-600">Te contactamos a la brevedad.</p>
        <button
          onClick={() => setStatus('idle')}
          className="mt-4 text-sm text-emerald-700 underline underline-offset-2"
        >
          Enviar otra consulta
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="nombre" className="block text-sm font-medium text-gray-700 mb-1">
          Nombre *
        </label>
        <input
          id="nombre"
          name="nombre"
          type="text"
          required
          value={form.nombre}
          onChange={handleChange}
          placeholder="Tu nombre completo"
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
          placeholder="tu@email.com"
          className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900 transition-colors"
        />
      </div>

      <div>
        <label htmlFor="telefono" className="block text-sm font-medium text-gray-700 mb-1">
          Teléfono
        </label>
        <input
          id="telefono"
          name="telefono"
          type="tel"
          value={form.telefono}
          onChange={handleChange}
          placeholder="+54 11 1234-5678"
          className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900 transition-colors"
        />
      </div>

      <div>
        <label htmlFor="mensaje" className="block text-sm font-medium text-gray-700 mb-1">
          Mensaje
        </label>
        <textarea
          id="mensaje"
          name="mensaje"
          rows={3}
          value={form.mensaje}
          onChange={handleChange}
          placeholder="¿Qué querés saber sobre este proyecto?"
          className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900 transition-colors resize-none"
        />
      </div>

      {status === 'error' && (
        <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">
          Hubo un error al enviar la consulta. Intentá de nuevo.
        </p>
      )}

      <button
        type="submit"
        disabled={status === 'loading'}
        className="w-full rounded-xl bg-gray-900 px-4 py-3 text-sm font-semibold text-white hover:bg-gray-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
      >
        {status === 'loading' ? 'Enviando…' : 'Enviar consulta'}
      </button>

      <p className="text-xs text-gray-400 text-center">
        Tu información no se comparte con terceros.
      </p>
    </form>
  )
}
