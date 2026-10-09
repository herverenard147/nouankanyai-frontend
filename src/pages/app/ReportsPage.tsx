import { useMutation } from '@tanstack/react-query'
import { useState } from 'react'

import { rawGenerateReport } from '@/api/rawBackend'
import { Button } from '@/components/ui/Button'
import { MutationError, SelectField } from '@/components/ui/Modal'
import { saveBlob } from '@/lib/apiClient'
import { useSessionStore } from '@/store/sessionStore'
import type { Profile } from '@/types/domain'
import type { ReportFormat, ReportType } from '@/types/backend'

const TYPE_LABELS: Record<ReportType, string> = {
  daily: 'Journalier',
  weekly: 'Hebdomadaire',
  monthly: 'Mensuel',
  energy_audit: 'Audit énergétique',
  anomaly_report: 'Anomalies',
  performance_report: 'Performance des machines',
}

const FORMAT_LABELS: Record<ReportFormat, string> = {
  pdf: 'PDF',
  xlsx: 'Excel',
  docx: 'Word',
  pptx: 'PowerPoint',
}

/** Ce que chaque type de compte peut générer : le Ménage veut un bilan lisible, l'Industrie
 * des documents à retravailler ou présenter. */
export const REPORT_OPTIONS: Record<Exclude<Profile, 'admin'>, { types: ReportType[]; formats: ReportFormat[] }> = {
  menage: { types: ['monthly'], formats: ['pdf'] },
  pme: { types: ['monthly', 'weekly', 'energy_audit'], formats: ['pdf', 'xlsx'] },
  industrie: {
    types: ['monthly', 'weekly', 'daily', 'energy_audit', 'anomaly_report', 'performance_report'],
    formats: ['pdf', 'docx', 'pptx', 'xlsx'],
  },
}

/** Rapports énergétiques générés par le serveur à partir des données réelles du compte
 * (POST /api/v1/reports/generate). */
export function ReportsPage() {
  const profile = useSessionStore((s) => s.session?.profile)
  const options = REPORT_OPTIONS[profile === 'pme' || profile === 'industrie' ? profile : 'menage']
  const [reportType, setReportType] = useState<ReportType>(options.types[0])
  const [format, setFormat] = useState<ReportFormat>(options.formats[0])
  const generate = useMutation({
    mutationFn: () => rawGenerateReport(reportType, format),
    onSuccess: ({ blob, filename }) => saveBlob(blob, filename ?? `rapport-nouankany.${format}`),
  })

  return (
    <div className="flex flex-col gap-7">
      <h1 className="text-section-title font-semibold text-text-primary">Rapports</h1>
      <p className="text-sm text-text-secondary">
        Un rapport reprend vos équipements, leurs derniers relevés, votre dernière facture CIE et les alertes de la période.
        Quand une valeur est estimée faute de mesure, le rapport le signale.
      </p>
      <form
        className="flex flex-col gap-4 border-t-2 border-text-primary pt-4 sm:max-w-md"
        onSubmit={(event) => {
          event.preventDefault()
          generate.mutate()
        }}
      >
        {options.types.length > 1 && (
          <SelectField
            label="Type de rapport"
            value={reportType}
            onChange={(value) => setReportType(value as ReportType)}
            options={options.types.map((t) => ({ value: t, label: TYPE_LABELS[t] }))}
          />
        )}
        {options.formats.length > 1 && (
          <SelectField
            label="Format"
            value={format}
            onChange={(value) => setFormat(value as ReportFormat)}
            options={options.formats.map((f) => ({ value: f, label: FORMAT_LABELS[f] }))}
          />
        )}
        <Button type="submit" disabled={generate.isPending} className="self-start">
          {generate.isPending ? 'Génération…' : `Télécharger le rapport ${TYPE_LABELS[reportType].toLowerCase()} (${FORMAT_LABELS[format]})`}
        </Button>
        <MutationError error={generate.error} />
      </form>
    </div>
  )
}
