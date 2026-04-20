import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { ensureToken } from './actions'
import ContributionList from './ContributionList'
import CollectiveEulogyGenerating from './CollectiveEulogyGenerating'
import CollectiveEulogyEditor from './CollectiveEulogyEditor'
import { revokeAndRegenerateToken, synthesizeCollectiveEulogy } from './actions'
import CopyButton from './CopyButton'
import CollapsibleContributions from './CollapsibleContributions'

export default async function CollectiveEulogyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: space } = await supabase
    .from('memorial_spaces')
    .select('id, deceased_first_name, deceased_nickname, deceased_last_name, created_by')
    .eq('id', id)
    .single()

  if (!space) notFound()

  const firstName = space.deceased_first_name
  const fullName = [
    space.deceased_first_name,
    space.deceased_nickname ? `"${space.deceased_nickname}"` : null,
    space.deceased_last_name,
  ].filter(Boolean).join(' ')

  const { data: membership } = await supabase
    .from('memorial_space_members')
    .select('role')
    .eq('memorial_space_id', id)
    .eq('user_id', user.id)
    .maybeSingle()

  const isPrimaryContact = membership?.role === 'primary_contact'
  const isDirector = space.created_by === user.id
  const canManageLink = isPrimaryContact || isDirector

  let token: string | null = null
  let shareUrl: string | null = null
  if (canManageLink) {
    token = await ensureToken(id)
    shareUrl = `${process.env.APP_URL ?? ''}/contribute/${token}`
  }

  const { data: contributions } = await supabase
    .from('collective_eulogy_contributions')
    .select('id, contributor_name, relationship_to_deceased, answers_json, moderation_status, submitted_at')
    .eq('memorial_space_id', id)
    .eq('source', 'contributor_link')
    .order('submitted_at', { ascending: false })

  const { data: collectiveEulogy } = await supabase
    .from('collective_eulogies')
    .select('status, current_version_id')
    .eq('memorial_space_id', id)
    .maybeSingle()

  const acceptedCount = (contributions ?? []).filter(c => c.moderation_status === 'accepted').length
  const pendingCount = (contributions ?? []).filter(c => c.moderation_status === 'pending').length

  function Shell({ children }: { children: React.ReactNode }) {
    return (
      <main className="min-h-screen py-12 px-4" style={{ backgroundColor: '#FFF1E5' }}>
        <div className="max-w-2xl mx-auto">
          <a href={`/spaces/${id}`} className="text-sm text-black hover:text-black mb-8 inline-block">
            ← Terug
          </a>
          <div className="mb-8">
            <h1 className="text-3xl text-black">Gezamenlijk afscheidswoord</h1>
            <p className="text-black text-sm mt-1">{fullName}</p>
          </div>
          {children}
        </div>
      </main>
    )
  }

  if (collectiveEulogy?.status === 'generating') {
    const { data: activeJob } = await supabase
      .from('generation_jobs')
      .select('id, status')
      .eq('memorial_space_id', id)
      .eq('job_type', 'collective_synthesize')
      .in('status', ['pending', 'processing'])
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    return (
      <Shell>
        <CollectiveEulogyGenerating jobId={activeJob?.id ?? null} spaceId={id} isUpdate={!!collectiveEulogy.current_version_id} />
      </Shell>
    )
  }

  if (collectiveEulogy?.status === 'ready' || collectiveEulogy?.status === 'finalized') {
    const { data: version } = await supabase
      .from('collective_eulogy_versions')
      .select('content')
      .eq('id', collectiveEulogy.current_version_id!)
      .single()

    return (
      <Shell>
        <div className="space-y-10">
          <CollectiveEulogyEditor
            spaceId={id}
            content={version?.content ?? ''}
            status={collectiveEulogy.status}
            fullName={fullName}
          />

          {isPrimaryContact && (
            <CollapsibleContributions pendingCount={pendingCount}>
              <p className="text-xs text-stone-500 mb-4">
                Na hermodereren kun je het afscheidswoord opnieuw genereren.
              </p>
              <ContributionList
                contributions={(contributions ?? []).map(c => ({
                  ...c,
                  answers_json: (c.answers_json ?? {}) as Record<string, string>,
                }))}
                spaceId={id}
                isPrimaryContact={isPrimaryContact}
              />
            </CollapsibleContributions>
          )}
        </div>
      </Shell>
    )
  }

  return (
    <Shell>
      <div className="space-y-8">
        {canManageLink && shareUrl && token && (
          <div>
            <h2 className="text-base text-black border-b border-stone-300 pb-2 mb-4">
              Deellink
            </h2>
            <p className="text-sm text-black mb-3">
              Stuur deze link naar familie en vrienden zodat zij een herinnering kunnen bijdragen.
            </p>
            <div
              className="flex items-center gap-3 border border-stone-300 rounded-xl px-4 py-3"
              style={{ backgroundColor: '#FFF8F2' }}
            >
              <span className="text-sm text-black flex-1 break-all">{shareUrl}</span>
              <CopyButton url={shareUrl} />
            </div>
            <form action={revokeAndRegenerateToken} className="mt-2">
              <input type="hidden" name="space_id" value={id} />
              <input type="hidden" name="old_token" value={token} />
              <button type="submit" className="text-xs text-stone-500 underline hover:text-black">
                Nieuwe link aanmaken (huidige link wordt ongeldig)
              </button>
            </form>
          </div>
        )}

        <div>
          <h2 className="text-base text-black border-b border-stone-300 pb-2 mb-4">
            Bijdragen
            {pendingCount > 0 && (
              <span className="ml-2 text-xs text-stone-500">({pendingCount} nieuw)</span>
            )}
          </h2>
          <ContributionList
            contributions={(contributions ?? []).map(c => ({
              ...c,
              answers_json: (c.answers_json ?? {}) as Record<string, string>,
            }))}
            spaceId={id}
            isPrimaryContact={isPrimaryContact}
          />
        </div>

        {isPrimaryContact && (
          <div className="border-t border-stone-200 pt-6">
            {acceptedCount === 0 ? (
              <p className="text-sm text-black">
                Accepteer minimaal één bijdrage om het gezamenlijk afscheidswoord te genereren.
              </p>
            ) : (
              <form action={synthesizeCollectiveEulogy}>
                <input type="hidden" name="space_id" value={id} />
                <button
                  type="submit"
                  className="px-6 py-3 bg-stone-800 text-white text-sm rounded-lg hover:bg-stone-700 transition-colors"
                >
                  Genereer gezamenlijk afscheidswoord ({acceptedCount} bijdrage{acceptedCount !== 1 ? 'n' : ''})
                </button>
              </form>
            )}
          </div>
        )}
      </div>
    </Shell>
  )
}

