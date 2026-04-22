'use client'

import { useState, useRef, useEffect } from 'react'
import { downloadEulogyPdf } from '@/lib/pdf'
import { autoSaveCollectiveEulogyEdit, regenerateCollectiveEulogy, reviseCollectiveEulogy, finalizeCollectiveEulogy, reopenCollectiveEulogy } from './actions'

const PRESETS = [
  { key: 'shorter', label: 'Korter', instruction: 'Maak de tekst wat korter door minder essentiële zinnen te schrappen. Streef naar circa 20% minder woorden.' },
  { key: 'longer', label: 'Langer', instruction: 'Maak de tekst wat langer door de gegeven inhoud iets meer ruimte te geven. Streef naar circa 20% meer woorden. Voeg geen verzonnen details toe.' },
  { key: 'simpler', label: 'Eenvoudigere taal', instruction: 'Herschrijf de volledige tekst in eenvoudigere, toegankelijkere taal. Vervang moeilijke woorden door alledaagse alternatieven, maak lange zinnen korter, schrijf zoals mensen praten. Pas dit door de hele tekst toe.' },
  { key: 'lighter', label: 'Vrolijker', instruction: 'Herschrijf de volledige tekst met een lichtere, warmere toon. Benadruk mooie herinneringen en dankbaarheid, gebruik meer warmte en levenslustigheid in de woordkeuze. Pas dit door de hele tekst toe.' },
  { key: 'subdued', label: 'Ingetogener', instruction: 'Herschrijf de volledige tekst met een ingetogenere, stillere toon. Maak emotionele passages rustiger, vermijd pathos, laat verdriet meer tussen de regels zitten. Pas dit door de hele tekst toe.' },
  { key: 'formal', label: 'Formeler', instruction: 'Herschrijf de volledige tekst in een formele stijl. Gebruik formele woordkeuze, vermijd spreektaal en informele uitdrukkingen, schrijf zoals voor een plechtige toespraak. Pas dit door de hele tekst toe.' },
  { key: 'informal', label: 'Informeler', instruction: 'Herschrijf de volledige tekst in een informelere, persoonlijkere stijl. Gebruik spreektaal, directe aanspreekvormen, schrijf zoals je het werkelijk zou zeggen. Pas dit door de hele tekst toe.' },
]

type Props = {
  spaceId: string
  content: string
  status: string
  fullName: string
  readOnly?: boolean
}


