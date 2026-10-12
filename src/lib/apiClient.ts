import { useSessionStore } from '@/store/sessionStore'

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8001').replace(/\/$/, '')

const VALIDATION_MESSAGES: Record<string, string> = {
  missing: 'champ obligatoire',
  float_type: 'doit être un nombre',
  float_parsing: 'doit être un nombre',
  int_type: 'doit être un nombre entier',
  int_parsing: 'doit être un nombre entier',
  string_type: 'doit être un texte',
  string_too_short: 'trop court',
  string_too_long: 'trop long',
  bool_type: 'doit être oui ou non',
  greater_than: 'valeur trop petite',
  greater_than_equal: 'valeur trop petite',
  less_than: 'valeur trop grande',
  less_than_equal: 'valeur trop grande',
  enum: 'valeur non autorisée',
  string_pattern_mismatch: 'format non reconnu',
}

// Noms des champs du serveur, dits comme dans les formulaires : jamais « power_kw » à l'écran.
const FIELD_LABELS: Record<string, string> = {
  nom: 'Nom', email: 'Adresse email', message: 'Message', telephone: 'Téléphone', password: 'Mot de passe',
  entreprise: 'Entreprise', contact_nom: 'Nom du contact', contact: 'Contact', notes: 'Précisions',
  title: 'Titre', description: 'Détail', gain_estime_fcfa: 'Gain estimé', month: 'Mois',
  amount_xof: 'Montant', actual_amount_xof: 'Montant réel', kwh_consumed: 'Consommation',
  power_kw: 'Puissance', localisation: 'Localisation', quantity: 'Quantité',
  temperature_max_c: 'Température max', vibration_max_hz: 'Vibration max', surconsommation_ratio: 'Ratio de surconsommation',
}

interface ValidationItem {
  type?: string
  loc?: unknown[]
  msg?: string
  ctx?: Record<string, unknown>
}

/** Une erreur de validation, dite avec sa limite quand le serveur la donne (« 5 000 caractères au plus »). */
function validationText(item: ValidationItem): string {
  const limit = (key: string) => (typeof item.ctx?.[key] === 'number' ? (item.ctx[key] as number).toLocaleString('fr-FR') : null)
  // Règle écrite côté serveur, déjà en français : « Value error, Adresse email invalide ».
  if (item.type === 'value_error' && item.msg) return item.msg.replace(/^Value error,\s*/, '').replace(/\.$/, '')
  if (item.type === 'string_too_long' && limit('max_length')) return `${limit('max_length')} caractères au plus`
  if (item.type === 'string_too_short' && limit('min_length')) return `${limit('min_length')} caractère${item.ctx?.min_length === 1 ? '' : 's'} au moins`
  if (item.type === 'greater_than' && limit('gt')) return `doit être supérieur à ${limit('gt')}`
  if (item.type === 'greater_than_equal' && limit('ge')) return `doit être au moins ${limit('ge')}`
  if (item.type === 'less_than' && limit('lt')) return `doit être inférieur à ${limit('lt')}`
  if (item.type === 'less_than_equal' && limit('le')) return `doit être au plus ${limit('le')}`
  return (item.type && VALIDATION_MESSAGES[item.type]) ?? 'valeur invalide'
}

/** Message lisible : texte du serveur tel quel, ou erreurs de validation FastAPI (422) traduites
 * champ par champ, jamais le JSON brut (Volet 2, partie E). */
export function readableMessage(message: unknown): string {
  if (typeof message === 'string') return message
  if (Array.isArray(message)) {
    return message
      .map((item: ValidationItem) => {
        const field = [...(item.loc ?? [])].reverse().find((part) => typeof part === 'string' && part !== 'body')
        const text = validationText(item)
        const label = field ? (FIELD_LABELS[String(field)] ?? String(field)) : null
        return label ? `${label} : ${text}.` : `${text[0].toUpperCase()}${text.slice(1)}.`
      })
      .join(' ')
  }
  return 'Erreur inattendue du serveur.'
}

export class ApiError extends Error {
  status: number
  constructor(message: string, status: number) {
    super(message)
    this.status = status
  }
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  body?: unknown
  /** Corps déjà prêt à l'envoi (ex: FormData pour un upload) : n'est pas JSON.stringify. */
  rawBody?: FormData
  auth?: boolean
}

/**
 * Client HTTP vers le backend FastAPI réel. Deux quirks du backend à gérer ici,
 * pas au niveau de chaque appelant :
 * - certaines routes renvoient un 200 OK avec `{"error": "..."}` au lieu d'un
 *   vrai statut HTTP d'erreur (ex: /api/machines/{id}/simulate sur une machine
 *   introuvable) : on les traite comme des échecs ici ;
 * - les erreurs FastAPI standard arrivent en `{"detail": "..."}`.
 */
let refreshing: Promise<boolean> | null = null

/** Échange le jeton de renouvellement contre une nouvelle paire, une seule fois même si plusieurs
 * requêtes reçoivent un 401 en même temps (Volet 5). Renvoie false si la session est fermée. */
