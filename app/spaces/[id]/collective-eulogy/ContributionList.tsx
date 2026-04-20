'use client'

import { moderateContribution } from './actions'

type Contribution = {
  id: string
  contributor_name: string
  relationship_to_deceased: string | null
  answers_json: Record<string, string>
  moderation_status: string
  submitted_at: string
}

type Props = {
  contributions: Contribution[]
  spaceId: string
  isPrimaryContact: boolean
}

const LABEL: Record<string, string> = {
  typical_trait: 'Typisch kenmerk',
  most_valued: 'Wat ze waardeerden',
  memory: 'Herinnering',
  catchphrase: 'Uitspraak',
  farewell_message: 'Boodschap',
}

export default function ContributionList({ contributions, spaceId, isPrimaryContact }: Props) {
  if (contributions.length === 0) {
    return <p className="text-sm text-black">Nog geen bijdragen ontvangen.</p>
  }

  return (
    <div className="space-y-4">
      {contributions.map(c => {
        const answers = Object.entries(c.answers_json).filter(([, v]) => v?.trim())
        const statusColor =
          c.moderation_status === 'accepted'
            ? 'text-green-700'
            : c.moderation_status === 'rejected'
            ? 'text-stone-400 line-through'
            : 'text-stone-600'

        return (
          <div
            key={c.id}
            className={`border border-stone-300 rounded-xl px-5 py-4 ${c.moderation_status === 'rejected' ? 'opacity-50' : ''}`}
            style={{ backgroundColor: '#FFF8F2' }}
          >
            <div className="flex items-start justify-between gap-4 mb-3">
              <div>
                <p className="text-sm text-black font-medium">{c.contributor_name}</p>
                {c.relationship_to_deceased && (
                  <p className="text-xs text-black">{c.relationship_to_deceased}</p>
                )}
              </div>
              <span className={`text-xs shrink-0 ${statusColor}`}>
                {c.moderation_status === 'accepted' ? 'Geaccepteerd' : c.moderation_status === 'rejected' ? 'Afgewezen' : 'In afwachting'}
              </span>
            </div>

            {answers.length > 0 && (
              <div className="space-y-2 mb-4">
                {answers.map(([key, val]) => (
                  <div key={key}>
                    <p className="text-xs text-stone-500">{LABEL[key] ?? key}</p>
                    <p className="text-sm text-black">{val}</p>
                  </div>
                ))}
              </div>
            )}

            {isPrimaryContact && c.moderation_status !== 'accepted' && (
              <form action={moderateContribution} className="inline-flex">
                <input type="hidden" name="contribution_id" value={c.id} />
                <input type="hidden" name="space_id" value={spaceId} />
                <input type="hidden" name="status" value="accepted" />
                <button
                  type="submit"
                  className="text-xs text-black underline hover:text-stone-600 mr-4"
                >
                  Accepteren
                </button>
              </form>
            )}
            {isPrimaryContact && c.moderation_status !== 'rejected' && (
              <form action={moderateContribution} className="inline-flex">
                <input type="hidden" name="contribution_id" value={c.id} />
                <input type="hidden" name="space_id" value={spaceId} />
                <input type="hidden" name="status" value="rejected" />
                <button
                  type="submit"
                  className="text-xs text-stone-400 underline hover:text-stone-600"
                >
                  Afwijzen
                </button>
              </form>
            )}
          </div>
        )
      })}
    </div>
  )
}
