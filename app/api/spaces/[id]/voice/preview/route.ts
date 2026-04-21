import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { ELEVENLABS_LANGUAGE_CODE, ELEVENLABS_MODEL, PREVIEW_MAX_CHARS } from '@/lib/config/voice'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: spaceId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new NextResponse('Unauthorized', { status: 401 })

  const { data: space } = await supabase
    .from('memorial_spaces')
    .select('id')
    .eq('id', spaceId)
    .single()
  if (!space) return new NextResponse('Not found', { status: 404 })

  const body = await req.json()
  const text: string = body.text
  const voiceId: string = body.voice_id
  if (!text?.trim() || !voiceId) {
    return new NextResponse('Missing text or voice_id', { status: 400 })
  }

  const apiKey = process.env.ELEVENLABS_API_KEY
  if (!apiKey) return new NextResponse('Spraaksynthese niet geconfigureerd', { status: 503 })

  const previewText = text.trim().slice(0, PREVIEW_MAX_CHARS)

  const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
    method: 'POST',
    headers: {
      'xi-api-key': apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      text: previewText,
      model_id: ELEVENLABS_MODEL,
      language_code: ELEVENLABS_LANGUAGE_CODE,
      voice_settings: { stability: 0.5, similarity_boost: 0.75 },
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    console.error('[voice/preview] ElevenLabs error:', err)
    return new NextResponse('Voorvertoning mislukt', { status: 502 })
  }

  const audio = await res.arrayBuffer()
  return new NextResponse(audio, {
    headers: { 'Content-Type': 'audio/mpeg' },
  })
}
