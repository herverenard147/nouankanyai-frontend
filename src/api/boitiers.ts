import { getCachedMachines, rawAdminBoitierCommands, rawAdminBoitierState, rawBoitierCommands, rawBoitierState, rawBoitiers } from '@/api/rawBackend'
import { formatUtcDateTime } from '@/lib/formatters'
import type {
  BackendAdminDevice,
  BackendBoitierLight,
  BackendBoitierMachineState,
  BackendDevice,
  BackendDeviceCommand,
  BackendDeviceState,
} from '@/types/backend'
import type { Provenance } from '@/types/domain'

/**
 * Boîtier vocal : ce que le site en montre. Tout vient du backend (`/api/v1/boitiers`) : la lumière et la phrase
 * « ce que dit le boîtier » sont calculées côté serveur à partir des derniers relevés, jamais reconstituées ici.
 * Tant qu'aucun capteur réel n'est branché, les relevés sont simulés : la donnée est donc marquée « synthétique ».
 */
export const BOITIER_PROVENANCE: Provenance = 'synthetique'

export type Connection = 'en_ligne' | 'hors_ligne' | 'en_attente'

export const CONNECTION_LABEL: Record<Connection, string> = {
  en_ligne: 'En ligne',
  hors_ligne: 'Hors ligne',
  en_attente: 'En attente de connexion',
}

export const LIGHT_SHORT: Record<BackendBoitierLight, string> = {
  vert: 'Verte',
  orange: 'Orange',
  rouge: 'Rouge',
  aucune_donnee: 'Éteinte',
}
export const LIGHT_COLOR: Record<BackendBoitierLight, string> = {
  vert: '#35C773',
  orange: '#F2A20C',
  rouge: '#FF4D5E',
  aucune_donnee: '#C9C7BE',
}
export const LIGHT_SENTENCE: Record<BackendBoitierLight, string> = {
  vert: 'Lumière verte : tous les appareils suivis sont dans leurs seuils.',
  orange: 'Lumière orange : un appareil s’approche de son seuil d’alerte.',
  rouge: 'Lumière rouge : un appareil dépasse son seuil, une action est nécessaire.',
  aucune_donnee: 'Pas de lumière d’état : aucun relevé pour les appareils de ce boîtier.',
}

export const MACHINE_STATE_LABEL: Record<BackendBoitierMachineState, string> = {
  vert: 'Dans les seuils',
  orange: 'À surveiller',
  rouge: 'Action requise',
  arrete: 'Éteint',
  inconnu: 'Pas de relevé',
}

export const COMMAND_RESULT_LABEL: Record<BackendDeviceCommand['status'], string> = {
  executed: 'Éteint',
  failed: 'Échec',
  cancelled: 'Annulée',
  expired: 'Expirée',
  proposed: 'En attente',
  confirmed: 'En cours',
}

export const COMMAND_VIA_LABEL: Record<BackendDeviceCommand['requested_via'], string> = { voice: 'À la voix', site: 'Depuis le site' }
export const LANGUAGE_LABEL: Record<BackendDevice['language'], string> = {
  fr: 'Français',
  en: 'Anglais',
}

export function connectionOf(device: Pick<BackendDevice, 'paired' | 'online'>): Connection {
  if (!device.paired) return 'en_attente'
  return device.online ? 'en_ligne' : 'hors_ligne'
}

export interface BoitierRow {
  device: BackendDevice
  connection: Connection
  /** Lumière actuelle ; absente tant que le boîtier n'est pas connecté. */
  light?: BackendBoitierLight
}

/** Liste du compte : chaque boîtier connecté est complété de sa lumière (une seule lecture de l'état par boîtier). */
export async function fetchBoitierRows(): Promise<BoitierRow[]> {
  const devices = await rawBoitiers()
  return Promise.all(
    devices.map(async (device) => {
      const connection = connectionOf(device)
      if (connection === 'en_attente') return { device, connection }
      try {
        return {
          device,
          connection,
          light: (await rawBoitierState(device.id)).light,
        }
      } catch {
        return { device, connection }
      }
    }),
  )
}

export interface BoitierDetail {
  state: BackendDeviceState
  commands: BackendDeviceCommand[]
  /** Dernier relevé par appareil (code → « 55,0 °C · 1,2 Hz »), lu depuis les machines du compte. */
  readings: Record<string, string>
}

const one = (value: number | null) => (value === null ? '—' : value.toFixed(1).replace('.', ','))

export async function fetchBoitierDetail(id: string): Promise<BoitierDetail> {
  const [state, commands, machines] = await Promise.all([rawBoitierState(id), rawBoitierCommands(id), getCachedMachines().catch(() => [])])
  const readings: Record<string, string> = {}
  for (const machine of machines) readings[machine.machine_id] = `${one(machine.temperature_c)} °C · ${one(machine.vibration_hz)} Hz`
  return { state, commands, readings }
}

/** Fiche d'un boîtier vue par un administrateur : l'état et l'historique, sans les machines du compte du client. */
export async function fetchAdminBoitierDetail(id: string): Promise<BoitierDetail> {
  const [state, commands] = await Promise.all([rawAdminBoitierState(id), rawAdminBoitierCommands(id)])
  return { state, commands, readings: {} }
}

export function lastActivity(device: Pick<BackendAdminDevice, 'last_seen_at'>): string {
  return device.last_seen_at ? formatUtcDateTime(device.last_seen_at).slice(0, 16) : '—'
}
