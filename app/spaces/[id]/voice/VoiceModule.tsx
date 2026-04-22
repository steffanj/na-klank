'use client'

import { useState, useRef, useEffect } from 'react'
import { PRESET_VOICES } from '@/lib/config/voice'
import { startVoiceGeneration } from './actions'
import RecordingCard from './RecordingCard'
// Voice cloning UI hidden until quality is sufficient — see VoiceRecorder.tsx and actions.ts (cloneVoice, deleteClonedVoice)

type Recording = {
  id: string
  source_type: string
  voice_id: string
  voice_source: string
  voice_label: string
  status: string
  result_url: string | null
  created_at: string
}

type TextSource = 'eulogy' | 'collective_eulogy' | 'custom_text'

export default function VoiceModule({
  spaceId,
  eulogyText,
  eulogyVersionId,
  collectiveEulogyText,
  recordings,
}: {
  spaceId: string
  eulogyText: string | null
  eulogyVersionId: string | null
  collectiveEulogyText: string | null
  recordings: Recording[]
}) {
  const availableSources: { key: TextSource; label: string; text: string | null }[] = [
    ...(eulogyText ? [{ key: 'eulogy' as TextSource, label: 'Mijn afscheidswoord', text: eulogyText }] : []),
    ...(collectiveEulogyText ? [{ key: 'collective_eulogy' as TextSource, label: 'Gezamenlijk afscheidswoord', text: collectiveEulogyText }] : []),
    { key: 'custom_text' as TextSource, label: 'Eigen tekst', text: null },
  ]

  const [selectedSource, setSelectedSource] = useState<TextSource>(availableSources[0].key)
  const [customText, setCustomText] = useState('')
  const [selectedVoiceId, setSelectedVoiceId] = useState(PRESET_VOICES[0].id)

  const [previewState, setPreviewState] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle')
  const [previewError, setPreviewError] = useState('')
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const audioRef = useRef<HTMLAudioElement>(null)

  useEffect(() => {
    if (previewUrl && audioRef.current) {
      audioRef.current.play().catch(() => {})
    }
  }, [previewUrl])

  const [generateState, setGenerateState] = useState<'idle' | 'submitting' | 'error'>('idle')
  const [generateError, setGenerateError] = useState('')

  const currentSourceObj = availableSources.find(s => s.key === selectedSource)!
  const activeText = selectedSource === 'custom_text' ? customText : (currentSourceObj.text ?? '')

  function selectVoice(id: string) {
    setSelectedVoiceId(id)
    setPreviewState('idle')
    if (previewUrl && previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(previewUrl)
    }
    setPreviewUrl(null)
  }

  function handlePreview() {
    setPreviewError('')
    const preset = PRESET_VOICES.find(v => v.id === selectedVoiceId)
    if (preset) {
      setPreviewUrl(preset.previewPath)
      setPreviewState('ready')
    }
  }

  async function handleGenerate() {
    if (!activeText.trim() || !selectedVoiceId) return
    setGenerateState('submitting')
    setGenerateError('')

    const fd = new FormData()
    fd.append('space_id', spaceId)
    fd.append('text', activeText)
    fd.append('voice_id', selectedVoiceId)
    fd.append('voice_source', 'preset')
    fd.append('source_type', selectedSource)
    if (selectedSource === 'eulogy' && eulogyVersionId) {
      fd.append('source_eulogy_version_id', eulogyVersionId)
    }

    const result = await startVoiceGeneration(fd)
    if (result?.error) {
      setGenerateError(result.error)
      setGenerateState('error')
    } else {
      setGenerateState('idle')
    }
  }

  const selectedVoiceLabel = PRESET_VOICES.find(v => v.id === selectedVoiceId)?.name ?? selectedVoiceId

  return (
    <div className="space-y-8">

      {/* Text source */}
      <section>
        <p className="text-sm text-black mb-3">Tekst om voor te laten lezen</p>
        <div className="flex flex-wrap gap-2 mb-4">
          {availableSources.map(s => (
            <button
              key={s.key}
              onClick={() => setSelectedSource(s.key)}
              className={`px-4 py-2 text-sm rounded-lg border transition-colors text-black ${
                selectedSource === s.key
                  ? 'border-stone-800 hover:border-stone-800'
                  : 'border-stone-300 hover:border-stone-400'
              }`}
              style={{ backgroundColor: '#FFF8F2' }}
            >
              {s.label}
            </button>
          ))}
        </div>
        {selectedSource === 'custom_text' && (
          <textarea
            value={customText}
            onChange={e => setCustomText(e.target.value)}
            rows={6}
            placeholder="Typ hier de tekst die voorgelezen moet worden…"
            className="w-full px-4 py-3 text-sm border border-stone-300 rounded-xl text-black focus:outline-none focus:ring-2 focus:ring-stone-400 resize-y"
            style={{ backgroundColor: '#FFF8F2' }}
          />
        )}
        {selectedSource !== 'custom_text' && currentSourceObj.text && (
          <div
            className="border border-stone-300 rounded-xl px-4 py-3 text-sm text-black max-h-40 overflow-y-auto whitespace-pre-wrap"
            style={{ backgroundColor: '#FFF8F2' }}
          >
            {currentSourceObj.text}
          </div>
        )}
      </section>

      {/* Voice selection */}
      <section>
        <p className="text-sm text-black mb-3">Stem</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {PRESET_VOICES.map(voice => (
            <button
              key={voice.id}
              onClick={() => selectVoice(voice.id)}
              className={`px-3 py-2.5 text-left rounded-lg border transition-colors ${
                selectedVoiceId === voice.id
                  ? 'border-stone-800 hover:border-stone-800'
                  : 'border-stone-200 text-black hover:border-stone-400'
              }`}
              style={{ backgroundColor: '#FFF8F2' }}
            >
              <p className="text-sm text-black">{voice.name}</p>
              <p className="text-xs mt-0.5 text-stone-500">{voice.description}</p>
            </button>
          ))}
        </div>
      </section>

      {/* Preview + Generate */}
      <section>
        <p className="text-sm text-black border-b border-stone-300 pb-2 mb-4">Voorvertoning en genereren</p>

        <div className="flex flex-wrap gap-3 items-center mb-4">
          <button
            onClick={handlePreview}
            className="px-4 py-2.5 text-sm border border-stone-300 rounded-lg text-black hover:border-stone-800 transition-colors"
            style={{ backgroundColor: '#FFF8F2' }}
          >
            {`Beluister preview — ${selectedVoiceLabel}`}
          </button>
          <button
            onClick={handleGenerate}
            disabled={generateState === 'submitting' || !activeText.trim()}
            className="px-4 py-2.5 text-sm border border-stone-300 rounded-lg text-black hover:border-stone-800 transition-colors disabled:opacity-50"
            style={{ backgroundColor: '#FFF8F2' }}
          >
            {generateState === 'submitting' ? 'Genereren…' : 'Genereer volledige opname'}
          </button>
        </div>

        {previewState === 'ready' && previewUrl && (
          <audio
            ref={audioRef}
            src={previewUrl}
            controls
            className="w-full h-10 mb-3"
            style={{ accentColor: '#292524' }}
          />
        )}
        {previewState === 'error' && (
          <p className="text-xs text-red-600 mb-3">{previewError}</p>
        )}
        {generateState === 'error' && (
          <p className="text-xs text-red-600 mb-3">{generateError}</p>
        )}
        {generateState === 'submitting' && (
          <p className="text-xs text-stone-500">De opname wordt aangemaakt. Dit kan even duren.</p>
        )}
      </section>

      {/* Recording library */}
      {recordings.length > 0 && (
        <section>
          <p className="text-sm text-black border-b border-stone-300 pb-2 mb-4">Mijn opnamen</p>
          <div className="space-y-3">
            {recordings.map(r => (
              <RecordingCard key={r.id} recording={r} spaceId={spaceId} />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
