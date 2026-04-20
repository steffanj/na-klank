'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { CONTRIBUTION_KEYS } from '@/lib/config/collective-eulogy'

export async function submitContribution(formData: FormData) {
  const admin = createAdminClient()

  const token = formData.get('token') as string
  const contributorName = (formData.get('contributor_name') as string)?.trim() || 'Anoniem'
  const contributorEmail = (formData.get('contributor_email') as string)?.trim() || null
  const relationship = (formData.get('relationship') as string)?.trim() || null

  const { data: tokenRow } = await admin
    .from('collective_eulogy_tokens')
    .select('memorial_space_id, revoked_at')
    .eq('token', token)
    .maybeSingle()

  if (!tokenRow || tokenRow.revoked_at) {
    throw new Error('Ongeldige of verlopen link.')
  }

  const answers: Record<string, string> = {}
  for (const key of CONTRIBUTION_KEYS) {
    const val = formData.get(key)
    if (typeof val === 'string' && val.trim().length > 2) answers[key] = val.trim()
  }

  await admin
    .from('collective_eulogy_contributions')
    .insert({
      memorial_space_id: tokenRow.memorial_space_id,
      contributor_name: contributorName,
      contributor_email: contributorEmail,
      relationship_to_deceased: relationship,
      answers_json: answers,
      source: 'contributor_link',
    })
}
