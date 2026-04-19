import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { SpaceCard } from './space-card'

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
    .order('funeral_date', { ascending: false, nullsFirst: false })
    .order('deceased_last_name', { ascending: true })
    .order('deceased_first_name', { ascending: true })

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
                <SpaceCard
                  key={space.id}
                  space={space}
                  name={name}
                  primaryContact={primaryContact}
                />
              )
            })}
          </div>
        )}
      </div>
    </main>
  )
}

type MemberRow = { role: string; invited_email: string; accepted_at: string | null }
