export type BoitierState = 'ecoute' | 'vert' | 'orange' | 'rouge'

export interface BoitierDialogLine {
  who: 'Vous' | 'Boîtier'
  text: string
}

export interface BoitierStateInfo {
  id: BoitierState
  /** Libellé du bouton de démonstration. */
  label: string
  /** Couleur de la lumière (hex). Le blanc d'écoute est volontairement distinct des trois lumières d'état. */
  led: string
  /** Phrase qui dit ce que signifie la lumière. */
  meaning: string
  dialog: BoitierDialogLine[]
}

export const WAKE_PHRASE = 'Hey Nouankany'

const ASK_STATE = `${WAKE_PHRASE}, tout va bien ?`

/**
 * Les quatre lumières du boîtier. Le blanc pulsé signale l'écoute : le vert est réservé à « tout va bien »,
 * sinon un boîtier qui écoute pendant une alerte passerait un instant au vert.
 * Les échanges sont des exemples d'illustration, pas des mesures : aucun chiffre n'y figure.
 */
export const BOITIER_STATES: BoitierStateInfo[] = [
  {
    id: 'ecoute',
    label: 'À l’écoute',
    led: '#ffffff',
    meaning: 'Lumière blanche pulsée : il vous écoute.',
    dialog: [{ who: 'Vous', text: `${WAKE_PHRASE}…` }],
  },
  {
    id: 'vert',
    label: 'Tout va bien',
    led: '#35c773',
    meaning: 'Lumière verte : vos appareils sont dans leurs seuils.',
    dialog: [
      { who: 'Vous', text: ASK_STATE },
      {
        who: 'Boîtier',
        text: 'Oui, tout va bien. Rien à faire.',
      },
    ],
  },
  {
    id: 'orange',
    label: 'À surveiller',
    led: '#f2a20c',
    meaning: 'Lumière orange : un appareil est à surveiller.',
    dialog: [
      { who: 'Vous', text: ASK_STATE },
      {
        who: 'Boîtier',
        text: 'Le climatiseur chauffe un peu. Je le surveille, je vous préviens si ça empire.',
      },
    ],
  },
  {
    id: 'rouge',
    label: 'Action requise',
    led: '#ff4d5e',
    meaning: 'Lumière rouge : un appareil a besoin de vous.',
    dialog: [
      { who: 'Vous', text: ASK_STATE },
      {
        who: 'Boîtier',
        text: 'Le climatiseur force trop. Je l’éteins ?',
      },
      { who: 'Vous', text: 'Oui.' },
      { who: 'Boîtier', text: 'C’est fait.' },
    ],
  },
]

export function boitierState(id: BoitierState): BoitierStateInfo {
  const info = BOITIER_STATES.find((state) => state.id === id)
  if (!info) throw new Error(`État de boîtier inconnu : ${id}`)
  return info
}

/** Ordre de la démonstration automatique de l'accueil : seules les lumières d'état, sans l'écoute. */
export const DEMO_CYCLE: BoitierState[] = ['vert', 'orange', 'rouge']

export interface BoitierPhraseGroup {
  title: string
  phrases: string[]
}

/**
 * Formulations comprises, par intention. Le routeur d'intentions du backend s'appuie sur la même liste :
 * plusieurs façons de dire la même chose, pour qu'on n'ait pas à retenir une formule exacte.
 */
export const BOITIER_PHRASES: BoitierPhraseGroup[] = [
  {
    title: 'Connaître l’état',
    phrases: ['Donne-moi l’état de mes appareils', 'Où en sont mes appareils ?', 'Est-ce que tout va bien ?'],
  },
  {
    title: 'Interroger un appareil',
    phrases: ['Comment va le climatiseur ?', 'Quel est l’état du réfrigérateur ?'],
  },
  {
    title: 'Demander un conseil',
    phrases: ['Que me conseilles-tu ?', 'Comment économiser de l’électricité ?'],
  },
  {
    title: 'Comprendre un problème',
    phrases: ['Qu’est-ce qui ne va pas ?', 'Pourquoi le climatiseur est en alerte ?'],
  },
  {
    title: 'Éteindre un appareil',
    phrases: ['Éteins le climatiseur', 'Coupe le téléviseur'],
  },
  {
    title: 'Relancer une vérification',
    phrases: ['Vérifie le climatiseur', 'Refais une mesure'],
  },
]
