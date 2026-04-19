'use client'

import { useState } from 'react'
import { deleteMemorialSpace } from './actions'

type MemberRow = { role: string; invited_email: string; accepted_at: string | null }

export function SpaceCard({
  space,
  name,
  primaryContact,
}: {
  space: { id: string; funeral_date: string | null }
  name: string
  primaryContact: MemberRow | undefined
}) {
  const [confirming, setConfirming] = useState(false)
  const [pending, setPending] = useState(false)

  return (
    <div className="border border-stone-300 rounded-xl px-6 py-5" style={{ backgroundColor: '#FFF8F2' }}>
      {/* Top row: always clean */}
      <div className="flex items-start justify-between">
        <a href={`/director/spaces/${space.id}`} className="flex-1 min-w-0">
          <p className="font-medium text-black text-lg">{name}</p>
          {space.funeral_date && (
            <p className="text-sm text-black mt-0.5">
              Uitvaart: {new Date(space.funeral_date).toLocaleDateString('nl-NL', {
                day: 'numeric', month: 'long', year: 'numeric',
              })}
            </p>
          )}
        </a>
        <div className="flex items-center gap-4 ml-4 shrink-0">
          <ContactBadge member={primaryContact} />
          {!confirming && (
            <button
              onClick={() => setConfirming(true)}
              className="text-sm text-black hover:text-red-600 transition-colors"
            >
              Verwijderen
            </button>
          )}
        </div>
      </div>

      {/* Confirmation row: only visible when triggered, full width below */}
      {confirming && (
        <div className="mt-4 pt-4 border-t border-red-200 flex items-center justify-between gap-4">
          <p className="text-sm font-bold text-red-700">
            Weet u zeker dat u &ldquo;{name}&rdquo; permanent wilt verwijderen?
          </p>
          <div className="flex items-center gap-4 shrink-0">
            <form action={async (fd) => { setPending(true); await deleteMemorialSpace(fd) }}>
              <input type="hidden" name="space_id" value={space.id} />
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
              className="text-sm text-black hover:text-black"
            >
              Annuleren
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function ContactBadge({ member }: { member: MemberRow | undefined }) {
  if (!member) return <span className="text-xs text-black">Geen contact</span>
  if (member.accepted_at) {
    return (
      <span className="text-xs bg-green-50 text-green-700 border border-green-200 rounded-full px-3 py-1">
        Actief — {member.invited_email}
      </span>
    )
  }
  return (
    <span className="text-xs bg-amber-50 text-amber-700 border border-amber-200 rounded-full px-3 py-1">
      Uitnodiging verstuurd — {member.invited_email}
    </span>
  )
}
