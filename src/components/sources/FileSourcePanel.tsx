import { useRef, useState } from 'react'

import { fileDetail, previewFile } from '@/api/sources'
import { BoitierSectionBlock, Th } from '@/components/boitier/BoitierParts'
import { ApiErrorMessage } from '@/components/errors/ApiErrorMessage'
import { MetricState } from '@/components/state/MetricState'
import { Button } from '@/components/ui/Button'
import { MutationError, SelectField, errorText } from '@/components/ui/Modal'
import { TextField } from '@/components/ui/TextField'
import { useFileMapping, useInstallation, useSourceFiles, useSourceMutations } from '@/hooks/queries/useSources'
import { formatUtcDateTime } from '@/lib/formatters'
import { EMPTY_FILE_DRAFT, fromMapping, toMapping } from '@/lib/sourceForms'
import type { FileDraft, FileMeasure } from '@/lib/sourceForms'
import type { BackendFileMapping, BackendFilePreview, BackendSourceFile } from '@/types/backend'

export function FileSourcePanel({ deviceId }: { deviceId: string }) {
  const mapping = useFileMapping(deviceId, true)
  return (
    <>
      <ColumnsSection deviceId={deviceId} saved={mapping.data?.mapping ?? null} loaded={mapping.isSuccess} />
      <DepositSection deviceId={deviceId} ready={Boolean(mapping.data?.mapping)} />
      <HistorySection deviceId={deviceId} />
    </>
  )
}

