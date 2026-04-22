import { BrevoClient } from '@getbrevo/brevo'

const brevo = new BrevoClient({ apiKey: process.env.BREVO_API_KEY ?? '' })

export async function sendContactEmail({
  name,
  email,
  message,
  spaceId,
  userId,
}: {
  name: string
  email: string
  message: string
  spaceId?: string | null
  userId?: string | null
}) {
  if (process.env.NODE_ENV !== 'production') {
    console.log(`\n[DEV] Contact from ${name} <${email}>:\n${message}\n`)
    return
  }

  let metaHtml = ''
  if (spaceId || userId) {
    metaHtml = `<hr style="margin-top:24px"><p style="color:#999;font-size:12px;">`
    if (spaceId) metaHtml += `Space ID: ${spaceId}<br>`
    if (userId) metaHtml += `User ID: ${userId}`
    metaHtml += `</p>`
  }

  await brevo.transactionalEmails.sendTransacEmail({
    sender: { name: 'Na-klank', email: process.env.BREVO_FROM ?? '' },
    to: [{ email: 'na-klank@tuta.com', name: 'Na-klank Support' }],
    replyTo: { email, name },
    subject: `Contactbericht van ${name}`,
    htmlContent: `
      <p><strong>Naam:</strong> ${name}</p>
      <p><strong>E-mail:</strong> ${email}</p>
      <p><strong>Bericht:</strong></p>
      <p>${message.replace(/\n/g, '<br>')}</p>
      ${metaHtml}
    `,
  })
}
