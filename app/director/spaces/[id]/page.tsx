import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { addFamilyMember } from './actions'

export default async function DirectorSpacePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: space } = await supabase
    .from('memorial_spaces')
    .select(`*, memorial_space_members(id, role, invited_email, invited_name, accepted_at, user_id)`)
    .eq('id', id)
    .eq('created_by', user.id)
    .single()

  if (!space) notFound()

  const members = space.memorial_space_members as MemberRow[]
  const name = [
    space.deceased_first_name,
    space.deceased_nickname ? `"${space.deceased_nickname}"` : null,
    space.deceased_last_name,
  ].filter(Boolean).join(' ')

  return (
    <main className="min-h-screen py-12 px-4" style={{ backgroundColor: '#FFF1E5' }}>
      <div className="max-w-2xl mx-auto">
        <a href="/director/dashboard" className="text-sm text-stone-400 hover:text-stone-600 mb-8 inline-block">
          ← Terug naar overzicht
        </a>

        <div className="mb-10">
          <h1 className="text-3xl text-black">{name}</h1>
          {space.funeral_date && (
            <p className="text-stone-500 text-sm mt-1">
              Uitvaart: {new Date(space.funeral_date).toLocaleDateString('nl-NL', {
                day: 'numeric', month: 'long', year: 'numeric'
              })}
            </p>
          )}
        </div>

        <section className="mb-10">
          <h2 className="text-base text-black border-b border-stone-300 pb-2 mb-4">Modules</h2>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Afscheidswoord', href: `/spaces/${id}/eulogy` },
              { label: 'Gezamenlijk afscheidswoord', href: `/spaces/${id}/collective-eulogy` },
              { label: "Foto's", href: `/spaces/${id}/photo` },
              { label: 'Voorlezen', href: `/spaces/${id}/voice` },
            ].map(m => (
              <a
                key={m.label}
                href={m.href}
                className="border border-stone-300 rounded-xl px-5 py-4 hover:border-stone-400 transition-colors"
                style={{ backgroundColor: '#FFF8F2' }}
              >
                <p className="text-black">{m.label}</p>
                <p className="text-xs text-stone-400 mt-1">Bekijk module →</p>
              </a>
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-base text-black border-b border-stone-300 pb-2 mb-4">Familieleden</h2>
          <div className="rounded-xl border border-stone-300 divide-y divide-stone-200 mb-4" style={{ backgroundColor: '#FFF8F2' }}>
            {members.length === 0 ? (
              <p className="px-5 py-4 text-sm text-stone-400">Geen leden uitgenodigd.</p>
            ) : members.map(m => (
              <div key={m.id} className="px-5 py-3 flex items-center justify-between">
                <div>
                  <p className="text-sm text-black">{m.invited_name ? `${m.invited_name} — ` : ''}{m.invited_email}</p>
                  <p className="text-xs text-stone-400 mt-0.5">{m.role === 'primary_contact' ? 'Primair contact' : 'Familielid'}</p>
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
              required
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
              className="px-4 py-2.5 text-sm bg-stone-800 text-white rounded-lg hover:bg-stone-700 transition-colors"
            >
              Uitnodigen
            </button>
          </form>
        </section>
      </div>
    </main>
  )
}

type MemberRow = {
  id: string
  role: string
  invited_email: string
  invited_name: string | null
  accepted_at: string | null
  user_id: string | null
}
