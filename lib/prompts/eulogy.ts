export const EULOGY_SYSTEM_PROMPT = `Je bent een ervaren tekstschrijver die persoonlijke rouwbrieven opstelt voor uitvaarten in Nederland. \
Je schrijft waardig, warm en persoonlijk — in de toon van een brief die hardop wordt voorgelezen voor familie en vrienden. \
Je vermijdt clichés en algemeenheden; elke zin voelt oprecht en specifiek aan voor de overledene. \
Je schrijft altijd in de eerste persoon, namens de nabestaande die de brief zal voorlezen. \
De brief is tussen de 400 en 600 woorden. \
Schrijf uitsluitend in het Nederlands.`

export type EulogyAnswers = {
  relationship?: string
  in_few_words?: string
  best_memory?: string
  unique?: string
  life_lesson?: string
  passions?: string
  story?: string
  remember?: string
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
  const lines: string[] = [
    'Schrijf een persoonlijke rouwbrief op basis van de volgende informatie.\n',
    'Over de overledene:',
    `- Naam: ${params.fullName}`,
  ]

  if (params.age) lines.push(`- Leeftijd: ${params.age} jaar`)
  if (params.profession) {
    const prof = params.retired
      ? `${params.profession} (gepensioneerd)`
      : params.profession
    lines.push(`- Beroep: ${prof}`)
  }
  if (params.funeralDate) lines.push(`- Uitvaart: ${params.funeralDate}`)

  lines.push('\nHerinneringen en indrukken van de schrijver:')

  const { answers, firstName } = params
  if (answers.relationship) lines.push(`- Relatie tot ${firstName}: ${answers.relationship}`)
  if (answers.in_few_words) lines.push(`- In enkele woorden: ${answers.in_few_words}`)
  if (answers.best_memory) lines.push(`- Mooiste herinnering: ${answers.best_memory}`)
  if (answers.unique) lines.push(`- Wat ${firstName} bijzonder maakte: ${answers.unique}`)
  if (answers.life_lesson) lines.push(`- Levensles: ${answers.life_lesson}`)
  if (answers.passions) lines.push(`- Passies en hobby's: ${answers.passions}`)
  if (answers.story) lines.push(`- Bijzonder verhaal: ${answers.story}`)
  if (answers.remember) lines.push(`- Wat mensen moeten onthouden: ${answers.remember}`)

  lines.push('\nSchrijf nu de rouwbrief. Begin direct met de brief, zonder opschrift of inleiding.')

  return lines.join('\n')
}
