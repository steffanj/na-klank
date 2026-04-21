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
- **Convergentie benutten.** Als meerdere bijdragers onafhankelijk van elkaar hetzelfde noemen, is dat waardevolle informatie over wie de overledene was. Benoem die convergentie expliciet met een eerlijke kwantificering ("vier bijdragers noemen...", "bij velen van ons") — schrijf nooit "bijna iedereen" of "velen" als dat feitelijk niet klopt.
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

**2. Het koor van eigenschappen.** Gebruik de antwoorden op "wat waardeerde je het meest" om de convergentie zichtbaar te maken. Wat kwam steeds terug? Welke woorden werden door hoeveel bijdragers precies genoemd? Dit is de kracht van het collectief: waar één stem subjectief is, wordt een koor betrouwbaar. Benoem de terugkerende thema's expliciet, maar kwantificeer eerlijk ("drie van de vijf bijdragers noemen...", "bij velen van ons" — alleen als dat feitelijk klopt).

**3. Specifieke beelden en momenten.** Gebruik de rijkste bijdragen uit "typisch [naam]" en "moment of beeld". Zet verschillende perspectieven naast elkaar — hoe een buurman hem zag, hoe een collega hem zag, hoe een oude vriend hem zag. Variatie geeft breedte. Waar mogelijk attribueer je ("Haar collega Lucas herinnert zich hoe..."), waar dat niet kan (anonieme bijdragen of wanneer het niet vloeit) laat je de bijdrage zonder attributie staan.

**4. Stemmen.** Een sectie gebaseerd op de antwoorden op "is er iets wat je [naam] nog zou willen zeggen". Dit zijn **directe citaten, geen parafraseringen.** Je mag selecteren welke citaten je opneemt (de meest raakende, de meest representatieve), maar wat je opneemt geef je woordelijk weer, zonder aanpassing. Als een bijdrage onleesbaar is zonder redactie, neem hem dan niet op. Leid deze sectie in met iets als: "Sommigen wilden nog iets tegen [naam] zeggen. Hier zijn hun woorden." Deze sectie is de emotionele piek van de eulogie.

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

Hoewel bijdragen vooraf door een contactpersoon zijn gemodereerd, mocht er toch een bijdrage tussen zitten die evident niet past (sarcasme, rancune, aanvallen op andere nabestaanden), gebruik hem dan niet. Zwijg erover; geef geen meta-commentaar. Het is niet jouw rol om uit te leggen wat je hebt weggelaten.

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

Omsluit je volledige output strikt in deze twee XML-tags, en schrijf niets buiten die tags:

<toespraak>
[De tekst die de spreker zal uitspreken. Geen inleiding, geen kopje, geen meta-opmerkingen.]
</toespraak>
<verantwoording>
[Per bijdrage (gebruik "Bijdrage N — naam"): wat heb je gebruikt, hoe verwerkt, en waarom? Benoem ook wat je hebt weggelaten en waarom. Dit wordt niet voorgelezen — het is uitsluitend voor de contactpersoon als controle op hallucinaties en attributie.]
</verantwoording>`

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

// XML field names for collective contributions
const CONTRIBUTION_XML_KEYS: Record<string, string> = {
  typical_trait: 'typisch',
  most_valued: 'meest_gewaardeerd',
  memory: 'moment_of_beeld',
  catchphrase: 'uitspraak',
  farewell_message: 'boodschap',
}

const VERIFIER_SYSTEM_PROMPT = `Je controleert een gegenereerde collectieve eulogie op claims die niet aantoonbaar in de aangeleverde bijdragen staan.

Jouw taak is specifiek en beperkt. Je controleert uitsluitend:

1. **Directe citaten** — Als iemand geciteerd wordt ("Zo zei hij dat altijd"), staan die woorden of een duidelijk herkenbare parafrase in die persoons bijdrage?

2. **Toeschrijvingen aan personen** — Als de tekst zegt "Haar collega Lucas herinnert zich hoe...", staat dat gegeven inderdaad in de bijdrage van iemand die Lucas heet?

3. **Convergentie-claims** — Als de tekst zegt "vier bijdragers noemen...", zijn het er ook echt vier? Kloppen kwantificerende uitspraken als "velen", "meerdere bijdragers", "bij velen van ons"?

4. **Specifieke details** — Feiten, gebeurtenissen of details die aan een specifieke persoon worden toegeschreven: staan die in diens bijdrage?

Wat je NIET controleert:
- Stijl, toon of opbouw van de tekst
- Algemene beschrijvingen die niet aan een specifieke persoon zijn toegeschreven
- Of de eulogie goed of slecht is

