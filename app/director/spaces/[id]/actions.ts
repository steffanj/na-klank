'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { sendInvite } from '@/lib/email/invite'

export async function addFamilyMember(formData: FormData) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const space_id = formData.get('space_id') as string
  const email = formData.get('email') as string
  const name = formData.get('name') as string || null

  await supabase.from('memorial_space_members').insert({
    memorial_space_id: space_id,
    invited_email: email,
    invited_name: name,
    role: 'family_member',
    invited_by: user.id,
  })

  await sendInvite({
    email,
    redirectTo: `${process.env.APP_URL}/auth/callback?next=/spaces/${space_id}`,
  })

  revalidatePath(`/director/spaces/${space_id}`)
}
