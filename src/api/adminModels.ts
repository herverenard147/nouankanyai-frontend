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
  const v2 = adminMetrics.model_metrics.xgboost_v2 ?? {}
  const gain = v2.gain_vs_moyenne_machine
  return {
    id: 'xgboost',
    title: 'XGBoost · prédiction',
    meta: model?.trained_at ? `entraîné le ${model.trained_at}` : 'entraînement inconnu',
    badge: `jeu de données : ${datasetLabel(xgb.dataset)}`,
    rows: [
      { label: 'R²', value: xgb.r2 !== null ? xgb.r2.toFixed(3).replace('.', ',') : (model?.metrics.r2?.toFixed(3) ?? '—') },
      { label: 'MAE', value: xgb.mae_kw !== null ? `${formatNumberFr(xgb.mae_kw, 1)} kW` : '—' },
      { label: 'MAPE', value: xgb.mape_pct !== null ? `${formatNumberFr(xgb.mape_pct, 1)} %` : '—' },
      {
        label: 'v2 : gain sur la moyenne de chaque machine',
        value: gain != null ? `${formatNumberFr(gain * 100, 1)} % (MAE ${formatNumberFr(v2.mae_kw ?? 0, 1)} kW contre ${formatNumberFr(v2.mae_moyenne_machine_kw ?? 0, 1)} kW)` : '—',
      },
      { label: 'v2 : R² (trompeur seul, dominé par la taille des machines)', value: v2.r2 != null ? v2.r2.toFixed(3).replace('.', ',') : '—' },
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
      { label: 'Alertes plateforme actives', value: String(adminMetrics.ml_health.isolation_forest_anomalies_detected) },
      { label: 'Second avis dans les conseils', value: 'retiré (quality gate jamais atteint)' },
      { label: 'F1-score (R&D v2, non déployé)', value: model?.metrics.f1_score !== undefined ? `${model.metrics.f1_score.toFixed(2)} (recherche)` : '—' },
      { label: 'Statut modèle', value: model?.status ?? '—' },
    ],
  }
}

async function geminiPanel(): Promise<AdminPanel> {
  const gemini = await rawGeminiMetrics()
  const all = Object.values(gemini.endpoints)
  const sum = (key: 'real_calls_total' | 'cache_hits' | 'http_429_count') => all.reduce((total, e) => total + e[key], 0)
  return {
    id: 'gemini',
    title: 'Gemini · observabilité',
    meta: `modèle ${gemini.gemini_model}`,
    badge: gemini.ai_mode === 'mock' ? 'mode mock : activé' : 'mode mock : désactivé',
    rows: [
      { label: 'Appels réels (vision)', value: String(sum('real_calls_total')) },
      { label: 'Cache hits', value: String(sum('cache_hits')) },
      { label: 'Saturations (429)', value: String(sum('http_429_count')) },
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
