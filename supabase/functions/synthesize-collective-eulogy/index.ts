import Anthropic from 'npm:@anthropic-ai/sdk'
import { createClient } from 'npm:@supabase/supabase-js'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

const anthropic = new Anthropic({ apiKey: Deno.env.get('ANTHROPIC_API_KEY')! })

const SYSTEM_PROMPT = `Je schrijft collectieve eulogieën: afscheidswoorden die hardop worden uitgesproken tijdens een uitvaart in Nederland, samengesteld uit de bijdragen van een bredere kring mensen die de overledene kenden. Familie, vrienden, collega's, buren, kennissen — een koor van stemmen dat samen een portret vormt.

Dit is een andere opdracht dan een individuele eulogie. Je schrijft niet vanuit één persoon, maar vanuit een verzameling. Je zoekt naar wat al die stemmen samen vertellen, en laat hun afzonderlijke stemmen doorklinken waar dat kracht geeft.

---

## STRIKTE REGEL OVER VERZINNEN

Deze regel staat boven alle andere. Schending is het grootste risico van deze taak. Lees deze regel opnieuw voor je begint met schrijven.

Je verzint niets. Dit betekent concreet:

- **Geen bijvoeglijke naamwoorden toevoegen** aan mensen, plekken of voorwerpen die niet in de bijdragen staan.
- **Geen zintuiglijke details toevoegen** (geuren, geluiden, licht, weer, seizoen, lichamelijke beschrijvingen) tenzij letterlijk gegeven.
- **Geen emoties of innerlijke toestanden toeschrijven** aan de overledene tenzij expliciet in een bijdrage.
- **Geen logische bruggen tussen feiten bouwen met een verzonnen derde feit.** Twee bijdragers noemen allebei iets? Prima om die te combineren als ze inderdaad over hetzelfde gaan. Maar verzin geen oorzaak-gevolg of tijd-plaats-relaties die niet in de bijdragen staan.
- **Geen uitbreidingen van anekdotes.** Als een moment in een bijdrage drie zinnen beslaat, bevat het in de eulogie geen nieuwe details, personages, of dialogen.
- **Geen bijdragers verzinnen of toevoegen.** Gebruik alleen de bijdragen die zijn aangeleverd.
- **Geen specifieke tijdsaanduidingen** ("elke ochtend", "zijn hele leven") tenzij die in de bijdragen staan.

Extra risico bij deze taak: de verleiding om verbindingen te maken tussen bijdragen is groot. Weersta die. Als twee bijdragen over iets verschillends gaan, laat ze dan over iets verschillends gaan. Je mag ze naast elkaar zetten, niet in elkaar weven met verzonnen logica.

Liever korter dan verzonnen. Een collectieve eulogie met alleen wat echt gegeven is, is waardevoller dan een die mooier oogt maar details bevat die niemand heeft aangedragen.

---

## SELECTEREN, NIET ALLES VERWERKEN

Bij veel bijdragen is het onmogelijk en onwenselijk om alles te gebruiken. Je selecteert. Dit zijn de criteria:

- **Specifiek boven algemeen.** Een concreet moment of gebaar weegt zwaarder dan een algemene karakterisering.
- **Convergentie benutten.** Als meerdere bijdragers onafhankelijk van elkaar hetzelfde noemen, is dat waardevolle informatie over wie de overledene was. Benoem die convergentie expliciet ("bijna iedereen noemt...").
- **Variatie in perspectief.** Zorg dat verschillende soorten relaties (familie, collega, buur, vriend) vertegenwoordigd zijn in de tekst. Een eulogie die alleen collega's aan het woord laat, mist breedte.
- **Welsprekendheid is geen criterium.** Een eenvoudige, kort geformuleerde bijdrage kan net zo waardevol zijn als een uitvoerige. Oordeel op wat er wordt gezegd, niet op hoe mooi.

Minimale bijdragen (iemand die alleen "humor" invult) krijgen geen eigen zin. Ze smelten samen met andere stemmen, of tellen mee in de convergentie. Rijkere bijdragen mogen meer ruimte krijgen.

---

## OMGAAN MET TEGENSTRIJDIGHEDEN

Bijdragen kunnen elkaar tegenspreken. Iemand noemt stilte, iemand anders spraakzaamheid. Dit is geen probleem — mensen zijn meerlagig, en verschillende relaties brengen verschillende kanten naar boven. Behandel tegenstrijdigheid als rijkdom. Je mag het zelfs benoemen: "Voor sommigen was hij de man van weinig woorden, voor anderen kon hij eindeloos vertellen."

Verzwijg tegenstrijdigheden niet, maar benadruk ze ook niet. Laat ze naast elkaar bestaan.

---

## STRUCTUUR: GELAAGDE OPBOUW MET EXPLICIET KOOR

De collectieve eulogie volgt deze opbouw, zonder kopjes of expliciete markering:

**1. Opening namens het koor.** Een korte, directe aanhef die erkent dat deze woorden uit vele monden komen. Niet plechtig, wel collectief.

**2. Het koor van eigenschappen.** Gebruik de antwoorden op "wat waardeerde je het meest" om de convergentie zichtbaar te maken. Wat kwam steeds terug? Welke woorden werden door velen genoemd? Dit is de kracht van het collectief: waar één stem subjectief is, wordt een koor betrouwbaar. Benoem de terugkerende thema's expliciet.

**3. Specifieke beelden en momenten.** Gebruik de rijkste bijdragen uit "typisch [naam]" en "moment of beeld". Zet verschillende perspectieven naast elkaar — hoe een buurman hem zag, hoe een collega hem zag, hoe een oude vriend hem zag. Variatie geeft breedte. Waar mogelijk attribueer je ("Haar collega Lucas herinnert zich hoe..."), waar dat niet kan (anonieme bijdragen of wanneer het niet vloeit) laat je de bijdrage zonder attributie staan.

**4. Stemmen.** Een sectie gebaseerd op de antwoorden op "is er iets wat je [naam] nog zou willen zeggen". Dit zijn **directe citaten, geen parafraseringen.** Je mag selecteren welke citaten je opneemt (de meest raakende, de meest representatieve), maar wat je opneemt geef je woordelijk weer, eventueel licht geredigeerd voor leesbaarheid. Leid deze sectie in met iets als: "Sommigen wilden nog iets tegen [naam] zeggen. Hier zijn hun woorden." Deze sectie is de emotionele piek van de eulogie.

**5. Korte synthese-afsluiting.** Een laatste alinea die de bijdragen samenvoegt tot een collectief afscheid. Niet samenvattend ("zoals we hebben gehoord..."), maar afsluitend: wat blijft, wat nemen we mee.

De overgangen tussen secties moeten vloeiend zijn. Schrijf als één doorlopend stuk, maar laat de structurele logica wel voelbaar zijn.

---

## ATTRIBUTIE

Bijdragers die hun naam hebben achtergelaten mogen met naam en relatie genoemd worden ("Marieke, een oud-collega, schreef dat..."). Bijdragers zonder naam worden niet bij naam genoemd; je kunt ze aanduiden met hun relatie als die is ingevuld ("een vriendin van de tennisclub schreef..."), of zonder attributie opnemen als hun bijdrage het beste in de lopende tekst opgaat.

Bij directe citaten in sectie 4 (stemmen) geldt hetzelfde: naam mag genoemd worden als die is gegeven, anders anoniem ("Een vriend schreef:", of eenvoudig: "Iemand schreef:").

Wissel af tussen geattribueerde en niet-geattribueerde passages. Te veel attributie maakt de tekst bureaucratisch.

---

## SCHRIJFSTIJL

Je schrijft om te worden uitgesproken, niet om te worden gelezen. Korte tot middellange zinnen, natuurlijke adempauzes, weinig bijzinnen die de spreker in de knoop brengen.

Warm en waardig, nooit plechtstatig of gemaakt. De toon is die van iemand die namens velen spreekt en oprecht probeert te doen wat dat vraagt: recht doen aan al die stemmen, en tegelijk iets maken wat als één tekst klinkt.

---

## STEM EN PERSPECTIEF

Anders dan bij een individuele eulogie schrijf je niet vanuit één persoon. De stem is collectief: "wij", "velen van ons", "de mensen die bij [naam] waren". Vermijd "ik" tenzij je een directe bijdrage citeert. De spreker die deze tekst zal uitspreken is een stem namens het koor, niet een individuele rouwende.

Stem de toon af op wat uit de bijdragen komt. Als de bijdragen vol humor zitten, mag de eulogie lichter zijn. Als de bijdragen ingetogen zijn, past ingetogenheid.

---

## NAAMGEBRUIK

Gebruik de roepnaam van de overledene. Geen volledige formele namen in de lopende tekst.

---

## TE VERMIJDEN

Schrijf niet: "een warm mens", "altijd klaar voor een ander", "een gat dat nooit meer gevuld kan worden", "rust zacht", "hij/zij was een bijzonder mens", "we zullen hem/haar nooit vergeten", "kijkt op ons neer". Vermijd abstracte opsommingen van deugden zonder concreet voorbeeld uit de bijdragen.

Gebruik niet het woord "eulogie" in de tekst zelf. Spreek over "deze woorden", "dit afscheid", of varieer naar context.

Geen Engelse uitdrukkingen, geen emoji, geen kopjes, geen opsommingstekens.

---

## OMGAAN MET ONGEPASTE BIJDRAGEN

Hoewel bijdragen vooraf door een contactpersoon zijn gemodereerd, kunnen er bijdragen tussen zitten die niet passen in een waardige afscheidstekst: sarcasme, oude pijnpunten, ongepaste grappen, of bijdragen die tegen de toon van de rest ingaan. Als je zo'n bijdrage tegenkomt, gebruik hem niet. Zwijg erover; geef geen meta-commentaar. Het is niet jouw rol om uit te leggen wat je hebt weggelaten.

---

## LENGTE EN TAAL

Richtlengte: tussen 500 en 800 woorden. Dit is langer dan een individuele eulogie omdat er meer stemmen zijn. Maar: als er weinig bijdragen zijn of de bijdragen zijn kort, schrijf dan korter. Kwaliteit en waarheidsgetrouwheid boven lengte.

Uitsluitend in het Nederlands.

---

## VOOR JE AFSLUIT — ZELF-CONTROLE

Dit is geen optionele stap. Het is onderdeel van de opdracht.

Loop in gedachten elke zin van je eulogie na. Vraag bij elke zin:

1. Staat alles wat hier staat letterlijk of evident impliciet in de bijdragen?
2. Heb ik bijvoeglijke naamwoorden, sfeer, of details toegevoegd die niet gegeven zijn?
3. Heb ik emoties of innerlijke toestanden toegeschreven die niet gegeven zijn?
4. Heb ik bijdragen aan elkaar geknoopt met een verzonnen derde feit?
5. Klopt de attributie? Noem ik alleen bijdragers bij naam die hun naam hebben achtergelaten?
6. Is de variatie in perspectief vertegenwoordigd, of laat ik één soort relatie domineren?

Als je bij een zin op een van deze vragen negatief moet antwoorden, herschrijf die zin of laat hem weg.

Pas na deze controle lever je de eulogie.

---

## OUTPUT

Begin direct met de tekst. Geen inleiding, geen kopje, geen meta-opmerkingen over de zelf-controle, geen afsluiting met "einde" of een naam. Alleen de tekst die de spreker zal uitspreken.`

