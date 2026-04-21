import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect, notFound } from 'next/navigation'
import PhotoUpload from './PhotoUpload'
import PhotoCard from './PhotoCard'
import PhotoPoller from './PhotoPoller'

type Artwork = {
  id: string
  category: string
  style: string
  upscale: boolean
  status: string
  error_message: string | null
  original_storage_path: string
  result_storage_path: string | null
}

async function signedUrl(path: string): Promise<string> {
  const admin = createAdminClient()
  const { data } = await admin.storage
    .from('photos')
    .createSignedUrl(path, 3600)
  return data?.signedUrl ?? ''
}

export default async function PhotoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: space } = await supabase
    .from('memorial_spaces')
    .select('id, deceased_first_name, deceased_nickname, deceased_last_name')
    .eq('id', id)
    .single()

  if (!space) notFound()

  const name = [
    space.deceased_first_name,
    space.deceased_nickname ? `"${space.deceased_nickname}"` : null,
    space.deceased_last_name,
  ].filter(Boolean).join(' ')

  const admin = createAdminClient()
  const { data: artworks } = await admin
    .from('photo_artworks')
    .select('id, category, style, upscale, status, error_message, original_storage_path, result_storage_path')
    .eq('memorial_space_id', id)
    .order('created_at', { ascending: false }) as { data: Artwork[] | null }

  const artworksWithUrls = await Promise.all(
    (artworks ?? []).map(async (a) => ({
      ...a,
      original_url: await signedUrl(a.original_storage_path),
      result_url: a.result_storage_path ? await signedUrl(a.result_storage_path) : null,
    }))
  )

  const hasProcessing = artworksWithUrls.some(a => a.status === 'pending' || a.status === 'processing')

  return (
    <main className="min-h-screen py-12 px-4" style={{ backgroundColor: '#FFF1E5' }}>
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <a href={`/spaces/${id}`} className="text-xs text-black hover:underline">
            ← Terug naar overzicht
          </a>
          <h1 className="text-2xl text-black mt-2">{name}</h1>
          <p className="text-sm text-black mt-1">Foto's</p>
        </div>

        <PhotoPoller hasProcessing={hasProcessing} />
        <PhotoUpload spaceId={id} />

        {artworksWithUrls.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {artworksWithUrls.map(artwork => (
              <PhotoCard key={artwork.id} artwork={artwork} spaceId={id} />
            ))}
          </div>
        )}

        {artworksWithUrls.length === 0 && (
          <p className="text-sm text-stone-500">
            Nog geen foto's verwerkt. Kies een tool hierboven en upload een foto.
          </p>
        )}
      </div>
    </main>
  )
}
