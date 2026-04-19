import { Resend } from 'resend'
import { createAdminClient } from '@/lib/supabase/admin'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function sendMagicLink({ email }: { email: string }) {
  const admin = createAdminClient()

  const { data: linkData, error: linkError } = await admin.auth.admin.generateLink({
    type: 'magiclink',
    email,
    options: { redirectTo: `${process.env.APP_URL}/auth/callback` },
  })

  if (linkError || !linkData) {
    throw new Error(linkError?.message ?? 'Kon geen inloglink aanmaken.')
  }

  const { hashed_token } = linkData.properties
  const magicUrl = `${process.env.APP_URL}/auth/callback?token_hash=${hashed_token}&type=magiclink`

  if (process.env.NODE_ENV !== 'production') {
    console.log(`\n[DEV] Magic link for ${email}:\n${magicUrl}\n`)
    return
  }

  const { error: emailError } = await resend.emails.send({
    from: process.env.RESEND_FROM ?? 'onboarding@resend.dev',
    to: email,
    subject: 'Inloglink voor Na-klank',
    html: `
      <p>Hallo,</p>
      <p>Klik op de onderstaande link om in te loggen bij Na-klank.</p>
      <p><a href="${magicUrl}">Inloggen</a></p>
      <p>Deze link is 24 uur geldig en kan maar één keer worden gebruikt.</p>
    `,
  })

  if (emailError) {
    throw new Error(`E-mail kon niet worden verstuurd: ${emailError.message}`)
  }
}
