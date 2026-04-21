import { createClient } from 'npm:@supabase/supabase-js'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

const REPLICATE_API_TOKEN = Deno.env.get('REPLICATE_API_TOKEN')!
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!

const ARTISTIC_STYLE_PROMPTS: Record<string, string> = {
  olieverf: 'Transform this photo into a detailed oil painting with rich, textured brushstrokes. Keep all subjects and composition identical.',
  aquarel: 'Transform this photo into a delicate watercolor painting with soft washes and flowing edges. Keep all subjects and composition identical.',
  potlood: 'Transform this photo into a detailed pencil sketch with fine linework and subtle shading. Keep all subjects and composition identical.',
  vintage: 'Transform this photo into a vintage poster illustration with a warm sepia-toned color palette and retro graphic style. Keep all subjects and composition identical.',
  impressionisme: 'Transform this photo into an impressionist painting in the style of Monet with visible expressive brushstrokes and soft light. Keep all subjects and composition identical.',
  sepia: 'Convert this photo to a warm sepia tone. Render the image in brown-golden greyscale tones as if it were an old historical photograph. Do not alter the composition, subjects, or any other aspect of the image.',
  zwart_wit: 'Convert this photo to black and white. Remove all color and render the image in greyscale tones. Do not alter the composition, subjects, or any other aspect of the image.',
}

async function toBase64DataUrl(buf: ArrayBuffer, mimeType: string): Promise<string> {
  const bytes = new Uint8Array(buf)
  let binary = ''
  const chunkSize = 8192
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize))
  }
  return `data:${mimeType};base64,${btoa(binary)}`
}

function imageDimensions(buf: ArrayBuffer): { width: number; height: number } | null {
  const b = new Uint8Array(buf)
  // PNG: signature 8 bytes, then IHDR chunk: 4 len + 4 type + 4 width + 4 height
  if (b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) {
    const w = (b[16] << 24) | (b[17] << 16) | (b[18] << 8) | b[19]
    const h = (b[20] << 24) | (b[21] << 16) | (b[22] << 8) | b[23]
    return { width: w, height: h }
  }
  // JPEG: scan for SOF markers (FF C0..C3, C5..C7, C9..CB, CD..CF)
  if (b[0] === 0xff && b[1] === 0xd8) {
    let i = 2
    while (i < b.length - 8) {
      if (b[i] !== 0xff) break
      const marker = b[i + 1]
      if ((marker >= 0xc0 && marker <= 0xc3) || (marker >= 0xc5 && marker <= 0xc7) ||
          (marker >= 0xc9 && marker <= 0xcb) || (marker >= 0xcd && marker <= 0xcf)) {
        const h = (b[i + 5] << 8) | b[i + 6]
        const w = (b[i + 7] << 8) | b[i + 8]
        return { width: w, height: h }
      }
      const len = (b[i + 2] << 8) | b[i + 3]
      i += 2 + len
    }
  }
  return null
}

function upscaleEnhanceModel(buf: ArrayBuffer): string {
  const dims = imageDimensions(buf)
  if (!dims) return 'Standard V2'
  const mp = (dims.width * dims.height) / 1_000_000
  if (mp < 1) return 'Low Resolution V2'
  if (mp > 4) return 'High Fidelity V2'
  return 'Standard V2'
}

async function storageDownload(path: string): Promise<{ buf: ArrayBuffer; mime: string }> {
  const { data, error } = await supabase.storage.from('photos').download(path)
  if (error || !data) throw new Error(`Storage download failed: ${path} — ${error?.message}`)
  const buf = await data.arrayBuffer()
  return { buf, mime: data.type || 'image/jpeg' }
}

async function storageDownloadToBase64(path: string): Promise<string> {
  const { buf, mime } = await storageDownload(path)
  return toBase64DataUrl(buf, mime)
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

  // Try the newer models endpoint first (works for official/deployment models)
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

  // Fall back: fetch the latest version hash and use the versioned endpoint
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

Deno.serve(async (req) => {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 })

  let artworkId: string
  let spaceId: string
  try {
    const body = await req.json()
    artworkId = body.artwork_id
    spaceId = body.space_id
    if (!artworkId || !spaceId) throw new Error('Missing artwork_id or space_id')
  } catch (e) {
    return new Response(String(e), { status: 400 })
  }

  const { data: artwork, error: fetchErr } = await supabase
    .from('photo_artworks')
    .select('*')
    .eq('id', artworkId)
    .single()

  if (fetchErr || !artwork) {
    return new Response('Artwork not found', { status: 404 })
  }

  await supabase
    .from('photo_artworks')
    .update({ status: 'processing' })
    .eq('id', artworkId)

  try {
    const { buf: imageBuf, mime: imageMime } = await storageDownload(artwork.original_storage_path)
    const imageBase64 = await toBase64DataUrl(imageBuf, imageMime)

    const webhookBase = `${SUPABASE_URL}/functions/v1/process-photo-webhook`
    const webhookUrl = `${webhookBase}?artwork_id=${artworkId}&space_id=${spaceId}&step=primary`

    let predictionId: string

    if (artwork.category === 'restoration' && artwork.style === 'enhance') {
      predictionId = await startPrediction('flux-kontext-apps/restore-image', {
        prompt: 'Restore this photo: remove scratches, dust, tears and damage. And colorize the photo.',
        input_image: imageBase64,
      }, webhookUrl)

    } else if (artwork.category === 'upscale') {
      predictionId = await startPrediction('topazlabs/image-upscale', {
        image: imageBase64,
        upscale_factor: '4x',
        enhance_model: upscaleEnhanceModel(imageBuf),
      }, webhookUrl)

    } else if (artwork.category === 'remove_background') {
      predictionId = await startPrediction('black-forest-labs/flux-kontext-pro', {
        prompt: 'Remove the background from this image, keeping only the main subject on a clean white background. Do not alter the subject in any way.',
        input_image: imageBase64,
      }, webhookUrl)

    } else if (artwork.category === 'artistic') {
      const prompt = ARTISTIC_STYLE_PROMPTS[artwork.style]
      if (!prompt) throw new Error(`Unknown artistic style: ${artwork.style}`)
      predictionId = await startPrediction('black-forest-labs/flux-kontext-pro', {
        prompt,
        input_image: imageBase64,
      }, webhookUrl)

    } else {
      throw new Error(`Unknown category/style: ${artwork.category}/${artwork.style}`)
    }

    await supabase
      .from('photo_artworks')
      .update({ replicate_prediction_id: predictionId })
      .eq('id', artworkId)

    return new Response(JSON.stringify({ ok: true, prediction_id: predictionId }), {
      headers: { 'Content-Type': 'application/json' },
    })

  } catch (err) {
    console.error('[process-photo] error:', err)
    await supabase
      .from('photo_artworks')
      .update({ status: 'failed', error_message: String(err) })
      .eq('id', artworkId)
    return new Response(String(err), { status: 500 })
  }
})
