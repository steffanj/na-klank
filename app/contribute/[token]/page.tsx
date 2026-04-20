import { createAdminClient } from '@/lib/supabase/admin'
import { notFound } from 'next/navigation'
import ContributionForm from './ContributionForm'

export default async function ContributePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const admin = createAdminClient()

  const { data: tokenRow } = await admin
    .from('collective_eulogy_tokens')
    .select('memorial_space_id, revoked_at')
    .eq('token', token)
    .maybeSingle()

  if (!tokenRow || tokenRow.revoked_at) notFound()

  const { data: space } = await admin
    .from('memorial_spaces')
    .select('deceased_first_name, deceased_nickname, deceased_last_name')
    .eq('id', tokenRow.memorial_space_id)
    .single()

  if (!space) notFound()

  const firstName = space.deceased_first_name
  const fullName = [
    space.deceased_first_name,
    space.deceased_nickname ? `"${space.deceased_nickname}"` : null,
    space.deceased_last_name,
  ].filter(Boolean).join(' ')

  return (
    <main className="min-h-screen py-12 px-4" style={{ backgroundColor: '#FFF1E5' }}>
      <div className="max-w-2xl mx-auto">
        <div className="mb-10">
          <p className="text-black text-sm mb-1">In herinnering aan</p>
          <h1 className="text-3xl text-black">{fullName}</h1>
        </div>

        <div className="mb-8">
          <h2 className="text-base text-black border-b border-stone-300 pb-2 mb-4">
            Jouw herinnering
          </h2>
          <p className="text-sm text-black mb-6">
            Deel hieronder een herinnering aan {firstName}. Alles is optioneel — vul in wat je wilt delen.
          </p>
          <ContributionForm token={token} firstName={firstName} />
        </div>
      </div>
    </main>
  )
}
