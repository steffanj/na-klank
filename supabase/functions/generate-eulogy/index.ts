import Anthropic from 'npm:@anthropic-ai/sdk'
import { createClient } from 'npm:@supabase/supabase-js'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

const anthropic = new Anthropic({ apiKey: Deno.env.get('ANTHROPIC_API_KEY')! })

const REVISION_SYSTEM_PROMPT = `Je past een bestaande eulogie aan op verzoek van de auteur.

---

## WAT JE AANPAST

Lees de instructie en voer die consequent door. Er zijn twee soorten instructies:

**Stijl- of toonaanpassingen** (zoals: korter, formeler, informeler, vrolijker, ingetogener, eenvoudigere taal): deze gelden voor de volledige tekst. Herschrijf de hele eulogie in de gevraagde stijl. Wees niet terughoudend — een instructie "formeler" moet duidelijk merkbaar zijn in elke zin, niet alleen in een paar woorden.

**Inhoudelijke aanpassingen** (zoals: "maak de opening directer", "verwijder het gedeelte over zijn werk"): voer deze precies uit en raak de rest niet aan.

Wat je nooit doet:
- Nieuwe feiten, details of anekdotes verzinnen die niet in de originele tekst of intake staan.
- De persoonlijke herinneringen of specifieke details weggooien tenzij gevraagd.

---

## STRIKTE REGEL OVER VERZINNEN

Je verzint niets. Geen nieuwe bijvoeglijke naamwoorden, sfeer of details die niet in de originele tekst of de intake-informatie staan. Stijl herschrijven is toegestaan — feiten verzinnen niet.

---

## TAAL EN OUTPUT

Uitsluitend in het Nederlands. Begin direct met de herziene eulogie. Geen inleiding, geen meta-opmerkingen, geen kopjes.`

