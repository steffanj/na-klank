'use client'

import { useState, useRef, useEffect } from 'react'
import { saveEulogyEdit, regenerateEulogy, finalizeEulogy } from './actions'

type Props = {
  eulogyId: string
  spaceId: string
  content: string
  status: string
  optInToCollective: boolean
}

export default function EulogyEditor({ eulogyId, spaceId, content, status, optInToCollective }: Props) {
  const [text, setText] = useState(content)
  const [optIn, setOptIn] = useState(optInToCollective)
  const finalized = status === 'finalized'
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`
    }
  }, [text])

  return (
    <div>
      <textarea
        ref={textareaRef}
        value={text}
        onChange={e => setText(e.target.value)}
        disabled={finalized}
        rows={1}
        className="w-full px-5 py-4 text-sm text-black border border-stone-300 rounded-xl leading-relaxed focus:outline-none focus:ring-2 focus:ring-stone-400 resize-none overflow-hidden mb-5"
        style={{ backgroundColor: '#FFF8F2' }}
      />

      {finalized ? (
        <p className="text-sm text-stone-400">Deze rouwbrief is afgerond.</p>
      ) : (
        <div className="space-y-5">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={optIn}
              onChange={e => setOptIn(e.target.checked)}
              className="mt-0.5 shrink-0"
            />
            <span className="text-sm text-stone-600">
              Deel mijn herinneringen voor de gezamenlijke rouwbrief
            </span>
          </label>

          <div className="flex gap-3 flex-wrap">
            <form action={saveEulogyEdit}>
              <input type="hidden" name="eulogy_id" value={eulogyId} />
              <input type="hidden" name="space_id" value={spaceId} />
              <input type="hidden" name="content" value={text} />
              <button
                type="submit"
                className="px-5 py-2.5 text-sm bg-stone-800 text-white rounded-lg hover:bg-stone-700 transition-colors"
              >
                Opslaan
              </button>
            </form>

            <form action={regenerateEulogy}>
              <input type="hidden" name="eulogy_id" value={eulogyId} />
              <input type="hidden" name="space_id" value={spaceId} />
              <button
                type="submit"
                className="px-5 py-2.5 text-sm border border-stone-300 text-black rounded-lg hover:border-stone-400 transition-colors"
                style={{ backgroundColor: '#FFF8F2' }}
              >
                Opnieuw genereren
              </button>
            </form>

            <form action={finalizeEulogy}>
              <input type="hidden" name="eulogy_id" value={eulogyId} />
              <input type="hidden" name="space_id" value={spaceId} />
              <input type="hidden" name="opt_in_to_collective" value={String(optIn)} />
              <button
                type="submit"
                className="px-5 py-2.5 text-sm border border-stone-300 text-stone-500 rounded-lg hover:border-stone-400 transition-colors"
                style={{ backgroundColor: '#FFF8F2' }}
              >
                Afronden
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
