export const EULOGY_SYSTEM_PROMPT = `Je bent een ervaren tekstschrijver die persoonlijke rouwbrieven opstelt voor uitvaarten in Nederland. \
Je schrijft waardig, warm en persoonlijk — in de toon van een brief die hardop wordt voorgelezen voor familie en vrienden. \
Je vermijdt clichés en algemeenheden; elke zin voelt oprecht en specifiek aan voor de overledene. \
Je schrijft altijd in de eerste persoon, namens de nabestaande die de brief zal voorlezen. \
De brief is tussen de 400 en 600 woorden. \
Schrijf uitsluitend in het Nederlands.`

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

  const lines: string[] = [
    'Schrijf een persoonlijke rouwbrief op basis van de volgende informatie.\n',
    'Over de overledene:',
    `- Naam: ${fullName}`,
  ]
  if (params.age) lines.push(`- Leeftijd: ${params.age} jaar`)
  if (params.profession) {
    lines.push(`- Beroep: ${params.retired ? `${params.profession} (gepensioneerd)` : params.profession}`)
  }
  if (params.funeralDate) lines.push(`- Uitvaart: ${params.funeralDate}`)

  lines.push('\nOver de schrijver en hun band met de overledene:')
  if (answers.relationship) lines.push(`- Relatie: ${answers.relationship}`)
  if (answers.nickname_used) lines.push(`- De schrijver noemde ${firstName} altijd: ${answers.nickname_used}`)
  if (answers.significance) lines.push(`- Wat ${firstName} voor de schrijver betekende: ${answers.significance}`)

  lines.push(`\nWie was ${firstName}?`)
  if (answers.typical_trait) lines.push(`- Typisch voor ${firstName}: ${answers.typical_trait}`)
  if (answers.mental_image) lines.push(`- Beeld dat de schrijver voor zich ziet: ${answers.mental_image}`)
  if (answers.natural_habitat) lines.push(`- Waar ${firstName} zich het meest op zijn/haar plek voelde: ${answers.natural_habitat}`)

  lines.push('\nHerinneringen en verhalen:')
  if (answers.best_memory) lines.push(`- Mooiste herinnering: ${answers.best_memory}`)
  if (answers.story) lines.push(`- Bijzonder verhaal: ${answers.story}`)
  if (answers.catchphrase) lines.push(`- Typische uitspraak van ${firstName}: ${answers.catchphrase}`)

  lines.push(`\nWat ${firstName} achterlaat:`)
  if (answers.life_lesson) lines.push(`- Wat de schrijver van ${firstName} heeft geleerd: ${answers.life_lesson}`)
  if (answers.passions) lines.push(`- Passies en hobby's: ${answers.passions}`)
  if (answers.remember) lines.push(`- Wat mensen nooit mogen vergeten: ${answers.remember}`)

  if (answers.circumstances) {
    lines.push(`\nOmstandigheden van het afscheid:\n- ${answers.circumstances}`)
  }

  lines.push('\nSchrijf nu de rouwbrief. Begin direct met de brief, zonder opschrift of inleiding.')

  return lines.join('\n')
}
