import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function DirectorDashboard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')

  return (
    <main className="min-h-screen bg-stone-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-serif text-stone-800 mb-2">Na-klank</h1>
        <p className="text-stone-500 mb-10">Dashboard — Phase 2 komt er aan.</p>

        <div className="bg-white border border-stone-200 rounded-xl p-6 text-stone-600">
          <p>Ingelogd als: <strong>{user.email}</strong></p>
          <p className="mt-2 text-sm text-stone-400">Fase 1 voltooid — authenticatie en schema zijn klaar.</p>
        </div>
      </div>
    </main>
  )
}
