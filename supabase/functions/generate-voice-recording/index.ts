import { createClient } from 'npm:@supabase/supabase-js'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

const ELEVENLABS_API_KEY = Deno.env.get('ELEVENLABS_API_KEY')!
const ELEVENLABS_MODEL = 'eleven_v3'
const ELEVENLABS_LANGUAGE_CODE = 'nl'

Deno.serve(async (req) => {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 })

  let recordingId: string, jobId: string, spaceId: string
  try {
    const body = await req.json()
    recordingId = body.recording_id
    jobId = body.job_id
    spaceId = body.space_id
    if (!recordingId || !jobId || !spaceId) throw new Error('Missing recording_id, job_id, or space_id')
  } catch (e) {
    return new Response(String(e), { status: 400 })
  }

  const { data: recording } = await supabase
    .from('voice_recordings')
    .select('*')
    .eq('id', recordingId)
    .single()

  if (!recording) return new Response('Recording not found', { status: 404 })

  await Promise.all([
    supabase.from('voice_recordings').update({ status: 'processing' }).eq('id', recordingId),
    supabase.from('generation_jobs').update({ status: 'processing' }).eq('id', jobId),
  ])

  try {
    const ttsRes = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${recording.voice_id}`, {
      method: 'POST',
      headers: {
        'xi-api-key': ELEVENLABS_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: recording.input_text,
        model_id: ELEVENLABS_MODEL,
        language_code: ELEVENLABS_LANGUAGE_CODE,
        voice_settings: { stability: 0.75, similarity_boost: 0.75 },
      }),
    })

    if (!ttsRes.ok) {
      const err = await ttsRes.text()
      throw new Error(`ElevenLabs TTS error (${ttsRes.status}): ${err}`)
    }

    const audioBuf = await ttsRes.arrayBuffer()
    const storagePath = `${spaceId}/${recordingId}.mp3`

    const { error: uploadErr } = await supabase.storage
      .from('voice-recordings')
      .upload(storagePath, audioBuf, { contentType: 'audio/mpeg', upsert: true })

    if (uploadErr) throw new Error(`Storage upload failed: ${uploadErr.message}`)

    await Promise.all([
      supabase
        .from('voice_recordings')
        .update({ status: 'done', result_storage_path: storagePath })
        .eq('id', recordingId),
      supabase
        .from('generation_jobs')
        .update({ status: 'done', completed_at: new Date().toISOString() })
        .eq('id', jobId),
    ])

    return new Response(JSON.stringify({ ok: true }), {
      headers: { 'Content-Type': 'application/json' },
    })

  } catch (err) {
    console.error('[generate-voice-recording] error:', err)
    await Promise.all([
      supabase.from('voice_recordings').update({ status: 'failed' }).eq('id', recordingId),
      supabase
        .from('generation_jobs')
        .update({ status: 'failed', error_message: String(err) })
        .eq('id', jobId),
    ])
    return new Response(String(err), { status: 500 })
  }
})
