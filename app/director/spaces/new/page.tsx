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
    <main className="min-h-screen py-12 px-4" style={{ backgroundColor: '#FFF1E5' }}>
      <div className="max-w-xl mx-auto">
        <a href="/director/dashboard" className="text-sm text-black hover:text-black mb-8 inline-block">
          ← Terug naar overzicht
        </a>
        <h1 className="text-3xl text-black mb-10">Nieuwe herdenkingsruimte</h1>

        <form ref={formRef} onSubmit={handleSubmit} className="space-y-8">

          <section className="space-y-5">
            <h2 className="text-base text-black border-b border-stone-300 pb-2">Gegevens overledene</h2>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Voornamen" name="deceased_first_name" required />
              <Field label="Achternaam" name="deceased_last_name" required />
            </div>
            <div className="flex gap-4">
              <div className="flex-1">
                <Field label="Roepnaam" name="deceased_nickname" />
              </div>
              <div className="w-24">
                <Field label="Leeftijd" name="deceased_age" type="number" min="0" max="130" />
              </div>
            </div>
            <div className="flex items-end gap-4">
              <div className="flex-1">
                <Field label="Beroep" name="deceased_profession" />
              </div>
              <label className="flex items-center gap-2 cursor-pointer pb-2.5">
                <input
                  type="checkbox"
                  name="deceased_retired"
                  className="w-4 h-4 rounded border-stone-400 text-stone-700 focus:ring-stone-400"
                />
                <span className="text-sm text-black whitespace-nowrap">Gepensioneerd</span>
              </label>
            </div>
            <div className="w-44">
              {/* lang="nl" nudges Chromium-based browsers to show dd/mm/yyyy */}
              <Field label="Datum uitvaart" name="funeral_date" type="date" lang="nl" />
            </div>
          </section>

          <section className="space-y-5">
            <h2 className="text-base text-black border-b border-stone-300 pb-2">Primair familiecontact</h2>
            <p className="text-sm text-black -mt-2">
              Deze persoon ontvangt een uitnodigingslink en krijgt toegang tot alle modules.
            </p>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Voornaam" name="contact_first_name" required />
              <Field label="E-mailadres" name="contact_email" type="email" required />
            </div>
          </section>

          {error && <p className="text-red-700 text-sm">{error}</p>}

          <button
            type="submit"
            disabled={pending}
            className="w-full py-3 bg-stone-800 text-white rounded-lg hover:bg-stone-700 transition-colors disabled:opacity-50"
          >
            {pending ? 'Aanmaken...' : 'Aanmaken en uitnodiging versturen'}
          </button>
        </form>
      </div>
    </main>
  )
}

function Field({
  label, name, type = 'text', required = false, ...rest
}: {
  label: string
  name: string
  type?: string
  required?: boolean
  [key: string]: unknown
}) {
  return (
    <div>
      <label htmlFor={name} className="block text-sm text-black mb-1">{label}</label>
      <input
        id={name}
        name={name}
        type={type}
        required={required}
        className="w-full px-4 py-2.5 border border-stone-300 rounded-lg text-black focus:outline-none focus:ring-2 focus:ring-stone-400 text-sm"
        style={{ backgroundColor: '#FFF8F2' }}
        {...(rest as React.InputHTMLAttributes<HTMLInputElement>)}
      />
    </div>
  )
}