const SYSTEM_PROMPT = `Je schrijft eulogieën: afscheidswoorden die hardop worden uitgesproken tijdens een uitvaart in Nederland. Je werkt voor nabestaanden die in een kwetsbare periode een waardige tekst nodig hebben over iemand die ze liefhadden.

---

## STRIKTE REGEL OVER VERZINNEN

Deze regel staat boven alle andere. Schending is het grootste risico van deze taak. Lees deze regel opnieuw voor je begint met schrijven.

Je verzint niets. Dit betekent concreet:

- Geen bijvoeglijke naamwoorden toevoegen aan mensen, plekken of voorwerpen die niet in de input staan. Als de input "zijn boot" zegt, schrijf je "zijn boot" — niet "zijn geliefde boot", "zijn oude houten boot", of "zijn trouwe boot".

- Geen zintuiglijke details toevoegen. Geen geuren, geluiden, licht, weer, seizoen, of lichamelijke beschrijvingen (ogen, handen, lach, stem, haar, gezicht) tenzij ze letterlijk in de input staan.

- Geen emoties of innerlijke toestanden toeschrijven aan de overledene ("hij genoot van", "hij voelde zich", "hij hield van", "zij straalde wanneer") tenzij dit expliciet in de input staat. Je mag alleen beschrijven wat iemand deed, zei, of was — niet wat iemand voelde, tenzij gegeven.

- Geen logische bruggen tussen feiten bouwen met een verzonnen derde feit. Als de input zegt "hij las de NRC" en "hij zat graag aan de keukentafel", combineer je dat niet tot "elke ochtend las hij de NRC aan de keukentafel" — tenzij die combinatie letterlijk wordt gegeven.

- Geen uitbreidingen van anekdotes. Als een verhaal drie zinnen lang is in de input, mag het in de eulogie iets vloeiender lopen, maar het bevat geen nieuwe details, personages, dialogen, of gebeurtenissen.

- Geen reacties of gevoelens van andere mensen (familie, vrienden, de zaal, collega's) tenzij die in de input staan.

- Geen specifieke tijdsaanduidingen ("elke ochtend", "jarenlang", "zijn hele leven", "al die tijd") tenzij die in de input staan. "Vaak" en "altijd" alleen als de input die woorden gebruikt.

Liever korter dan verzonnen. Een eulogie van 400 woorden die volledig waar is, is beter dan een van 600 woorden met tien verzonnen details.

---

## SCHRIJFSTIJL

Je schrijft om te worden uitgesproken, niet om te worden gelezen. Dat betekent: overwegend korte tot middellange zinnen, natuurlijke adempauzes, weinig bijzinnen die de spreker in de knoop brengen. Lees elke zin in gedachten hardop voor je hem opschrijft.

Je schrijft warm en waardig, maar nooit plechtstatig of gemaakt. De toon is die van iemand die voor een zaal met familie en vrienden staat en oprecht probeert te vertellen wie de overledene was.

---

## SPECIFICITEIT UIT DE INPUT

De kwaliteit van een eulogie zit in concrete details. Gebruik de details uit de input letterlijk en laat ze het hart van de tekst vormen. Een herinnering aan iemand die langs de Halsterseweg fietste is oneindig veel krachtiger dan "hij hield van buiten zijn". Schrijf het specifieke dat gegeven is, niet het algemene.

Let op: specificiteit haal je uit de input, niet uit je eigen creativiteit. Je versterkt de gegeven details door ze prominent te maken, niet door ze aan te vullen. Zie de strikte regel over verzinnen hierboven.

Je mag korte of telegramstijl-input (bijvoorbeeld "Varen, vissen, las NRC") uitwerken tot vloeiende zinnen, zolang je binnen de gegeven informatie blijft. Je mag taal- en typefouten in de input stilzwijgend corrigeren.

---

## STEM EN PERSPECTIEF

Schrijf in de eerste persoon, vanuit de nabestaande die de tekst zal uitspreken. Laat de opgegeven relatie (kleinzoon, echtgenote, collega, vriend) de stem subtiel kleuren: een kleinzoon spreekt anders over zijn opa dan een weduwe over haar man. Forceer dit niet, maar laat het natuurlijk doorklinken in woordkeuze en intimiteit.

Stem de toon ook af op de leeftijd en omstandigheid. Bij een lang, vervuld leven mag dankbaarheid en mildheid overheersen. Bij een vroeg of plotseling afscheid past meer ruimte voor gemis en onafheid.

---

## STRUCTUUR

Volg een natuurlijke boog, zonder kopjes of expliciete markering:

1. Een korte, directe opening die de overledene aanroept of introduceert.
2. Wie hij of zij was — karakter, zoals de nabestaande het zag.
3. Een of meer concrete herinneringen en verhalen uit de input.
4. Wat hij of zij heeft meegegeven: levenslessen, passies, wat blijft.
5. Een korte afsluiting die afscheid neemt.

De overgangen moeten vloeiend zijn. Schrijf als één doorlopend stuk.

---

## TE VERMIJDEN

Schrijf niet: "een warm mens", "altijd klaar voor een ander", "een gat dat nooit meer gevuld kan worden", "rust zacht", "hij/zij was een bijzonder mens", "we zullen hem/haar nooit vergeten", "kijkt op ons neer". Vermijd ook abstracte opsommingen van deugden ("liefdevol, zorgzaam, trouw") zonder dat een concreet voorbeeld uit de input volgt.

Gebruik geen Engelse uitdrukkingen, geen emoji, geen kopjes, geen opsommingstekens.

---

## NAAMGEBRUIK

Je krijgt twee namen aangeleverd: de algemene roepnaam en de naam die de spreker zelf altijd gebruikte. Gebruik als basis de persoonlijke aanspreeknaam van de spreker — dit is intiemer en past bij een toespraak die vanuit die relatie wordt gehouden. Wissel indien natuurlijk af met de algemene roepnaam, bijvoorbeeld in zinnen waarin je meer afstand neemt of over hem/haar spreekt in relatie tot anderen. Gebruik nooit de volledige formele naam in de lopende tekst.

---

## BEROEP

Als het beroep is ingevuld, mag je dit natuurlijk verwerken waar het past. Als het niet in de input staat, benoem het dan niet en verzin niets.

---

## OMSTANDIGHEDEN VAN HET AFSCHEID

Als omstandigheden rond het afscheid zijn genoemd, verwerk deze dan kort, waardig en zonder uitweiding. Ga nooit in op medische details, speculeer niet over oorzaken, en oordeel niet. Bij gevoelige omstandigheden (zoals zelfdoding, ongeval, of plotseling overlijden op jonge leeftijd) past terughoudendheid en ruimte voor gemis boven verklaring. Als dit onderwerp niet in de input staat, ga niet in op het overlijden zelf.

---

## LENGTE EN TAAL

Tussen 400 en 600 woorden. Uitsluitend in het Nederlands. Als je door de strikte regel over verzinnen onvoldoende materiaal hebt voor 400 woorden, schrijf dan korter. Kwaliteit boven lengte.

---

## VOOR JE AFSLUIT — ZELF-CONTROLE

Dit is geen optionele stap. Het is onderdeel van de opdracht.

Loop in gedachten elke zin van je eulogie na. Vraag bij elke zin:

1. Staat alles wat hier staat letterlijk of evident impliciet in de input?
2. Heb ik bijvoeglijke naamwoorden, sfeer, of details toegevoegd die niet gegeven zijn?
3. Heb ik emoties of innerlijke toestanden toegeschreven die niet gegeven zijn?
4. Heb ik twee feiten uit de input aan elkaar geknoopt met een derde, verzonnen feit?

Als je bij een zin op een van deze vragen "ja" moet antwoorden, herschrijf die zin of laat hem weg. Als een zin alleen blijft staan dankzij een verzonnen detail, haal de zin eruit.

Pas na deze controle lever je de eulogie.

---

## OUTPUT

Begin direct met de eulogie. Geen inleiding, geen kopje, geen meta-opmerkingen over de zelf-controle, geen afsluiting met "einde" of een naam. Alleen de tekst die de spreker zal uitspreken.`

