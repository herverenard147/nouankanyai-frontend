import { describe, expect, it } from 'vitest'

import publishedFlow from '../../public/outils/nouankany-node-red.json?raw'

import { CONVERT_CODE, READ_CODE, RESULT_CODE, SEND_CODE, SETTINGS_CODE, TOKEN_CODE, buildFlow } from '@/lib/nodeRedFlow'

/**
 * Exécute le corps d'un nœud « function » comme Node-RED : `msg`, `flow`, `node` sont fournis, la valeur rendue est
 * le ou les messages de sortie, `node.send` en envoie d'autres.
 */
function harness() {
  const store = new Map<string, unknown>()
  const sent: unknown[] = []
  const warnings: string[] = []
  const errors: string[] = []
  const status: unknown[] = []
  const flow = { get: (k: string) => store.get(k), set: (k: string, v: unknown) => void store.set(k, v) }
  const node = {
    send: (m: unknown) => void sent.push(m),
    status: (s: unknown) => void status.push(s),
    warn: (w: string) => void warnings.push(w),
    error: (e: string) => void errors.push(e),
  }
  const run = (code: string, msg: Record<string, unknown> = {}) =>
    new Function('msg', 'flow', 'node', `"use strict";\n${code}`)(msg, flow, node) as unknown
  return { store, sent, warnings, errors, status, run }
}

/** Les deux registres de 16 bits d'un flottant 32 bits, poids fort d'abord (comme un Eastron). */
function float32Words(value: number): [number, number] {
  const view = new DataView(new ArrayBuffer(4))
  view.setFloat32(0, value)
  return [view.getUint16(0), view.getUint16(2)]
}

const SETTINGS_FOR_TEST = SETTINGS_CODE.replace('https://ADRESSE-DE-LA-PLATEFORME', 'http://plateforme.test')
  .replace('IDENTIFIANT-DE-LA-SOURCE', 'source-1')
  .replace('CLE-DE-LA-SOURCE', 'cle-1')

