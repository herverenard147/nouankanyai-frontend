import { beforeAll, describe, expect, it } from 'vitest'

import { fetchActionAlerts, fetchAlertHistory, fetchAutoAlerts } from '@/api/alerts'
import { fetchAdminPanel, reloadModels } from '@/api/adminModels'
import { fetchAdminUsers, promoteUser } from '@/api/adminUsers'
import { fetchAdvice } from '@/api/advice'
import { sendAssistantMessage } from '@/api/assistant'
import { fetchConsumptionSeries } from '@/api/consumption'
import { fetchEquipmentTable } from '@/api/equipment'
import { addManualInvoice, confirmInvoiceActual, fetchInvoices, generateForecastInvoice } from '@/api/invoices'
import { fetchJournal } from '@/api/journal'
import { fetchKpi, kpiIdsFor } from '@/api/kpis'
import { fetchMachinesTable } from '@/api/machinesTable'
import { fetchOpenAnomalies } from '@/api/anomalies'
import { fetchPredictionsBundle } from '@/api/prediction'
import {
  rawAddMachine,
  rawAuditRequests,
  rawCreateAuditRequest,
  rawCreateSite,
  rawResetMachine,
  rawSimulateMachine,
  rawSites,
  rawUserFacturation,
  rawUserMachines,
} from '@/api/rawBackend'
import { fetchThresholds, updateThresholds } from '@/api/settings'
import { useSessionStore } from '@/store/sessionStore'

/**
 * Smoke test d'intégration : appelle le vrai backend local (voir
 * VITE_API_BASE_URL, défaut http://localhost:8001) via les comptes de démo
 * réels créés pour cette vérification. Pas destiné à tourner en CI (dépend
 * d'un backend + Postgres locaux déjà démarrés) — usage ponctuel de vérification.
 */

async function loginAs(email: string, password: string) {
  const result = await useSessionStore.getState().login(email, password)
  if (!result.ok) throw new Error(`Login ${email} a échoué : ${result.message}`)
}

describe('intégration backend réel — compte Ménage', () => {
  beforeAll(async () => {
    await loginAs('aicha@menage.demo', 'demo1234')
  })

  it('sites, KPI, alertes, conseils, prédiction, consommation, factures ne plantent pas', async () => {
    const sites = await rawSites()
    expect(sites.length).toBeGreaterThan(0)

    for (const kpiId of kpiIdsFor('menage')) {
      const kpi = await fetchKpi('menage', kpiId)
      expect(kpi.label).toBeTruthy()
      expect(kpi.provenance).toBe('estime')
    }

    const actionAlerts = await fetchActionAlerts('menage')
    expect(Array.isArray(actionAlerts)).toBe(true)
    const autoAlerts = await fetchAutoAlerts('menage')
    expect(Array.isArray(autoAlerts)).toBe(true)
    const history = await fetchAlertHistory('menage')
    expect(Array.isArray(history)).toBe(true)

    const advice = await fetchAdvice('menage')
    expect(Array.isArray(advice)).toBe(true)

    const predictions = await fetchPredictionsBundle('menage', 'heure')
    expect(predictions.global.series.length).toBeGreaterThan(0)
    expect(predictions.global.provenance).toBe('synthetique')
    expect(predictions.perDevice.length).toBeGreaterThan(0)

    const consumption = await fetchConsumptionSeries('menage')
    expect(consumption.length).toBeGreaterThan(0)
    expect(consumption[0].byPost.length).toBeGreaterThan(0)

    const invoices = await fetchInvoices('menage')
    expect(Array.isArray(invoices)).toBe(true)
  }, 30000)

  it('seuils : lecture puis mise à jour réelle, valeur bien répercutée', async () => {
    const before = await fetchThresholds()
    const updated = await updateThresholds({ ...before, temperature_max_c: before.temperature_max_c === 61 ? 60 : 61 })
    expect(updated.temperature_max_c).not.toBe(before.temperature_max_c)
    // restaure la valeur d'origine pour ne pas polluer le compte de démo
    await updateThresholds(before)
  }, 30000)

  it('facture : génère une prévision réelle puis confirme un montant réel', async () => {
    // generate_bill_forecast() est un upsert par mois côté backend : un appel
    // répété pour le même mois renvoie/actualise la même ligne plutôt que
    // d'en créer une nouvelle — donc pas d'hypothèse sur son statut initial.
    const forecast = await generateForecastInvoice()
    expect(forecast.id).toBeTruthy()
    const confirmed = await confirmInvoiceActual(forecast.id, 12345)
    expect(confirmed.status).toBe('traitee')
    expect(confirmed.fields.some((f) => f.value.includes('12'))).toBe(true)
  }, 30000)

  it('facture : ajout manuel réel', async () => {
    const invoice = await addManualInvoice({ month: 'Test smoke', amountXof: 1000 })
    expect(invoice.period).toBe('Test smoke')
  }, 30000)

  it('assistant : /api/chat répond réellement (AI_MODE=mock attendu en local)', async () => {
    const reply = await sendAssistantMessage('menage', 'Bonjour')
    expect(typeof reply).toBe('string')
    expect(reply.length).toBeGreaterThan(0)
  }, 30000)
})

