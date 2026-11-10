import type { LandingChart } from '@/types/domain'

export const LANDING_CHARTS: LandingChart[] = [
  // D4 (décisions CNID du 2026-11-10) : « 79 → 87 » n'avait pas de source retrouvée. On montre le prix réellement payé,
  // lu sur une vraie facture CIE basse tension (bimestre d'oct. à déc. 2023, période 12/2023), montants hors taxes.
  {
    id: 'tarif',
    headline: '94,94',
    label: 'FCFA HT par kWh en tranche 1 (80,74 en tranche 2), lus sur une vraie facture CIE basse tension',
    axisY: 'FCFA HT/kWh',
    axisX: 'tranche',
    source: 'facture CIE basse tension réelle, période 12/2023',
    ticks: ['100', '50', '0'],
    min: 0,
    max: 100,
    gapPx: 30,
    bars: [
      { x: 'Tranche 1', value: 94.94, tip: '94,94 FCFA HT/kWh' },
      { x: 'Tranche 2', value: 80.74, tip: '80,74 FCFA HT/kWh' },
    ],
  },
  // S-03 : l'ancien « ×2 » (indices 1,0 / 1,5 / 2,0) était faux. Valeurs recopiées de backend/ml/tariffs.py (moyenne
  // tension, tarif général) : pointe / creuses = 94,21 / 57,17 = 1,65.
  {
    id: 'ecart',
    headline: '×1,65',
    label: 'prix du kWh aux heures de pointe face aux heures creuses, en moyenne tension',
    axisY: 'FCFA TTC/kWh',
    axisX: 'palier horaire',
    source: 'grille ANARE-CI, arrêté du 2 janvier 2019, moyenne tension, tarif général',
    ticks: ['100', '50', '0'],
    min: 0,
    max: 100,
    gapPx: 26,
    bars: [
      { x: 'Creuses', value: 57.17, tip: '57,17' },
      { x: 'Pleines', value: 69.09, tip: '69,09' },
      { x: 'Pointe', value: 94.21, tip: '94,21' },
    ],
  },
  {
    id: 'demande',
    headline: '6,5%',
    label: 'croissance annuelle de la demande nationale, 2025–2030',
    axisY: 'indice base 100',
    axisX: 'année',
    source: 'projection à 6,5%/an',
    ticks: ['140', '120', '100'],
    min: 96,
    max: 140,
    gapPx: 12,
    bars: [
      { x: '25', value: 100, tip: 'indice 100' },
      { x: '26', value: 106.5, tip: 'indice 106,5' },
      { x: '27', value: 113.4, tip: 'indice 113,4' },
      { x: '28', value: 120.8, tip: 'indice 120,8' },
      { x: '29', value: 128.6, tip: 'indice 128,6' },
      { x: '30', value: 137, tip: 'indice 137,0' },
    ],
  },
]
