import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

const MODULES = [
  {
    key: 'eulogy',
    label: 'Afscheidswoord',
    description: 'Nabestaanden kunnen middels een gericht vragenformulier herinneringen over de overledene delen, waar de technologie dan een passend en persoonlijk eerbetoon bij schrijft. Dit eerbetoon kan worden bijgesteld tot het goed voelt om voor te dragen.',
  },
  {
    key: 'collective-eulogy',
    label: 'Gezamenlijk afscheidswoord',
    description: 'Via een link die gedeeld kan worden kunnen familieleden, vrienden, collega\'s en kennissen middels een vragenformulier hun persoonlijke herinneringen delen — ieder op hun eigen moment en tempo. Na-klank bundelt alle bijdragen tot één samenhangend gezamenlijk eerbetoon dat voorgelezen kan worden.',
  },
  {
    key: 'voice',
    label: 'Voorlezen',
    description: 'Niet iedereen kan of wil een afscheidswoord zelf uitspreken. Na-klank kan het eerbetoon voorlezen in een rustige, natuurlijk klinkende stem — de toespraak wordt downloadbaar als .mp3, klaar om afgespeeld te worden tijdens de uitvaartdienst.',
  },
  {
    key: 'photo',
    label: "Foto's",
    description: "Verbeter de kwaliteit van oude foto's, kleur zwart-wit-foto's in, vergroot foto's of vertaal ze naar een artistieke stijl. Om dát beeld te creëren, dat de overledene eer aan doet.",
  },
]

export default async function Home() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role === 'director') redirect('/director/dashboard')

    const { data: membership } = await supabase
      .from('memorial_space_members')
      .select('memorial_space_id')
      .eq('user_id', user.id)
      .not('accepted_at', 'is', null)
      .limit(1)
      .single()

    if (membership) redirect(`/spaces/${membership.memorial_space_id}`)

    redirect('/auth/login')
  }

  return (
    <main className="min-h-screen" style={{ backgroundColor: '#FFF1E5' }}>

      <div className="flex justify-end px-6 pt-6">
        <a
          href="/auth/login"
          className="px-4 py-2 text-sm border border-stone-300 rounded-lg text-black hover:border-stone-800 transition-colors"
          style={{ backgroundColor: '#FFF8F2' }}
        >
          Inloggen
        </a>
      </div>

      <section className="max-w-2xl mx-auto px-6 pt-10 pb-16 text-center">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="48" height="48" className="mx-auto mb-6">
          <circle cx="32" cy="32" r="4" fill="#2C3E50"/>
          <circle cx="32" cy="32" r="11" fill="none" stroke="#2C3E50" strokeWidth="1.5" opacity="0.75"/>
          <circle cx="32" cy="32" r="19" fill="none" stroke="#2C3E50" strokeWidth="1.5" opacity="0.45"/>
          <circle cx="32" cy="32" r="27" fill="none" stroke="#2C3E50" strokeWidth="1.5" opacity="0.2"/>
        </svg>
        <h1 className="text-4xl text-black mb-4">Na-klank</h1>
        <p className="text-black text-lg leading-relaxed mb-3">
          Bied nabestaanden een persoonlijk eerbetoon — begeleid door technologie.
        </p>
        <div className="text-sm text-black leading-relaxed space-y-4 mb-10 text-left">
          <p>
            Een overlijden vraagt om meer dan een standaard afscheid. Na-klank helpt nabestaanden bij het samenstellen van iets eigens: een afscheidswoord dat klopt, foto's die recht doen aan wie iemand was.
          </p>
          <p>
            Uniek aan Na-klank is de mogelijkheid om herinneringen van meerdere familieleden en vrienden samen te brengen. Ieder deelt wat hij of zij wil — Na-klank weeft de bijdragen samen tot één gezamenlijk eerbetoon.
          </p>
          <p>
            Uitvaartondernemers maken een herdenkingsruimte aan en nodigen de familie uit. De rest verloopt op het eigen tempo van de familie, met begeleiding van Na-klank.
          </p>
        </div>
      </section>

      <section className="max-w-2xl mx-auto px-6 pb-16">
        <h2 className="text-base text-black border-b border-stone-300 pb-2 mb-6">Modules</h2>
        <div className="grid grid-cols-1 gap-3">
          {MODULES.map(module => (
            <div
              key={module.key}
              className="border border-stone-300 rounded-xl px-5 py-4"
              style={{ backgroundColor: '#FFF8F2' }}
            >
              <p className="text-black">{module.label}</p>
              <p className="text-xs text-black mt-1">{module.description}</p>
            </div>
          ))}
          {[
            {
              label: 'Rouwkaart',
              description: 'In de eerste dagen na een overlijden moet er veel tegelijk geregeld worden, terwijl de woorden vaak nog niet komen. Na-klank helpt met een korte, zachte vragenlijst om tot een passende tekst voor de rouwkaart te komen — eerbiedig, in eigen woorden, en snel genoeg om de drukkerij op tijd te halen.',
            },
            {
              label: 'Muziekadvies',
              description: 'Op basis van de muziekvoorkeuren van de overledene en het gewenste gevoel van de dienst stelt Na-klank passende muzieksuggesties voor — afgestemd op genre, artiest en songtekst, voor zowel de intrede, bezinningsmomenten als het uitgeleide.',
            },
          ].map(module => (
            <div
              key={module.label}
              className="border border-stone-200 rounded-xl px-5 py-4"
              style={{ backgroundColor: '#FFFCF9' }}
            >
              <div className="flex items-center gap-2 mb-1">
                <p className="text-stone-400">{module.label}</p>
                <span className="text-xs text-stone-400 border border-stone-200 rounded px-1.5 py-0.5 leading-none">binnenkort</span>
              </div>
              <p className="text-xs text-stone-400">{module.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="max-w-2xl mx-auto px-6 pb-20">
        <h2 className="text-base text-black border-b border-stone-300 pb-2 mb-6">Hoe werkt het?</h2>
        <div
          className="rounded-xl border border-stone-300 flex items-center justify-center"
          style={{ backgroundColor: '#FFF8F2', aspectRatio: '16 / 9' }}
        >
          <p className="text-sm text-stone-400">Demo-video volgt binnenkort</p>
        </div>
      </section>

      <section className="max-w-2xl mx-auto px-6 pb-20">
        <h2 className="text-base text-black border-b border-stone-300 pb-2 mb-6">Contact</h2>
        <p className="text-sm text-black">
          Na-klank bedient uitvaartondernemers en de families die zij begeleiden. Bent u uitvaartondernemer en heeft u interesse? Neem vrijblijvend{' '}
          <a href="/contact" className="underline hover:text-stone-600 transition-colors">contact</a>
          {' '}op voor meer informatie.
        </p>
      </section>

    </main>
  )
}
