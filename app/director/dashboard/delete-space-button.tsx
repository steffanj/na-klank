'use client'

import { useState } from 'react'
import { deleteMemorialSpace } from './actions'

export function DeleteSpaceButton({ spaceId, spaceName }: { spaceId: string; spaceName: string }) {
  const [confirming, setConfirming] = useState(false)
  const [pending, setPending] = useState(false)

  return (
    <div className="contents">
      <button
        onClick={e => { e.preventDefault(); setConfirming(true) }}
        className="text-sm text-stone-300 hover:text-red-600 transition-colors shrink-0"
      >
        Verwijderen
      </button>

      {confirming && (
        <div className="col-span-full mt-3 pt-3 border-t border-red-200 flex items-center justify-between gap-4">
          <p className="text-sm font-bold text-red-700">
            Weet u zeker dat u &ldquo;{spaceName}&rdquo; permanent verwijdert?
          </p>
          <div className="flex items-center gap-4 shrink-0">
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
                className="text-sm font-bold text-red-700 underline hover:text-red-900 disabled:opacity-50"
              >
                {pending ? 'Verwijderen...' : 'Ja, verwijder'}
              </button>
            </form>
            <button
              onClick={() => setConfirming(false)}
              className="text-sm text-stone-400 hover:text-stone-600"
            >
              Annuleren
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
