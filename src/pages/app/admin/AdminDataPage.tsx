import { useMutation, useQuery } from '@tanstack/react-query'
import { useState } from 'react'

import { downloadTrainingCsv, rawMlCollection, rawMlCollectionMachines, rawMlForecastReview } from '@/api/rawBackend'
import { MetricState } from '@/components/state/MetricState'
import { Button } from '@/components/ui/Button'
import { MutationError } from '@/components/ui/Modal'
import { formatNumberFr } from '@/lib/formatters'

const SECTION = 'flex flex-col gap-3 border-t-2 border-text-primary pt-4'
const TH = 'px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-text-secondary'
const TD = 'px-3 py-2 tabular-nums'
const pct = (v: number | null) => (v === null ? 'n.d.' : `${formatNumberFr(v * 100, 0)} %`)
const day = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString('fr-FR') : 'n.d.')
const METHODE: Record<string, string> = { profil: 'Profil mesuré', fiche: 'Fiche de l’appareil', copie_v2: 'Modèle v2 (réentraîné)', ancien_modele: 'Modèle v2 d’origine', modele_relatif: 'Modèle relatif', similarite: 'Similarité' }

/**
 * Données d'entraînement (demande du propriétaire, 2026-10-18 : tout gérer depuis le site, plus de script lancé à la
 * main). Seules les mesures réelles des boîtiers servent : avancement de la collecte, appareil par appareil, bilan des
 * prévisions servies face aux relevés réels, et téléchargement du jeu d'entraînement pour le carnet Colab.
 */