describe('modèle Node-RED de repli', () => {
  it('une demande Modbus par grandeur, avec la fonction, l’esclave, l’adresse et le nombre de registres', () => {
    const h = harness()
    h.run(SETTINGS_FOR_TEST)
    expect(h.run(READ_CODE, {})).toBeNull()
    expect(h.sent).toHaveLength(5)
    const power = h.sent.find((m) => String((m as { topic: string }).topic).startsWith('0|power_kw|')) as { payload: unknown }
    expect(power.payload).toEqual({ fc: 4, unitid: 1, address: 52, quantity: 2 })
  })

  it('convertit les registres en unités Nouankany, demande un jeton puis envoie les mesures', () => {
    const h = harness()
    h.run(SETTINGS_FOR_TEST)
    h.run(READ_CODE, {})
    const answer: Record<string, number> = { power_kw: 12400, energy_kwh: 5321.5, voltage_v: 231.2, current_a: 18.4, power_factor: -0.86 }
    for (const m of h.sent as { topic: string }[]) {
      const grandeur = m.topic.split('|')[1]
      // Sortie réelle du « Modbus Flex Getter » : msg.payload = registres lus, msg.topic conservé.
      h.run(CONVERT_CODE, { topic: m.topic, payload: float32Words(answer[grandeur]) })
    }
    const out = h.run(SEND_CODE, {}) as [Record<string, unknown> | null, Record<string, unknown> | null]
    expect(out[1]).toBeNull()
    const tokenRequest = out[0]!
    expect(tokenRequest.url).toBe('http://plateforme.test/api/v1/boitier/token')
    expect(tokenRequest.payload).toEqual({ device_id: 'source-1', secret: 'cle-1' })
    const [reading] = tokenRequest.readings as Record<string, number | string>[]
    expect(reading.external_ref).toBe('COMPRESSEUR_1')
    expect(reading.power_kw).toBeCloseTo(12.4, 4)          // W -> kW
    expect(reading.energy_kwh).toBeCloseTo(5321.5, 3)
    expect(reading.power_factor).toBeCloseTo(0.86, 4)      // valeur absolue
    expect(String(reading.recorded_at)).toMatch(/Z$/)      // heure UTC

    const measures = h.run(TOKEN_CODE, { statusCode: 200, payload: { token: 'jeton-1', expires_in: 3600 }, readings: tokenRequest.readings }) as Record<string, unknown>
    expect(measures.url).toBe('http://plateforme.test/api/v1/boitier/measurements')
    expect((measures.headers as Record<string, string>).Authorization).toBe('Bearer jeton-1')

    // Minute suivante : le jeton est encore valable, pas de nouvelle demande.
    h.sent.length = 0
    h.run(READ_CODE, {})
    for (const m of h.sent as { topic: string }[]) h.run(CONVERT_CODE, { topic: m.topic, payload: float32Words(answer[m.topic.split('|')[1]]) })
    const next = h.run(SEND_CODE, {}) as [unknown, Record<string, unknown> | null]
    expect(next[0]).toBeNull()
    expect((next[1]!.headers as Record<string, string>).Authorization).toBe('Bearer jeton-1')
  })

  it('types entiers, registres inversés, et rien n’est envoyé sans puissance', () => {
    const h = harness()
    h.run(SETTINGS_FOR_TEST.replace("data_type: 'float32'", "data_type: 'int32'"))
    h.store.set('lectures', {})
    h.run(CONVERT_CODE, { topic: '0|power_kw|2026-10-16T08:00:00.000Z', payload: [0x0000, 0x3070] })   // 12400 W en entier 32 bits
    h.run(CONVERT_CODE, { topic: '0|energy_kwh|2026-10-16T08:00:00.000Z', payload: [0xffff, 0xfffe] }) // -2 (entier signé)
    expect((h.store.get('lectures') as Record<string, Record<string, number>>)['0']).toMatchObject({ power_kw: 12.4, energy_kwh: -2 })

    const swapped = harness()
    swapped.run(SETTINGS_FOR_TEST.replace("data_type: 'float32'", "data_type: 'float32_swapped'"))
    const [hi, lo] = float32Words(5000)
    swapped.run(CONVERT_CODE, { topic: '0|power_kw|t', payload: [lo, hi] })
    expect((swapped.store.get('lectures') as Record<string, Record<string, number>>)['0'].power_kw).toBeCloseTo(5, 6)

    const empty = harness()
    empty.run(SETTINGS_FOR_TEST)
    empty.store.set('lectures', { 0: { recorded_at: 't', voltage_v: 230 } })
    expect(empty.run(SEND_CODE, {})).toBeNull()
  })

  it('jeton refusé : erreur claire ; 401 à l’envoi : jeton oublié pour en redemander un ; refus détaillés', () => {
    const h = harness()
    h.run(SETTINGS_FOR_TEST)
    expect(h.run(TOKEN_CODE, { statusCode: 401, payload: { detail: 'Boîtier inconnu ou secret invalide' } })).toBeNull()
    expect(h.errors[0]).toMatch(/Boîtier inconnu ou secret invalide/)
    h.store.set('jeton', { valeur: 'x', expire: Date.now() + 999999 })
    h.run(RESULT_CODE, { statusCode: 401, payload: { detail: 'Jeton invalide ou expiré' } })
    expect(h.store.get('jeton')).toBeNull()
    h.run(RESULT_CODE, { statusCode: 200, payload: { accepted: 0, rejected: [{ index: 0, reason: 'unité attendue kW (des W ?)' }] } })
    expect(h.warnings).toEqual(['Mesure refusée : unité attendue kW (des W ?)'])
  })

  // Après un changement de src/lib/nodeRedFlow.ts : GENERER_NODE_RED=1 npx vitest run src/test/nodeRedFlow.test.ts
  it('le fichier importable est à jour et chaque nœud est relié à un nœud existant', async () => {
    const expected = `${JSON.stringify(buildFlow(), null, 2)}\n`
    const env = (globalThis as { process?: { env: Record<string, string | undefined> } }).process?.env ?? {}
    if (env.GENERER_NODE_RED === '1') {
      const fs = (await import(/* @vite-ignore */ `node:${'fs'}`)) as { writeFileSync: (path: string, data: string) => void }
      fs.writeFileSync('public/outils/nouankany-node-red.json', expected)
      return
    }
    expect(publishedFlow).toBe(expected)
    const flow = buildFlow()
    const ids = new Set(flow.map((n) => n.id))
    for (const n of flow) for (const out of (n.wires as string[][] | undefined) ?? []) for (const target of out) expect(ids.has(target), `${n.id} -> ${target}`).toBe(true)
    expect(flow.find((n) => n.type === 'modbus-flex-getter')?.keepMsgProperties).toBe(true)
  })
})
