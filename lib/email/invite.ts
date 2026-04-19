import { Resend } from 'resend'
import { createAdminClient } from '@/lib/supabase/admin'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function sendInvite({
  email,
  name,
  redirectTo,
}: {
  email: string
  name?: string | null
  redirectTo: string
}) {
  const admin = createAdminClient()

  const { data: linkData, error: linkError } = await admin.auth.admin.generateLink({
    type: 'invite',
    email,
    options: { redirectTo, data: name ? { display_name: name } : undefined },
  })

  if (linkError || !linkData) {
    throw new Error(linkError?.message ?? 'Kon geen uitnodigingslink aanmaken.')
  }

  // Build invite URL using hashed_token so the callback can verify it server-side
  // via verifyOtp — avoids PKCE code_verifier requirement from action_link flow
  const { hashed_token } = linkData.properties
  const next = new URL(redirectTo).searchParams.get('next') ?? '/'
  const inviteUrl = `${process.env.APP_URL}/auth/callback?token_hash=${hashed_token}&type=invite&next=${encodeURIComponent(next)}`

  if (process.env.NODE_ENV !== 'production') {
    console.log(`\n[DEV] Invite link for ${email}:\n${inviteUrl}\n`)
    return
  }

  const { error: emailError } = await resend.emails.send({
    from: process.env.RESEND_FROM ?? 'onboarding@resend.dev',
    to: email,
    subject: 'Je bent uitgenodigd voor Na-klank',
    html: `
      <p>Hallo${name ? ` ${name}` : ''},</p>
      <p>Je bent uitgenodigd om deel te nemen aan een herdenkingsruimte op Na-klank.</p>
      <p><a href="${inviteUrl}">Klik hier om je uitnodiging te accepteren</a></p>
      <p>Deze link is 24 uur geldig.</p>
    `,
  })

  if (emailError) {
    throw new Error(`Gebruiker aangemaakt, maar e-mail kon niet worden verstuurd: ${emailError.message}`)
  }
}
