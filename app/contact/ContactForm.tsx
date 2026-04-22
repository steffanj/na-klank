'use client'

import { useState } from 'react'
import { sendContactMessage } from './actions'

export default function ContactForm({
  defaultName,
  defaultEmail,
  spaceId,
  userId,
}: {
  defaultName: string
  defaultEmail: string
  spaceId: string | null
  userId: string | null
}) {
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const result = await sendContactMessage(new FormData(e.currentTarget))
    setLoading(false)
    if (result?.error) {
      setError(result.error)
    } else {
      setSent(true)
    }
  }

  if (sent) {
    return <p className="text-sm text-black">Je bericht is verzonden. We nemen zo snel mogelijk contact op.</p>
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {spaceId && <input type="hidden" name="space_id" value={spaceId} />}
      {userId && <input type="hidden" name="user_id" value={userId} />}
      <div>
        <label className="block text-sm text-black mb-1">Naam</label>
        <input
          name="name"
          defaultValue={defaultName}
          required
          className="w-full px-4 py-3 text-sm text-black border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-400"
          style={{ backgroundColor: '#FFF8F2' }}
        />
      </div>
      <div>
        <label className="block text-sm text-black mb-1">E-mail</label>
        <input
          name="email"
          type="email"
          defaultValue={defaultEmail}
          required
          className="w-full px-4 py-3 text-sm text-black border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-400"
          style={{ backgroundColor: '#FFF8F2' }}
        />
      </div>
      <div>
        <label className="block text-sm text-black mb-1">Bericht</label>
        <textarea
          name="message"
          required
          rows={5}
          className="w-full px-4 py-3 text-sm text-black border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-400 resize-y"
          style={{ backgroundColor: '#FFF8F2' }}
        />
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className="px-6 py-3 text-sm border border-stone-300 rounded-lg text-black hover:border-stone-800 transition-colors disabled:opacity-50"
        style={{ backgroundColor: '#FFF8F2' }}
      >
        {loading ? 'Verzenden…' : 'Verstuur bericht'}
      </button>
    </form>
  )
}
