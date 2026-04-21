'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

function fireEdgeFunction(artworkId: string, spaceId: string) {
  const admin = createAdminClient()
  admin.functions.invoke('process-photo', {
    body: { artwork_id: artworkId, space_id: spaceId },
  }).catch((err) => console.error('[process-photo] invoke error:', err))
}

export async function uploadPhoto(formData: FormData): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const spaceId = formData.get('space_id') as string
  const category = formData.get('category') as string
  const style = formData.get('style') as string
  const upscale = formData.get('upscale') === 'true'
  const file = formData.get('photo') as File

  if (!file || file.size === 0) return { error: 'Geen bestand geselecteerd' }

  const ext = file.name.split('.').pop() ?? 'jpg'
  const tempId = crypto.randomUUID()
  const originalPath = `${spaceId}/${tempId}/original.${ext}`

  const admin = createAdminClient()
  const { error: uploadErr } = await admin.storage
    .from('photos')
    .upload(originalPath, await file.arrayBuffer(), {
      contentType: file.type || 'image/jpeg',
    })

  if (uploadErr) {
    console.error('[uploadPhoto] storage error:', uploadErr)
    return { error: `Opslaan mislukt: ${uploadErr.message}` }
  }

  const { data: artwork, error: insertErr } = await admin
    .from('photo_artworks')
    .insert({
      id: tempId,
      memorial_space_id: spaceId,
      uploaded_by: user.id,
      original_storage_path: originalPath,
      category,
      style,
      upscale,
    })
    .select('id')
    .single()

  if (insertErr || !artwork) {
    console.error('[uploadPhoto] insert error:', insertErr)
    return { error: `Database fout: ${insertErr?.message}` }
  }

  fireEdgeFunction(artwork.id, spaceId)
  redirect(`/spaces/${spaceId}/photo`)
}

export async function deleteArtwork(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const spaceId = formData.get('space_id') as string
  const artworkId = formData.get('artwork_id') as string

  const admin = createAdminClient()

  const { data: artwork } = await admin
    .from('photo_artworks')
    .select('original_storage_path, result_storage_path')
    .eq('id', artworkId)
    .single()

  if (artwork) {
    const paths = [artwork.original_storage_path, artwork.result_storage_path].filter(Boolean)
    if (paths.length > 0) {
      await admin.storage.from('photos').remove(paths)
    }
  }

  await admin
    .from('photo_artworks')
    .delete()
    .eq('id', artworkId)

  revalidatePath(`/spaces/${spaceId}/photo`)
}
