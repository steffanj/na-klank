import { createClient } from 'npm:@supabase/supabase-js'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

const REPLICATE_API_TOKEN = Deno.env.get('REPLICATE_API_TOKEN')!
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!

async function toBase64DataUrl(buf: ArrayBuffer, mimeType: string): Promise<string> {
  const bytes = new Uint8Array(buf)
  let binary = ''
  const chunkSize = 8192
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize))
  }
  return `data:${mimeType};base64,${btoa(binary)}`
}

async function startPrediction(
  model: string,
  input: Record<string, unknown>,
  webhookUrl: string,
): Promise<string> {
  const headers = {
    Authorization: `Bearer ${REPLICATE_API_TOKEN}`,
    'Content-Type': 'application/json',
  }
  const webhookPayload = { webhook: webhookUrl, webhook_events_filter: ['completed'] }

  const modelsRes = await fetch(`https://api.replicate.com/v1/models/${model}/predictions`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ input, ...webhookPayload }),
  })
  if (modelsRes.ok) {
    const data = await modelsRes.json()
    return data.id as string
  }

  if (modelsRes.status !== 404) {
    const text = await modelsRes.text()
    throw new Error(`Replicate error (${modelsRes.status}): ${text}`)
  }

  const modelRes = await fetch(`https://api.replicate.com/v1/models/${model}`, {
    headers: { Authorization: `Bearer ${REPLICATE_API_TOKEN}` },
  })
  if (!modelRes.ok) throw new Error(`Cannot fetch model metadata for ${model}`)
  const modelData = await modelRes.json()
  const version = modelData.latest_version?.id
  if (!version) throw new Error(`No latest version found for ${model}`)

  const predRes = await fetch('https://api.replicate.com/v1/predictions', {
    method: 'POST',
    headers,
    body: JSON.stringify({ version, input, ...webhookPayload }),
  })
  if (!predRes.ok) {
    const text = await predRes.text()
    throw new Error(`Replicate error (${predRes.status}): ${text}`)
  }
  const data = await predRes.json()
  return data.id as string
}

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
  const step = url.searchParams.get('step') ?? 'primary'

  if (!artworkId || !spaceId) {
    return new Response('Missing artwork_id or space_id', { status: 400 })
  }

  let prediction: { status: string; output: unknown; error?: string }
  try {
    prediction = await req.json()
  } catch {
    return new Response('Invalid JSON', { status: 400 })
  }

  console.log(`[process-photo-webhook] artwork=${artworkId} step=${step} status=${prediction.status}`)

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
    const { data: artwork } = await supabase
      .from('photo_artworks')
      .select('upscale, category')
      .eq('id', artworkId)
      .single()

    const needsUpscale = artwork?.upscale && artwork?.category !== 'upscale' && step === 'primary'

    if (needsUpscale) {
      // Download primary result and start upscale prediction
      const res = await fetch(outputUrl)
      if (!res.ok) throw new Error(`Failed to fetch primary result: ${outputUrl}`)
      const buf = await res.arrayBuffer()
      const ct = res.headers.get('content-type') ?? 'image/jpeg'
      const imageBase64 = await toBase64DataUrl(buf, ct)

      const upscaleWebhook = `${SUPABASE_URL}/functions/v1/process-photo-webhook?artwork_id=${artworkId}&space_id=${spaceId}&step=upscale`
      const upscalePredId = await startPrediction('topazlabs/image-upscale', { image: imageBase64, scale: 4 }, upscaleWebhook)

      await supabase
        .from('photo_artworks')
        .update({ replicate_prediction_id: upscalePredId })
        .eq('id', artworkId)

      return new Response('ok')
    }

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
