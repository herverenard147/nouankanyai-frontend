import { useSessionStore } from '@/store/sessionStore'

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8001').replace(/\/$/, '')

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

    throw new ApiError(typeof message === 'string' ? message : JSON.stringify(message), response.status)
  }

  if (data && typeof data === 'object' && 'error' in data && typeof data.error === 'string') {
    throw new ApiError(data.error, 200)
  }

  return data as T
}

export const api = {
  get: <T>(path: string, auth = true) => request<T>(path, { method: 'GET', auth }),
  post: <T>(path: string, body?: unknown, auth = true) => request<T>(path, { method: 'POST', body, auth }),
  put: <T>(path: string, body?: unknown, auth = true) => request<T>(path, { method: 'PUT', body, auth }),
  patch: <T>(path: string, body?: unknown, auth = true) => request<T>(path, { method: 'PATCH', body, auth }),
  delete: <T>(path: string, auth = true) => request<T>(path, { method: 'DELETE', auth }),
  postForm: <T>(path: string, form: FormData, auth = true) => request<T>(path, { method: 'POST', rawBody: form, auth }),
}
