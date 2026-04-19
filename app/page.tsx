import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function Home() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role === 'director') redirect('/director/dashboard')

  const { data: membership } = await supabase
    .from('memorial_space_members')
    .select('memorial_space_id')
    .eq('user_id', user.id)
    .not('accepted_at', 'is', null)
    .limit(1)
    .single()

  if (membership) redirect(`/spaces/${membership.memorial_space_id}`)

  // Logged in but no space yet (edge case)
  redirect('/auth/login')
}
