import type { BackendBillVerification } from '@/types/backend'

export type Check = { label: string; ok: boolean }

/** Résultat du contrôle fait à l'envoi : ce qui est déjà vérifié, et ce qu'il reste à comparer sur la photo. */
export function verificationChecks(v: BackendBillVerification): Check[] {
  const out: Check[] = []
  if (v.document === 'facture_cie') out.push({ label: 'Facture CIE reconnue', ok: true })
  else if (v.document === 'inconnu') out.push({ label: 'En-tête CIE non retrouvé : vérifiez le document', ok: false })
  if (v.numero === 'ok') out.push({ label: 'Numéro de compteur du compte retrouvé', ok: true })
  else if (v.numero === 'a_verifier') out.push({ label: `Numéro de compteur à vérifier sur la photo${v.numero_lu ? ` (lu : ${v.numero_lu}, à confirmer)` : ''}`, ok: false })
  else if (v.numero === 'sans_numero_compte') out.push({ label: 'Compte sans numéro de compteur : recopiez-le de la photo', ok: false })
  if (v.chiffres === 'ok') out.push({ label: 'Mois, montant et kWh conformes à la photo', ok: true })
  else if (v.chiffres === 'lus_sur_photo') out.push({ label: 'Chiffres lus sur la photo', ok: true })
  else out.push({ label: 'Chiffres non lus automatiquement : comparez-les', ok: false })
  return out
}
