export type IntakeQuestion = {
  key: string
  label: string
  subtitle?: string
  placeholder?: string
  multiline: boolean
}

export type IntakeSection = {
  title: string
  questions: IntakeQuestion[]
}

export const INTAKE_SECTIONS: IntakeSection[] = [
  {
    title: 'Over jou en jullie band',
    questions: [
      {
        key: 'relationship',
        label: 'Wat is jouw relatie tot [naam]?',
        multiline: false,
      },
      {
        key: 'nickname_used',
        label: 'Hoe noemde jij [naam] altijd?',
        subtitle: 'De naam of het koosnaampje dat je zelf gebruikte. Dit mag hetzelfde zijn als de roepnaam, maar vaak is het persoonlijker.',
        multiline: false,
      },
      {
        key: 'significance',
        label: 'Wat heeft [naam] voor jou betekend?',
        subtitle: 'Eén of twee zinnen is genoeg. Wat maakt dat juist jij deze toespraak houdt?',
        multiline: true,
      },
    ],
  },
  {
    title: 'Wie was [naam]?',
    questions: [
      {
        key: 'typical_trait',
        label: 'Wat was er typisch [naam] aan hem/haar?',
        subtitle: 'Denk aan een gebaar, een houding, iets wat hij/zij altijd zei of deed.',
        multiline: true,
      },
      {
        key: 'mental_image',
        label: 'Als je aan [naam] denkt, wat zie je dan voor je?',
        subtitle: 'Een beeld, een plek, een moment — het mag klein zijn.',
        multiline: true,
      },
      {
        key: 'natural_habitat',
        label: 'Waar voelde [naam] zich het meest op zijn/haar plek?',
        subtitle: 'Een plek, bezigheid of omgeving waar hij/zij helemaal zichzelf was.',
        multiline: false,
      },
    ],
  },
  {
    title: 'Herinneringen en verhalen',
    questions: [
      {
        key: 'best_memory',
        label: 'Je mooiste herinnering aan [naam]',
        subtitle: 'Het hoeft geen groots moment te zijn — juist kleine, specifieke herinneringen werken vaak het best.',
        multiline: true,
      },
      {
        key: 'story',
        label: 'Een verhaal dat je altijd bijblijft',
        subtitle: 'Iets grappigs, ontroerends, of een moment dat veel over hem/haar zei.',
        multiline: true,
      },
      {
        key: 'catchphrase',
        label: 'Had [naam] een uitspraak of zin die hij/zij vaak zei?',
        subtitle: 'Een stopwoord, een wijsheid, een typische reactie.',
        multiline: false,
      },
    ],
  },
  {
    title: 'Wat [naam] achterlaat',
    questions: [
      {
        key: 'life_lesson',
        label: 'Wat heb je van [naam] geleerd?',
        subtitle: 'Een les, een gewoonte, een manier van kijken naar de wereld.',
        multiline: true,
      },
      {
        key: 'passions',
        label: "Wat waren zijn/haar passies of hobby's?",
        multiline: false,
      },
      {
        key: 'remember',
        label: 'Als je één ding over [naam] zou willen dat mensen nooit vergeten, wat is dat dan?',
        multiline: true,
      },
    ],
  },
  {
    title: 'Omstandigheden van het afscheid',
    questions: [
      {
        key: 'circumstances',
        label: 'Zijn er omstandigheden rond het afscheid die je in de toespraak wilt laten meeklinken?',
        subtitle: 'Bijvoorbeeld: het kwam plotseling, het was een lang ziekbed, of juist een rustig en waardig einde na een lang leven. Laat leeg als je hier liever niet over spreekt in de toespraak.',
        placeholder: 'Laat leeg als je liever niet over het afscheid zelf spreekt.',
        multiline: true,
      },
    ],
  },
]

export const INTAKE_KEYS = INTAKE_SECTIONS.flatMap(s => s.questions.map(q => q.key))
