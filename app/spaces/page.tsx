import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function SpacesOverviewPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: memberships } = await supabase
    .from('memorial_space_members')
    .select('memorial_space_id, memorial_spaces(id, deceased_first_name, deceased_nickname, deceased_last_name, funeral_date)')
    .eq('user_id', user.id)
    .not('accepted_at', 'is', null)

  type SpaceRow = {
    id: string
    deceased_first_name: string
    deceased_nickname: string | null
    deceased_last_name: string
    funeral_date: string | null
  }

  const spaces = (memberships ?? [])
    .map(m => {
      const s = m.memorial_spaces
      if (!s || Array.isArray(s)) return null
      return s as unknown as SpaceRow
    })
    .filter((s): s is SpaceRow => s !== null)

  if (spaces.length === 1) {
    redirect(`/spaces/${spaces[0].id}`)
  }

  return (
    <main className="min-h-screen py-12 px-4" style={{ backgroundColor: '#FFF1E5' }}>
      <div className="max-w-2xl mx-auto">
        <div className="mb-10">
          <h1 className="text-3xl text-black">Herinneringsruimtes</h1>
        </div>

        {spaces.length === 0 ? (
          <p className="text-sm text-black">Je bent nog niet toegevoegd aan een herinneringsruimte.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {spaces.map(space => {
              const name = [
                space.deceased_first_name,
                space.deceased_nickname ? `"${space.deceased_nickname}"` : null,
                space.deceased_last_name,
              ].filter(Boolean).join(' ')

              return (
                <a
                  key={space.id}
                  href={`/spaces/${space.id}`}
                  className="border border-stone-300 rounded-xl px-5 py-4 hover:border-stone-400 transition-colors"
                  style={{ backgroundColor: '#FFF8F2' }}
                >
                  <p className="text-black">{name}</p>
                  {space.funeral_date && (
                    <p className="text-xs text-black mt-1">
                      Uitvaart: {new Date(space.funeral_date).toLocaleDateString('nl-NL', {
                        day: 'numeric', month: 'long', year: 'numeric',
                      })}
                    </p>
                  )}
                </a>
              )
            })}
          </div>
        )}
      </div>
    </main>
  )
}
