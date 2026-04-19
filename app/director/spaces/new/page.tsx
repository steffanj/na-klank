'use client'

import { useRef, useState } from 'react'
import { createMemorialSpace } from './actions'

export default function NewSpacePage() {
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const formRef = useRef<HTMLFormElement>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setPending(true)
    setError(null)
    try {
      await createMemorialSpace(new FormData(e.currentTarget))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Er is een fout opgetreden.')
      setPending(false)
    }
  }

  return (
    <main className="min-h-screen bg-stone-50 py-12 px-4">
      <div className="max-w-xl mx-auto">
        <a href="/director/dashboard" className="text-sm text-stone-400 hover:text-stone-600 mb-6 inline-block">
          ← Terug naar overzicht
        </a>
        <h1 className="text-2xl font-serif text-stone-800 mb-8">Nieuwe herdenkingsruimte</h1>

        <form ref={formRef} onSubmit={handleSubmit} className="space-y-6">
          <section>
            <h2 className="text-sm font-medium text-stone-500 uppercase tracking-wide mb-4">Gegevens overledene</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Field label="Voornaam *" name="deceased_first_name" required />
                <Field label="Achternaam *" name="deceased_last_name" required />
              </div>
              <Field label="Roepnaam" name="deceased_nickname" />
              <div className="grid grid-cols-2 gap-4">
                <Field label="Leeftijd" name="deceased_age" type="number" min="0" max="130" />
                <Field label="Beroep" name="deceased_profession" />
              </div>
              <Field label="Datum uitvaart" name="funeral_date" type="date" />
            </div>
          </section>

          <section>
            <h2 className="text-sm font-medium text-stone-500 uppercase tracking-wide mb-4">Primair familiecontact</h2>
            <Field
              label="E-mailadres nabestaande *"
              name="contact_email"
              type="email"
              required
              hint="Deze persoon ontvangt een uitnodigingslink en krijgt toegang tot alle modules."
            />
          </section>

          {error && <p className="text-red-600 text-sm">{error}</p>}

          <button
            type="submit"
            disabled={pending}
            className="w-full py-3 bg-stone-800 text-white rounded-lg hover:bg-stone-700 transition-colors disabled:opacity-50"
          >
            {pending ? 'Aanmaken...' : 'Herdenkingsruimte aanmaken & uitnodiging versturen'}
          </button>
        </form>
      </div>
    </main>
  )
}

function Field({
  label, name, type = 'text', required = false, hint, ...rest
}: {
  label: string
  name: string
  type?: string
  required?: boolean
  hint?: string
  [key: string]: unknown
}) {
  return (
    <div>
      <label htmlFor={name} className="block text-sm text-stone-700 mb-1">{label}</label>
      <input
        id={name}
        name={name}
        type={type}
        required={required}
        className="w-full px-4 py-2.5 border border-stone-300 rounded-lg text-stone-800 bg-white focus:outline-none focus:ring-2 focus:ring-stone-400 text-sm"
        {...(rest as React.InputHTMLAttributes<HTMLInputElement>)}
      />
      {hint && <p className="text-xs text-stone-400 mt-1">{hint}</p>}
    </div>
  )
}
