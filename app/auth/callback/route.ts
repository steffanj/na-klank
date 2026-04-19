import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type')
  const next = searchParams.get('next')

  const supabase = await createClient()

  if (token_hash && type) {
    const { error } = await supabase.auth.verifyOtp({ token_hash, type: type as any })
    if (error) {
      return NextResponse.redirect(`${origin}/auth/login?error=auth_failed`)
    }
  } else if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (error) {
      return NextResponse.redirect(`${origin}/auth/login?error=auth_failed`)
    }
  } else {
    return NextResponse.redirect(`${origin}/auth/login?error=auth_failed`)
  }

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.redirect(`${origin}/auth/login`)

  // Link any pending memorial_space_members rows for this email
  const admin = createAdminClient()
  const { data: pending } = await admin
    .from('memorial_space_members')
    .select('id, memorial_space_id')
    .eq('invited_email', user.email!)
    .is('user_id', null)

  if (pending && pending.length > 0) {
    await admin
      .from('memorial_space_members')
      .update({ user_id: user.id, accepted_at: new Date().toISOString() })
      .eq('invited_email', user.email!)
      .is('user_id', null)
  }

  // Determine redirect: explicit next param wins, then role-based default
  if (next) {
    return NextResponse.redirect(`${origin}${next}`)
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role === 'director') {
    return NextResponse.redirect(`${origin}/director/dashboard`)
  }

  // Family member: go to first accepted space
  if (pending && pending.length > 0) {
    return NextResponse.redirect(`${origin}/spaces/${pending[0].memorial_space_id}`)
  }

  const { data: membership } = await supabase
    .from('memorial_space_members')
    .select('memorial_space_id')
    .eq('user_id', user.id)
    .not('accepted_at', 'is', null)
    .limit(1)
    .single()

  if (membership) {
    return NextResponse.redirect(`${origin}/spaces/${membership.memorial_space_id}`)
  }

  return NextResponse.redirect(`${origin}/`)
}
