'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { INTAKE_KEYS } from '@/lib/config/eulogy'

function fireEdgeFunction(eulogyId: string, jobId: string) {
  const admin = createAdminClient()
  admin.functions.invoke('generate-eulogy', {
    body: { eulogy_id: eulogyId, job_id: jobId },
  }).catch(() => {})
}

export async function startEulogy(spaceId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: eulogy } = await supabase
    .from('eulogies')
    .insert({ memorial_space_id: spaceId, author_user_id: user.id })
    .select('id')
    .single()

  if (!eulogy) throw new Error('Kon rouwbrief niet starten.')

  await supabase
    .from('eulogy_intakes')
    .insert({ eulogy_id: eulogy.id, answers_json: {} })

  revalidatePath(`/spaces/${spaceId}/eulogy`)
}

export async function generateEulogy(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const eulogyId = formData.get('eulogy_id') as string
  const spaceId = formData.get('space_id') as string

  const answers: Record<string, string> = {}
  for (const key of INTAKE_KEYS) {
    const val = formData.get(key)
    if (typeof val === 'string' && val.trim()) answers[key] = val.trim()
  }

  await supabase
    .from('eulogy_intakes')
    .update({ answers_json: answers, updated_at: new Date().toISOString() })
    .eq('eulogy_id', eulogyId)

  await supabase
    .from('eulogies')
    .update({ status: 'generating', updated_at: new Date().toISOString() })
    .eq('id', eulogyId)

  const { data: job } = await supabase
    .from('generation_jobs')
    .insert({
      memorial_space_id: spaceId,
      job_type: 'eulogy_generate',
      target_id: eulogyId,
      triggered_by_user_id: user.id,
    })
    .select('id')
    .single()

  if (job) fireEdgeFunction(eulogyId, job.id)

  redirect(`/spaces/${spaceId}/eulogy`)
}

export async function saveEulogyEdit(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const eulogyId = formData.get('eulogy_id') as string
  const spaceId = formData.get('space_id') as string
  const content = formData.get('content') as string

  const { data: latest } = await supabase
    .from('eulogy_versions')
    .select('version_number')
    .eq('eulogy_id', eulogyId)
    .order('version_number', { ascending: false })
    .limit(1)
    .maybeSingle()

  const nextVersion = (latest?.version_number ?? 0) + 1

  const { data: version } = await supabase
    .from('eulogy_versions')
    .insert({
      eulogy_id: eulogyId,
      version_number: nextVersion,
      content,
      generation_source: 'manual_edit',
    })
    .select('id')
    .single()

  if (version) {
    await supabase
      .from('eulogies')
      .update({ current_version_id: version.id, updated_at: new Date().toISOString() })
      .eq('id', eulogyId)
  }

  redirect(`/spaces/${spaceId}/eulogy`)
}

export async function regenerateEulogy(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const eulogyId = formData.get('eulogy_id') as string
  const spaceId = formData.get('space_id') as string

  await supabase
    .from('eulogies')
    .update({ status: 'generating', updated_at: new Date().toISOString() })
    .eq('id', eulogyId)

  const { data: job } = await supabase
    .from('generation_jobs')
    .insert({
      memorial_space_id: spaceId,
      job_type: 'eulogy_regenerate',
      target_id: eulogyId,
      triggered_by_user_id: user.id,
    })
    .select('id')
    .single()

  if (job) fireEdgeFunction(eulogyId, job.id)

  redirect(`/spaces/${spaceId}/eulogy`)
}

export async function resetEulogy(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const eulogyId = formData.get('eulogy_id') as string
  const spaceId = formData.get('space_id') as string

  await supabase
    .from('eulogies')
    .update({ status: 'intake_in_progress', updated_at: new Date().toISOString() })
    .eq('id', eulogyId)
    .eq('author_user_id', user.id)

  redirect(`/spaces/${spaceId}/eulogy`)
}

export async function finalizeEulogy(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const eulogyId = formData.get('eulogy_id') as string
  const spaceId = formData.get('space_id') as string
  const optIn = formData.get('opt_in_to_collective') === 'true'

  await supabase
    .from('eulogies')
    .update({ status: 'finalized', opt_in_to_collective: optIn, updated_at: new Date().toISOString() })
    .eq('id', eulogyId)

  redirect(`/spaces/${spaceId}/eulogy`)
}
