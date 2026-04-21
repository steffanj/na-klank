'use client'

import { deleteArtwork } from './actions'

const TOOL_LABELS: Record<string, string> = {
  'restoration/enhance': 'Gerestaureerd',
  'upscale/upscale': 'Vergroot',
  'remove_background/remove_background': 'Achtergrond verwijderd',
  'artistic/olieverf': 'Olieverfschilderij',
  'artistic/aquarel': 'Aquarel',
  'artistic/potlood': 'Potloodschets',
  'artistic/vintage': 'Vintage poster',
  'artistic/impressionisme': 'Impressionisme',
}

type Props = {
  artwork: {
    id: string
    category: string
    style: string
    upscale: boolean
    status: string
    error_message: string | null
    original_url: string
    result_url: string | null
  }
  spaceId: string
}

async function downloadImage(url: string, filename: string) {
  const res = await fetch(url)
  const blob = await res.blob()
  const objectUrl = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = objectUrl
  a.download = filename
  a.click()
  URL.revokeObjectURL(objectUrl)
}

export default function PhotoCard({ artwork, spaceId }: Props) {
  const label = TOOL_LABELS[`${artwork.category}/${artwork.style}`] ?? artwork.style
  const displayUrl = artwork.status === 'done' && artwork.result_url
    ? artwork.result_url
    : artwork.original_url

  return (
    <div
      className="rounded-xl border border-stone-300 overflow-hidden"
      style={{ backgroundColor: '#FFF8F2' }}
    >
      <div className="relative">
        {artwork.status === 'done' ? (
          <img
            src={displayUrl}
            alt={label}
            className="w-full aspect-square object-cover"
          />
        ) : (
          <div
            className="w-full aspect-square flex flex-col items-center justify-center gap-2"
            style={{ backgroundColor: '#FFF1E5' }}
          >
            <img
              src={artwork.original_url}
              alt="Origineel"
              className="w-full h-full absolute inset-0 object-cover opacity-30"
            />
            <div className="relative z-10 text-center px-4">
              {artwork.status === 'failed' ? (
                <p className="text-xs text-red-700" title={artwork.error_message ?? undefined}>Verwerking mislukt</p>
              ) : (
                <>
                  <p className="text-xs text-black">Verwerken...</p>
                  <p className="text-xs text-stone-500 mt-1">{label}</p>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="px-4 py-3 flex items-center justify-between">
        <div>
          <p className="text-xs text-black">{label}</p>
          {artwork.upscale && artwork.category !== 'upscale' && (
            <p className="text-xs text-stone-500">+ vergroot</p>
          )}
        </div>
        <div className="flex items-center gap-3">
          {artwork.status === 'done' && artwork.result_url && (
            <button
              type="button"
              onClick={() => downloadImage(artwork.result_url!, `${label}.jpg`)}
              className="text-xs text-black underline"
            >
              Download
            </button>
          )}
          <form action={deleteArtwork}>
            <input type="hidden" name="space_id" value={spaceId} />
            <input type="hidden" name="artwork_id" value={artwork.id} />
            <button
              type="submit"
              className="text-xs text-stone-500 hover:text-red-700 transition-colors"
            >
              Verwijderen
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
