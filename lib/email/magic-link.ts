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

  // Look up spaces associated with this email to personalize the email
  const { data: memberships } = await admin
    .from('memorial_space_members')
    .select('invited_name, memorial_spaces(deceased_first_name, deceased_nickname, deceased_last_name)')
    .eq('invited_email', email)

  type SpaceRow = {
    deceased_first_name: string
    deceased_nickname: string | null
    deceased_last_name: string
  }

  const rows = (memberships ?? []).map(m => {
    const s = m.memorial_spaces
    if (!s || Array.isArray(s)) return null
    return { space: s as unknown as SpaceRow, invited_name: m.invited_name as string | null }
  }).filter((r): r is { space: SpaceRow; invited_name: string | null } => r !== null)

  const userName = rows[0]?.invited_name ?? null
  const greeting = `Hallo${userName ? ` ${userName}` : ''},`

  let subject: string
  let body: string

  if (rows.length === 1) {
    const s = rows[0].space
    const deceasedName = [
      s.deceased_first_name,
      s.deceased_nickname ? `"${s.deceased_nickname}"` : null,
      s.deceased_last_name,
    ].filter(Boolean).join(' ')
    subject = 'Inloglink voor Na-klank herinneringsruimte'
    body = `<p>${greeting}</p>
      <p>Klik op de onderstaande link om in te loggen bij Na-klank voor toegang tot de herinneringsruimte van ${deceasedName}.</p>`
  } else if (rows.length > 1) {
    subject = 'Inloglink voor Na-klank herinneringsruimten'
    body = `<p>${greeting}</p>
      <p>Klik op de onderstaande link om in te loggen bij Na-klank voor toegang tot verschillende herinneringsruimten.</p>`
  } else {
    subject = 'Inloglink voor Na-klank'
    body = `<p>${greeting}</p>
      <p>Klik op de onderstaande link om in te loggen bij Na-klank.</p>`
  }

  try {
    await brevo.transactionalEmails.sendTransacEmail({
      sender: { name: 'Na-klank', email: process.env.BREVO_FROM ?? '' },
      to: [{ email }],
      subject,
      htmlContent: `${body}
        <p><a href="${magicUrl}">Inloggen</a></p>
        <p>Deze link is 30 minuten geldig en kan maar één keer worden gebruikt.</p>
      `,
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    throw new Error(`E-mail kon niet worden verstuurd: ${message}`)
  }
}
