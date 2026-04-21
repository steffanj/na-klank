'use client'

import { useState } from 'react'
import { deleteVoiceRecording } from './actions'

const SOURCE_LABELS: Record<string, string> = {
  eulogy: 'Afscheidswoord',
  collective_eulogy: 'Gezamenlijk afscheidswoord',
  custom_text: 'Eigen tekst',
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

export default function RecordingCard({
  recording,
  spaceId,
}: {
  recording: Recording
  spaceId: string
}) {
  const [deleting, setDeleting] = useState(false)

  async function handleDelete() {
    if (!confirm('Weet je zeker dat je deze opname wilt verwijderen?')) return
    setDeleting(true)
    const fd = new FormData()
    fd.append('space_id', spaceId)
    fd.append('recording_id', recording.id)
    await deleteVoiceRecording(fd)
  }

  const date = new Date(recording.created_at).toLocaleDateString('nl-NL', {
    day: 'numeric', month: 'long', year: 'numeric',
  })

  return (
    <div
      className="border border-stone-300 rounded-xl px-5 py-4"
      style={{ backgroundColor: '#FFF8F2' }}
    >
      <div className="flex items-start justify-between gap-4 mb-3">
        <div>
          <p className="text-sm text-black">{SOURCE_LABELS[recording.source_type] ?? recording.source_type}</p>
          <p className="text-xs text-stone-500 mt-0.5">{recording.voice_label} · {date}</p>
        </div>
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="text-xs text-stone-400 hover:text-red-600 transition-colors shrink-0 disabled:opacity-50"
        >
          {deleting ? 'Verwijderen…' : 'Verwijder'}
        </button>
      </div>

      {recording.status === 'done' && recording.result_url ? (
        <audio
          controls
          src={recording.result_url}
          className="w-full h-10"
          style={{ accentColor: '#292524' }}
        />
      ) : recording.status === 'failed' ? (
        <p className="text-xs text-red-600">Genereren mislukt.</p>
      ) : (
        <p className="text-xs text-stone-500">Genereren…</p>
      )}
    </div>
  )
}