function refreshSession(): Promise<boolean> {
  const refreshToken = useSessionStore.getState().session?.refreshToken
  if (!refreshToken) return Promise.resolve(false)
  refreshing ??= (async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: refreshToken }),
      })
      if (!response.ok) return false
      const data = (await response.json()) as { token: string; refresh_token?: string }
      useSessionStore.getState().setTokens(data.token, data.refresh_token)
      return true
    } catch {
      return false
    } finally {
      refreshing = null
    }
  })()
  return refreshing
}

async function request<T>(path: string, options: RequestOptions = {}, retried = false): Promise<T> {
  const { method = 'GET', body, rawBody, auth = true } = options
  const headers: Record<string, string> = {}

  if (auth) {
    const token = useSessionStore.getState().session?.token
    if (token) headers.Authorization = `Bearer ${token}`
  }

  let requestBody: BodyInit | undefined
  if (rawBody) {
    requestBody = rawBody
  } else if (body !== undefined) {
    headers['Content-Type'] = 'application/json'
    requestBody = JSON.stringify(body)
  }

  let response: Response
  try {
    response = await fetch(`${API_BASE_URL}${path}`, { method, headers, body: requestBody })
  } catch {
    throw new ApiError('Impossible de joindre le serveur. Vérifiez votre connexion.', 0)
  }

  const contentType = response.headers.get('content-type') ?? ''
  const data = contentType.includes('application/json') ? await response.json().catch(() => null) : null

  if (!response.ok) {
    // Deux formats d'erreur coexistent : `{"detail": "..."}` (routes legacy,
    // HTTPException standard) et `{"error": {"code","message",...}}` (routes
    // /api/v1/ml/*, StandardErrorResponse : voir app/api/handlers.py).
    const message = data?.detail ?? data?.error?.message ?? data?.error ?? `Erreur ${response.status}`

    // Token expiré/révoqué : sans ça, l'utilisateur reste sur les pages
    // protégées avec un état d'erreur par widget au lieu d'être renvoyé vers
    // /login pour se reconnecter (ProtectedRoute redirige dès que le store
    // repasse à session=null, pas besoin de navigation explicite ici).
    if (response.status === 401 && auth) {
      // Jeton d'accès expiré (30 min) : un renouvellement silencieux, puis la même requête.
      if (!retried && (await refreshSession())) return request<T>(path, options, true)
      useSessionStore.getState().logout()
    }

    throw new ApiError(readableMessage(message), response.status)
  }

  if (data && typeof data === 'object' && 'error' in data && typeof data.error === 'string') {
    throw new ApiError(data.error, 200)
  }

  return data as T
}

/**
 * Téléchargement d'un fichier (CSV, PDF, Word…) : même base d'URL, même jeton et même
 * gestion des erreurs que les appels JSON, mais renvoie le Blob et le nom de fichier
 * proposé par le serveur (en-tête Content-Disposition).
 */
async function requestBlob(path: string, method: 'GET' | 'POST', body?: unknown): Promise<{ blob: Blob; filename: string | null }> {
  const headers: Record<string, string> = {}
  const token = useSessionStore.getState().session?.token
  if (token) headers.Authorization = `Bearer ${token}`
  let requestBody: BodyInit | undefined
  if (body !== undefined) {
    headers['Content-Type'] = 'application/json'
    requestBody = JSON.stringify(body)
  }

  let response: Response
  try {
    response = await fetch(`${API_BASE_URL}${path}`, { method, headers, body: requestBody })
  } catch {
    throw new ApiError('Impossible de joindre le serveur. Vérifiez votre connexion.', 0)
  }
  if (!response.ok) {
    const data = await response.json().catch(() => null)
    if (response.status === 401) useSessionStore.getState().logout()
    const message = data?.detail ?? data?.error?.message ?? `Erreur ${response.status}`
    throw new ApiError(readableMessage(message), response.status)
  }
  const disposition = response.headers.get('content-disposition') ?? ''
  const match = /filename="?([^";]+)"?/i.exec(disposition)
  return { blob: await response.blob(), filename: match ? match[1] : null }
}

/** Propose le fichier à l'utilisateur (lien de téléchargement temporaire). */
export function saveBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

export const api = {
  get: <T>(path: string, auth = true) => request<T>(path, { method: 'GET', auth }),
  post: <T>(path: string, body?: unknown, auth = true) => request<T>(path, { method: 'POST', body, auth }),
  put: <T>(path: string, body?: unknown, auth = true) => request<T>(path, { method: 'PUT', body, auth }),
  patch: <T>(path: string, body?: unknown, auth = true) => request<T>(path, { method: 'PATCH', body, auth }),
  delete: <T>(path: string, auth = true) => request<T>(path, { method: 'DELETE', auth }),
  postForm: <T>(path: string, form: FormData, auth = true) => request<T>(path, { method: 'POST', rawBody: form, auth }),
  getBlob: (path: string) => requestBlob(path, 'GET'),
  postBlob: (path: string, body?: unknown) => requestBlob(path, 'POST', body),
}
