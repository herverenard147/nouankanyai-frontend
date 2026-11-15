import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { ImpactFigure } from '@/components/advice/ImpactFigure'

describe('S-16 : gains sans source', () => {
  it('un gain en FCFA est étiqueté « ordre de grandeur »', () => {
    render(<ImpactFigure advice={{ impactKind: 'gain', impactLabel: '−1 200 FCFA par mois' }} />)
    expect(screen.getByText('−1 200 FCFA par mois')).toBeTruthy()
    expect(screen.getByText('ordre de grandeur')).toBeTruthy()
  })
  it('une sévérité n\'est pas un gain : pas d\'étiquette', () => {
    render(<ImpactFigure advice={{ impactKind: 'severity', impactLabel: 'critique' }} />)
    expect(screen.queryByText('ordre de grandeur')).toBeNull()
  })
})
