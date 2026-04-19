import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function DirectorDashboard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: spaces } = await supabase
    .from('memorial_spaces')
    .select(`
      id, deceased_first_name, deceased_nickname, deceased_last_name,
      funeral_date, created_at,
      memorial_space_members(role, invited_email, accepted_at)
    `)
    .eq('created_by', user.id)
    .order('created_at', { ascending: false })

  return (
    <main className="min-h-screen bg-stone-50">
      <div className="max-w-4xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between mb-10">
          <div>
            <h1 className="text-3xl font-serif text-stone-800">Na-klank</h1>
            <p className="text-stone-400 text-sm mt-1">Uitvaartbegeleider dashboard</p>
          </div>
          <a
            href="/director/spaces/new"
            className="px-5 py-2.5 bg-stone-800 text-white text-sm rounded-lg hover:bg-stone-700 transition-colors"
          >
            + Nieuwe ruimte
          </a>
        </div>

        {!spaces || spaces.length === 0 ? (
          <div className="text-center py-24 text-stone-400">
            <p className="text-lg mb-2">Nog geen herdenkingsruimtes</p>
            <a href="/director/spaces/new" className="text-stone-600 underline text-sm">
              Maak de eerste aan
            </a>
          </div>
        ) : (
          <div className="space-y-3">
            {spaces.map((space) => {
              const primaryContact = (space.memorial_space_members as MemberRow[])
                ?.find(m => m.role === 'primary_contact')
              const name = [
                space.deceased_first_name,
                space.deceased_nickname ? `"${space.deceased_nickname}"` : null,
                space.deceased_last_name,
              ].filter(Boolean).join(' ')

              return (
                <a
                  key={space.id}
                  href={`/director/spaces/${space.id}`}
                  className="block bg-white border border-stone-200 rounded-xl px-6 py-5 hover:border-stone-300 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium text-stone-800 text-lg">{name}</p>
                      {space.funeral_date && (
                        <p className="text-sm text-stone-400 mt-0.5">
                          Uitvaart: {new Date(space.funeral_date).toLocaleDateString('nl-NL', {
                            day: 'numeric', month: 'long', year: 'numeric'
                          })}
                        </p>
                      )}
                    </div>
                    <ContactBadge member={primaryContact} />
                  </div>
                </a>
              )
            })}
          </div>
        )}
      </div>
    </main>
  )
}

type MemberRow = { role: string; invited_email: string; accepted_at: string | null }

function ContactBadge({ member }: { member: MemberRow | undefined }) {
  if (!member) return <span className="text-xs text-stone-300">Geen contact</span>
  if (member.accepted_at) {
    return (
      <span className="text-xs bg-green-50 text-green-700 border border-green-200 rounded-full px-3 py-1">
        Actief — {member.invited_email}
      </span>
    )
  }
  return (
    <span className="text-xs bg-amber-50 text-amber-700 border border-amber-200 rounded-full px-3 py-1">
      Uitnodiging verstuurd — {member.invited_email}
    </span>
  )
}
