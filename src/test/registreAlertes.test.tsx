import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { BackendAlertEntry } from '@/types/backend'

/**
 * Registre des alertes (2026-10-16) : une alerte terminée reste dans l'historique avec la façon dont elle s'est
 * fermée, et l'utilisateur peut dire ce qu'il a fait pour que Nouankany ajuste ses recommandations.
 */
vi.mock('@/api/rawBackend', () => ({
  rawAlertFeedback: vi.fn(async () => ({})),
  rawAlertRegistry: vi.fn(async () => []),
}))

import { rawAlertFeedback } from '@/api/rawBackend'
import { AlertFeedbackForm } from '@/components/alerts/AlertFeedbackForm'
import { alertProvenance, feedbackFieldsForLevel, problemChoices, resolutionLabel } from '@/lib/alertRegistry'

function alert(overrides: Partial<BackendAlertEntry> = {}): BackendAlertEntry {
  return {
    id: 'a1', machine_code: 'CF-01', machine_nom: 'Chambre froide', kind: 'surchauffe', kind_label: 'Surchauffe', level: 'alerte',
    source: 'boitier', title: 'Dépassement de seuil : température', description: null, action: null,
    reco: { id: 'surchauffe.refrigeration', version: 1, cause: 'Joint de porte défectueux.', steps: ['Contrôlez le joint de porte.'] },
    opened_provenance: 'mesure', created_at: '2026-10-16T08:00:00', last_seen_at: null, is_open: false,
    closed_at: '2026-10-16T09:00:00', closure_trigger: 'auto', closure_provenance: 'mesure', resolution: 'inconnue',
    needs_feedback: true, feedback: null, ...overrides,
  }
}

function renderForm(a: BackendAlertEntry, level: 'debutant' | 'amateur' | 'technique' = 'debutant') {
  const client = new QueryClient({ defaultOptions: { mutations: { retry: false } } })
  return render(
    <QueryClientProvider client={client}>
      <AlertFeedbackForm alert={a} level={level} onLater={vi.fn()} />
    </QueryClientProvider>,
  )
}

describe('registre des alertes', () => {
  beforeEach(() => vi.clearAllMocks())

  it('dit comment une alerte terminée a été fermée', () => {
    expect(resolutionLabel(alert())).toBe('Revenue à la normale seule, à documenter')
    expect(resolutionLabel(alert({ closure_trigger: 'verification' }))).toBe('Fermée après vérification, à documenter')
    expect(resolutionLabel(alert({ resolution: 'nouankany' }))).toMatch(/^Résolue par Nouankany/)
    expect(resolutionLabel(alert({ is_open: true }))).toBe('En cours')
  })

  it('propose la cause indiquée, ou des causes propres à un écart de prévision', () => {
    expect(problemChoices(alert())[0].label).toBe('La cause indiquée : Joint de porte défectueux.')
    expect(problemChoices(alert({ kind: 'ecart_prevision' })).map((c) => c.value)).toContain('usage_exceptionnel')
  })

  it('le niveau change réellement le volet', () => {
    expect(feedbackFieldsForLevel('debutant')).toEqual({ showSteps: false, showCostAndDowntime: false })
    expect(feedbackFieldsForLevel('amateur')).toEqual({ showSteps: true, showCostAndDowntime: false })
    expect(feedbackFieldsForLevel('technique')).toEqual({ showSteps: true, showCostAndDowntime: true })
  })

  it('une mesure synthétique est signalée comme telle', () => {
    expect(alertProvenance(alert({ closure_provenance: 'simulation' }))).toBe('synthetique')
    renderForm(alert({ closure_provenance: 'simulation' }))
    expect(screen.getByText(/n’ajustera pas les recommandations|n'ajustera pas les recommandations/)).toBeTruthy()
  })

  it('« rien fait » envoie action rien, sans demander ce qui a été fait', async () => {
    renderForm(alert())
    const send = screen.getByRole('button', { name: 'Envoyer' })
    expect((send as HTMLButtonElement).disabled).toBe(true)
    fireEvent.click(screen.getByLabelText('Non'))
    expect(screen.queryByText("Qu'avez-vous fait ?")).toBeNull()
    fireEvent.click(screen.getByLabelText('Je ne sais pas, c’est revenu tout seul'))
    fireEvent.click(send)
    await waitFor(() => expect(rawAlertFeedback).toHaveBeenCalledWith('a1', { did_something: false, problem: 'inconnu', action: 'rien' }))
  })

  it('une intervention envoie la cause, l’action et l’utilité', async () => {
    renderForm(alert(), 'technique')
    expect(screen.getByText('Recommandation affichée')).toBeTruthy()
    fireEvent.click(screen.getByLabelText('Oui'))
    fireEvent.click(screen.getByLabelText('La cause indiquée : Joint de porte défectueux.'))
    fireEvent.click(screen.getByLabelText('Un technicien est intervenu'))
    fireEvent.click(screen.getAllByLabelText('En partie')[0])
    fireEvent.change(screen.getByLabelText("Coût de l'intervention en FCFA (facultatif)"), { target: { value: '15000' } })
    fireEvent.click(screen.getByRole('button', { name: 'Envoyer' }))
    await waitFor(() =>
      expect(rawAlertFeedback).toHaveBeenCalledWith('a1', {
        did_something: true, problem: 'cause_indiquee', action: 'technicien', reco_useful: 'en_partie', cost_fcfa: 15000,
      }),
    )
  })
})
