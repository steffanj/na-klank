import { createClient } from '@/lib/supabase/server'
import ContactForm from './ContactForm'
import Footer from '@/app/components/Footer'

export default async function ContactPage({ searchParams }: { searchParams: Promise<{ space_id?: string }> }) {
  const { space_id } = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let userName = ''
  let userEmail = ''

  if (user) {
    userEmail = user.email ?? ''

    if (space_id) {
      const { data: membership } = await supabase
        .from('memorial_space_members')
        .select('invited_name')
        .eq('memorial_space_id', space_id)
        .eq('user_id', user.id)
        .maybeSingle()
      userName = membership?.invited_name ?? ''
    }

    if (!userName) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('display_name')
        .eq('id', user.id)
        .maybeSingle()
      userName = profile?.display_name ?? ''
    }
  }

  return (
    <main className="min-h-screen py-12 px-4" style={{ backgroundColor: '#FFF1E5' }}>
      <div className="max-w-2xl mx-auto">
        {space_id && (
          <a href={`/spaces/${space_id}`} className="text-sm text-black hover:text-black mb-8 inline-block">
            ← Terug
          </a>
        )}
        <div className="mb-8">
          <h1 className="text-3xl text-black">Contact</h1>
        </div>
        <div className="mb-8 text-sm text-black space-y-1">
          <p>Telefoon: <a href="tel:+31643004501" className="hover:underline">+316 4300 4501</a></p>
          <p className="text-stone-500">Of stuur een bericht via het formulier:</p>
        </div>
        <ContactForm
          defaultName={userName}
          defaultEmail={userEmail}
          spaceId={space_id ?? null}
          userId={user?.id ?? null}
        />
        <Footer spaceId={space_id} />
      </div>
    </main>
  )
}
