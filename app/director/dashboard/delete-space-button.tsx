'use client'

import { useState } from 'react'
import { deleteMemorialSpace } from './actions'

export function DeleteSpaceButton({ spaceId, spaceName }: { spaceId: string; spaceName: string }) {
  const [confirming, setConfirming] = useState(false)
  const [pending, setPending] = useState(false)

  if (confirming) {
    return (
      <div className="flex items-center gap-3" onClick={e => e.preventDefault()}>
        <p className="text-sm font-bold text-red-700">
          Weet u zeker dat u &ldquo;{spaceName}&rdquo; permanent verwijdert?
        </p>
        <form
          action={async (fd) => {
            setPending(true)
            await deleteMemorialSpace(fd)
          }}
        >
          <input type="hidden" name="space_id" value={spaceId} />
          <button
            type="submit"
            disabled={pending}
            className="text-sm font-bold text-red-700 underline hover:text-red-900 disabled:opacity-50 whitespace-nowrap"
          >
            {pending ? 'Verwijderen...' : 'Ja, verwijder'}
          </button>
        </form>
        <button
          onClick={() => setConfirming(false)}
          className="text-sm text-stone-400 hover:text-stone-600 whitespace-nowrap"
        >
          Annuleren
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={e => { e.preventDefault(); setConfirming(true) }}
      className="text-sm text-stone-300 hover:text-red-600 transition-colors"
    >
      Verwijderen
    </button>
  )
}
