import { useEffect, useRef, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'

import {
  rawAddMachine,
  rawAnalyzeMachineMedia,
  rawDeleteMachine,
  rawExtractMachinePhoto,
  rawResetMachine,
  rawSimulateMachine,
  rawTestMachine,
  rawUpdateMachine,
} from '@/api/rawBackend'
import { useThresholds } from '@/hooks/queries/useThresholds'
import type { BackendMachineTestResult, BackendMachineUpdatePayload, BackendNewMachinePayload } from '@/types/backend'

/**
 * Équipements (PME) et machines (Industrie) sont la même ressource backend
 * (`/api/machines`, voir equipment.ts/machinesTable.ts) — on invalide les deux
 * query keys après toute mutation, peu importe la page d'où elle vient. Les
 * alertes (alerts-action/alerts-auto) et l'historique en dérivent aussi (voir
 * api/alerts.ts) : une résolution de machine doit les rafraîchir également,
 * sinon l'alerte résolue reste affichée jusqu'au prochain remount.
 */
function invalidateMachineQueries(queryClient: ReturnType<typeof useQueryClient>) {
  // ['machines'] est le cache partagé sous-jacent (voir getCachedMachines dans rawBackend.ts) :
  // sans l'invalider, equipment/machines-table/machines-raw/kpi-set rejoueraient une donnée
  // périmée (staleTime global) malgré leur propre invalidation ci-dessous.
  queryClient.invalidateQueries({ queryKey: ['machines'] })
  queryClient.invalidateQueries({ queryKey: ['equipment'] })
  queryClient.invalidateQueries({ queryKey: ['machines-table'] })
  queryClient.invalidateQueries({ queryKey: ['machines-raw'] })
  queryClient.invalidateQueries({ queryKey: ['kpi-set'] })
  queryClient.invalidateQueries({ queryKey: ['alerts-action'] })
  queryClient.invalidateQueries({ queryKey: ['alerts-auto'] })
  queryClient.invalidateQueries({ queryKey: ['alerts-history'] })
  queryClient.invalidateQueries({ queryKey: ['anomalies-open'] })
}

/** Reconnaissance de l'appareil à partir d'une photo (pré-remplissage du formulaire
 * d'ajout) — ne touche jamais la liste des machines, pas d'invalidation de cache. */
/** Analyse d'une photo ou d'une vidéo de la machine (POST /api/machines/{id}/analyze-media) :
 * une menace détectée passe la machine en alerte, d'où l'invalidation. */
export function useAnalyzeMachineMedia() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ machineId, file }: { machineId: string; file: File }) => rawAnalyzeMachineMedia(machineId, file),
    onSuccess: () => invalidateMachineQueries(queryClient),
  })
}

/** Remise en état normal par le client (POST /api/machines/{id}/reset). */
export function useResetMachine() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (machineId: string) => rawResetMachine(machineId),
    onSuccess: () => invalidateMachineQueries(queryClient),
  })
}

/** Outil de démonstration (POST /api/machines/{id}/simulate) : comptes d'essai et de démo seulement. */
export function useSimulateMachine() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (machineId: string) => rawSimulateMachine(machineId),
    onSuccess: () => invalidateMachineQueries(queryClient),
  })
}

export function useExtractMachinePhoto() {
  return useMutation({
    mutationFn: (file: File) => rawExtractMachinePhoto(file),
  })
}

export function useAddMachine() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: BackendNewMachinePayload) => rawAddMachine(payload),
    onSuccess: () => invalidateMachineQueries(queryClient),
  })
}

export function useUpdateMachine() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ machineId, payload }: { machineId: string; payload: BackendMachineUpdatePayload }) =>
      rawUpdateMachine(machineId, payload),
    onSuccess: () => invalidateMachineQueries(queryClient),
  })
}

export function useDeleteMachine() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (machineId: string) => rawDeleteMachine(machineId),
    onSuccess: () => invalidateMachineQueries(queryClient),
  })
}

/**
 * Reprend une lecture capteur fraîche sur la machine et relance l'analyse
 * côté backend (mêmes seuils que ceux qui ont généré l'alerte) — ne marque
 * résolu que si cette nouvelle lecture est effectivement normale. Le
 * résultat (`resolved`) doit être lu par l'appelant : un `isSuccess` de la
 * mutation ne veut PAS dire que l'alerte est levée, seulement que le test a
 * bien été effectué (il peut conclure que le problème persiste encore).
 */
export function useResolveMachine() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (machineId: string) => rawTestMachine(machineId),
    onSuccess: () => invalidateMachineQueries(queryClient),
  })
}

const MAX_AUTO_ATTEMPTS = 5
const RETRY_DELAY_MS = 2000
const AUTO_RESOLVE_STORAGE_PREFIX = 'nouankany-auto-resolve:'

