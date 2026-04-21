'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { uploadPhoto } from './actions'

const TOOLS = [
  { category: 'restoration', style: 'enhance', label: 'Restaureren', description: 'Herstel beschadigde of vervaagde foto\'s én kleur ze in. Krassen, vlekken en scheuren worden verwijderd en zwart-witfoto\'s krijgen automatisch kleur.' },
  { category: 'upscale', style: 'upscale', label: 'Vergroten', description: 'Vergroot foto\'s zonder kwaliteitsverlies. Geschikt om kleine foto\'s groter te maken, of grote foto\'s verder te vergroten voor afdruk op groot formaat.' },
  { category: 'remove_background', style: 'remove_background', label: 'Achtergrond verwijderen', description: 'Verwijder de achtergrond van een foto zodat alleen het onderwerp overblijft, op een witte achtergrond.' },
  { category: 'artistic', style: '', label: 'Artistieke stijl', description: 'Vertaal een foto naar een schilderij of tekening in een gekozen kunststijl, zoals olieverf, aquarel of potlood.' },
]

const ARTISTIC_STYLES = [
  { key: 'olieverf', label: 'Olieverf' },
  { key: 'impressionisme', label: 'Impressionistisch' },
  { key: 'aquarel', label: 'Aquarel' },
  { key: 'potlood', label: 'Potlood' },
  { key: 'vintage', label: 'Vintage poster' },
  { key: 'sepia', label: 'Sepia' },
  { key: 'zwart_wit', label: 'Zwart/wit' },
]

export default function PhotoUpload({ spaceId }: { spaceId: string }) {
  const router = useRouter()
  const [selectedTool, setSelectedTool] = useState<(typeof TOOLS)[0] | null>(null)
  const [artisticStyle, setArtisticStyle] = useState('olieverf')
  const [preview, setPreview] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) setPreview(URL.createObjectURL(file))
  }

  function resetForm() {
    setSelectedTool(null)
    setArtisticStyle('olieverf')
    setPreview(null)
    if (fileRef.current) fileRef.current.value = ''
  }

  async function handleSubmit() {
    if (!selectedTool || !fileRef.current?.files?.[0]) return
    setSubmitting(true)
    setErrorMsg(null)
    const fd = new FormData()
    fd.set('space_id', spaceId)
    fd.set('category', selectedTool.category)
    fd.set('style', selectedTool.category === 'artistic' ? artisticStyle : selectedTool.style)
    fd.set('photo', fileRef.current.files[0])
    const result = await uploadPhoto(fd)
    setSubmitting(false)
    if (result?.error) {
      setErrorMsg(result.error)
      return
    }
    resetForm()
    router.refresh()
  }

  return (
    <div
      className="rounded-xl border border-stone-300 p-5 mb-6"
      style={{ backgroundColor: '#FFF8F2' }}
    >
      <p className="text-sm text-black mb-4">Nieuwe foto verwerken</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
        {TOOLS.map(tool => {
          const isSelected = selectedTool?.style === tool.style && selectedTool?.category === tool.category
          return (
            <button
              key={tool.style || tool.category}
              type="button"
              onClick={() => setSelectedTool(tool)}
              className={`text-left px-4 py-3 rounded-xl border transition-colors ${
                isSelected
                  ? 'border-stone-800 bg-stone-800 text-white'
                  : 'border-stone-300 text-black hover:border-stone-400'
              }`}
              style={isSelected ? {} : { backgroundColor: '#FFF1E5' }}
            >
              <p className="text-sm font-medium">{tool.label}</p>
              <p className={`text-xs mt-1 leading-relaxed ${isSelected ? 'text-stone-300' : 'text-stone-500'}`}>
                {tool.description}
              </p>
            </button>
          )
        })}
      </div>

      {selectedTool?.category === 'artistic' && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
          {ARTISTIC_STYLES.map(s => (
            <button
              key={s.key}
              type="button"
              onClick={() => setArtisticStyle(s.key)}
              className={`px-3 py-1.5 text-xs rounded-lg border transition-colors ${
                artisticStyle === s.key
                  ? 'bg-stone-600 text-white border-stone-600'
                  : 'border-stone-300 text-black hover:border-stone-400'
              }`}
              style={artisticStyle === s.key ? {} : { backgroundColor: '#FFF1E5' }}
            >
              {s.label}
            </button>
          ))}
        </div>
      )}

      {selectedTool && (
        <div>
          <div className="flex items-center gap-3">
            <label className="flex-1">
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                onChange={handleFile}
                className="block w-full text-xs text-black file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border file:border-stone-300 file:text-xs file:text-black file:bg-stone-50 hover:file:border-stone-400"
              />
            </label>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting || !preview}
              className="px-5 py-2.5 text-sm bg-stone-800 text-white rounded-lg hover:bg-stone-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
            >
              {submitting ? 'Bezig...' : 'Verwerken'}
            </button>
          </div>
          {preview && (
            <img
              src={preview}
              alt="Voorbeeld"
              className="mt-3 max-h-40 rounded-lg object-contain border border-stone-200"
            />
          )}
          {errorMsg && (
            <p className="mt-3 text-xs text-red-700">{errorMsg}</p>
          )}
        </div>
      )}
    </div>
  )
}
