import { api } from '@/lib/apiClient'
import type {
  BackendDevice,
  BackendDeviceCreatePayload,
  BackendDeviceCreated,
  BackendFileMapping,
  BackendFilePreview,
  BackendInstallation,
  BackendInterventionAccount,
  BackendKeyRenewed,
  BackendMeterPoint,
  BackendMeterPointCreate,
  BackendMeterTemplate,
  BackendSourceAlias,
  BackendSourceFile,
  BackendSourceKind,
  BackendTechnicianAccess,
} from '@/types/backend'

/**
 * Sources de mesures (2026-10-16) : boîtier vocal, passerelle muette, logiciel du client, dépôt de fichiers. Toutes sont
 * des `devices` côté backend ; les mesures arrivent dans les mêmes unités et passent les mêmes contrôles. Ces appels
 * servent au client (son compte) et au technicien en intervention (en-tête ajouté par `apiClient`).
 */

export const SOURCE_KIND_LABEL: Record<BackendSourceKind, string> = {
  vocal: 'Boîtier Nouankany',
  passerelle: 'Passerelle de mesure',
  logiciel: 'Logiciel du client',
  fichier: 'Dépôt de fichiers',
  capteur: 'Capteur d’un appareil',
}

export const SOURCE_KIND_SENTENCE: Record<BackendSourceKind, string> = {
  vocal: "Le boîtier qui parle : il donne l'état de vos appareils à la voix et en couleur.",
  passerelle: 'Un petit boîtier muet, posé dans le tableau électrique, qui lit vos compteurs et envoie leurs mesures.',
  logiciel: 'Votre logiciel de supervision ou de gestion d’énergie envoie lui-même ses mesures, avec une clé.',
  fichier: 'Votre logiciel exporte un fichier (CSV ou Excel), déposé chaque jour automatiquement ou à la main.',
  capteur: 'Un petit capteur posé sur un appareil : il mesure sa consommation, et peut le couper s’il a un relais.',
}

export const METER_STATUS_LABEL = {
  a_tester: 'Lecture d’essai en attente',
  actif: 'En service',
  a_verifier: 'À vérifier',
} as const

export const kindOf = (device: Pick<BackendDevice, 'kind'>): BackendSourceKind => device.kind ?? 'vocal'

export const fetchSources = () => api.get<BackendDevice[]>('/api/v1/boitiers')
export const createSource = (payload: BackendDeviceCreatePayload) => api.post<BackendDeviceCreated>('/api/v1/boitiers', payload)
export const revokeSource = (id: string) => api.delete<{ status: string }>(`/api/v1/boitiers/${id}`)

// Passerelle : compteurs lus
export const fetchMeterTemplates = () => api.get<BackendMeterTemplate[]>('/api/v1/boitiers/compteurs/modeles')
export const fetchMeterPoints = (id: string) => api.get<BackendMeterPoint[]>(`/api/v1/boitiers/${id}/compteurs`)
export const addMeterPoint = (id: string, payload: BackendMeterPointCreate) => api.post<BackendMeterPoint>(`/api/v1/boitiers/${id}/compteurs`, payload)
export const retestMeterPoint = (id: string, pointId: string) => api.post<BackendMeterPoint>(`/api/v1/boitiers/${id}/compteurs/${pointId}/retester`)
export const deleteMeterPoint = (id: string, pointId: string) => api.delete<{ status: string }>(`/api/v1/boitiers/${id}/compteurs/${pointId}`)

// Logiciel du client et fichiers : clé et noms reliés
export const fetchAliases = (id: string) => api.get<{ items: BackendSourceAlias[] }>(`/api/v1/boitiers/${id}/correspondances`)
export const saveAliases = (id: string, items: BackendSourceAlias[]) => api.put<{ items: BackendSourceAlias[] }>(`/api/v1/boitiers/${id}/correspondances`, { items })
export const renewKey = (id: string) => api.post<BackendKeyRenewed>(`/api/v1/boitiers/${id}/nouvelle-cle`)

// Fichiers
const fileForm = (file: File) => {
  const form = new FormData()
  form.append('file', file)
  return form
}
export const previewFile = (id: string, file: File) => api.postForm<BackendFilePreview>(`/api/v1/boitiers/${id}/fichier/apercu`, fileForm(file))
export const fetchFileMapping = (id: string) => api.get<{ mapping: BackendFileMapping | null }>(`/api/v1/boitiers/${id}/fichier/colonnes`)
export const saveFileMapping = (id: string, mapping: BackendFileMapping, columns?: string[]) =>
  api.put<{ mapping: BackendFileMapping }>(`/api/v1/boitiers/${id}/fichier/colonnes`, { mapping, columns })
export const uploadFile = (id: string, file: File) => api.postForm<BackendSourceFile>(`/api/v1/boitiers/${id}/fichiers`, fileForm(file))
export const fetchFiles = (id: string) => api.get<BackendSourceFile[]>(`/api/v1/boitiers/${id}/fichiers`)

/** Détail d'un fichier reçu : la raison d'un refus global, ou la liste des lignes refusées. */
export function fileDetail(file: Pick<BackendSourceFile, 'detail'>): { raison?: string; refus: { ligne: number; raison: string }[] } {
  if (!file.detail) return { refus: [] }
  try {
    const parsed = JSON.parse(file.detail) as { raison?: string; refus?: { ligne: number; raison: string }[] }
    return { raison: parsed.raison, refus: parsed.refus ?? [] }
  } catch {
    return { raison: file.detail, refus: [] }
  }
}

// Accès technicien : côté client, côté technicien
export const fetchTechnicianAccess = () => api.get<BackendTechnicianAccess>('/api/v1/intervention/acces')
export const grantTechnicianAccess = (days: number, note?: string) => api.post<BackendTechnicianAccess>('/api/v1/intervention/acces', { days, note: note || null })
export const revokeTechnicianAccess = () => api.delete<BackendTechnicianAccess>('/api/v1/intervention/acces')
export const fetchInterventionAccounts = () => api.get<BackendInterventionAccount[]>('/api/v1/intervention/comptes')
export const fetchInstallation = () => api.get<BackendInstallation>('/api/v1/intervention/installation')

/** Adresse Modbus « 3xxxx / 4xxxx » d'une notice -> adresse de départ comptée depuis 0, comme dans la trame. */
export function modbusOffset(documented: number): { address: number; function: 3 | 4 } | null {
  if (documented >= 30001 && documented <= 39999) return { address: documented - 30001, function: 4 }
  if (documented >= 40001 && documented <= 49999) return { address: documented - 40001, function: 3 }
  return null
}

/** Capteurs d'appareils du compte, par code d'appareil (un capteur actif au plus par appareil). */
export function sensorsByMachine(devices: BackendDevice[]): Map<string, BackendDevice> {
  const out = new Map<string, BackendDevice>()
  for (const d of devices) if (kindOf(d) === 'capteur' && d.machine_code) out.set(d.machine_code, d)
  return out
}
