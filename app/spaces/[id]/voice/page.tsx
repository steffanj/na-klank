import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect, notFound } from 'next/navigation'
import { PRESET_VOICES } from '@/lib/config/voice'
import VoiceModule from './VoiceModule'
import VoicePoller from './VoicePoller'
import Toelichting from '@/app/components/Toelichting'

async function signedUrl(bucket: string, path: string): Promise<string> {
  const admin = createAdminClient()
  const { data } = await admin.storage.from(bucket).createSignedUrl(path, 3600)
  return data?.signedUrl ?? ''
}

export default async function VoicePage({ params }: { params: Promise<{ id: string }> }) {
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

  const firstName = space.deceased_first_name
  const name = [
    space.deceased_first_name,
    space.deceased_nickname ? `"${space.deceased_nickname}"` : null,
    space.deceased_last_name,
  ].filter(Boolean).join(' ')

  const admin = createAdminClient()

  // Load user's ready eulogy version
  const { data: eulogy } = await admin
    .from('eulogies')
    .select('current_version_id, status')
    .eq('memorial_space_id', id)
    .eq('author_user_id', user.id)
    .in('status', ['ready', 'finalized'])
    .maybeSingle()

  let eulogyText: string | null = null
  let eulogyVersionId: string | null = null

  if (eulogy?.current_version_id) {
    const { data: version } = await admin
      .from('eulogy_versions')
      .select('id, content')
      .eq('id', eulogy.current_version_id)
      .single()
    if (version) {
      eulogyText = version.content
      eulogyVersionId = version.id
    }
  }

  // Check if user is primary contact
  const { data: myMembership } = await supabase
    .from('memorial_space_members')
    .select('role')
    .eq('memorial_space_id', id)
    .eq('user_id', user.id)
    .maybeSingle()

  const isPrimaryContact = myMembership?.role === 'primary_contact'

  // Load collective eulogy if ready
  const { data: collectiveEulogy } = await admin
    .from('collective_eulogies')
    .select('current_version_id, status')
    .eq('memorial_space_id', id)
    .in('status', ['ready', 'finalized'])
    .maybeSingle()

  let collectiveEulogyText: string | null = null

  if (collectiveEulogy?.current_version_id) {
    const { data: version } = await admin
      .from('collective_eulogy_versions')
      .select('content')
      .eq('id', collectiveEulogy.current_version_id)
      .single()
    if (version && isPrimaryContact) collectiveEulogyText = version.content
  }

  // Load cloned voices for this space
  const { data: clonedVoices } = await admin
    .from('cloned_voices')
    .select('id, display_name, elevenlabs_voice_id, uploaded_by')
    .eq('memorial_space_id', id)
    .order('created_at', { ascending: false }) as { data: Array<{
      id: string
      display_name: string
      elevenlabs_voice_id: string
      uploaded_by: string
    }> | null }

  // Load this user's voice recordings for this space
  const { data: rawRecordings } = await admin
    .from('voice_recordings')
    .select('id, source_type, voice_id, voice_source, status, result_storage_path, created_at')
    .eq('memorial_space_id', id)
    .eq('created_by', user.id)
    .order('created_at', { ascending: false }) as { data: Array<{
      id: string
      source_type: string
      voice_id: string
      voice_source: string
      status: string
      result_storage_path: string | null
      created_at: string
    }> | null }

  const recordings = await Promise.all(
    (rawRecordings ?? []).map(async (r) => {
      const presetVoice = PRESET_VOICES.find(v => v.id === r.voice_id)
      const clonedVoice = (clonedVoices ?? []).find(v => v.elevenlabs_voice_id === r.voice_id)
      const voiceLabel = presetVoice?.name ?? clonedVoice?.display_name ?? r.voice_id

      return {
        ...r,
        voice_label: voiceLabel,
        result_url: r.result_storage_path
          ? await signedUrl('voice-recordings', r.result_storage_path)
          : null,
      }
    })
  )

  const hasProcessing = recordings.some(r => r.status === 'pending' || r.status === 'processing')

  return (
    <main className="min-h-screen py-12 px-4" style={{ backgroundColor: '#FFF1E5' }}>
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <a href={`/spaces/${id}`} className="text-xs text-black hover:underline">
            ← Terug naar overzicht
          </a>
          <h1 className="text-2xl text-black mt-2">{name}</h1>
          <p className="text-sm text-black mt-1">Voorlezen</p>
        </div>

        <Toelichting>
          <p>Met deze tool laat je een afscheidswoord voorlezen in een synthetische stem.</p>
          <p>Kies een stem uit de lijst met beschikbare stemmen en beluister een kort voorbeeld. Selecteer daarna het afscheidswoord dat je wilt laten voorlezen — je persoonlijke afscheidswoord of het gezamenlijke afscheidswoord. Na-klank genereert een volledige geluidsopname die je kunt beluisteren en downloaden.</p>
          <p>Eerdere opnamen vind je onderaan de pagina onder <em>Mijn opnamen</em>.</p>
        </Toelichting>
        <VoicePoller hasProcessing={hasProcessing} />

        <VoiceModule
          spaceId={id}
          eulogyText={eulogyText}
          eulogyVersionId={eulogyVersionId}
          collectiveEulogyText={collectiveEulogyText}
          recordings={recordings}
        />

        <div className="mt-16 flex justify-center">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="48" height="48">
            <circle cx="32" cy="32" r="4" fill="#2C3E50"/>
            <circle cx="32" cy="32" r="11" fill="none" stroke="#2C3E50" strokeWidth="1.5" opacity="0.75"/>
            <circle cx="32" cy="32" r="19" fill="none" stroke="#2C3E50" strokeWidth="1.5" opacity="0.45"/>
            <circle cx="32" cy="32" r="27" fill="none" stroke="#2C3E50" strokeWidth="1.5" opacity="0.2"/>
          </svg>
        </div>
      </div>
    </main>
  )
}
