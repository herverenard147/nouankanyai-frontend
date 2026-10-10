import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { DataTable } from '@/components/table/DataTable'
import type { TableColumn } from '@/components/table/DataTable'
import { RowDetailDrawer } from '@/components/table/RowDetailDrawer'
import type { EquipmentRow } from '@/types/domain'

const columns: TableColumn<EquipmentRow>[] = [{ key: 'categorie', label: 'Catégorie' }]

function row(overrides: Partial<EquipmentRow> = {}): EquipmentRow {
  return {
    id: 'm1',
    categorie: 'Cuisine',
    marque: 'Samsung',
    modele: 'X1',
    site: 'Domicile',
    priorite: 'Moyenne',
    statut: 'Normal',
    provenance: 'estime',
    photo_data_url: null,
    ...overrides,
  }
}

describe('Photo de la machine dans la liste (boîte noire — contrat : afficher la photo si connue, jamais en inventer une)', () => {
  it('affiche la photo de l’équipement quand elle est connue', () => {
    const { container } = render(
      <DataTable columns={columns} rows={[row({ photo_data_url: 'data:image/jpeg;base64,abc' })]} photoColumn />,
    )
    const img = container.querySelector('img') as HTMLImageElement
    expect(img).not.toBeNull()
    expect(img.src).toContain('data:image/jpeg;base64,abc')
  })

  it('ne tente jamais de deviner une image manquante (pas de <img>, juste un espace réservé)', () => {
    const { container } = render(<DataTable columns={columns} rows={[row({ photo_data_url: null })]} photoColumn />)
    expect(container.querySelector('img')).toBeNull()
  })

  it('ne touche pas aux tables qui ne demandent pas la colonne photo (compat. AdminUsersPage et autres)', () => {
    const { container } = render(
      <DataTable columns={columns} rows={[row({ photo_data_url: 'data:image/jpeg;base64,abc' })]} />,
    )
    expect(container.querySelector('img')).toBeNull()
  })
})

describe('Photo de la machine dans la fiche détail (boîte blanche — s’appuie sur row.photo_data_url, le champ réel)', () => {
  it('affiche la photo en grand quand row.photo_data_url est renseigné', () => {
    render(
      <RowDetailDrawer
        row={row({ photo_data_url: 'data:image/jpeg;base64,xyz' })}
        columns={columns}
        title="Four"
        onClose={() => {}}
      />,
    )
    expect(screen.getByRole('img', { name: 'Photo : Four' })).toHaveAttribute('src', 'data:image/jpeg;base64,xyz')
  })

  it("n'affiche aucune image quand la machine n'a pas de photo", () => {
    render(<RowDetailDrawer row={row({ photo_data_url: null })} columns={columns} title="Four" onClose={() => {}} />)
    expect(screen.queryByRole('img')).not.toBeInTheDocument()
  })
})
