'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

export async function deleteMemorialSpace(formData: FormData) {
  const supabase = await createClient()
  const admin = createAdminClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const space_id = formData.get('space_id') as string

  // Fetch space details before deletion for the log
  const { data: space } = await supabase
    .from('memorial_spaces')
    .select('id, deceased_first_name, deceased_last_name, deceased_nickname, organization_id, created_by')
    .eq('id', space_id)
    .eq('created_by', user.id)
    .single()

  if (!space) return // not found or not owned by this director

  // Write to log before deletion (cascade will remove the space)
  await admin.from('deleted_spaces_log').insert({
    space_id: space.id,
    deceased_first_name: space.deceased_first_name,
    deceased_last_name: space.deceased_last_name,
    deceased_nickname: space.deceased_nickname,
    organization_id: space.organization_id,
    deleted_by: user.id,
  })

  await admin.from('memorial_spaces').delete().eq('id', space_id)

  revalidatePath('/director/dashboard')
}
