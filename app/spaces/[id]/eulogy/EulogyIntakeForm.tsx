'use client'

import { INTAKE_QUESTIONS } from '@/lib/config/eulogy'
import { generateEulogy } from './actions'

type Props = {
  eulogyId: string
  spaceId: string
  firstName: string
  savedAnswers: Record<string, string>
}

export default function EulogyIntakeForm({ eulogyId, spaceId, firstName, savedAnswers }: Props) {
  return (
    <form action={generateEulogy}>
      <input type="hidden" name="eulogy_id" value={eulogyId} />
      <input type="hidden" name="space_id" value={spaceId} />

      <div className="space-y-6 mb-8">
        {INTAKE_QUESTIONS.map(q => {
          const label = q.label.replace('[naam]', firstName)
          const defaultValue = savedAnswers[q.key] ?? ''

          return (
            <div key={q.key}>
              <label className="block text-sm text-black mb-1.5">{label}</label>
              {q.multiline ? (
                <textarea
                  name={q.key}
                  defaultValue={defaultValue}
                  placeholder={q.placeholder}
                  rows={3}
                  className="w-full px-4 py-3 text-sm text-black border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-400 resize-none"
                  style={{ backgroundColor: '#FFF8F2' }}
                />
              ) : (
                <input
                  type="text"
                  name={q.key}
                  defaultValue={defaultValue}
                  placeholder={q.placeholder}
                  className="w-full px-4 py-3 text-sm text-black border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-400"
                  style={{ backgroundColor: '#FFF8F2' }}
                />
              )}
            </div>
          )
        })}
      </div>

      <button
        type="submit"
        className="px-6 py-3 bg-stone-800 text-white text-sm rounded-lg hover:bg-stone-700 transition-colors"
      >
        Stel rouwbrief op
      </button>
    </form>
  )
}
