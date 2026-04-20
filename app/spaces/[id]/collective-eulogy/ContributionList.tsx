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

function ContributionCard({ c, spaceId, isPrimaryContact }: { c: Contribution; spaceId: string; isPrimaryContact: boolean }) {
  const answers = Object.entries(c.answers_json).filter(([, v]) => v?.trim())

  return (
    <div
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

      {isPrimaryContact && (
        <div className="flex gap-4">
          {c.moderation_status !== 'accepted' && (
            <form action={moderateContribution} className="inline-flex">
              <input type="hidden" name="contribution_id" value={c.id} />
              <input type="hidden" name="space_id" value={spaceId} />
              <input type="hidden" name="status" value="accepted" />
              <button type="submit" className="text-xs text-black underline hover:text-stone-600">
                Accepteren
              </button>
            </form>
          )}
          {c.moderation_status !== 'rejected' && (
            <form action={moderateContribution} className="inline-flex">
              <input type="hidden" name="contribution_id" value={c.id} />
              <input type="hidden" name="space_id" value={spaceId} />
              <input type="hidden" name="status" value="rejected" />
              <button type="submit" className="text-xs text-stone-400 underline hover:text-stone-600">
                Afwijzen
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  )
}

function Section({ title, contributions, spaceId, isPrimaryContact }: {
  title: string
  contributions: Contribution[]
  spaceId: string
  isPrimaryContact: boolean
}) {
  if (contributions.length === 0) return null
  return (
    <div>
      <p className="text-xs text-stone-500 mb-3">{title} ({contributions.length})</p>
      <div className="space-y-3">
        {contributions.map(c => (
          <ContributionCard key={c.id} c={c} spaceId={spaceId} isPrimaryContact={isPrimaryContact} />
        ))}
      </div>
    </div>
  )
}

export default function ContributionList({ contributions, spaceId, isPrimaryContact }: Props) {
  if (contributions.length === 0) {
    return <p className="text-sm text-black">Nog geen bijdragen ontvangen.</p>
  }

  const pending  = contributions.filter(c => c.moderation_status === 'pending')
  const accepted = contributions.filter(c => c.moderation_status === 'accepted')
  const rejected = contributions.filter(c => c.moderation_status === 'rejected')

  const sections = [
    { key: 'pending',  title: 'Te beoordelen', items: pending },
    { key: 'accepted', title: 'Geaccepteerd',   items: accepted },
    { key: 'rejected', title: 'Afgewezen',       items: rejected },
  ].filter(s => s.items.length > 0)

  return (
    <div className="space-y-6">
      {sections.map((s, i) => (
        <div key={s.key}>
          {i > 0 && <hr className="border-stone-300 mb-6" />}
          <Section
            title={s.title}
            contributions={s.items}
            spaceId={spaceId}
            isPrimaryContact={isPrimaryContact}
          />
        </div>
      ))}
    </div>
  )
}
