import Anthropic from 'npm:@anthropic-ai/sdk'
import { createClient } from 'npm:@supabase/supabase-js'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

const anthropic = new Anthropic({ apiKey: Deno.env.get('ANTHROPIC_API_KEY')! })

// ─────────────────────────────────────────────────────────────
// SYSTEM PROMPT — review with user before deploying to production
// ─────────────────────────────────────────────────────────────
const SYSTEM_PROMPT = `Je bent een ervaren tekstschrijver die persoonlijke rouwbrieven opstelt voor uitvaarten in Nederland. \
Je schrijft waardig, warm en persoonlijk — in de toon van een brief die hardop wordt voorgelezen voor familie en vrienden. \
Je vermijdt clichés en algemeenheden; elke zin voelt oprecht en specifiek aan voor de overledene. \
Je schrijft altijd in de eerste persoon, namens de nabestaande die de brief zal voorlezen. \
De brief is tussen de 400 en 600 woorden. \
Schrijf uitsluitend in het Nederlands.`
// ─────────────────────────────────────────────────────────────

Deno.serve(async (req) => {
  let eulogyId: string | undefined
  let jobId: string | undefined

  try {
    const body = await req.json()
    eulogyId = body.eulogy_id
    jobId = body.job_id

    if (!eulogyId || !jobId) {
      return new Response(JSON.stringify({ error: 'eulogy_id and job_id are required' }), { status: 400 })
    }

    await supabase
      .from('generation_jobs')
      .update({ status: 'processing', updated_at: new Date().toISOString() })
      .eq('id', jobId)

    const { data: eulogy } = await supabase
      .from('eulogies')
      .select('id, memorial_space_id')
      .eq('id', eulogyId)
      .single()

    const { data: space } = await supabase
      .from('memorial_spaces')
      .select('deceased_first_name, deceased_nickname, deceased_last_name, deceased_age, deceased_profession, deceased_retired, funeral_date')
      .eq('id', eulogy.memorial_space_id)
      .single()

    const { data: intake } = await supabase
      .from('eulogy_intakes')
      .select('answers_json')
      .eq('eulogy_id', eulogyId)
      .single()

    const firstName = space.deceased_first_name
    const fullName = [
      space.deceased_first_name,
      space.deceased_nickname ? `"${space.deceased_nickname}"` : null,
      space.deceased_last_name,
    ].filter(Boolean).join(' ')

    const answers = (intake?.answers_json ?? {}) as Record<string, string>

    const lines: string[] = [
      'Schrijf een persoonlijke rouwbrief op basis van de volgende informatie.\n',
      'Over de overledene:',
      `- Naam: ${fullName}`,
    ]
    if (space.deceased_age) lines.push(`- Leeftijd: ${space.deceased_age} jaar`)
    if (space.deceased_profession) {
      const prof = space.deceased_retired
        ? `${space.deceased_profession} (gepensioneerd)`
        : space.deceased_profession
      lines.push(`- Beroep: ${prof}`)
    }
    if (space.funeral_date) {
      lines.push(`- Uitvaart: ${new Date(space.funeral_date).toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' })}`)
    }
    lines.push('\nHerinneringen en indrukken van de schrijver:')
    if (answers.relationship) lines.push(`- Relatie tot ${firstName}: ${answers.relationship}`)
    if (answers.in_few_words) lines.push(`- In enkele woorden: ${answers.in_few_words}`)
    if (answers.best_memory) lines.push(`- Mooiste herinnering: ${answers.best_memory}`)
    if (answers.unique) lines.push(`- Wat ${firstName} bijzonder maakte: ${answers.unique}`)
    if (answers.life_lesson) lines.push(`- Levensles: ${answers.life_lesson}`)
    if (answers.passions) lines.push(`- Passies en hobby's: ${answers.passions}`)
    if (answers.story) lines.push(`- Bijzonder verhaal: ${answers.story}`)
    if (answers.remember) lines.push(`- Wat mensen moeten onthouden: ${answers.remember}`)
    lines.push('\nSchrijf nu de rouwbrief. Begin direct met de brief, zonder opschrift of inleiding.')

    const message = await anthropic.messages.create({
      model: 'claude-opus-4-7',
      max_tokens: 8192,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: lines.join('\n') }],
    })

    const content = message.content[0].type === 'text' ? message.content[0].text : ''

    const { data: latestVersion } = await supabase
      .from('eulogy_versions')
      .select('version_number')
      .eq('eulogy_id', eulogyId)
      .order('version_number', { ascending: false })
      .limit(1)
      .maybeSingle()

    const nextVersion = (latestVersion?.version_number ?? 0) + 1

    const { data: version } = await supabase
      .from('eulogy_versions')
      .insert({
        eulogy_id: eulogyId,
        version_number: nextVersion,
        content,
        generation_source: nextVersion === 1 ? 'initial' : 'regenerated',
      })
      .select('id')
      .single()

    await supabase
      .from('eulogies')
      .update({ status: 'ready', current_version_id: version.id, updated_at: new Date().toISOString() })
      .eq('id', eulogyId)

    await supabase
      .from('generation_jobs')
      .update({ status: 'done', updated_at: new Date().toISOString(), completed_at: new Date().toISOString() })
      .eq('id', jobId)

    return new Response(JSON.stringify({ ok: true }), { headers: { 'Content-Type': 'application/json' } })
  } catch (err) {
    console.error('generate-eulogy error:', err)

    if (jobId) {
      await supabase
        .from('generation_jobs')
        .update({ status: 'failed', error_message: String(err), updated_at: new Date().toISOString(), completed_at: new Date().toISOString() })
        .eq('id', jobId)
    }
    if (eulogyId) {
      await supabase
        .from('eulogies')
        .update({ status: 'intake_in_progress', updated_at: new Date().toISOString() })
        .eq('id', eulogyId)
    }

    return new Response(JSON.stringify({ error: String(err) }), { status: 500, headers: { 'Content-Type': 'application/json' } })
  }
})
