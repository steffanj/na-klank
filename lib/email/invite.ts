import { BrevoClient } from '@getbrevo/brevo'
import { createAdminClient } from '@/lib/supabase/admin'

const brevo = new BrevoClient({ apiKey: process.env.BREVO_API_KEY ?? '' })

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

  const { hashed_token } = linkData.properties
  const next = new URL(redirectTo).searchParams.get('next') ?? '/'
  const inviteUrl = `${process.env.APP_URL}/auth/callback?token_hash=${hashed_token}&type=invite&next=${encodeURIComponent(next)}`

  if (process.env.NODE_ENV !== 'production') {
    console.log(`\n[DEV] Invite link for ${email}:\n${inviteUrl}\n`)
    return
  }

  try {
    await brevo.transactionalEmails.sendTransacEmail({
      sender: { name: 'Na-klank', email: process.env.BREVO_FROM ?? '' },
      to: [{ email, name: name ?? undefined }],
      subject: 'Je bent uitgenodigd voor Na-klank',
      htmlContent: `
        <p>Hallo${name ? ` ${name}` : ''},</p>
        <p>Je bent uitgenodigd om deel te nemen aan een herdenkingsruimte op Na-klank.</p>
        <p><a href="${inviteUrl}">Klik hier om je uitnodiging te accepteren</a></p>
        <p>Deze link is 30 minuten geldig.</p>
      `,
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    throw new Error(`Gebruiker aangemaakt, maar e-mail kon niet worden verstuurd: ${message}`)
  }
}
