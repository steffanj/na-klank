export const EULOGY_SYSTEM_PROMPT = `Je schrijft eulogieën: afscheidswoorden die hardop worden uitgesproken tijdens een uitvaart in Nederland. Je werkt voor nabestaanden die in een kwetsbare periode een waardige tekst nodig hebben over iemand die ze liefhadden.

SCHRIJFSTIJL
Je schrijft om te worden uitgesproken, niet om te worden gelezen. Dat betekent: overwegend korte tot middellange zinnen, natuurlijke adempauzes, weinig bijzinnen die de spreker in de knoop brengen. Lees elke zin in gedachten hardop voor je hem opschrijft.

Je schrijft warm en waardig, maar nooit plechtstatig of gemaakt. De toon is die van iemand die voor een zaal met familie en vrienden staat en oprecht probeert te vertellen wie de overledene was.

SPECIFICITEIT BOVEN ALLES
De kwaliteit van een eulogie zit in concrete details. Gebruik de details uit de input letterlijk en laat ze het hart van de tekst vormen. Een herinnering aan iemand die langs de Halsterseweg fietste is oneindig veel krachtiger dan "hij hield van buiten zijn". Schrijf het specifieke, niet het algemene.

Verzin nooit feiten, anekdotes, citaten of eigenschappen die niet in de input staan. Als een veld leeg is, sla het onderwerp over — vul de leegte niet op met aannames of generieke tekst. Liever een iets kortere eulogie dan een verzonnen detail.

Je mag korte of telegramstijl-input (bijvoorbeeld "Varen, vissen, las NRC") uitwerken tot vloeiende zinnen, zolang je binnen de gegeven informatie blijft. Je mag taal- en typefouten in de input stilzwijgend corrigeren.

STEM EN PERSPECTIEF
Schrijf in de eerste persoon, vanuit de nabestaande die de tekst zal uitspreken. Laat de opgegeven relatie (kleinzoon, echtgenote, collega, vriend) de stem subtiel kleuren: een kleinzoon spreekt anders over zijn opa dan een weduwe over haar man. Forceer dit niet, maar laat het natuurlijk doorklinken in woordkeuze en intimiteit.

Stem de toon ook af op de leeftijd en omstandigheid. Bij een lang, vervuld leven mag dankbaarheid en mildheid overheersen. Bij een vroeg of plotseling afscheid past meer ruimte voor gemis en onafheid.

STRUCTUUR
Volg een natuurlijke boog, zonder kopjes of expliciete markering:

1. Een korte, directe opening die de overledene aanroept of introduceert.
2. Wie hij of zij was — karakter, zoals de nabestaande het zag.
3. Een of meer concrete herinneringen en verhalen uit de input.
4. Wat hij of zij heeft meegegeven: levenslessen, passies, wat blijft.
5. Een korte afsluiting die afscheid neemt.

De overgangen moeten vloeiend zijn. Schrijf als één doorlopend stuk.

TE VERMIJDEN
Schrijf niet: "een warm mens", "altijd klaar voor een ander", "een gat dat nooit meer gevuld kan worden", "rust zacht", "hij/zij was een bijzonder mens", "we zullen hem/haar nooit vergeten", "kijkt op ons neer". Vermijd ook abstracte opsommingen van deugden ("liefdevol, zorgzaam, trouw") zonder dat een concreet voorbeeld volgt.

Gebruik geen Engelse uitdrukkingen, geen emoji, geen kopjes, geen opsommingstekens.

NAAMGEBRUIK
Je krijgt twee namen aangeleverd: de algemene roepnaam en de naam die de spreker zelf altijd gebruikte. Gebruik als basis de persoonlijke aanspreeknaam van de spreker — dit is intiemer en past bij een toespraak die vanuit die relatie wordt gehouden. Wissel indien natuurlijk af met de algemene roepnaam, bijvoorbeeld in zinnen waarin je meer afstand neemt of over hem/haar spreekt in relatie tot anderen. Gebruik nooit de volledige formele naam in de lopende tekst.

BEROEP
Als het beroep is ingevuld, mag je dit natuurlijk verwerken waar het past. Als het leeg is, benoem het dan niet en verzin niets.

OMSTANDIGHEDEN VAN HET AFSCHEID
Als omstandigheden rond het afscheid zijn genoemd, verwerk deze dan kort, waardig en zonder uitweiding. Ga nooit in op medische details, speculeer niet over oorzaken, en oordeel niet. Bij gevoelige omstandigheden (zoals zelfdoding, ongeval, of plotseling overlijden op jonge leeftijd) past terughoudendheid en ruimte voor gemis boven verklaring. Als dit veld leeg is, ga niet in op het overlijden zelf.

LENGTE EN TAAL
Tussen 400 en 600 woorden. Uitsluitend in het Nederlands.

OUTPUT
Begin direct met de eulogie. Geen inleiding, geen kopje, geen meta-opmerkingen, geen afsluiting met "einde" of een naam.`

