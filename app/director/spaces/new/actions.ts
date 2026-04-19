'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { sendInvite } from '@/lib/email/invite'

export async function createMemorialSpace(formData: FormData) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const deceased_first_name  = formData.get('deceased_first_name') as string
  const deceased_last_name   = formData.get('deceased_last_name') as string
  const deceased_nickname    = formData.get('deceased_nickname') as string || null
  const deceased_age         = formData.get('deceased_age') ? Number(formData.get('deceased_age')) : null
  const deceased_profession  = formData.get('deceased_profession') as string || null
  const deceased_retired     = formData.get('deceased_retired') === 'on'
  const funeral_date         = formData.get('funeral_date') as string || null
  const contact_first_name   = formData.get('contact_first_name') as string
  const contact_email        = formData.get('contact_email') as string

  const { data: space, error: spaceError } = await supabase
    .from('memorial_spaces')
    .insert({
      deceased_first_name,
      deceased_last_name,
      deceased_nickname,
      deceased_age,
      deceased_profession,
      deceased_retired,
      funeral_date: funeral_date || null,
      created_by: user.id,
    })
    .select()
    .single()

  if (spaceError || !space) {
    throw new Error(spaceError?.message ?? 'Kon de herdenkingsruimte niet aanmaken.')
  }

  await supabase.from('memorial_space_members').insert({
    memorial_space_id: space.id,
    invited_email: contact_email,
    invited_name: contact_first_name,
    role: 'primary_contact',
    invited_by: user.id,
  })

  await sendInvite({
    email: contact_email,
    name: contact_first_name,
    redirectTo: `${process.env.APP_URL}/auth/callback?next=/spaces/${space.id}`,
  })

  redirect(`/director/spaces/${space.id}`)
}
