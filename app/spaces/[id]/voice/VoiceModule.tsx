'use client'

import { useState, useRef, useEffect } from 'react'
import { PRESET_VOICES } from '@/lib/config/voice'
import { cloneVoice, deleteClonedVoice, startVoiceGeneration } from './actions'
import RecordingCard from './RecordingCard'
import VoiceRecorder from './VoiceRecorder'

type ClonedVoice = {
  id: string
  display_name: string
  elevenlabs_voice_id: string
  uploaded_by: string
}

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
  userId,
  eulogyText,
  eulogyVersionId,
  collectiveEulogyText,
  clonedVoices,
  recordings,
}: {
  spaceId: string
  userId: string
  eulogyText: string | null
  eulogyVersionId: string | null
  collectiveEulogyText: string | null
  clonedVoices: ClonedVoice[]
  recordings: Recording[]
}) {
  const availableSources: { key: TextSource; label: string; text: string | null }[] = [
    ...(eulogyText ? [{ key: 'eulogy' as TextSource, label: 'Mijn afscheidswoord', text: eulogyText }] : []),
    ...(collectiveEulogyText ? [{ key: 'collective_eulogy' as TextSource, label: 'Gezamenlijk afscheidswoord', text: collectiveEulogyText }] : []),
    { key: 'custom_text' as TextSource, label: 'Eigen tekst', text: null },
  ]

  const defaultSource = availableSources[0].key
  const [selectedSource, setSelectedSource] = useState<TextSource>(defaultSource)
  const [customText, setCustomText] = useState('')
  const [selectedVoiceId, setSelectedVoiceId] = useState(PRESET_VOICES[0].id)
  const [selectedVoiceSource, setSelectedVoiceSource] = useState<'preset' | 'cloned'>('preset')

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

  const [cloneOpen, setCloneOpen] = useState(false)
  const [cloneInputMode, setCloneInputMode] = useState<'record' | 'upload'>('record')
  const [recordedFile, setRecordedFile] = useState<File | null>(null)
  const [cloneState, setCloneState] = useState<'idle' | 'submitting' | 'error'>('idle')
  const [cloneError, setCloneError] = useState('')

  const currentSourceObj = availableSources.find(s => s.key === selectedSource)!
  const activeText = selectedSource === 'custom_text' ? customText : (currentSourceObj.text ?? '')

  function selectVoice(id: string, source: 'preset' | 'cloned') {
    setSelectedVoiceId(id)
    setSelectedVoiceSource(source)
    setPreviewState('idle')
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
      setPreviewUrl(null)
    }
  }

  async function handlePreview() {
    setPreviewError('')
    if (previewUrl && previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(previewUrl)
      setPreviewUrl(null)
    }

    // Preset voice: play the pre-generated static sample — no API call
    if (selectedVoiceSource === 'preset') {
      const preset = PRESET_VOICES.find(v => v.id === selectedVoiceId)
      if (preset) {
        setPreviewUrl(preset.previewPath)
        setPreviewState('ready')
      }
      return
    }

    // Cloned voice: call ElevenLabs with a short excerpt
    if (!activeText.trim()) return
    setPreviewState('loading')

    const res = await fetch(`/api/spaces/${spaceId}/voice/preview`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: activeText, voice_id: selectedVoiceId }),
    })

    if (!res.ok) {
      const msg = await res.text()
      setPreviewError(msg || 'Voorvertoning mislukt')
      setPreviewState('error')
      return
    }

    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    setPreviewUrl(url)
    setPreviewState('ready')
  }

  async function handleGenerate() {
    if (!activeText.trim() || !selectedVoiceId) return
    setGenerateState('submitting')
    setGenerateError('')

    const fd = new FormData()
    fd.append('space_id', spaceId)
    fd.append('text', activeText)
    fd.append('voice_id', selectedVoiceId)
    fd.append('voice_source', selectedVoiceSource)
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

  async function handleCloneSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setCloneState('submitting')
    setCloneError('')

    const fd = new FormData(e.currentTarget)
    fd.append('space_id', spaceId)

    if (cloneInputMode === 'record') {
      if (!recordedFile) {
        setCloneError('Maak eerst een opname.')
        setCloneState('error')
        return
      }
      fd.set('sample', recordedFile, recordedFile.name)
    }

    const result = await cloneVoice(fd)
    if (result?.error) {
      setCloneError(result.error)
      setCloneState('error')
    } else {
      setCloneState('idle')
      setCloneOpen(false)
      setRecordedFile(null)
      ;(e.target as HTMLFormElement).reset()
    }
  }

  async function handleDeleteClone(voiceRowId: string) {
    if (!confirm('Weet je zeker dat je deze gekloonde stem wilt verwijderen?')) return
    const fd = new FormData()
    fd.append('space_id', spaceId)
    fd.append('voice_id', voiceRowId)
    await deleteClonedVoice(fd)
  }

  const selectedVoiceLabel = selectedVoiceSource === 'preset'
    ? (PRESET_VOICES.find(v => v.id === selectedVoiceId)?.name ?? selectedVoiceId)
    : (clonedVoices.find(v => v.elevenlabs_voice_id === selectedVoiceId)?.display_name ?? selectedVoiceId)

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
              className={`px-4 py-2 text-sm rounded-lg border transition-colors ${
                selectedSource === s.key
                  ? 'bg-stone-800 text-white border-stone-800'
                  : 'border-stone-300 text-black hover:border-stone-400'
              }`}
              style={selectedSource !== s.key ? { backgroundColor: '#FFF8F2' } : undefined}
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

        {PRESET_VOICES.length > 0 && (
          <div className="mb-3">
            <p className="text-xs text-stone-500 mb-2">Standaard stemmen</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {PRESET_VOICES.map(voice => (
                <button
                  key={voice.id}
                  onClick={() => selectVoice(voice.id, 'preset')}
                  className={`px-3 py-2.5 text-left rounded-lg border transition-colors ${
                    selectedVoiceSource === 'preset' && selectedVoiceId === voice.id
                      ? 'bg-stone-800 text-white border-stone-800'
                      : 'border-stone-300 text-black hover:border-stone-400'
                  }`}
                  style={!(selectedVoiceSource === 'preset' && selectedVoiceId === voice.id) ? { backgroundColor: '#FFF8F2' } : undefined}
                >
                  <p className="text-sm">{voice.name}</p>
                  <p className={`text-xs mt-0.5 ${selectedVoiceSource === 'preset' && selectedVoiceId === voice.id ? 'text-stone-300' : 'text-stone-500'}`}>
                    {voice.description}
                  </p>
                </button>
              ))}
            </div>
          </div>
        )}

        {clonedVoices.length > 0 && (
          <div className="mb-3">
            <p className="text-xs text-stone-500 mb-2">Gekloonde stemmen</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {clonedVoices.map(voice => (
                <div key={voice.id} className="relative">
                  <button
                    onClick={() => selectVoice(voice.elevenlabs_voice_id, 'cloned')}
                    className={`w-full px-3 py-2.5 text-left rounded-lg border transition-colors ${
                      selectedVoiceSource === 'cloned' && selectedVoiceId === voice.elevenlabs_voice_id
                        ? 'bg-stone-800 text-white border-stone-800'
                        : 'border-stone-300 text-black hover:border-stone-400'
                    }`}
                    style={!(selectedVoiceSource === 'cloned' && selectedVoiceId === voice.elevenlabs_voice_id) ? { backgroundColor: '#FFF8F2' } : undefined}
                  >
                    <p className="text-sm pr-6">{voice.display_name}</p>
                    <p className={`text-xs mt-0.5 ${selectedVoiceSource === 'cloned' && selectedVoiceId === voice.elevenlabs_voice_id ? 'text-stone-300' : 'text-stone-500'}`}>
                      Gekloond
                    </p>
                  </button>
                  {voice.uploaded_by === userId && (
                    <button
                      onClick={() => handleDeleteClone(voice.id)}
                      className="absolute top-2 right-2 text-xs text-stone-400 hover:text-red-600 transition-colors"
                      title="Verwijder gekloonde stem"
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Clone voice section */}
        <div className="border border-stone-200 rounded-xl overflow-hidden">
          <button
            onClick={() => setCloneOpen(o => !o)}
            className="w-full px-4 py-3 text-left text-sm text-black hover:bg-stone-50 transition-colors flex items-center justify-between"
            style={{ backgroundColor: '#FFF8F2' }}
          >
            <span>Eigen stem toevoegen</span>
            <span className="text-stone-400">{cloneOpen ? '−' : '+'}</span>
          </button>
          {cloneOpen && (
            <form onSubmit={handleCloneSubmit} className="px-4 pb-4 pt-3 border-t border-stone-200 space-y-4" style={{ backgroundColor: '#FFF8F2' }}>
              <input
                name="display_name"
                type="text"
                required
                placeholder="Naam (bijv. 'Mijn stem')"
                className="w-full px-3 py-2.5 text-sm border border-stone-300 rounded-lg text-black focus:outline-none focus:ring-2 focus:ring-stone-400"
                style={{ backgroundColor: 'white' }}
              />

              {/* Mode toggle */}
              <div className="flex gap-2">
                {(['record', 'upload'] as const).map(mode => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => { setCloneInputMode(mode); setRecordedFile(null) }}
                    className={`px-3 py-1.5 text-xs rounded-lg border transition-colors ${
                      cloneInputMode === mode
                        ? 'bg-stone-800 text-white border-stone-800'
                        : 'border-stone-300 text-black hover:border-stone-400'
                    }`}
                    style={cloneInputMode !== mode ? { backgroundColor: 'white' } : undefined}
                  >
                    {mode === 'record' ? 'Opnemen' : 'Bestand uploaden'}
                  </button>
                ))}
              </div>

              {cloneInputMode === 'record' ? (
                <div>
                  <VoiceRecorder onRecorded={(file) => setRecordedFile(file)} />
                  {recordedFile && (
                    <p className="text-xs text-green-700 mt-2">
                      Opname klaar: {recordedFile.name} ({(recordedFile.size / 1024).toFixed(0)} KB)
                    </p>
                  )}
                </div>
              ) : (
                <div>
                  <p className="text-xs text-stone-500 mb-2">
                    Geaccepteerde formaten: mp3, wav, m4a. Minimaal 1 minuut voor de beste kwaliteit.
                  </p>
                  <input
                    name="sample"
                    type="file"
                    accept="audio/mpeg,audio/mp3,audio/wav,audio/x-wav,audio/m4a,audio/mp4"
                    className="w-full text-sm text-stone-600 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-sm file:bg-stone-200 file:text-black hover:file:bg-stone-300"
                  />
                </div>
              )}

              {cloneError && <p className="text-xs text-red-600">{cloneError}</p>}
              <button
                type="submit"
                disabled={cloneState === 'submitting' || (cloneInputMode === 'record' && !recordedFile)}
                className="px-4 py-2 text-sm bg-stone-800 text-white rounded-lg hover:bg-stone-700 transition-colors disabled:opacity-50"
              >
                {cloneState === 'submitting' ? 'Stem klonen…' : 'Stem klonen'}
              </button>
            </form>
          )}
        </div>
      </section>

      {/* Preview + Generate */}
      <section>
        <p className="text-sm text-black border-b border-stone-300 pb-2 mb-4">Voorvertoning en genereren</p>

        <div className="flex flex-wrap gap-3 items-center mb-4">
          <button
            onClick={handlePreview}
            disabled={previewState === 'loading' || !activeText.trim()}
            className="px-4 py-2.5 text-sm border border-stone-300 rounded-lg text-black hover:border-stone-400 transition-colors disabled:opacity-50"
            style={{ backgroundColor: '#FFF8F2' }}
          >
            {previewState === 'loading' ? 'Laden…' : `Beluister preview — ${selectedVoiceLabel}`}
          </button>
          <button
            onClick={handleGenerate}
            disabled={generateState === 'submitting' || !activeText.trim() || !selectedVoiceId}
            className="px-4 py-2.5 text-sm bg-stone-800 text-white rounded-lg hover:bg-stone-700 transition-colors disabled:opacity-50"
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
