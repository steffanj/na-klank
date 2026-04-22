import { BrevoClient } from '@getbrevo/brevo'
import { createAdminClient } from '@/lib/supabase/admin'

const brevo = new BrevoClient({ apiKey: process.env.BREVO_API_KEY ?? '' })

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

  try {
    await brevo.transactionalEmails.sendTransacEmail({
      sender: { name: 'Na-klank', email: process.env.BREVO_FROM ?? '' },
      to: [{ email }],
      subject: 'Inloglink voor Na-klank',
      htmlContent: `
        <p>Hallo,</p>
        <p>Klik op de onderstaande link om in te loggen bij Na-klank.</p>
        <p><a href="${magicUrl}">Inloggen</a></p>
        <p>Deze link is 24 uur geldig en kan maar één keer worden gebruikt.</p>
      `,
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    throw new Error(`E-mail kon niet worden verstuurd: ${message}`)
  }
}
