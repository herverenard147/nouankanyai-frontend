import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { DataTable } from '@/components/table/DataTable'
import type { TableColumn } from '@/components/table/DataTable'
import { RowDetailDrawer } from '@/components/table/RowDetailDrawer'

/**
 * Comportement générique pré-existant de DataTable/RowDetailDrawer (tri,
 * recherche, clic de ligne, actions, fermeture) — jamais couvert avant
 * (constaté en répondant à la question "tes tests prennent-ils en compte
 * les fonctionnalités qui existaient déjà ?"). Ne touche pas à
 * photoColumn/photo_data_url, déjà couvert par machinePhotoDisplay.test.tsx.
 */

interface Row {
  id: string
  nom: string
  categorie: string
  provenance: 'estime'
}

const columns: TableColumn<Row>[] = [
  { key: 'nom', label: 'Nom' },
  { key: 'categorie', label: 'Catégorie' },
]

const rows: Row[] = [
  { id: '1', nom: 'Zèbre', categorie: 'Cuisine', provenance: 'estime' },
  { id: '2', nom: 'Alpha', categorie: 'Bureau', provenance: 'estime' },
]

describe('DataTable : tri', () => {
  it('trie en ordre croissant au premier clic sur un en-tête, puis inverse au second', () => {
    render(<DataTable columns={columns} rows={rows} />)
    const header = screen.getByRole('button', { name: /Nom/ })

    fireEvent.click(header)
    let cells = screen.getAllByRole('row').slice(1).map((row) => row.textContent)
    expect(cells[0]).toContain('Alpha')
    expect(cells[1]).toContain('Zèbre')

    fireEvent.click(header)
    cells = screen.getAllByRole('row').slice(1).map((row) => row.textContent)
    expect(cells[0]).toContain('Zèbre')
    expect(cells[1]).toContain('Alpha')
  })
})

describe('DataTable : recherche', () => {
  it('filtre les lignes sur toutes les colonnes visibles', () => {
    render(<DataTable columns={columns} rows={rows} searchPlaceholder="Rechercher…" />)
    fireEvent.change(screen.getByLabelText('Rechercher…'), { target: { value: 'bureau' } })
    expect(screen.getByText('Alpha')).toBeInTheDocument()
    expect(screen.queryByText('Zèbre')).not.toBeInTheDocument()
  })

  it('affiche "Aucun résultat." quand rien ne correspond', () => {
    render(<DataTable columns={columns} rows={rows} searchPlaceholder="Rechercher…" />)
    fireEvent.change(screen.getByLabelText('Rechercher…'), { target: { value: 'inexistant' } })
    expect(screen.getByText('Aucun résultat.')).toBeInTheDocument()
  })
})

describe('DataTable : clic de ligne et actions', () => {
  it('déclenche onRowClick avec la bonne ligne', () => {
    const onRowClick = vi.fn()
    render(<DataTable columns={columns} rows={rows} onRowClick={onRowClick} />)
    fireEvent.click(screen.getByText('Alpha'))
    expect(onRowClick).toHaveBeenCalledWith(rows[1])
  })

  it('un clic sur une action ne déclenche pas onRowClick (stopPropagation)', () => {
    const onRowClick = vi.fn()
    const onEditClick = vi.fn()
    render(
      <DataTable
        columns={columns}
        rows={rows}
        onRowClick={onRowClick}
        renderActions={() => <button onClick={onEditClick}>Modifier</button>}
      />,
    )
    fireEvent.click(screen.getAllByRole('button', { name: 'Modifier' })[0])
    expect(onEditClick).toHaveBeenCalledTimes(1)
    expect(onRowClick).not.toHaveBeenCalled()
  })
})

describe('RowDetailDrawer : comportement générique', () => {
  it('affiche Modifier/Supprimer seulement quand fournis, jamais sinon', () => {
    const { rerender } = render(
      <RowDetailDrawer row={rows[0]} columns={columns} title="Détail" onClose={vi.fn()} />,
    )
    expect(screen.queryByRole('button', { name: 'Modifier' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Supprimer/ })).not.toBeInTheDocument()

    rerender(
      <RowDetailDrawer
        row={rows[0]}
        columns={columns}
        title="Détail"
        onClose={vi.fn()}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />,
    )
    expect(screen.getByRole('button', { name: 'Modifier' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Supprimer/ })).toBeInTheDocument()
  })

  it('Supprimer est désactivé et affiche "Suppression…" pendant deletePending', () => {
    render(
      <RowDetailDrawer
        row={rows[0]}
        columns={columns}
        title="Détail"
        onClose={vi.fn()}
        onDelete={vi.fn()}
        deletePending
      />,
    )
    expect(screen.getByRole('button', { name: 'Suppression…' })).toBeDisabled()
  })

  it('ferme sur Échap et sur le clic du fond, jamais sur un clic à l’intérieur', () => {
    const onClose = vi.fn()
    render(<RowDetailDrawer row={rows[0]} columns={columns} title="Détail" onClose={onClose} />)

    fireEvent.click(screen.getByText('Détail'))
    expect(onClose).not.toHaveBeenCalled()

    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' })
    expect(onClose).toHaveBeenCalledTimes(1)

    fireEvent.click(screen.getByLabelText('Fermer la fiche détail'))
    expect(onClose).toHaveBeenCalledTimes(2)
  })

  it('ne rend rien quand row est null', () => {
    const { container } = render(<RowDetailDrawer row={null} columns={columns} title="Détail" onClose={vi.fn()} />)
    expect(container).toBeEmptyDOMElement()
  })
})
