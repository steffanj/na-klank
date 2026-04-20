import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { addFamilyMember } from './actions'

async function logout() {
  'use server'
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/auth/login')
}

const MODULES = [
  {
    key: 'eulogy',
    label: 'Afscheidswoord',
    description: 'Verzamel persoonlijke herinneringen, en schrijf een persoonlijk eerbetoon, met begeleiding.',
    href: (id: string) => `/spaces/${id}/eulogy`,
  },
  {
    key: 'collective-eulogy',
    label: 'Gezamenlijk afscheidswoord',
    description: 'Verzamel herinneringen van familie en vrienden, en laat een gemeenschappelijk eerbetoon opstellen.',
    href: (id: string) => `/spaces/${id}/collective-eulogy`,
  },
  {
    key: 'photo',
    label: "Foto's",
    description: "Upgrade de kwaliteit van oude foto's, laat zwart-wit-foto's inkleuren of vertaal foto's naar een kunstzinnige stijl.",
    href: (id: string) => `/spaces/${id}/photo`,
  },
  {
    key: 'voice',
    label: 'Voorlezen',
    description: 'Laat je afscheidswoord voorlezen in een vertrouwde stem, of je eigen stem.',
    href: (id: string) => `/spaces/${id}/voice`,
  },
]

type MemberRow = {
  id: string
  role: string
  invited_email: string
  invited_name: string | null
  accepted_at: string | null
}

export default async function SpaceHubPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: space } = await supabase
    .from('memorial_spaces')
    .select(`id, deceased_first_name, deceased_nickname, deceased_last_name, funeral_date, created_by,
      memorial_space_members(id, role, invited_email, invited_name, accepted_at)`)
    .eq('id', id)
    .single()

  if (!space) notFound()

  const members = (space.memorial_space_members ?? []) as MemberRow[]

  const { data: myMembership } = await supabase
    .from('memorial_space_members')
    .select('role')
    .eq('memorial_space_id', id)
    .eq('user_id', user.id)
    .maybeSingle()

  const isPrimaryContact = myMembership?.role === 'primary_contact'
  const isDirector = space.created_by === user.id
  const canManageMembers = isPrimaryContact || isDirector

  const name = [
    space.deceased_first_name,
    space.deceased_nickname ? `"${space.deceased_nickname}"` : null,
    space.deceased_last_name,
  ].filter(Boolean).join(' ')

  return (
    <main className="min-h-screen py-12 px-4" style={{ backgroundColor: '#FFF1E5' }}>
      <div className="max-w-2xl mx-auto">
        <div className="mb-10">
          <p className="text-black text-sm mb-1">In herinnering aan</p>
          <h1 className="text-3xl text-black">{name}</h1>
          {space.funeral_date && (
            <p className="text-black text-sm mt-1">
              Uitvaart: {new Date(space.funeral_date).toLocaleDateString('nl-NL', {
                day: 'numeric', month: 'long', year: 'numeric'
              })}
            </p>
          )}
        </div>

        <h2 className="text-base text-black border-b border-stone-300 pb-2 mb-4 flex items-center justify-between">
          Modules
          <form action={logout}>
            <button type="submit" className="text-xs text-black hover:underline">
              Uitloggen
            </button>
          </form>
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-10">
          {MODULES.map(module => (
            <a
              key={module.key}
              href={module.href(id)}
              className="border border-stone-300 rounded-xl px-5 py-4 hover:border-stone-400 transition-colors"
              style={{ backgroundColor: '#FFF8F2' }}
            >
              <p className="text-black">{module.label}</p>
              <p className="text-xs text-black mt-1">{module.description}</p>
            </a>
          ))}
        </div>

        {canManageMembers && (
          <section>
            <h2 className="text-base text-black border-b border-stone-300 pb-2 mb-4">
              Familieleden
            </h2>
            <div
              className="rounded-xl border border-stone-300 divide-y divide-stone-200 mb-4"
              style={{ backgroundColor: '#FFF8F2' }}
            >
              {members.length === 0 ? (
                <p className="px-5 py-4 text-sm text-black">Nog geen familieleden uitgenodigd.</p>
              ) : members.map(m => (
                <div key={m.id} className="px-5 py-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm text-black">
                      {m.invited_name ? `${m.invited_name} — ` : ''}{m.invited_email}
                    </p>
                    <p className="text-xs text-black mt-0.5">
                      {m.role === 'primary_contact' ? 'Primair contact' : 'Familielid'}
                    </p>
                  </div>
                  {m.accepted_at
                    ? <span className="text-xs text-green-700">Actief</span>
                    : <span className="text-xs text-amber-700">Uitnodiging verstuurd</span>
                  }
                </div>
              ))}
            </div>

            <form action={addFamilyMember} className="flex gap-2">
              <input type="hidden" name="space_id" value={id} />
              <input
                name="name"
                type="text"
                placeholder="Voornaam"
                className="w-36 px-4 py-2.5 text-sm border border-stone-300 rounded-lg text-black focus:outline-none focus:ring-2 focus:ring-stone-400"
                style={{ backgroundColor: '#FFF8F2' }}
              />
              <input
                name="email"
                type="email"
                required
                placeholder="familielid@email.nl"
                className="flex-1 px-4 py-2.5 text-sm border border-stone-300 rounded-lg text-black focus:outline-none focus:ring-2 focus:ring-stone-400"
                style={{ backgroundColor: '#FFF8F2' }}
              />
              <button
                type="submit"
                className="px-4 py-2.5 text-sm bg-stone-800 text-white rounded-lg hover:bg-stone-700 transition-colors shrink-0"
              >
                Uitnodigen
              </button>
            </form>
          </section>
        )}
      </div>
    </main>
  )
}