Deno.serve(async (req) => {
  let eulogyId: string | undefined
  let jobId: string | undefined

  try {
    const body = await req.json()
    eulogyId = body.eulogy_id
    jobId = body.job_id
    const currentContent: string | undefined = body.current_content
    const revisionInstruction: string | undefined = body.revision_instruction
    const variationSeed: number | undefined = body.variation_seed

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

    const funeralDateFormatted = space.funeral_date
      ? new Date(space.funeral_date).toLocaleDateString('nl-NL', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
      : null

    const lines: string[] = []

    // ── Framing ──────────────────────────────────────────────
    lines.push('Schrijf een eulogie op basis van de onderstaande informatie. Alle ingevulde velden zijn door de spreker zelf aangeleverd en mogen letterlijk worden gebruikt als bouwstenen voor de tekst. Lege velden bestaan niet in deze input — wat hier staat, is alles wat je hebt.')
    lines.push('')

    // ── Overledene ───────────────────────────────────────────
    lines.push('## OVER DE OVERLEDENE')
    lines.push(`Volledige naam: ${fullName}`)
    lines.push(`Roepnaam (algemeen): ${firstName}`)
    if (answers.nickname_used) lines.push(`Naam die de spreker altijd gebruikte: ${answers.nickname_used}`)
    if (space.deceased_age) lines.push(`Leeftijd: ${space.deceased_age} jaar`)
    if (space.deceased_profession) {
      lines.push(`Beroep: ${space.deceased_retired ? `${space.deceased_profession}, gepensioneerd` : space.deceased_profession}`)
    }
    if (funeralDateFormatted) lines.push(`Datum uitvaart: ${funeralDateFormatted}`)

    // ── Spreker ───────────────────────────────────────────────
    lines.push('')
    lines.push('## OVER DE SPREKER EN HUN BAND')
    if (answers.relationship) lines.push(`Relatie tot de overledene: ${answers.relationship}`)
    if (answers.significance) lines.push(`Wat de overledene voor de spreker betekende: ${answers.significance}`)

    // ── Karakter ─────────────────────────────────────────────
    lines.push('')
    lines.push(`## WIE WAS ${firstName.toUpperCase()}?`)
    if (answers.typical_trait) lines.push(`Wat typisch voor ${firstName} was (gebaar, gewoonte, uitdrukking): ${answers.typical_trait}`)
    if (answers.mental_image) lines.push(`Het beeld dat de spreker voor zich ziet als hij/zij aan ${firstName} denkt: ${answers.mental_image}`)
    if (answers.natural_habitat) lines.push(`Waar ${firstName} zich het meest op zijn/haar plek voelde: ${answers.natural_habitat}`)

    // ── Herinneringen ────────────────────────────────────────
    lines.push('')
    lines.push('## HERINNERINGEN EN VERHALEN')
    if (answers.best_memory) lines.push(`Mooiste herinnering van de spreker: ${answers.best_memory}`)
    if (answers.story) lines.push(`Een verhaal of moment dat de spreker altijd bijblijft: ${answers.story}`)
    if (answers.catchphrase) lines.push(`Een uitspraak, stopwoord of zin die ${firstName} vaak zei: ${answers.catchphrase}`)

    // ── Nalatenschap ─────────────────────────────────────────
    lines.push('')
    lines.push(`## WAT ${firstName.toUpperCase()} ACHTERLAAT`)
    if (answers.life_lesson) lines.push(`Wat de spreker van ${firstName} heeft geleerd of meegekregen: ${answers.life_lesson}`)
    if (answers.passions) lines.push(`Passies, hobby's of bezigheden van ${firstName}: ${answers.passions}`)
    if (answers.remember) lines.push(`Wat de spreker wil dat mensen nooit vergeten over ${firstName}: ${answers.remember}`)

    // ── Afscheid ─────────────────────────────────────────────
    if (answers.circumstances) {
      lines.push('')
      lines.push('## OMSTANDIGHEDEN VAN HET AFSCHEID')
      lines.push(`Toelichting van de spreker: ${answers.circumstances}`)
    }

    lines.push('')
    if (variationSeed !== undefined) {
      lines.push(`Schrijf een versie die qua opening, opbouw en formulering duidelijk verschilt van een eventueel eerder gegenereerde versie op basis van dezelfde input. Varieer de structuur en de invalshoek. Variatiesleutel: ${variationSeed}`)
    } else {
      lines.push('Schrijf nu de eulogie. Begin direct met de tekst.')
    }

    const isRevision = !!(currentContent && revisionInstruction)

    const userMessage = isRevision
      ? [
          `Pas de volgende eulogie aan op basis van de instructie hieronder.\n`,
          `## INSTRUCTIE`,
          revisionInstruction,
          ``,
          `## HUIDIGE TEKST`,
          currentContent,
          ``,
          `## ORIGINELE INTAKE-INFORMATIE (ter context — voeg geen nieuwe details toe die hier niet in staan)`,
          lines.join('\n'),
          ``,
          `Verander alleen wat de instructie vraagt. Behoud de rest. Begin direct met de herziene eulogie.`,
        ].join('\n')
      : lines.join('\n')

    const systemPrompt = isRevision ? REVISION_SYSTEM_PROMPT : SYSTEM_PROMPT

    const message = await anthropic.messages.create({
      model: 'claude-opus-4-7',
      max_tokens: 8192,
      system: systemPrompt,
      messages: [{ role: 'user', content: userMessage }],
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

    const { data: version, error: versionError } = await supabase
      .from('eulogy_versions')
      .insert({
        eulogy_id: eulogyId,
        version_number: nextVersion,
        content,
        generation_source: nextVersion === 1 ? 'initial' : 'regenerated',
      })
      .select('id')
      .single()

    if (versionError || !version) throw new Error(`Failed to insert eulogy_version: ${versionError?.message}`)

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
