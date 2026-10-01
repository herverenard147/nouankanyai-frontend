import { getCachedAdminMetrics, getCachedMlModels, rawGeminiMetrics, rawMlReload } from '@/api/rawBackend'
import { formatNumberFr } from '@/lib/formatters'
import type { AdminPanel } from '@/types/domain'

/** Le backend nomme le jeu de données en anglais ("synthetic") ; l'interface est en français. */
function datasetLabel(dataset: string | null): string {
  return !dataset || dataset.toLowerCase() === 'synthetic' ? 'synthétique' : dataset
}

export function adminPanelIds(): string[] {
  return ['xgboost', 'isolation-forest', 'gemini']
}

async function xgboostPanel(): Promise<AdminPanel> {
  const [models, adminMetrics] = await Promise.all([getCachedMlModels(), getCachedAdminMetrics()])
  const model = models.find((m) => m.model_type === 'XGBoost')
  const xgb = adminMetrics.model_metrics.xgboost
  return {
    id: 'xgboost',
    title: 'XGBoost · prédiction',
    meta: model?.trained_at ? `entraîné le ${model.trained_at}` : 'entraînement inconnu',
    badge: `jeu de données : ${datasetLabel(xgb.dataset)}`,
    rows: [
      { label: 'R²', value: xgb.r2 !== null ? formatNumberFr(xgb.r2, 1) : (model?.metrics.r2?.toFixed(3) ?? '—') },
      { label: 'MAE', value: xgb.mae_kw !== null ? `${formatNumberFr(xgb.mae_kw, 1)} kW` : '—' },
      { label: 'MAPE', value: xgb.mape_pct !== null ? `${formatNumberFr(xgb.mape_pct, 1)} %` : '—' },
      { label: 'Statut modèle', value: model?.status ?? '—' },
    ],
  }
}

async function isolationForestPanel(): Promise<AdminPanel> {
  const [models, adminMetrics] = await Promise.all([getCachedMlModels(), getCachedAdminMetrics()])
  const model = models.find((m) => m.model_type === 'IsolationForest')
  return {
    id: 'isolation-forest',
    title: 'Isolation Forest · anomalies',
    meta: model?.trained_at ? `entraîné le ${model.trained_at}` : 'entraînement inconnu',
    badge: 'jeu de données : synthétique',
    rows: [
      { label: 'Anomalies détectées', value: String(adminMetrics.ml_health.isolation_forest_anomalies_detected) },
      { label: 'F1-score', value: model?.metrics.f1_score !== undefined ? model.metrics.f1_score.toFixed(3) : '—' },
      { label: 'Statut modèle', value: model?.status ?? '—' },
      { label: 'Dérive du modèle', value: adminMetrics.ml_health.model_drift_status },
    ],
  }
}

async function geminiPanel(): Promise<AdminPanel> {
  const gemini = await rawGeminiMetrics()
  const chat = gemini.endpoints.chat
  return {
    id: 'gemini',
    title: 'Gemini · observabilité',
    meta: `modèle ${gemini.gemini_model}`,
    badge: gemini.ai_mode === 'mock' ? 'mode mock : activé' : 'mode mock : désactivé',
    rows: [
      { label: 'Appels réels (chat)', value: String(chat.real_calls_total) },
      { label: 'Cache hits', value: String(chat.cache_hits) },
      { label: 'Saturations (429)', value: String(chat.http_429_count) },
      { label: 'Limite locale', value: `${gemini.rate_limit_per_minute} / min` },
    ],
  }
}

export async function fetchAdminPanel(panelId: string): Promise<AdminPanel> {
  switch (panelId) {
    case 'xgboost':
      return xgboostPanel()
    case 'isolation-forest':
      return isolationForestPanel()
    case 'gemini':
      return geminiPanel()
    default:
      throw new Error(`Panneau admin inconnu : ${panelId}`)
  }
}

export const reloadModels = rawMlReload
