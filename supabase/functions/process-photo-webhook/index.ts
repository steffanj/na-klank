import { createClient } from 'npm:@supabase/supabase-js'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)


async function uploadResultToStorage(
  artworkId: string,
  spaceId: string,
  resultUrl: string,
  suffix = 'result',
): Promise<string> {
  const res = await fetch(resultUrl)
  if (!res.ok) throw new Error(`Failed to fetch result: ${resultUrl}`)
  const buf = await res.arrayBuffer()
  const ct = res.headers.get('content-type') ?? 'image/png'
  const ext = ct.includes('png') ? 'png' : ct.includes('webp') ? 'webp' : 'jpg'
  const path = `${spaceId}/${artworkId}/${suffix}.${ext}`
  const { error } = await supabase.storage.from('photos').upload(path, buf, {
    contentType: ct,
    upsert: true,
  })
  if (error) throw new Error(`Storage upload failed: ${error.message}`)
  return path
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 })

  const url = new URL(req.url)
  const artworkId = url.searchParams.get('artwork_id')
  const spaceId = url.searchParams.get('space_id')

  if (!artworkId || !spaceId) {
    return new Response('Missing artwork_id or space_id', { status: 400 })
  }

  let prediction: { status: string; output: unknown; error?: string }
  try {
    prediction = await req.json()
  } catch {
    return new Response('Invalid JSON', { status: 400 })
  }

  console.log(`[process-photo-webhook] artwork=${artworkId} status=${prediction.status}`)

  if (prediction.status === 'failed' || prediction.status === 'canceled') {
    await supabase
      .from('photo_artworks')
      .update({
        status: 'failed',
        error_message: prediction.error ?? `Replicate prediction ${prediction.status}`,
      })
      .eq('id', artworkId)
    return new Response('ok')
  }

  if (prediction.status !== 'succeeded') {
    return new Response('ok')
  }

  const outputUrl = Array.isArray(prediction.output) ? prediction.output[0] : prediction.output
  if (!outputUrl || typeof outputUrl !== 'string') {
    await supabase
      .from('photo_artworks')
      .update({ status: 'failed', error_message: 'No output URL in prediction' })
      .eq('id', artworkId)
    return new Response('ok')
  }

  try {
    const resultPath = await uploadResultToStorage(artworkId, spaceId, outputUrl)

    await supabase
      .from('photo_artworks')
      .update({ status: 'done', result_storage_path: resultPath })
      .eq('id', artworkId)

    return new Response('ok')

  } catch (err) {
    console.error('[process-photo-webhook] error:', err)
    await supabase
      .from('photo_artworks')
      .update({ status: 'failed', error_message: String(err) })
      .eq('id', artworkId)
    return new Response('ok')
  }
})