export type AutoResolveStatus = 'idle' | 'retrying' | 'resolved' | 'needs_human' | 'error'

interface StoredAutoResolveLoop {
  attempt: number
  startedAt: number
}

function autoResolveStorageKey(machineId: string) {
  return `${AUTO_RESOLVE_STORAGE_PREFIX}${machineId}`
}

function readStoredAutoResolveLoop(machineId: string): StoredAutoResolveLoop | null {
  try {
    const raw = localStorage.getItem(autoResolveStorageKey(machineId))
    return raw ? (JSON.parse(raw) as StoredAutoResolveLoop) : null
  } catch {
    return null
  }
}

function writeStoredAutoResolveLoop(machineId: string, loop: StoredAutoResolveLoop) {
  try {
    localStorage.setItem(autoResolveStorageKey(machineId), JSON.stringify(loop))
  } catch {
    // Navigation privée / quota dépassé : la reprise après interruption est une
    // commodité, pas une garantie — la boucle continue simplement sans persister.
  }
}

function clearStoredAutoResolveLoop(machineId: string) {
  try {
    localStorage.removeItem(autoResolveStorageKey(machineId))
  } catch {
    // voir writeStoredAutoResolveLoop
  }
}

/**
 * Relance automatique de « Vérifier et résoudre » (POST /api/machines/{id}/test)
 * jusqu'à résolution — sauf pour une alerte critique (jamais de boucle, une
 * intervention humaine est supposée immédiate) ou si l'utilisateur n'a pas
 * activé l'automatisation (panneau « Automatisation IA », Réglages) : dans ces
 * deux cas, `trigger()` ne fait qu'un seul essai, comportement identique à
 * l'ancien `useResolveMachine`. Plafonné à `MAX_AUTO_ATTEMPTS` essais espacés de
 * `RETRY_DELAY_MS` ; au-delà sans résolution, `needs_human` — jamais présenté
 * comme résolu si ça ne l'est pas.
 *
 * Reprise après interruption : l'état de la boucle (machine, essai en cours) est
 * persisté en localStorage à chaque tentative et repris automatiquement au
 * montage si l'automatisation est toujours active pour cette machine — un
 * onglet fermé ou une page rechargée en plein cycle ne doit jamais obliger
 * l'utilisateur à recliquer depuis zéro.
 */
export function useAutoResolveMachine(machineId: string, severity: 'critique' | 'modérée' | 'faible') {
  const queryClient = useQueryClient()
  const thresholdsQuery = useThresholds()
  const autoEnabled = Boolean(thresholdsQuery.data?.auto_resolve_enabled) && severity !== 'critique'

  const [status, setStatus] = useState<AutoResolveStatus>('idle')
  const [attempt, setAttempt] = useState(0)
  const [lastResult, setLastResult] = useState<BackendMachineTestResult | null>(null)
  const [error, setError] = useState<unknown>(null)
  const cancelledRef = useRef(false)

  async function runLoop(startAttempt: number) {
    cancelledRef.current = false
    let current = startAttempt
    while (true) {
      current += 1
      setAttempt(current)
      setStatus('retrying')
      if (autoEnabled) writeStoredAutoResolveLoop(machineId, { attempt: current, startedAt: Date.now() })

      let result: BackendMachineTestResult
      try {
        result = await rawTestMachine(machineId)
      } catch (e) {
        if (cancelledRef.current) return
        setError(e)
        setStatus('error')
        clearStoredAutoResolveLoop(machineId)
        return
      }
      if (cancelledRef.current) return

      setLastResult(result)
      invalidateMachineQueries(queryClient)

      if (result.resolved) {
        setStatus('resolved')
        clearStoredAutoResolveLoop(machineId)
        return
      }
      if (!autoEnabled || current >= MAX_AUTO_ATTEMPTS) {
        setStatus(autoEnabled ? 'needs_human' : 'idle')
        clearStoredAutoResolveLoop(machineId)
        return
      }
      await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS))
      if (cancelledRef.current) return
    }
  }

  function trigger() {
    setError(null)
    void runLoop(0)
  }

  useEffect(() => {
    if (autoEnabled) {
      const stored = readStoredAutoResolveLoop(machineId)
      if (stored && stored.attempt < MAX_AUTO_ATTEMPTS) {
        void runLoop(stored.attempt)
      } else if (stored) {
        clearStoredAutoResolveLoop(machineId)
      }
    }
    return () => {
      cancelledRef.current = true
    }
    // La reprise ne doit se déclencher qu'au changement de machine/d'éligibilité,
    // jamais à chaque re-render de runLoop (recréée à chaque rendu).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [machineId, autoEnabled])

  return { status, attempt, maxAttempts: MAX_AUTO_ATTEMPTS, lastResult, error, trigger, autoEnabled }
}
