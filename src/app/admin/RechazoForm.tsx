'use client'

import { useState } from 'react'
import { rechazarProyecto } from './actions'

export default function RechazoForm({ proyectoId }: { proyectoId: string }) {
  const [abierto, setAbierto] = useState(false)
  const [motivo, setMotivo] = useState('')

  if (!abierto) {
    return (
      <button
        type="button"
        onClick={() => setAbierto(true)}
        className="text-xs font-medium text-red-700 border border-red-200 rounded-lg px-3 py-1.5 hover:bg-red-50 transition-colors"
      >
        Rechazar
      </button>
    )
  }

  return (
    <form
      action={async () => {
        const fd = new FormData()
        fd.set('proyecto_id', proyectoId)
        fd.set('motivo', motivo)
        await rechazarProyecto(fd)
      }}
      className="space-y-2"
    >
      <textarea
        value={motivo}
        onChange={(e) => setMotivo(e.target.value)}
        rows={3}
        required
        placeholder="Motivo del rechazo…"
        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-xs text-gray-900 placeholder-gray-400 focus:border-gray-900 focus:outline-none"
      />
      <div className="flex gap-2">
        <button
          type="submit"
          className="text-xs font-semibold text-white bg-red-700 rounded-lg px-3 py-1.5 hover:bg-red-800 transition-colors"
        >
          Confirmar rechazo
        </button>
        <button
          type="button"
          onClick={() => setAbierto(false)}
          className="text-xs font-medium text-gray-500 border border-gray-200 rounded-lg px-3 py-1.5 hover:bg-gray-50 transition-colors"
        >
          Cancelar
        </button>
      </div>
    </form>
  )
}
