/**
 * Comptes de démonstration réels (créés via /api/auth/signup sur le backend),
 * affichés dans l'encart de connexion en développement seulement. Purement
 * informatif : l'authentification réelle passe par le backend, pas par cette liste.
 * Jamais de compte administrateur ici (constat C6 de l'audit du 2026-10-10).
 */
export const DEMO_ACCOUNTS = [
  { email: 'aicha@menage.demo', password: 'demo1234' },
  { email: 'contact@boulangerie-awale.demo', password: 'demo1234' },
  { email: 'exploitation@yopougon-l2.demo', password: 'demo1234' },
]
