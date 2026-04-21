'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

function fireEdgeFunction(recordingId: string, jobId: string, spaceId: string) {
  const admin = createAdminClient()
  admin.functions.invoke('generate-voice-recording', {
    body: { recording_id: recordingId, job_id: jobId, space_id: spaceId },
  }).catch((err) => console.error('[generate-voice-recording] invoke error:', err))
}

export async function cloneVoice(formData: FormData): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const spaceId = formData.get('space_id') as string
  const displayName = (formData.get('display_name') as string)?.trim()
  const file = formData.get('sample') as File

  if (!file || file.size === 0) return { error: 'Geen bestand geselecteerd' }
  if (!displayName) return { error: 'Naam is verplicht' }

  const { data: membership } = await supabase
    .from('memorial_space_members')
    .select('id')
    .eq('memorial_space_id', spaceId)
    .eq('user_id', user.id)
    .not('accepted_at', 'is', null)
    .maybeSingle()

  if (!membership) return { error: 'Geen toegang tot deze ruimte' }

  const apiKey = process.env.ELEVENLABS_API_KEY
  if (!apiKey) return { error: 'Spraaksynthese niet geconfigureerd' }

  const admin = createAdminClient()
  const ext = file.name.split('.').pop() ?? 'mp3'
  const samplePath = `${spaceId}/${crypto.randomUUID()}.${ext}`

  const fileBytes = await file.arrayBuffer()

  const { error: uploadErr } = await admin.storage
    .from('voice-samples')
    .upload(samplePath, fileBytes, { contentType: file.type || 'audio/mpeg' })

  if (uploadErr) return { error: `Upload mislukt: ${uploadErr.message}` }

  const elForm = new FormData()
  elForm.append('name', displayName)
  elForm.append('files', new Blob([fileBytes], { type: file.type || 'audio/mpeg' }), file.name)

  const elRes = await fetch('https://api.elevenlabs.io/v1/voices/add', {
    method: 'POST',
    headers: { 'xi-api-key': apiKey },
    body: elForm,
  })

  if (!elRes.ok) {
    const err = await elRes.text()
    console.error('[cloneVoice] ElevenLabs error:', err)
    await admin.storage.from('voice-samples').remove([samplePath])
    return { error: 'Stem klonen mislukt. Controleer of het audiobestand lang genoeg is (minimaal 1 minuut).' }
  }

  const { voice_id } = await elRes.json()

  const { error: insertErr } = await admin.from('cloned_voices').insert({
    memorial_space_id: spaceId,
    uploaded_by: user.id,
    display_name: displayName,
    elevenlabs_voice_id: voice_id,
    sample_storage_path: samplePath,
  })

  if (insertErr) {
    console.error('[cloneVoice] insert error:', insertErr)
    return { error: `Database fout: ${insertErr.message}` }
  }

  revalidatePath(`/spaces/${spaceId}/voice`)
  return {}
}

export async function deleteClonedVoice(formData: FormData): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const spaceId = formData.get('space_id') as string
  const voiceRowId = formData.get('voice_id') as string

  const admin = createAdminClient()
  const { data: voice } = await admin
    .from('cloned_voices')
    .select('elevenlabs_voice_id, sample_storage_path, uploaded_by')
    .eq('id', voiceRowId)
    .single()

  if (!voice || voice.uploaded_by !== user.id) return { error: 'Geen toegang' }

  const apiKey = process.env.ELEVENLABS_API_KEY
  if (apiKey) {
    await fetch(`https://api.elevenlabs.io/v1/voices/${voice.elevenlabs_voice_id}`, {
      method: 'DELETE',
      headers: { 'xi-api-key': apiKey },
    }).catch((err) => console.error('[deleteClonedVoice] ElevenLabs delete error:', err))
  }

  await admin.storage.from('voice-samples').remove([voice.sample_storage_path])
  await admin.from('cloned_voices').delete().eq('id', voiceRowId)

  revalidatePath(`/spaces/${spaceId}/voice`)
  return {}
}

export async function startVoiceGeneration(formData: FormData): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const spaceId = formData.get('space_id') as string
  const text = (formData.get('text') as string)?.trim()
  const voiceId = formData.get('voice_id') as string
  const voiceSource = formData.get('voice_source') as 'preset' | 'cloned'
  const sourceType = formData.get('source_type') as 'eulogy' | 'collective_eulogy' | 'custom_text'
  const sourceEulogyVersionId = (formData.get('source_eulogy_version_id') as string) || null

  if (!text) return { error: 'Geen tekst opgegeven' }
  if (!voiceId) return { error: 'Geen stem geselecteerd' }

  const admin = createAdminClient()

  const { data: recording, error: recErr } = await admin
    .from('voice_recordings')
    .insert({
      memorial_space_id: spaceId,
      created_by: user.id,
      source_type: sourceType,
      source_eulogy_version_id: sourceEulogyVersionId,
      input_text: text,
      voice_id: voiceId,
      voice_source: voiceSource,
      status: 'pending',
    })
    .select('id')
    .single()

  if (recErr || !recording) return { error: `Database fout: ${recErr?.message}` }

  const { data: job, error: jobErr } = await admin
    .from('generation_jobs')
    .insert({
      memorial_space_id: spaceId,
      job_type: 'voice_generate',
      target_id: recording.id,
      status: 'pending',
      triggered_by_user_id: user.id,
    })
    .select('id')
    .single()

  if (jobErr || !job) return { error: `Job aanmaken mislukt: ${jobErr?.message}` }

  fireEdgeFunction(recording.id, job.id, spaceId)
  revalidatePath(`/spaces/${spaceId}/voice`)
  return {}
}

export async function deleteVoiceRecording(formData: FormData): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const spaceId = formData.get('space_id') as string
  const recordingId = formData.get('recording_id') as string

  const admin = createAdminClient()
  const { data: recording } = await admin
    .from('voice_recordings')
    .select('result_storage_path, created_by')
    .eq('id', recordingId)
    .single()

  if (!recording || recording.created_by !== user.id) return { error: 'Geen toegang' }

  if (recording.result_storage_path) {
    await admin.storage.from('voice-recordings').remove([recording.result_storage_path])
  }

  await admin.from('voice_recordings').delete().eq('id', recordingId)

  revalidatePath(`/spaces/${spaceId}/voice`)
  return {}
}
