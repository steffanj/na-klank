import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'

const MODULES = [
  {
    key: 'eulogy',
    label: 'Rouwbrief',
    description: 'Schrijf een persoonlijk eerbetoon met begeleiding.',
    href: (id: string) => `/spaces/${id}/eulogy`,
  },
  {
    key: 'collective-eulogy',
    label: 'Gezamenlijke rouwbrief',
    description: 'Verzamel herinneringen van familie en vrienden.',
    href: (id: string) => `/spaces/${id}/collective-eulogy`,
  },
  {
    key: 'photo',
    label: "Foto's",
    description: 'Herstel, kleur of vertaal foto\'s naar een kunstzinnige stijl.',
    href: (id: string) => `/spaces/${id}/photo`,
  },
  {
    key: 'voice',
    label: 'Voorlezen',
    description: 'Laat de rouwbrief voorlezen in een vertrouwde stem.',
    href: (id: string) => `/spaces/${id}/voice`,
  },
]

export default async function SpaceHubPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: space } = await supabase
    .from('memorial_spaces')
    .select('id, deceased_first_name, deceased_nickname, deceased_last_name, funeral_date')
    .eq('id', id)
    .single()

  if (!space) notFound()

  const name = [
    space.deceased_first_name,
    space.deceased_nickname ? `"${space.deceased_nickname}"` : null,
    space.deceased_last_name,
  ].filter(Boolean).join(' ')

  return (
    <main className="min-h-screen bg-stone-50">
      <div className="max-w-2xl mx-auto px-6 py-12">
        <div className="text-center mb-12">
          <p className="text-stone-400 text-sm mb-2">In herinnering aan</p>
          <h1 className="text-4xl font-serif text-stone-800">{name}</h1>
          {space.funeral_date && (
            <p className="text-stone-400 text-sm mt-3">
              Uitvaart op {new Date(space.funeral_date).toLocaleDateString('nl-NL', {
                weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
              })}
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {MODULES.map(module => (
            <a
              key={module.key}
              href={module.href(id)}
              className="bg-white border border-stone-200 rounded-2xl px-6 py-6 hover:border-stone-300 hover:shadow-sm transition-all group"
            >
              <h2 className="font-serif text-xl text-stone-800 mb-2 group-hover:text-stone-600 transition-colors">
                {module.label}
              </h2>
              <p className="text-sm text-stone-400 leading-relaxed">{module.description}</p>
              <p className="text-xs text-stone-300 mt-4">Nog niet gestart</p>
            </a>
          ))}
        </div>
      </div>
    </main>
  )
}
