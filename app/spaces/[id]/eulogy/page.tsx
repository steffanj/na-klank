import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { startEulogy } from './actions'
import EulogyIntakeForm from './EulogyIntakeForm'
import EulogyGenerating from './EulogyGenerating'
import EulogyEditor from './EulogyEditor'
import Toelichting from '@/app/components/Toelichting'

export default async function EulogyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: space } = await supabase
    .from('memorial_spaces')
    .select('id, deceased_first_name, deceased_nickname, deceased_last_name, deceased_age, deceased_profession, deceased_retired, funeral_date')
    .eq('id', id)
    .single()

  if (!space) notFound()

  const firstName = space.deceased_first_name
  const fullName = [
    space.deceased_first_name,
    space.deceased_nickname ? `"${space.deceased_nickname}"` : null,
    space.deceased_last_name,
  ].filter(Boolean).join(' ')

  const { data: eulogy } = await supabase
    .from('eulogies')
    .select('id, status, current_version_id')
    .eq('memorial_space_id', id)
    .eq('author_user_id', user.id)
    .maybeSingle()

  function Shell({ children }: { children: React.ReactNode }) {
    return (
      <main className="min-h-screen py-12 px-4" style={{ backgroundColor: '#FFF1E5' }}>
        <div className="max-w-2xl mx-auto">
          <a href={`/spaces/${id}`} className="text-sm text-black hover:text-black mb-8 inline-block">
            ← Terug
          </a>
          <div className="mb-8">
            <h1 className="text-3xl text-black">Afscheidswoord</h1>
            <p className="text-black text-sm mt-1">{fullName}</p>
          </div>
          <Toelichting>
            <p>Met deze tool stel je een persoonlijk afscheidswoord op voor {firstName}.</p>
            <p>Je beantwoordt een reeks vragen over {firstName} — over zijn of haar leven, karakter en herinneringen. Op basis van je antwoorden stelt Na-klank een eerste versie op. Je kunt de tekst daarna zelf aanpassen, opnieuw laten genereren of verfijnen met een herziening-instructie.</p>
            <p>Het afscheidswoord is alleen voor jou zichtbaar en kan ook worden voorgelezen via de module <em>Voorlezen</em>.</p>
          </Toelichting>
          {children}
        </div>
      </main>
    )
  }

  if (!eulogy) {
    return (
      <Shell>
        <p className="text-black text-sm mb-8">
          Beantwoord een aantal vragen over {firstName}, en wij stellen een persoonlijke afscheidswoord voor je op.
        </p>
        <form action={startEulogy.bind(null, id)}>
          <button
            type="submit"
            className="px-6 py-3 bg-stone-800 text-white text-sm rounded-lg hover:bg-stone-700 transition-colors"
          >
            Begin
          </button>
        </form>
      </Shell>
    )
  }

  if (eulogy.status === 'intake_in_progress') {
    const { data: intake } = await supabase
      .from('eulogy_intakes')
      .select('answers_json')
      .eq('eulogy_id', eulogy.id)
      .single()

    return (
      <Shell>
        <EulogyIntakeForm
          eulogyId={eulogy.id}
          spaceId={id}
          firstName={firstName}
          savedAnswers={(intake?.answers_json as Record<string, string>) ?? {}}
        />
      </Shell>
    )
  }

  if (eulogy.status === 'generating') {
    const { data: activeJob } = await supabase
      .from('generation_jobs')
      .select('id, status, job_type')
      .eq('target_id', eulogy.id)
      .in('status', ['pending', 'processing'])
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    return (
      <Shell>
        <EulogyGenerating
          jobId={activeJob?.id ?? null}
          spaceId={id}
          eulogyId={eulogy.id}
          isUpdate={activeJob?.job_type === 'eulogy_regenerate'}
        />
      </Shell>
    )
  }

  if (eulogy.status === 'ready' || eulogy.status === 'finalized') {
    const [{ data: version }, { data: profile }] = await Promise.all([
      supabase
        .from('eulogy_versions')
        .select('content')
        .eq('id', eulogy.current_version_id!)
        .single(),
      supabase
        .from('profiles')
        .select('display_name')
        .eq('id', user.id)
        .single(),
    ])

    return (
      <Shell>
        <EulogyEditor
          eulogyId={eulogy.id}
          spaceId={id}
          content={version?.content ?? ''}
          status={eulogy.status}
          fullName={fullName}
          authorName={profile?.display_name ?? user.email ?? null}
        />
      </Shell>
    )
  }

  notFound()
}
