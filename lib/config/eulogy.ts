export type IntakeQuestion = {
  key: string
  label: string
  placeholder?: string
  multiline: boolean
}

export const INTAKE_QUESTIONS: IntakeQuestion[] = [
  {
    key: 'relationship',
    label: 'Wat is jouw relatie tot [naam]?',
    placeholder: 'Bijv. dochter, vriend, collega',
    multiline: false,
  },
  {
    key: 'in_few_words',
    label: 'Hoe zou je [naam] in enkele woorden omschrijven?',
    placeholder: 'Bijv. warm, grappig, zorgzaam',
    multiline: false,
  },
  {
    key: 'best_memory',
    label: 'Wat is je mooiste herinnering aan [naam]?',
    multiline: true,
  },
  {
    key: 'unique',
    label: 'Wat maakte [naam] bijzonder of uniek?',
    multiline: true,
  },
  {
    key: 'life_lesson',
    label: 'Welke levensles heeft [naam] je meegegeven?',
    multiline: true,
  },
  {
    key: 'passions',
    label: "Wat waren de passies of hobby's van [naam]?",
    multiline: false,
  },
  {
    key: 'story',
    label: 'Is er een grappig of ontroerend verhaal dat je wilt delen?',
    multiline: true,
  },
  {
    key: 'remember',
    label: 'Wat wil je dat mensen onthouden over [naam]?',
    multiline: true,
  },
]
