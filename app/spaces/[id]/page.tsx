import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'

const MODULES = [
  {
    key: 'eulogy',
    label: 'Rouwbrief',
    description: 'Verzamel persoonlijke herinneringen, en schrijf een persoonlijk eerbetoon, met begeleiding.',
    href: (id: string) => `/spaces/${id}/eulogy`,
  },
  {
    key: 'collective-eulogy',
    label: 'Gezamenlijke rouwbrief',
    description: 'Verzamel herinneringen van familie en vrienden, en laat een gemeenschappelijk eerbetoon opstellen.',
    href: (id: string) => `/spaces/${id}/collective-eulogy`,
  },
  {
    key: 'photo',
    label: "Foto's",
    description: 'Upgrade de kwaliteit van oude foto\'s, laat zwart-wit-foto\'s inkleuren of vertaal foto\'s naar een kunstzinnige stijl.',
    href: (id: string) => `/spaces/${id}/photo`,
  },
  {
    key: 'voice',
    label: 'Voorlezen',
    description: 'Laat je rouwbrief voorlezen in een vertrouwde stem, of je eigen stem.',
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
    <main className="min-h-screen py-12 px-4" style={{ backgroundColor: '#FFF1E5' }}>
      <div className="max-w-2xl mx-auto">
        <div className="mb-10">
          <p className="text-stone-500 text-sm mb-1">In herinnering aan</p>
          <h1 className="text-3xl text-black">{name}</h1>
          {space.funeral_date && (
            <p className="text-stone-500 text-sm mt-1">
              Uitvaart: {new Date(space.funeral_date).toLocaleDateString('nl-NL', {
                day: 'numeric', month: 'long', year: 'numeric'
              })}
            </p>
          )}
        </div>

        <h2 className="text-base text-black border-b border-stone-300 pb-2 mb-4">Modules</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {MODULES.map(module => (
            <a
              key={module.key}
              href={module.href(id)}
              className="border border-stone-300 rounded-xl px-5 py-4 hover:border-stone-400 transition-colors"
              style={{ backgroundColor: '#FFF8F2' }}
            >
              <p className="text-black">{module.label}</p>
              <p className="text-xs text-stone-400 mt-1">{module.description}</p>
            </a>
          ))}
        </div>
      </div>
    </main>
  )
}
