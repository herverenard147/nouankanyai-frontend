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
  greater_than_equal: 'valeur trop petite',
  less_than_equal: 'valeur trop grande',
  enum: 'valeur non autorisée',
}

/** Message lisible : texte du serveur tel quel, ou erreurs de validation FastAPI (422) traduites
 * champ par champ, jamais le JSON brut (Volet 2, partie E). */
function readableMessage(message: unknown): string {
  if (typeof message === 'string') return message
  if (Array.isArray(message)) {
    return message
      .map((item: { type?: string; loc?: unknown[]; msg?: string }) => {
        const field = [...(item.loc ?? [])].reverse().find((part) => typeof part === 'string' && part !== 'body')
        const text = (item.type && VALIDATION_MESSAGES[item.type]) ?? 'valeur invalide'
        return field ? `${String(field)} : ${text}.` : `${text[0].toUpperCase()}${text.slice(1)}.`
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
  /** Corps déjà prêt à l'envoi (ex: FormData pour un upload) — n'est pas JSON.stringify. */
  rawBody?: FormData
  auth?: boolean
}

/**
 * Client HTTP vers le backend FastAPI réel. Deux quirks du backend à gérer ici,
 * pas au niveau de chaque appelant :
 * - certaines routes renvoient un 200 OK avec `{"error": "..."}` au lieu d'un
 *   vrai statut HTTP d'erreur (ex: /api/machines/{id}/simulate sur une machine
 *   introuvable) — on les traite comme des échecs ici ;
 * - les erreurs FastAPI standard arrivent en `{"detail": "..."}`.
 */
async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
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
    // /api/v1/ml/*, StandardErrorResponse — voir app/api/handlers.py).
    const message = data?.detail ?? data?.error?.message ?? data?.error ?? `Erreur ${response.status}`

    // Token expiré/révoqué : sans ça, l'utilisateur reste sur les pages
    // protégées avec un état d'erreur par widget au lieu d'être renvoyé vers
    // /login pour se reconnecter (ProtectedRoute redirige dès que le store
    // repasse à session=null, pas besoin de navigation explicite ici).
    if (response.status === 401 && auth) {
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
