'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

function fireEdgeFunction(spaceId: string, jobId: string) {
  const admin = createAdminClient()
  admin.functions.invoke('synthesize-collective-eulogy', {
    body: { space_id: spaceId, job_id: jobId, variation_seed: Math.random() },
  }).catch((err) => console.error('[synthesize-collective-eulogy] invoke error:', err))
}

export async function resetCollectiveEulogy(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const spaceId = formData.get('space_id') as string

  await supabase
    .from('collective_eulogies')
    .update({ status: 'not_started', updated_at: new Date().toISOString() })
    .eq('memorial_space_id', spaceId)

  revalidatePath(`/spaces/${spaceId}/collective-eulogy`)
}

export async function ensureToken(spaceId: string): Promise<string> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: existing } = await supabase
    .from('collective_eulogy_tokens')
    .select('token')
    .eq('memorial_space_id', spaceId)
    .is('revoked_at', null)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (existing) return existing.token

  const admin = createAdminClient()
  const { data: created } = await admin
    .from('collective_eulogy_tokens')
    .insert({ memorial_space_id: spaceId })
    .select('token')
    .single()

  return created!.token
}

export async function revokeAndRegenerateToken(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const spaceId = formData.get('space_id') as string
  const oldToken = formData.get('old_token') as string

  const admin = createAdminClient()
  await admin
    .from('collective_eulogy_tokens')
    .update({ revoked_at: new Date().toISOString() })
    .eq('token', oldToken)

  await admin
    .from('collective_eulogy_tokens')
    .insert({ memorial_space_id: spaceId })

  revalidatePath(`/spaces/${spaceId}/collective-eulogy`)
}

export async function moderateContribution(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const contributionId = formData.get('contribution_id') as string
  const status = formData.get('status') as 'accepted' | 'rejected'
  const spaceId = formData.get('space_id') as string

  await supabase
    .from('collective_eulogy_contributions')
    .update({ moderation_status: status })
    .eq('id', contributionId)

  revalidatePath(`/spaces/${spaceId}/collective-eulogy`)
}

export async function synthesizeCollectiveEulogy(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const spaceId = formData.get('space_id') as string

  const { data: existing } = await supabase
    .from('collective_eulogies')
    .select('memorial_space_id')
    .eq('memorial_space_id', spaceId)
    .maybeSingle()

  if (existing) {
    await supabase
      .from('collective_eulogies')
      .update({ status: 'generating', updated_at: new Date().toISOString() })
      .eq('memorial_space_id', spaceId)
  } else {
    await supabase
      .from('collective_eulogies')
      .insert({ memorial_space_id: spaceId, status: 'generating' })
  }

  const { data: job } = await supabase
    .from('generation_jobs')
    .insert({
      memorial_space_id: spaceId,
      job_type: 'collective_synthesize',
      target_id: spaceId,
      triggered_by_user_id: user.id,
    })
    .select('id')
    .single()

  if (job) fireEdgeFunction(spaceId, job.id)

  redirect(`/spaces/${spaceId}/collective-eulogy`)
}

export async function autoSaveCollectiveEulogyEdit(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  const spaceId = formData.get('space_id') as string
  const content = formData.get('content') as string

  const { data: latest } = await supabase
    .from('collective_eulogy_versions')
    .select('version_number')
    .eq('memorial_space_id', spaceId)
    .order('version_number', { ascending: false })
    .limit(1)
    .maybeSingle()

  const nextVersion = (latest?.version_number ?? 0) + 1

  const { data: version } = await supabase
    .from('collective_eulogy_versions')
    .insert({
      memorial_space_id: spaceId,
      version_number: nextVersion,
      content,
      generated_by_user_id: user.id,
    })
    .select('id')
    .single()

  if (version) {
    await supabase
      .from('collective_eulogies')
      .update({ current_version_id: version.id, updated_at: new Date().toISOString() })
      .eq('memorial_space_id', spaceId)
  }

  revalidatePath(`/spaces/${spaceId}/collective-eulogy`)
}

export async function regenerateCollectiveEulogy(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const spaceId = formData.get('space_id') as string

  await supabase
    .from('collective_eulogies')
    .update({ status: 'generating', updated_at: new Date().toISOString() })
    .eq('memorial_space_id', spaceId)

  const { data: job } = await supabase
    .from('generation_jobs')
    .insert({
      memorial_space_id: spaceId,
      job_type: 'collective_synthesize',
      target_id: spaceId,
      triggered_by_user_id: user.id,
    })
    .select('id')
    .single()

  if (job) fireEdgeFunction(spaceId, job.id)

  redirect(`/spaces/${spaceId}/collective-eulogy`)
}

export async function finalizeCollectiveEulogy(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const spaceId = formData.get('space_id') as string

  await supabase
    .from('collective_eulogies')
    .update({ status: 'finalized', updated_at: new Date().toISOString() })
    .eq('memorial_space_id', spaceId)

  revalidatePath(`/spaces/${spaceId}/collective-eulogy`)
}

export async function reopenCollectiveEulogy(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const spaceId = formData.get('space_id') as string

  await supabase
    .from('collective_eulogies')
    .update({ status: 'ready', updated_at: new Date().toISOString() })
    .eq('memorial_space_id', spaceId)

  revalidatePath(`/spaces/${spaceId}/collective-eulogy`)
}

export async function reviseCollectiveEulogy(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const spaceId = formData.get('space_id') as string
  const currentContent = formData.get('current_content') as string
  const revisionInstruction = formData.get('revision_instruction') as string

  if (!revisionInstruction?.trim()) redirect(`/spaces/${spaceId}/collective-eulogy`)

  await supabase
    .from('collective_eulogies')
    .update({ status: 'generating', updated_at: new Date().toISOString() })
    .eq('memorial_space_id', spaceId)

  const { data: job } = await supabase
    .from('generation_jobs')
    .insert({
      memorial_space_id: spaceId,
      job_type: 'collective_synthesize',
      target_id: spaceId,
      triggered_by_user_id: user.id,
    })
    .select('id')
    .single()

  if (job) {
    const admin = createAdminClient()
    admin.functions.invoke('synthesize-collective-eulogy', {
      body: {
        space_id: spaceId,
        job_id: job.id,
        current_content: currentContent,
        revision_instruction: revisionInstruction.trim(),
        variation_seed: Math.random(),
      },
    }).catch(() => {})
  }

  redirect(`/spaces/${spaceId}/collective-eulogy`)
}
