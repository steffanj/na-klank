'use client'

import { useState } from 'react'
import { requestMagicLink } from './actions'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const formData = new FormData()
    formData.set('email', email)

    try {
      await requestMagicLink(formData)
      setSubmitted(true)
    } catch (err: any) {
      setError(err.message ?? 'Er is een fout opgetreden.')
      setLoading(false)
    }
  }

  if (submitted) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-stone-50">
        <div className="max-w-md w-full px-6 py-12 text-center">
          <h1 className="text-2xl font-serif text-stone-800 mb-4">Controleer uw e-mail</h1>
          <p className="text-stone-600">
            We hebben een inloglink gestuurd naar <strong>{email}</strong>. Klik op de link in de e-mail om in te loggen.
          </p>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-stone-50">
      <div className="max-w-md w-full px-6 py-12">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-serif text-stone-800 mb-2">Na-klank</h1>
          <p className="text-stone-500 text-sm">Een persoonlijk eerbetoon</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm text-stone-700 mb-1">
              E-mailadres
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 border border-stone-300 rounded-lg text-stone-800 bg-white focus:outline-none focus:ring-2 focus:ring-stone-400"
              placeholder="uw@emailadres.nl"
            />
          </div>

          {error && <p className="text-red-600 text-sm">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-stone-800 text-white rounded-lg hover:bg-stone-700 transition-colors disabled:opacity-50"
          >
            {loading ? 'Bezig...' : 'Stuur inloglink'}
          </button>
        </form>
      </div>
    </main>
  )
}
