'use client'

import { useState } from 'react'
import { submitContribution } from './actions'
import { CONTRIBUTION_QUESTIONS } from '@/lib/config/collective-eulogy'

type Props = {
  token: string
  firstName: string
}

export default function ContributionForm({ token, firstName }: Props) {
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      const fd = new FormData(e.currentTarget)
      await submitContribution(fd)
      setSubmitted(true)
    } catch {
      setError('Er ging iets mis. Probeer het opnieuw.')
    } finally {
      setSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <div className="text-center py-12">
        <p className="text-black text-lg mb-2">Bedankt voor je bijdrage.</p>
        <p className="text-black text-sm">Je herinnering aan {firstName} is ontvangen.</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <input type="hidden" name="token" value={token} />

      <div>
        <label className="block text-sm text-black mb-1">
          Jouw naam <span className="text-stone-400 text-xs">(optioneel)</span>
        </label>
        <p className="text-xs text-black mb-2">Als je dit invult, kan je naam worden genoemd bij jouw bijdrage. Anoniem meedoen mag ook.</p>
        <input
          type="text"
          name="contributor_name"
          className="w-full px-4 py-2.5 text-sm text-black border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-400"
          style={{ backgroundColor: '#FFF8F2' }}
        />
      </div>

      <div>
        <label className="block text-sm text-black mb-1">
          Hoe kende je {firstName}? <span className="text-stone-400 text-xs">(optioneel)</span>
        </label>
        <p className="text-xs text-black mb-2">Een paar woorden zijn genoeg. Denk aan de rol waarin je {firstName} kende.</p>
        <input
          type="text"
          name="relationship"
          className="w-full px-4 py-2.5 text-sm text-black border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-400"
          style={{ backgroundColor: '#FFF8F2' }}
        />
      </div>

      {CONTRIBUTION_QUESTIONS.map(q => (
        <div key={q.key}>
          <label className="block text-sm text-black mb-1">
            {q.label.replace('hem/haar', firstName)} <span className="text-stone-400 text-xs">(optioneel)</span>
          </label>
          {q.subtitle && <p className="text-xs text-black mb-2">{q.subtitle}</p>}
          {q.multiline ? (
            <textarea
              name={q.key}
              rows={3}
              className="w-full px-4 py-2.5 text-sm text-black border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-400 resize-none"
              style={{ backgroundColor: '#FFF8F2' }}
            />
          ) : (
            <input
              type="text"
              name={q.key}
              className="w-full px-4 py-2.5 text-sm text-black border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-400"
              style={{ backgroundColor: '#FFF8F2' }}
            />
          )}
        </div>
      ))}

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="px-6 py-3 bg-stone-800 text-white text-sm rounded-lg hover:bg-stone-700 transition-colors disabled:opacity-50"
      >
        {submitting ? 'Versturen…' : 'Verstuur herinnering'}
      </button>
    </form>
  )
}
