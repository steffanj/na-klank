'use client'

import { useState, useRef, useEffect } from 'react'

const SAMPLE_TEXT = `Mijn naam is [naam], en dit is een stemopname voor de Na-klank applicatie. Ik lees deze tekst voor zodat mijn stem goed herkend kan worden.

Het leven bestaat uit grote en kleine momenten. Soms zijn het de kleine dingen die het meest bijblijven: een glimlach op het juiste moment, een warm gesprek aan tafel, of een wandeling in de vroege ochtend terwijl de wereld nog stil is.

We herinneren ons mensen niet alleen door wat ze deden, maar door hoe ze ons lieten voelen. Door de manier waarop ze luisterden, vroegen, zorgden. Door hun stem, hun lach, hun aanwezigheid.

Afscheid nemen is moeilijk. Maar woorden kunnen iets bewaren wat anders verdwijnt. Ze kunnen een brug slaan tussen nu en straks, tussen wie iemand was en hoe we hem of haar willen herinneren.

Dit is mijn stem. Ik hoop dat ze mag klinken zoals ik bedoel: oprecht, warm, en vol zorg voor degene aan wie dit afscheidswoord is gewijd.`

function mimeToExtension(mime: string): string {
  if (mime.includes('ogg')) return 'ogg'
  if (mime.includes('mp4') || mime.includes('m4a')) return 'm4a'
  return 'webm'
}

function formatTime(s: number): string {
  const m = Math.floor(s / 60)
  const sec = s % 60
  return `${m}:${sec.toString().padStart(2, '0')}`
}

type State = 'idle' | 'requesting' | 'recording' | 'recorded' | 'error'

export default function VoiceRecorder({
  onRecorded,
}: {
  onRecorded: (file: File) => void
}) {
  const [state, setState] = useState<State>('idle')
  const [errorMsg, setErrorMsg] = useState('')
  const [seconds, setSeconds] = useState(0)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const streamRef = useRef<MediaStream | null>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const audioBlobRef = useRef<Blob | null>(null)
  // Track blob URL in a ref so cleanup never captures a stale closure value
  const audioUrlRef = useRef<string | null>(null)

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
      if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop())
      if (audioUrlRef.current) URL.revokeObjectURL(audioUrlRef.current)
    }
  }, []) // unmount only — avoids Strict Mode double-cleanup revoking a fresh blob URL

  async function startRecording() {
    setState('requesting')
    setErrorMsg('')

    let stream: MediaStream
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    } catch {
      setState('error')
      setErrorMsg('Microfoon toegang geweigerd. Sta toegang toe in je browserinstellingen en probeer opnieuw.')
      return
    }

    streamRef.current = stream
    chunksRef.current = []
    setSeconds(0)

    const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
      ? 'audio/webm;codecs=opus'
      : MediaRecorder.isTypeSupported('audio/ogg;codecs=opus')
        ? 'audio/ogg;codecs=opus'
        : ''

    const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined)
    mediaRecorderRef.current = recorder

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data)
    }

    recorder.onstop = () => {
      stream.getTracks().forEach(t => t.stop())
      if (timerRef.current) clearInterval(timerRef.current)

      const blob = new Blob(chunksRef.current, { type: recorder.mimeType || 'audio/webm' })
      audioBlobRef.current = blob

      if (audioUrlRef.current) URL.revokeObjectURL(audioUrlRef.current)
      const url = URL.createObjectURL(blob)
      audioUrlRef.current = url
      setAudioUrl(url)
      setState('recorded')
    }

    recorder.start(250)
    setState('recording')

    timerRef.current = setInterval(() => setSeconds(s => s + 1), 1000)
  }

  function stopRecording() {
    mediaRecorderRef.current?.stop()
  }

  function reset() {
    if (audioUrlRef.current) URL.revokeObjectURL(audioUrlRef.current)
    audioUrlRef.current = null
    setAudioUrl(null)
    audioBlobRef.current = null
    setSeconds(0)
    setState('idle')
  }

  function useRecording() {
    if (!audioBlobRef.current) return
    const blob = audioBlobRef.current
    const ext = mimeToExtension(blob.type)
    const file = new File([blob], `opname.${ext}`, { type: blob.type })
    onRecorded(file)
  }

  return (
    <div className="space-y-4">
      {/* Sample text */}
      <div>
        <p className="text-xs text-stone-500 mb-2">
          Lees de onderstaande tekst voor op een rustige plek. Een opname van minimaal één minuut geeft de beste kwaliteit.
        </p>
        <div
          className="border border-stone-200 rounded-xl px-4 py-3 text-sm text-black leading-relaxed whitespace-pre-wrap max-h-52 overflow-y-auto"
          style={{ backgroundColor: 'white' }}
        >
          {SAMPLE_TEXT}
        </div>
      </div>

      {/* Controls */}
      {state === 'idle' && (
        <button
          type="button"
          onClick={startRecording}
          className="flex items-center gap-2 px-4 py-2.5 text-sm bg-stone-800 text-white rounded-lg hover:bg-stone-700 transition-colors"
        >
          <span className="w-2.5 h-2.5 rounded-full bg-red-400" />
          Opname starten
        </button>
      )}

      {state === 'requesting' && (
        <p className="text-sm text-stone-500">Microfoon toegang vragen…</p>
      )}

      {state === 'recording' && (
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
            <span className="text-sm text-black font-mono">{formatTime(seconds)}</span>
          </div>
          <button
            type="button"
            onClick={stopRecording}
            className="px-4 py-2 text-sm border border-stone-300 text-black rounded-lg hover:border-stone-400 transition-colors"
            style={{ backgroundColor: '#FFF8F2' }}
          >
            Opname stoppen
          </button>
          {seconds < 60 && (
            <span className="text-xs text-amber-700">
              Nog {formatTime(60 - seconds)} voor minimale kwaliteit
            </span>
          )}
        </div>
      )}

      {state === 'recorded' && audioUrl && (
        <div className="space-y-3">
          <audio src={audioUrl} controls className="w-full h-10" style={{ accentColor: '#292524' }} />
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={useRecording}
              className="px-4 py-2 text-sm bg-stone-800 text-white rounded-lg hover:bg-stone-700 transition-colors"
            >
              Deze opname gebruiken
            </button>
            <button
              type="button"
              onClick={reset}
              className="px-4 py-2 text-sm border border-stone-300 text-black rounded-lg hover:border-stone-400 transition-colors"
              style={{ backgroundColor: '#FFF8F2' }}
            >
              Opnieuw opnemen
            </button>
          </div>
          {seconds < 60 && (
            <p className="text-xs text-amber-700">
              De opname is korter dan één minuut. De kwaliteit kan tegenvallen. Je kunt opnieuw opnemen of toch doorgaan.
            </p>
          )}
        </div>
      )}

      {state === 'error' && (
        <p className="text-xs text-red-600">{errorMsg}</p>
      )}
    </div>
  )
}