## OUTPUT

Als alles klopt:
<verificatie>
  <status>goedgekeurd</status>
</verificatie>

Als er problemen zijn:
<verificatie>
  <status>issues_found</status>
  <bevindingen>
    <bevinding>
      <zin>[De exacte problematische zin of passage uit de toespraak]</zin>
      <probleem>[Wat er niet klopt en waarom]</probleem>
      <actie>verwijder</actie>
    </bevinding>
  </bevindingen>
</verificatie>

Gebruik actie "verwijder" als de zin niet gered kan worden. Gebruik actie "pas_aan" met een concrete suggestie als een kleine aanpassing voldoende is.

Wees precies en streng. Geef alleen echte problemen door — geen twijfels, geen stijlkritiek. Als je het niet met zekerheid kunt weerleggen, is het geen bevinding.`

const LANGUAGE_CHECKER_SYSTEM_PROMPT = `Je controleert een Nederlandse toespraak uitsluitend op taal-, spel- en grammaticafouten.

Jouw taak is strikt beperkt:
- Corrigeer spelfouten, tikfouten en grammaticale fouten
- Corrigeer inconsequent gebruik van hoofdletters, leestekens en koppeltekens waar dat duidelijk fout is
- Corrigeer dt-fouten en andere werkwoordsvervoegingfouten

Wat je NIET doet:
- De inhoud aanpassen
- Stijl of toon wijzigen
- Zinnen herstructureren
- Woorden vervangen door synoniemen
- Iets toevoegen of weghalen

Als er geen fouten zijn, geef je de tekst ongewijzigd terug.

Begin direct met de (eventueel gecorrigeerde) tekst. Geen inleiding, geen uitleg, geen XML-tags.`

const CORRECTOR_SYSTEM_PROMPT = `Je past een collectieve eulogie aan op basis van een lijst concrete bevindingen van een verificateur.

Jouw taak:
- Verwijder of corrigeer uitsluitend de zinnen die zijn aangemerkt in de bevindingen
- Raak de rest van de tekst niet aan
- Voeg geen nieuwe informatie toe
- Als het weghalen van een zin de omringende tekst onvloeiend maakt, pas je maximaal één of twee aangrenzende zinnen aan voor leesbaarheid — zonder nieuwe feiten toe te voegen

Begin direct met de gecorrigeerde tekst. Geen inleiding, geen uitleg, geen XML-tags.`

async function runLanguageCheck(speech: string, anthropicClient: Anthropic): Promise<string> {
  const response = await anthropicClient.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 16384,
    system: LANGUAGE_CHECKER_SYSTEM_PROMPT,
    messages: [{ role: 'user', content: speech }],
  })
  const result = response.content[0].type === 'text' ? response.content[0].text.trim() : speech
  return result || speech
}

type VerificationPass = {
  pass: number
  status: 'goedgekeurd' | 'issues_found'
  bevindingen: string
}

async function runVerificationLoop(
  initialSpeech: string,
  verantwoording: string | null,
  contributionsXml: string,
  anthropicClient: Anthropic,
): Promise<{ speech: string; log: VerificationPass[] }> {
  let speech = initialSpeech
  const log: VerificationPass[] = []

  for (let pass = 1; pass <= 2; pass++) {
    const verifierUserMsg = [
      `## BIJDRAGEN (grondwaarheid)\n\n${contributionsXml}`,
      `\n\n## TOESPRAAK\n\n${speech}`,
      pass === 1 && verantwoording ? `\n\n## VERANTWOORDING VAN DE AUTEUR\n\n${verantwoording}` : '',
      `\n\nVerifieer de toespraak aan de hand van de bijdragen.`,
    ].join('')

    const verifierResponse = await anthropicClient.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2048,
      system: VERIFIER_SYSTEM_PROMPT,
      messages: [{ role: 'user', content: verifierUserMsg }],
    })

    const verifierRaw = verifierResponse.content[0].type === 'text' ? verifierResponse.content[0].text : ''
    const status = extractXmlTag(verifierRaw, 'status') === 'goedgekeurd' ? 'goedgekeurd' : 'issues_found'
    const bevindingen = status === 'issues_found' ? extractXmlTag(verifierRaw, 'bevindingen') : ''

    log.push({ pass, status, bevindingen })

    if (status === 'goedgekeurd') break

    const correctorUserMsg = [
      `## TOESPRAAK\n\n${speech}`,
      `\n\n## BEVINDINGEN\n\n${bevindingen}`,
      `\n\n## BIJDRAGEN (grondwaarheid)\n\n${contributionsXml}`,
      `\n\nCorrigeer de toespraak op basis van de bevindingen.`,
    ].join('')

    const correctorResponse = await anthropicClient.messages.create({
      model: 'claude-opus-4-7',
      max_tokens: 16384,
      system: CORRECTOR_SYSTEM_PROMPT,
      messages: [{ role: 'user', content: correctorUserMsg }],
    })

    speech = correctorResponse.content[0].type === 'text' ? correctorResponse.content[0].text : speech
  }

  return { speech, log }
}