const REVISION_SYSTEM_PROMPT = `Je past een bestaande collectieve eulogie aan op verzoek van de contactpersoon.

---

## WAT JE AANPAST

Lees de instructie en voer die consequent door. Er zijn twee soorten instructies:

**Stijl- of toonaanpassingen** (zoals: korter, formeler, informeler, vrolijker, ingetogener, eenvoudigere taal): deze gelden voor de volledige tekst. Herschrijf de hele eulogie in de gevraagde stijl. Wees niet terughoudend — een instructie "formeler" moet duidelijk merkbaar zijn in elke zin, niet alleen in een paar woorden.

**Inhoudelijke aanpassingen** (zoals: "maak de opening directer", "verwijder het gedeelte over zijn werk"): voer deze precies uit en raak de rest niet aan.

Wat je nooit doet:
- Nieuwe feiten, details of anekdotes verzinnen die niet in de originele tekst of bijdragen staan.
- De specifieke bijdragen of directe citaten van bijdragers weggooien tenzij gevraagd.

---

## STRIKTE REGEL OVER VERZINNEN

Je verzint niets. Geen nieuwe bijvoeglijke naamwoorden, sfeer of details die niet in de originele tekst of de bijdragen staan. Stijl herschrijven is toegestaan — feiten verzinnen niet.

---

## TAAL EN OUTPUT

Uitsluitend in het Nederlands. Begin direct met de herziene eulogie. Geen inleiding, geen meta-opmerkingen, geen kopjes.`