export default function CollectiveEulogyEditor({ spaceId, content, status, fullName, readOnly = false }: Props) {
  const [text, setText] = useState(content)
  const [selectedPresets, setSelectedPresets] = useState<Set<string>>(new Set())
  const [freeInstruction, setFreeInstruction] = useState('')
  const [saveStatus, setSaveStatus] = useState<'idle' | 'pending' | 'saving' | 'saved'>('idle')
  const [copied, setCopied] = useState(false)
  const finalized = status === 'finalized'
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const lastSavedText = useRef(content)

  function togglePreset(key: string) {
    setSelectedPresets(prev => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  const combinedInstruction = [
    ...Array.from(selectedPresets).map(k => PRESETS.find(p => p.key === k)!.instruction),
    freeInstruction.trim(),
  ].filter(Boolean).join(' ')

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`
    }
  }, [text])

  useEffect(() => {
    if (finalized || readOnly || text === lastSavedText.current) return
    setSaveStatus('pending')
    const timer = setTimeout(async () => {
      setSaveStatus('saving')
      const fd = new FormData()
      fd.set('space_id', spaceId)
      fd.set('content', text)
      await autoSaveCollectiveEulogyEdit(fd)
      lastSavedText.current = text
      setSaveStatus('saved')
      setTimeout(() => setSaveStatus('idle'), 2000)
    }, 2000)
    return () => clearTimeout(timer)
  }, [text, spaceId, finalized])

  async function handleCopy() {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function handleDownload() {
    downloadEulogyPdf({
      fullName,
      subtitle: 'Gezamenlijk afscheidswoord',
      text,
      filename: `${fullName} — Gezamenlijk afscheidswoord.pdf`,
    })
  }

  if (readOnly) {
    return (
      <div>
        <textarea
          ref={textareaRef}
          value={text}
          onChange={() => {}}
          disabled
          rows={1}
          className="w-full px-5 py-4 text-sm text-black border border-stone-300 rounded-xl leading-relaxed resize-none overflow-hidden mb-4"
          style={{ backgroundColor: '#FFF8F2' }}
        />
        <div className="flex gap-3 flex-wrap">
          <button
            type="button"
            onClick={handleCopy}
            className="px-5 py-2.5 text-sm border border-stone-300 text-black rounded-lg hover:border-stone-400 transition-colors"
            style={{ backgroundColor: '#FFF8F2' }}
          >
            {copied ? 'Gekopieerd' : 'Kopieer tekst'}
          </button>
          <button
            type="button"
            onClick={handleDownload}
            className="px-5 py-2.5 text-sm border border-stone-300 text-black rounded-lg hover:border-stone-400 transition-colors"
            style={{ backgroundColor: '#FFF8F2' }}
          >
            Download
          </button>
        </div>
      </div>
    )
  }

  return (
    <div>
      <textarea
        ref={textareaRef}
        value={text}
        onChange={e => setText(e.target.value)}
        disabled={finalized}
        rows={1}
        className="w-full px-5 py-4 text-sm text-black border border-stone-300 rounded-xl leading-relaxed focus:outline-none focus:ring-2 focus:ring-stone-400 resize-none overflow-hidden mb-1"
        style={{ backgroundColor: '#FFF8F2' }}
      />
      <div className="h-5 mb-4 flex justify-end">
        {(saveStatus === 'pending' || saveStatus === 'saving') && <span className="text-xs text-black">Opslaan...</span>}
        {saveStatus === 'saved' && <span className="text-xs text-black">Opgeslagen</span>}
      </div>

      {finalized ? (
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <p className="text-sm text-black">Dit afscheidswoord is afgerond.</p>
            <form action={reopenCollectiveEulogy} className="inline-flex items-center">
              <input type="hidden" name="space_id" value={spaceId} />
              <button type="submit" className="text-xs text-black hover:text-black underline">
                Heropenen
              </button>
            </form>
          </div>
          <div className="flex gap-3 flex-wrap">
            <button
              type="button"
              onClick={handleCopy}
              className="px-5 py-2.5 text-sm border border-stone-300 text-black rounded-lg hover:border-stone-400 transition-colors"
              style={{ backgroundColor: '#FFF8F2' }}
            >
              {copied ? 'Gekopieerd' : 'Kopieer tekst'}
            </button>
            <button
              type="button"
              onClick={handleDownload}
              className="px-5 py-2.5 text-sm border border-stone-300 text-black rounded-lg hover:border-stone-400 transition-colors"
              style={{ backgroundColor: '#FFF8F2' }}
            >
              Download
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-5">
          <div className="flex gap-3 flex-wrap">
            <form action={regenerateCollectiveEulogy}>
              <input type="hidden" name="space_id" value={spaceId} />
              <button
                type="submit"
                className="px-5 py-2.5 text-sm border border-stone-300 text-black rounded-lg hover:border-stone-400 transition-colors"
                style={{ backgroundColor: '#FFF8F2' }}
              >
                Opnieuw genereren
              </button>
            </form>
            <button
              type="button"
              onClick={handleCopy}
              className="px-5 py-2.5 text-sm border border-stone-300 text-black rounded-lg hover:border-stone-400 transition-colors"
              style={{ backgroundColor: '#FFF8F2' }}
            >
              {copied ? 'Gekopieerd' : 'Kopieer tekst'}
            </button>
            <button
              type="button"
              onClick={handleDownload}
              className="px-5 py-2.5 text-sm border border-stone-300 text-black rounded-lg hover:border-stone-400 transition-colors"
              style={{ backgroundColor: '#FFF8F2' }}
            >
              Download
            </button>
          </div>

          <div className="border-t border-stone-200 pt-5">
            <p className="text-xs text-black mb-3">Aanpassen</p>
            <div className="flex flex-wrap gap-2 mb-4">
              {PRESETS.map(preset => (
                <button
                  key={preset.key}
                  type="button"
                  onClick={() => togglePreset(preset.key)}
                  className={`px-3 py-1.5 text-xs rounded-lg border transition-colors ${
                    selectedPresets.has(preset.key)
                      ? 'bg-stone-800 text-white border-stone-800'
                      : 'border-stone-300 text-black hover:border-stone-400'
                  }`}
                  style={selectedPresets.has(preset.key) ? {} : { backgroundColor: '#FFF8F2' }}
                >
                  {preset.label}
                </button>
              ))}
            </div>
            <form action={reviseCollectiveEulogy}>
              <input type="hidden" name="space_id" value={spaceId} />
              <input type="hidden" name="current_content" value={text} />
              <input type="hidden" name="revision_instruction" value={combinedInstruction} />
              <div className="flex gap-3 items-center">
                <input
                  type="text"
                  value={freeInstruction}
                  onChange={e => setFreeInstruction(e.target.value)}
                  placeholder={'Vrije instructie, bijv. \u201Cmaak de opening wat directer\u201D'}
                  className="flex-1 px-4 py-2.5 text-sm text-black border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-400"
                  style={{ backgroundColor: '#FFF8F2' }}
                />
                <button
                  type="submit"
                  disabled={!combinedInstruction}
                  className="px-5 py-2.5 text-sm bg-stone-800 text-white rounded-lg hover:bg-stone-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
                >
                  Pas toe
                </button>
              </div>
            </form>
          </div>

          <div className="border-t border-stone-200 pt-5">
            <form action={finalizeCollectiveEulogy}>
              <input type="hidden" name="space_id" value={spaceId} />
              <button
                type="submit"
                className="px-5 py-2.5 text-sm border border-stone-300 text-black rounded-lg hover:border-stone-400 transition-colors"
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