function ColumnsSection({ deviceId, saved, loaded }: { deviceId: string; saved: BackendFileMapping | null; loaded: boolean }) {
  const installation = useInstallation()
  const { saveMapping } = useSourceMutations(deviceId)
  const [preview, setPreview] = useState<BackendFilePreview | null>(null)
  const [previewError, setPreviewError] = useState<string | null>(null)
  const [previewing, setPreviewing] = useState(false)
  const [edited, setEdited] = useState<FileDraft | null>(null)
  // Tant que rien n'est modifié, le formulaire montre le réglage enregistré.
  const draft = edited ?? (loaded && saved ? fromMapping(saved) : EMPTY_FILE_DRAFT)

  async function onPreview(file: File) {
    setPreviewing(true)
    setPreviewError(null)
    try {
      setPreview(await previewFile(deviceId, file))
    } catch (error) {
      setPreviewError(errorText(error))
    } finally {
      setPreviewing(false)
    }
  }

  const set = (patch: Partial<FileDraft>) => setEdited({ ...draft, ...patch })
  const columns = preview?.columns ?? []
  const colOptions = (empty: string) => [{ value: '', label: empty }, ...columns.map((c) => ({ value: c, label: c }))]
  const machines = installation.data?.appareils ?? []

  return (
    <BoitierSectionBlock title="Régler les colonnes" rule>
      <p className="text-sm text-text-secondary">
        Envoyez un vrai fichier exporté par le logiciel : ses colonnes s’affichent. Dites une fois quelle colonne contient quoi, et dans quelle unité. Rien n’est deviné.
      </p>
      <FilePicker label="Fichier d’exemple (CSV ou XLSX)" busy={previewing} onFile={onPreview} button="Voir l’aperçu" />
      {previewError && <ApiErrorMessage message={previewError} className="text-sm text-alert" />}
      {saved && !preview && <p className="text-sm text-confirm">Colonnes réglées. Envoyez un fichier d’exemple pour les modifier.</p>}

      {preview && (
        <>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr className="border-b border-text-primary">
                  {preview.columns.map((c) => (
                    <Th key={c}>{c}</Th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {preview.rows.map((row, i) => (
                  <tr key={i} className="border-b border-border">
                    {row.map((cell, j) => (
                      <td key={j} className="py-1.5 pr-3 text-text-primary">
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-text-secondary">{preview.total_rows} lignes dans ce fichier.</p>

          <div className="grid gap-3.5 sm:grid-cols-2">
            <SelectField label="Colonne de la date" value={draft.date_column} onChange={(v) => set({ date_column: v })} options={colOptions('Choisir')} />
            <TextField label="Décalage de l’heure du fichier par rapport à UTC (heures)" inputMode="decimal" value={draft.utc_offset_hours} onChange={(e) => set({ utc_offset_hours: e.target.value })} />
            <SelectField
              label="L’appareil est donné par"
              value={draft.appliance}
              onChange={(v) => set({ appliance: v as FileDraft['appliance'] })}
              options={[
                { value: 'colonne', label: 'une colonne du fichier' },
                { value: 'unique', label: 'un seul appareil pour tout le fichier' },
              ]}
            />
            {draft.appliance === 'colonne' ? (
              <SelectField label="Colonne de l’appareil" value={draft.appliance_column} onChange={(v) => set({ appliance_column: v })} options={colOptions('Choisir')} />
            ) : (
              <SelectField
                label="Appareil"
                value={draft.machine_code}
                onChange={(v) => set({ machine_code: v })}
                options={[{ value: '', label: 'Choisir' }, ...machines.map((m) => ({ value: m.code, label: m.nom }))]}
              />
            )}
            <SelectField
              label="Ce qui est mesuré"
              value={draft.measure}
              onChange={(v) => set({ measure: v as FileMeasure })}
              options={[
                { value: 'power', label: 'une puissance' },
                { value: 'energy', label: 'une énergie (sans colonne de puissance)' },
              ]}
            />
            <span />
            {draft.measure === 'power' && (
              <>
                <SelectField label="Colonne de la puissance" value={draft.power_column} onChange={(v) => set({ power_column: v })} options={colOptions('Choisir')} />
                <SelectField
                  label="Unité de la puissance"
                  value={draft.power_unit}
                  onChange={(v) => set({ power_unit: v as FileDraft['power_unit'] })}
                  options={['W', 'kW', 'MW'].map((u) => ({ value: u, label: u }))}
                />
              </>
            )}
            <SelectField
              label={draft.measure === 'power' ? 'Colonne de l’index d’énergie (facultatif)' : 'Colonne de l’énergie'}
              value={draft.energy_column}
              onChange={(v) => set({ energy_column: v })}
              options={colOptions(draft.measure === 'power' ? 'Aucune' : 'Choisir')}
            />
            <SelectField
              label="Unité de l’énergie"
              value={draft.energy_unit}
              onChange={(v) => set({ energy_unit: v as FileDraft['energy_unit'] })}
              options={['Wh', 'kWh', 'MWh'].map((u) => ({ value: u, label: u }))}
            />
            {draft.measure === 'energy' && (
              <>
                <SelectField
                  label="Nature de l’énergie"
                  value={draft.energy_kind}
                  onChange={(v) => set({ energy_kind: v as FileDraft['energy_kind'] })}
                  options={[
                    { value: 'index', label: 'index : ne fait que monter (compteur)' },
                    { value: 'intervalle', label: 'consommation de chaque pas de temps' },
                  ]}
                />
                {draft.energy_kind === 'intervalle' && (
                  <TextField label="Durée de chaque pas de temps (minutes)" inputMode="numeric" value={draft.interval_minutes} onChange={(e) => set({ interval_minutes: e.target.value })} />
                )}
              </>
            )}
            <SelectField label="Colonne du facteur de puissance (facultatif)" value={draft.pf_column} onChange={(v) => set({ pf_column: v })} options={colOptions('Aucune')} />
            {draft.pf_column && (
              <SelectField
                label="Le facteur de puissance est écrit"
                value={draft.pf_percent ? 'pct' : 'unit'}
                onChange={(v) => set({ pf_percent: v === 'pct' })}
                options={[
                  { value: 'unit', label: 'entre 0 et 1' },
                  { value: 'pct', label: 'en pourcentage' },
                ]}
              />
            )}
            <SelectField label="Colonne de la tension en V (facultatif)" value={draft.voltage_column} onChange={(v) => set({ voltage_column: v })} options={colOptions('Aucune')} />
            <SelectField label="Colonne du courant en A (facultatif)" value={draft.current_column} onChange={(v) => set({ current_column: v })} options={colOptions('Aucune')} />
            <SelectField label="Colonne de la température en °C (facultatif)" value={draft.temperature_column} onChange={(v) => set({ temperature_column: v })} options={colOptions('Aucune')} />
          </div>
          <div>
            <Button type="button" loading={saveMapping.isPending} onClick={() => saveMapping.mutate({ mapping: toMapping(draft), columns }, { onSuccess: () => setEdited(null) })}>
              Enregistrer le réglage
            </Button>
          </div>
          <MutationError error={saveMapping.error} />
          {saveMapping.isSuccess && <p className="text-sm text-confirm">Réglage enregistré. Les prochains fichiers seront lus ainsi.</p>}
        </>
      )}
    </BoitierSectionBlock>
  )
}

function DepositSection({ deviceId, ready }: { deviceId: string; ready: boolean }) {
  const { upload } = useSourceMutations(deviceId)
  return (
    <BoitierSectionBlock title="Déposer un fichier" rule>
      <p className="text-sm text-text-secondary">
        Les fichiers arrivent normalement tout seuls (dépôt automatique avec la clé). Vous pouvez aussi en déposer un ici, par exemple pour reprendre un historique (jusqu’à un an). Un fichier déposé deux fois ne crée aucun doublon.
      </p>
      {!ready && <p className="text-sm text-alert">Réglez d’abord les colonnes : sinon le fichier sera refusé.</p>}
      <FilePicker label="Fichier (CSV ou XLSX, 20 Mo au plus)" busy={upload.isPending} onFile={(f) => upload.mutate(f)} button="Déposer" />
      <MutationError error={upload.error} />
      {upload.data && (
        <p className="text-sm text-text-primary">
          {upload.data.status === 'refuse' ? 'Fichier refusé : voir la raison dans l’historique.' : `${upload.data.accepted} mesure(s) gardée(s), ${upload.data.rejected} ligne(s) refusée(s).`}
        </p>
      )}
    </BoitierSectionBlock>
  )
}

function HistorySection({ deviceId }: { deviceId: string }) {
  const files = useSourceFiles(deviceId, true)
  const [open, setOpen] = useState<string | null>(null)
  const rows = files.data ?? []
  return (
    <BoitierSectionBlock title="Fichiers reçus" rule>
      <MetricState status={files.status}>
        {rows.length === 0 ? (
          <p className="text-sm text-text-secondary">Aucun fichier reçu pour le moment.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[40rem] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-text-primary">
                  <Th>Reçu le (UTC)</Th>
                  <Th>Fichier</Th>
                  <Th>Origine</Th>
                  <Th>Résultat</Th>
                  <Th>
                    <span className="sr-only">Détail</span>
                  </Th>
                </tr>
              </thead>
              <tbody>
                {rows.map((f) => (
                  <FileRow key={f.id} file={f} open={open === f.id} onToggle={() => setOpen(open === f.id ? null : f.id)} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </MetricState>
    </BoitierSectionBlock>
  )
}

function FileRow({ file, open, onToggle }: { file: BackendSourceFile; open: boolean; onToggle: () => void }) {
  const detail = fileDetail(file)
  const hasDetail = Boolean(detail.raison) || detail.refus.length > 0
  return (
    <>
      <tr className="border-b border-border align-top">
        <td className="py-2 pr-4 text-text-primary">{formatUtcDateTime(file.received_at).slice(0, 16)}</td>
        <td className="py-2 pr-4 text-text-primary">{file.filename ?? '-'}</td>
        <td className="py-2 pr-4 text-text-secondary">{file.via === 'plateforme' ? 'Déposé sur la plateforme' : 'Dépôt automatique'}</td>
        <td className="py-2 pr-4">
          {file.status === 'refuse' ? (
            <span className="font-medium text-alert">Refusé</span>
          ) : (
            <span className="text-text-primary">
              {file.accepted} gardée(s) sur {file.lines} ligne(s){file.rejected ? ` · ${file.rejected} refusée(s)` : ''}
            </span>
          )}
        </td>
        <td className="py-2 text-right">
          {hasDetail && (
            <Button type="button" variant="ghost" onClick={onToggle} aria-expanded={open}>
              {open ? 'Masquer' : 'Pourquoi ?'}
            </Button>
          )}
        </td>
      </tr>
      {open && (
        <tr className="border-b border-border">
          <td colSpan={5} className="bg-bg-elevated px-3 py-2">
            {detail.raison && <ApiErrorMessage message={detail.raison} className="text-sm text-text-primary" />}
            {detail.refus.length > 0 && (
              <ul className="flex flex-col gap-1 text-sm">
                {detail.refus.map((r) => (
                  <li key={`${r.ligne}-${r.raison}`} className="flex gap-2">
                    <span className="shrink-0 text-text-secondary">Ligne {r.ligne}</span>
                    <ApiErrorMessage message={r.raison} className="text-text-primary" />
                  </li>
                ))}
              </ul>
            )}
            {file.rejected > detail.refus.length && <p className="mt-1 text-xs text-text-secondary">Seules les 50 premières lignes refusées sont détaillées.</p>}
          </td>
        </tr>
      )}
    </>
  )
}

function FilePicker({ label, busy, onFile, button }: { label: string; busy: boolean; onFile: (file: File) => void; button: string }) {
  const ref = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<File | null>(null)
  return (
    <div className="flex flex-wrap items-end gap-3">
      <label className="flex flex-col gap-1.5 text-sm font-medium text-text-primary">
        {label}
        <input
          ref={ref}
          type="file"
          accept=".csv,.xlsx,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          className="text-sm font-normal"
        />
      </label>
      <Button type="button" disabled={!file} loading={busy} onClick={() => file && onFile(file)}>
        {button}
      </Button>
    </div>
  )
}