describe('intégration backend réel — compte PME', () => {
  beforeAll(async () => {
    await loginAs('contact@boulangerie-awale.demo', 'demo1234')
  })

  it('table équipements a des lignes réelles avec provenance', async () => {
    const table = await fetchEquipmentTable('pme')
    expect(table.rows.length).toBeGreaterThan(0)
    for (const row of table.rows) {
      expect(row.provenance).toBe('estime')
      expect(row.categorie).toBeTruthy()
    }
  }, 30000)

  it('cycle réel site → machine → simulate → reset', async () => {
    const site = await rawCreateSite({ nom: 'Site smoke test', localisation: 'Test' })
    expect(site.id).toBeTruthy()

    const added = await rawAddMachine({
      nom: 'Machine smoke test',
      categorie: 'Ventilateur Extracteur',
      marque: 'AirFlow',
      modele: 'AFL-5',
      site_id: site.id,
      quantite: 1,
    })
    const machineId = added.machines[0].machine_id
    expect(added.machines[0].status).toBe('actif')

    const simulated = await rawSimulateMachine(machineId)
    expect(simulated.status).toBe('success')

    const table = await fetchEquipmentTable('pme')
    expect(table.rows.find((r) => r.id === machineId)?.statut).toBe('Anomalie détectée')

    const reset = await rawResetMachine(machineId)
    expect(reset.status).toBe('success')
  }, 30000)
})

describe('intégration backend réel — compte Industrie', () => {
  beforeAll(async () => {
    await loginAs('exploitation@yopougon-l2.demo', 'demo1234')
  })

  it('table machines et anomalies ouvertes reflètent la machine simulée en alerte', async () => {
    const table = await fetchMachinesTable('industrie')
    expect(table.rows.length).toBeGreaterThan(0)

    const openAnomalies = await fetchOpenAnomalies('industrie')
    expect(openAnomalies.length).toBeGreaterThan(0)
    expect(openAnomalies[0].statut).toBe('Anomalie détectée')

    const journal = await fetchJournal('industrie')
    expect(Array.isArray(journal)).toBe(true)
  }, 30000)
})

describe('intégration backend réel — compte Admin', () => {
  beforeAll(async () => {
    await loginAs('admin@nouankany.demo', 'demo1234')
  })

  it('KPI admin, panneaux ML, utilisateurs et journal renvoient des données réelles', async () => {
    for (const kpiId of kpiIdsFor('admin')) {
      const kpi = await fetchKpi('admin', kpiId)
      expect(kpi.provenance).toBe('telemetrie_systeme')
    }

    for (const panelId of ['xgboost', 'isolation-forest', 'gemini']) {
      const panel = await fetchAdminPanel(panelId)
      expect(panel.rows.length).toBeGreaterThan(0)
    }

    const users = await fetchAdminUsers()
    expect(users.length).toBeGreaterThanOrEqual(4)
    const menageUser = users.find((u) => u.email === 'aicha@menage.demo')
    expect(menageUser?.profile).toBe('menage')

    const journal = await fetchJournal('admin')
    expect(Array.isArray(journal)).toBe(true)
  }, 30000)

  it('drill-down utilisateur (machines + facturation) renvoie des données réelles', async () => {
    const users = await fetchAdminUsers()
    const menageUser = users.find((u) => u.email === 'aicha@menage.demo')
    expect(menageUser).toBeTruthy()

    const machines = await rawUserMachines(menageUser!.id)
    expect(machines.length).toBeGreaterThan(0)
    const facturation = await rawUserFacturation(menageUser!.id)
    expect(facturation).toHaveProperty('billCount')
  }, 30000)

  it('promotion/rétrogradation réelle d’un utilisateur (superadmin uniquement), puis restauration', async () => {
    const users = await fetchAdminUsers()
    const menageUser = users.find((u) => u.email === 'aicha@menage.demo')!
    expect(menageUser.platformRole).toBeNull()

    const promoted = await promoteUser(menageUser.id, true)
    expect(promoted.platform_role).toBe('admin')

    const demoted = await promoteUser(menageUser.id, false)
    expect(demoted.platform_role).toBeNull()
  }, 30000)

  it('rechargement réel des modèles ML (admin)', async () => {
    const result = await reloadModels()
    expect(result.active_models.length).toBeGreaterThan(0)
  }, 30000)

  it('formulaire "Demander un audit" : soumission publique puis lecture admin réelle', async () => {
    const email = `smoke-${Date.now()}@audit-test.demo`
    const created = await rawCreateAuditRequest({
      entreprise: 'Entreprise Smoke Test',
      contact_nom: 'Contact Smoke',
      email,
      secteur: 'industrie',
      message: 'Test de bout en bout du formulaire.',
    })
    expect(created.status).toBe('nouveau')

    const leads = await rawAuditRequests()
    expect(leads.some((lead) => lead.email === email)).toBe(true)
  }, 30000)
})