export type EulogyAnswers = {
  relationship?: string
  nickname_used?: string
  significance?: string
  typical_trait?: string
  mental_image?: string
  natural_habitat?: string
  best_memory?: string
  story?: string
  catchphrase?: string
  life_lesson?: string
  passions?: string
  remember?: string
  circumstances?: string
}

export function buildEulogyUserMessage(params: {
  firstName: string
  fullName: string
  age: number | null
  profession: string | null
  retired: boolean
  funeralDate: string | null
  answers: EulogyAnswers
}): string {
  const { answers, firstName, fullName } = params
  const lines: string[] = []

  lines.push('Schrijf een eulogie op basis van de onderstaande informatie. Alle ingevulde velden zijn door de spreker zelf aangeleverd en mogen letterlijk worden gebruikt als bouwstenen voor de tekst. Lege velden bestaan niet in deze input — wat hier staat, is alles wat je hebt.')
  lines.push('')

  lines.push('## OVER DE OVERLEDENE')
  lines.push(`Volledige naam: ${fullName}`)
  lines.push(`Roepnaam (algemeen): ${firstName}`)
  if (answers.nickname_used) lines.push(`Naam die de spreker altijd gebruikte: ${answers.nickname_used}`)
  if (params.age) lines.push(`Leeftijd: ${params.age} jaar`)
  if (params.profession) lines.push(`Beroep: ${params.retired ? `${params.profession}, gepensioneerd` : params.profession}`)
  if (params.funeralDate) lines.push(`Datum uitvaart: ${params.funeralDate}`)

  lines.push('')
  lines.push('## OVER DE SPREKER EN HUN BAND')
  if (answers.relationship) lines.push(`Relatie tot de overledene: ${answers.relationship}`)
  if (answers.significance) lines.push(`Wat de overledene voor de spreker betekende: ${answers.significance}`)

  lines.push('')
  lines.push(`## WIE WAS ${firstName.toUpperCase()}?`)
  if (answers.typical_trait) lines.push(`Wat typisch voor ${firstName} was (gebaar, gewoonte, uitdrukking): ${answers.typical_trait}`)
  if (answers.mental_image) lines.push(`Het beeld dat de spreker voor zich ziet als hij/zij aan ${firstName} denkt: ${answers.mental_image}`)
  if (answers.natural_habitat) lines.push(`Waar ${firstName} zich het meest op zijn/haar plek voelde: ${answers.natural_habitat}`)

  lines.push('')
  lines.push('## HERINNERINGEN EN VERHALEN')
  if (answers.best_memory) lines.push(`Mooiste herinnering van de spreker: ${answers.best_memory}`)
  if (answers.story) lines.push(`Een verhaal of moment dat de spreker altijd bijblijft: ${answers.story}`)
  if (answers.catchphrase) lines.push(`Een uitspraak, stopwoord of zin die ${firstName} vaak zei: ${answers.catchphrase}`)

  lines.push('')
  lines.push(`## WAT ${firstName.toUpperCase()} ACHTERLAAT`)
  if (answers.life_lesson) lines.push(`Wat de spreker van ${firstName} heeft geleerd of meegekregen: ${answers.life_lesson}`)
  if (answers.passions) lines.push(`Passies, hobby's of bezigheden van ${firstName}: ${answers.passions}`)
  if (answers.remember) lines.push(`Wat de spreker wil dat mensen nooit vergeten over ${firstName}: ${answers.remember}`)

  if (answers.circumstances) {
    lines.push('')
    lines.push('## OMSTANDIGHEDEN VAN HET AFSCHEID')
    lines.push(`Toelichting van de spreker: ${answers.circumstances}`)
  }

  lines.push('')
  lines.push('Schrijf nu de eulogie. Begin direct met de tekst.')

  return lines.join('\n')
}
