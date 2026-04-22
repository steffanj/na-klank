'use server'

import { sendContactEmail } from '@/lib/email/contact'

export async function sendContactMessage(formData: FormData): Promise<{ error: string } | null> {
  const name = (formData.get('name') as string)?.trim()
  const email = (formData.get('email') as string)?.trim()
  const message = (formData.get('message') as string)?.trim()
  const spaceId = (formData.get('space_id') as string) || null
  const userId = (formData.get('user_id') as string) || null

  if (!name || !email || !message) {
    return { error: 'Vul alle velden in.' }
  }

  try {
    await sendContactEmail({ name, email, message, spaceId, userId })
    return null
  } catch (err) {
    console.error('[contact] send error:', err)
    return { error: 'Verzenden mislukt. Probeer het later opnieuw.' }
  }
}
