'use client'

import { INTAKE_SECTIONS } from '@/lib/config/eulogy'
import { generateEulogy } from './actions'

type Props = {
  eulogyId: string
  spaceId: string
  firstName: string
  savedAnswers: Record<string, string>
}

export default function EulogyIntakeForm({ eulogyId, spaceId, firstName, savedAnswers }: Props) {
  function replace(text: string) {
    return text.replace(/\[naam\]/g, firstName)
  }

  return (
    <form action={generateEulogy}>
      <input type="hidden" name="eulogy_id" value={eulogyId} />
      <input type="hidden" name="space_id" value={spaceId} />

      <div className="space-y-10 mb-8">
        {INTAKE_SECTIONS.map(section => (
          <section key={section.title}>
            <h2 className="text-base text-black border-b border-stone-300 pb-2 mb-5">
              {replace(section.title)}
            </h2>
            <div className="space-y-6">
              {section.questions.map(q => (
                <div key={q.key}>
                  <label className="block text-sm text-black mb-1">
                    {replace(q.label)}
                  </label>
                  {q.subtitle && (
                    <p className="text-xs text-stone-400 mb-1.5">{q.subtitle}</p>
                  )}
                  {q.multiline ? (
                    <textarea
                      name={q.key}
                      defaultValue={savedAnswers[q.key] ?? ''}
                      placeholder={q.placeholder}
                      rows={3}
                      className="w-full px-4 py-3 text-sm text-black border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-400 resize-none"
                      style={{ backgroundColor: '#FFF8F2' }}
                    />
                  ) : (
                    <input
                      type="text"
                      name={q.key}
                      defaultValue={savedAnswers[q.key] ?? ''}
                      placeholder={q.placeholder}
                      className="w-full px-4 py-3 text-sm text-black border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-400"
                      style={{ backgroundColor: '#FFF8F2' }}
                    />
                  )}
                </div>
              ))}
            </div>
          </section>
        ))}
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
