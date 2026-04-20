export interface ContributionQuestion {
  key: string
  label: string
  subtitle: string
  placeholder: string
  multiline: boolean
}

export const CONTRIBUTION_QUESTIONS: ContributionQuestion[] = [
  {
    key: 'typical_trait',
    label: 'Wat was er typisch aan hem/haar?',
    subtitle: 'Een gebaar, een houding, iets wat hij/zij altijd zei of deed. Hoe concreter, hoe beter.',
    placeholder: '',
    multiline: false,
  },
  {
    key: 'most_valued',
    label: 'Wat waardeerde je het meest?',
    subtitle: 'Een eigenschap, een manier van zijn, iets waar hij/zij in uitblonk. Eén of twee woorden mag.',
    placeholder: '',
    multiline: false,
  },
  {
    key: 'memory',
    label: 'Een moment of beeld dat je bij zult blijven herinneren',
    subtitle: 'Het hoeft geen groot moment te zijn. Juist kleine, specifieke herinneringen werken vaak het sterkst.',
    placeholder: '',
    multiline: true,
  },
  {
    key: 'catchphrase',
    label: 'Een uitspraak of manier van spreken die je is bijgebleven',
    subtitle: 'Een stopwoord, een typische reactie, iets wat hij/zij vaak zei.',
    placeholder: '',
    multiline: false,
  },
  {
    key: 'farewell_message',
    label: 'Is er iets wat je hem/haar nog zou willen zeggen?',
    subtitle: 'Een korte boodschap, een bedankje, iets wat je altijd had willen zeggen. Dit mag direct aan hem/haar gericht zijn.',
    placeholder: '',
    multiline: true,
  },
]

export const CONTRIBUTION_KEYS = CONTRIBUTION_QUESTIONS.map(q => q.key)
