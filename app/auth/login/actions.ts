'use server'

import { sendMagicLink } from '@/lib/email/magic-link'

export async function requestMagicLink(formData: FormData) {
  const email = formData.get('email') as string
  await sendMagicLink({ email })
}