export function AdminDataPage() {
  const status = useQuery({ queryKey: ['ml-collecte'], queryFn: rawMlCollection })
  const machines = useQuery({ queryKey: ['ml-collecte-appareils'], queryFn: rawMlCollectionMachines })
  const [jours, setJours] = useState(30)
  const review = useQuery({ queryKey: ['ml-bilan', jours], queryFn: () => rawMlForecastReview(jours) })
  const [done, setDone] = useState(false)
  const download = useMutation({ mutationFn: downloadTrainingCsv, onSuccess: () => setDone(true) })
  const s = status.data

  return (
    <div className="flex flex-col gap-7">
      <section className="flex flex-col gap-3">
        <h2 className="text-section-title font-semibold text-text-primary">Collecte de mesures réelles</h2>
        <p className="text-sm text-text-secondary">
          Seules les mesures envoyées par les boîtiers des comptes clients servent à réentraîner les modèles : ni simulation, ni démonstration,
          ni compte de test.
        </p>
        <MetricState status={status.status}>
          {s && (
            <div className="flex flex-col gap-3">
              <dl className="grid gap-3 text-sm sm:grid-cols-3">
                <div className="border border-border p-3">
                  <dt className="text-text-secondary">Relevés réels reçus</dt>
                  <dd className="text-lg font-semibold tabular-nums text-text-primary">{formatNumberFr(s.releves_reels, 0)}</dd>
                </div>
                <div className="border border-border p-3">
                  <dt className="text-text-secondary">Appareils mesurés</dt>
                  <dd className="text-lg font-semibold tabular-nums text-text-primary">{s.machines_mesurees}</dd>
                </div>
                <div className="border border-border p-3">
                  <dt className="text-text-secondary">Mesurés depuis un mois</dt>
                  <dd className="text-lg font-semibold tabular-nums text-text-primary">
                    {s.machines_avec_un_mois} sur {s.seuil_reentrainement.machines}
                  </dd>
                </div>
              </dl>
              <p className={`text-sm font-semibold ${s.pret_pour_reentrainement ? 'text-confirm' : 'text-text-secondary'}`}>
                {s.pret_pour_reentrainement
                  ? 'Seuil atteint : le réentraînement sur vos propres mesures a du sens.'
                  : `Seuil pas encore atteint : ${s.seuil_reentrainement.machines} appareils mesurés au moins un mois, à ${pct(s.seuil_reentrainement.couverture)} des heures.`}
              </p>
            </div>
          )}
        </MetricState>
      </section>

      <section className={SECTION}>
        <h2 className="text-section-title font-semibold text-text-primary">Jeu d’entraînement</h2>
        <p className="text-sm text-text-secondary">
          Une ligne par appareil et par heure ; une heure sans mesure reste vide, jamais inventée. Déposez le fichier dans le Drive (dossier
          Nouankany/donnees_reelles) puis lancez le carnet « reentrainement_reel » sur Colab ; sans le seuil atteint, il ne réentraîne rien.
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <Button type="button" loading={download.isPending} onClick={() => { setDone(false); download.mutate() }}>
            Télécharger le jeu d’entraînement (CSV)
          </Button>
          {done && <span className="text-sm text-confirm">Fichier téléchargé.</span>}
        </div>
        <MutationError error={download.error} />
      </section>

      <section className={SECTION}>
        <h2 className="text-section-title font-semibold text-text-primary">Appareil par appareil</h2>
        <p className="text-sm text-text-secondary">« Prêt » : au moins un mois de mesures, avec une mesure sur 80 % des heures au moins.</p>
        <MetricState status={machines.status} isEmpty={machines.data?.length === 0}>
          <div className="overflow-x-auto border-y border-border">
            <table className="w-full min-w-[720px] text-sm">
              <thead>
                <tr>
                  <th className={TH}>Appareil</th>
                  <th className={TH}>Compte</th>
                  <th className={TH}>Relevés</th>
                  <th className={TH}>Période</th>
                  <th className={TH}>Heures mesurées</th>
                  <th className={TH}>Couverture</th>
                  <th className={TH}>État</th>
                </tr>
              </thead>
              <tbody>
                {machines.data?.map((m) => (
                  <tr key={m.code} className="border-t border-border">
                    <td className="px-3 py-2">
                      <span className="font-semibold text-text-primary">{m.nom}</span>
                      <span className="block text-xs text-text-secondary">{m.categorie ?? 'sans famille'}</span>
                    </td>
                    <td className="px-3 py-2">{m.type_compte ?? 'n.d.'}</td>
                    <td className={TD}>{formatNumberFr(m.releves, 0)}</td>
                    <td className={TD}>
                      {day(m.debut)} au {day(m.fin)}
                    </td>
                    <td className={TD}>
                      {formatNumberFr(m.heures_mesurees, 0)} sur {formatNumberFr(m.heures_periode, 0)}
                    </td>
                    <td className={TD}>{pct(m.couverture)}</td>
                    <td className={`px-3 py-2 font-semibold ${m.pret ? 'text-confirm' : 'text-text-secondary'}`}>{m.pret ? 'Prêt' : 'En cours'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </MetricState>
      </section>

      <section className={SECTION}>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h2 className="text-section-title font-semibold text-text-primary">Prévisions servies face aux relevés réels</h2>
          <label className="flex items-center gap-2 text-sm text-text-secondary">
            Période
            <select className="focus-ring border border-border bg-surface px-2 py-1 text-text-primary" value={jours} onChange={(e) => setJours(Number(e.target.value))}>
              <option value={7}>7 jours</option>
              <option value={30}>30 jours</option>
              <option value={90}>90 jours</option>
            </select>
          </label>
        </div>
        <p className="text-sm text-text-secondary">Erreur relative : écart moyen entre la prévision et la mesure, rapporté à la consommation mesurée.</p>
        <MetricState status={review.status} isEmpty={review.data?.lignes.length === 0}>
          {review.data && (
            <div className="overflow-x-auto border-y border-border">
              <p className="px-3 py-2 text-xs text-text-secondary">{formatNumberFr(review.data.previsions_servies, 0)} prévision(s) servie(s) sur la période</p>
              <table className="w-full min-w-[640px] text-sm">
                <thead>
                  <tr>
                    <th className={TH}>Méthode</th>
                    <th className={TH}>Famille</th>
                    <th className={TH}>Prévisions</th>
                    <th className={TH}>Heures comparées</th>
                    <th className={TH}>Erreur moyenne</th>
                    <th className={TH}>Erreur relative</th>
                  </tr>
                </thead>
                <tbody>
                  {review.data.lignes.map((l) => (
                    <tr key={`${l.methode}-${l.modele}-${l.famille}`} className="border-t border-border">
                      <td className="px-3 py-2">
                        {METHODE[l.methode] ?? l.methode}
                        {l.modele && <span className="block text-xs text-text-secondary">{l.modele}</span>}
                      </td>
                      <td className="px-3 py-2">{l.famille ?? 'n.d.'}</td>
                      <td className={TD}>{formatNumberFr(l.previsions, 0)}</td>
                      <td className={TD}>{formatNumberFr(l.heures_mesurees, 0)}</td>
                      <td className={TD}>{formatNumberFr(l.erreur_moyenne_kw * 1000, 0)} W</td>
                      <td className={TD}>{pct(l.erreur_relative)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </MetricState>
      </section>
    </div>
  )
}