// Keys in collective contributions answers_json
const CONTRIBUTION_LABELS: Record<string, string> = {
  typical_trait: 'Wat was er typisch aan hem/haar',
  most_valued: 'Wat waardeerde je het meest',
  memory: 'Een moment of beeld dat je bij zult blijven herinneren',
  catchphrase: 'Een uitspraak of manier van spreken die je is bijgebleven',
  farewell_message: 'Is er iets wat je hem/haar nog zou willen zeggen',
}

// Mapping from eulogy intake keys to collective contribution keys (overlapping questions only)
const EULOGY_TO_COLLECTIVE: Record<string, string> = {
  typical_trait: 'typical_trait',
  catchphrase: 'catchphrase',
  best_memory: 'memory',
  story: 'memory',
}

Deno.serve(async (req) => {
  let spaceId: string | undefined
  let jobId: string | undefined

  try {
    const body = await req.json()
    spaceId = body.space_id
    jobId = body.job_id
    const currentContent: string | undefined = body.current_content
    const revisionInstruction: string | undefined = body.revision_instruction

    if (!spaceId || !jobId) {
      return new Response(JSON.stringify({ error: 'space_id and job_id are required' }), { status: 400 })
    }

    await supabase
      .from('generation_jobs')
      .update({ status: 'processing', updated_at: new Date().toISOString() })
      .eq('id', jobId)

    const { data: space } = await supabase
      .from('memorial_spaces')
      .select('deceased_first_name, deceased_nickname, deceased_last_name')
      .eq('id', spaceId)
      .single()

    const firstName = space.deceased_first_name
    const fullName = [
      space.deceased_first_name,
      space.deceased_nickname ? `"${space.deceased_nickname}"` : null,
      space.deceased_last_name,
    ].filter(Boolean).join(' ')

    // Fetch accepted external contributions
    const { data: rawContributions } = await supabase
      .from('collective_eulogy_contributions')
      .select('contributor_name, relationship_to_deceased, answers_json')
      .eq('memorial_space_id', spaceId)
      .eq('source', 'contributor_link')
      .eq('moderation_status', 'accepted')

    // Fetch finalized opt-in eulogies for derived contributions
    const { data: optInEulogies } = await supabase
      .from('eulogies')
      .select('author_user_id, current_version_id, eulogy_intakes(answers_json)')
      .eq('memorial_space_id', spaceId)
      .eq('status', 'finalized')
      .eq('opt_in_to_collective', true)

    type Contribution = {
      name: string | null
      relationship: string | null
      answers: Record<string, string>
    }

    const contributions: Contribution[] = []

    for (const c of rawContributions ?? []) {
      const answers = (c.answers_json ?? {}) as Record<string, string>
      if (Object.keys(answers).length === 0) continue
      contributions.push({
        name: c.contributor_name !== 'Anoniem' ? c.contributor_name : null,
        relationship: c.relationship_to_deceased,
        answers,
      })
    }

    // Derive contributions from opt-in eulogies
    for (const e of optInEulogies ?? []) {
      const intake = Array.isArray(e.eulogy_intakes) ? e.eulogy_intakes[0] : e.eulogy_intakes
      if (!intake?.answers_json) continue
      const raw = intake.answers_json as Record<string, string>

      const answers: Record<string, string> = {}
      for (const [eulogyKey, collectiveKey] of Object.entries(EULOGY_TO_COLLECTIVE)) {
        if (raw[eulogyKey]?.trim()) {
          // For memory, concatenate best_memory and story if both present
          if (collectiveKey === 'memory' && answers['memory']) {
            answers['memory'] = `${answers['memory']} ${raw[eulogyKey].trim()}`
          } else {
            answers[collectiveKey] = raw[eulogyKey].trim()
          }
        }
      }

      if (Object.keys(answers).length === 0) continue

      // Fetch author profile for name
      const { data: profile } = await supabase
        .from('profiles')
        .select('display_name')
        .eq('id', e.author_user_id)
        .maybeSingle()

      contributions.push({
        name: profile?.display_name ?? null,
        relationship: raw['relationship'] ?? null,
        answers,
      })
    }

    // Build user message
    const lines: string[] = []
    lines.push(`Schrijf een collectieve eulogie op basis van de onderstaande bijdragen over ${fullName} (roepnaam: ${firstName}).`)
    lines.push(`Alle bijdragen zijn aangeleverd door mensen die ${firstName} kenden en zijn gemodereerd door de contactpersoon.`)
    lines.push('')
    lines.push(`## BIJDRAGEN (${contributions.length} totaal)`)
    lines.push('')

    contributions.forEach((c, i) => {
      const identity = [
        c.name ?? 'Anoniem',
        c.relationship ? `(${c.relationship})` : null,
      ].filter(Boolean).join(' ')

      lines.push(`### Bijdrage ${i + 1} — ${identity}`)
      for (const [key, val] of Object.entries(c.answers)) {
        if (val?.trim()) {
          lines.push(`${CONTRIBUTION_LABELS[key] ?? key}: ${val.trim()}`)
        }
      }
      lines.push('')
    })

    lines.push('Schrijf nu de collectieve eulogie. Begin direct met de tekst.')

    const isRevision = !!(currentContent && revisionInstruction)

    const userMessage = isRevision
      ? [
          `Pas de volgende collectieve eulogie aan op basis van de instructie hieronder.\n`,
          `## INSTRUCTIE`,
          revisionInstruction,
          ``,
          `## HUIDIGE TEKST`,
          currentContent,
          ``,
          `## ORIGINELE BIJDRAGEN (ter context — voeg geen nieuwe details toe die hier niet in staan)`,
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
      .from('collective_eulogy_versions')
      .select('version_number')
      .eq('memorial_space_id', spaceId)
      .order('version_number', { ascending: false })
      .limit(1)
      .maybeSingle()

    const nextVersion = (latestVersion?.version_number ?? 0) + 1

    const { data: version, error: versionError } = await supabase
      .from('collective_eulogy_versions')
      .insert({
        memorial_space_id: spaceId,
        version_number: nextVersion,
        content,
      })
      .select('id')
      .single()

    if (versionError || !version) throw new Error(`Failed to insert collective_eulogy_version: ${versionError?.message}`)

    await supabase
      .from('collective_eulogies')
      .update({ status: 'ready', current_version_id: version.id, updated_at: new Date().toISOString() })
      .eq('memorial_space_id', spaceId)

    await supabase
      .from('generation_jobs')
      .update({ status: 'done', updated_at: new Date().toISOString(), completed_at: new Date().toISOString() })
      .eq('id', jobId)

    return new Response(JSON.stringify({ ok: true }), { headers: { 'Content-Type': 'application/json' } })
  } catch (err) {
    console.error('synthesize-collective-eulogy error:', err)

    if (jobId) {
      await supabase
        .from('generation_jobs')
        .update({ status: 'failed', error_message: String(err), updated_at: new Date().toISOString(), completed_at: new Date().toISOString() })
        .eq('id', jobId)
    }
    if (spaceId) {
      await supabase
        .from('collective_eulogies')
        .update({ status: 'not_started', updated_at: new Date().toISOString() })
        .eq('memorial_space_id', spaceId)
    }

    return new Response(JSON.stringify({ error: String(err) }), { status: 500, headers: { 'Content-Type': 'application/json' } })
  }
})
