import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { DeleteSpaceButton } from './delete-space-button'

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
    <main className="min-h-screen" style={{ backgroundColor: '#FFF1E5' }}>
      <div className="max-w-4xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between mb-10">
          <div>
            <h1 className="text-3xl text-black">Na-klank</h1>
            <p className="text-stone-500 text-sm mt-1">Uitvaartbegeleider dashboard</p>
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
                <div key={space.id} className="border border-stone-300 rounded-xl px-6 py-5 transition-colors" style={{ backgroundColor: '#FFF8F2' }}>
                  <div className="flex items-start justify-between">
                    <a href={`/director/spaces/${space.id}`} className="flex-1 min-w-0">
                      <p className="font-medium text-black text-lg">{name}</p>
                      {space.funeral_date && (
                        <p className="text-sm text-stone-500 mt-0.5">
                          Uitvaart: {new Date(space.funeral_date).toLocaleDateString('nl-NL', {
                            day: 'numeric', month: 'long', year: 'numeric'
                          })}
                        </p>
                      )}
                    </a>
                    <div className="flex items-center gap-4 ml-4 shrink-0">
                      <ContactBadge member={primaryContact} />
                      <DeleteSpaceButton spaceId={space.id} spaceName={name} />
                    </div>
                  </div>
                </div>
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
