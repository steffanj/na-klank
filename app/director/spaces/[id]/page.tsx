import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'

export default async function DirectorSpacePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: space } = await supabase
    .from('memorial_spaces')
    .select(`
      *, memorial_space_members(id, role, invited_email, accepted_at, user_id)
    `)
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
    <main className="min-h-screen bg-stone-50">
      <div className="max-w-3xl mx-auto px-6 py-10">
        <a href="/director/dashboard" className="text-sm text-stone-400 hover:text-stone-600 mb-6 inline-block">
          ← Terug naar overzicht
        </a>

        <div className="mb-8">
          <h1 className="text-3xl font-serif text-stone-800">{name}</h1>
          {space.funeral_date && (
            <p className="text-stone-400 text-sm mt-1">
              Uitvaart: {new Date(space.funeral_date).toLocaleDateString('nl-NL', {
                day: 'numeric', month: 'long', year: 'numeric'
              })}
            </p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4 mb-8">
          {[
            { label: 'Rouwbrief', href: `/spaces/${id}/eulogy` },
            { label: 'Gezamenlijke rouwbrief', href: `/spaces/${id}/collective-eulogy` },
            { label: "Foto's", href: `/spaces/${id}/photo` },
            { label: 'Stem', href: `/spaces/${id}/voice` },
          ].map(m => (
            <a
              key={m.label}
              href={m.href}
              className="bg-white border border-stone-200 rounded-xl px-5 py-4 hover:border-stone-300 transition-colors"
            >
              <p className="font-medium text-stone-700">{m.label}</p>
              <p className="text-xs text-stone-400 mt-1">Bekijk module →</p>
            </a>
          ))}
        </div>

        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-medium text-stone-500 uppercase tracking-wide">Familieleden</h2>
            <AddMemberForm spaceId={id} />
          </div>
          <div className="bg-white border border-stone-200 rounded-xl divide-y divide-stone-100">
            {members.length === 0 ? (
              <p className="px-5 py-4 text-sm text-stone-400">Geen leden uitgenodigd.</p>
            ) : members.map(m => (
              <div key={m.id} className="px-5 py-3 flex items-center justify-between">
                <div>
                  <p className="text-sm text-stone-700">{m.invited_email}</p>
                  <p className="text-xs text-stone-400">{m.role === 'primary_contact' ? 'Primair contact' : 'Familielid'}</p>
                </div>
                {m.accepted_at
                  ? <span className="text-xs text-green-600">Actief</span>
                  : <span className="text-xs text-amber-600">Uitnodiging verstuurd</span>
                }
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  )
}

type MemberRow = { id: string; role: string; invited_email: string; accepted_at: string | null; user_id: string | null }

// Inline server action for adding extra family members
import { addFamilyMember } from './actions'

function AddMemberForm({ spaceId }: { spaceId: string }) {
  return (
    <form action={addFamilyMember} className="flex gap-2">
      <input type="hidden" name="space_id" value={spaceId} />
      <input
        name="email"
        type="email"
        required
        placeholder="familielid@email.nl"
        className="px-3 py-1.5 text-sm border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-400"
      />
      <button
        type="submit"
        className="px-3 py-1.5 text-sm bg-stone-700 text-white rounded-lg hover:bg-stone-600 transition-colors"
      >
        Uitnodigen
      </button>
    </form>
  )
}