function escapeXml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

function extractXmlTag(text: string, tag: string): string {
  const open = `<${tag}>`
  const close = `</${tag}>`
  const start = text.indexOf(open)
  const end = text.indexOf(close)
  if (start === -1 || end === -1) return ''
  return text.slice(start + open.length, end).trim()
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
    const variationSeed: number | undefined = body.variation_seed

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

    // Fetch accepted external contributions, ordered by submission time for stable numbering
    const { data: rawContributions } = await supabase
      .from('collective_eulogy_contributions')
      .select('contributor_name, relationship_to_deceased, answers_json, submitted_at')
      .eq('memorial_space_id', spaceId)
      .eq('source', 'contributor_link')
      .eq('moderation_status', 'accepted')
      .order('submitted_at', { ascending: true })

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

    // Build XML contributions block
    const xmlLines: string[] = []
    xmlLines.push('<bijdragen>')
    contributions.forEach((c, i) => {
      xmlLines.push(`  <bijdrage nr="${i + 1}">`)
      xmlLines.push(`    <naam>${escapeXml(c.name ?? 'Anoniem')}</naam>`)
      if (c.relationship) {
        xmlLines.push(`    <relatie>${escapeXml(c.relationship)}</relatie>`)
      }
      for (const [key, val] of Object.entries(c.answers)) {
        if (val?.trim()) {
          const tag = CONTRIBUTION_XML_KEYS[key] ?? key
          xmlLines.push(`    <${tag}>${escapeXml(val.trim())}</${tag}>`)
        }
      }
      xmlLines.push(`  </bijdrage>`)
    })
    xmlLines.push('</bijdragen>')

    const contributionsXml = xmlLines.join('\n')

    const lines: string[] = []
    lines.push(`Schrijf een collectieve eulogie op basis van de onderstaande bijdragen over ${fullName} (roepnaam: ${firstName}).`)
    lines.push(`Alle bijdragen zijn aangeleverd door mensen die ${firstName} kenden en zijn gemodereerd door de contactpersoon.`)
    lines.push('')
    lines.push(`## BIJDRAGEN (${contributions.length} totaal)`)
    lines.push('')
    lines.push(contributionsXml)
    lines.push('')
    lines.push('Schrijf nu de collectieve eulogie. Omsluit je output in <toespraak> en <verantwoording> tags zoals beschreven.')

    if (variationSeed !== undefined) {
      lines.push(`\nSchrijf een versie die qua opening, opbouw en formulering duidelijk verschilt van een eventueel eerder gegenereerde versie op basis van dezelfde bijdragen. Varieer de structuur en de invalshoek. Variatiesleutel: ${variationSeed}`)
    }

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
          contributionsXml,
          ``,
          `Verander alleen wat de instructie vraagt. Behoud de rest. Begin direct met de herziene eulogie.`,
        ].join('\n')
      : lines.join('\n')

    const systemPrompt = isRevision ? REVISION_SYSTEM_PROMPT : SYSTEM_PROMPT

    const message = await anthropic.messages.create({
      model: 'claude-opus-4-7',
      max_tokens: 16384,
      system: systemPrompt,
      messages: [{ role: 'user', content: userMessage }],
    })

    const rawOutput = message.content[0].type === 'text' ? message.content[0].text : ''

    let content: string
    let attributionAudit: string | null
    let verificationLog: VerificationPass[] | null = null

    if (isRevision) {
      content = rawOutput
      attributionAudit = null
    } else {
      const initialSpeech = extractXmlTag(rawOutput, 'toespraak') || rawOutput
      attributionAudit = extractXmlTag(rawOutput, 'verantwoording') || null

      const verified = await runVerificationLoop(initialSpeech, attributionAudit, contributionsXml, anthropic)
      content = await runLanguageCheck(verified.speech, anthropic)
      verificationLog = verified.log
    }

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
        attribution_audit_raw: attributionAudit,
        verification_log: verificationLog ? JSON.stringify(verificationLog) : null,
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
