/**
 * Modèle Node-RED de repli (étape 7, 2026-10-16) : pour le client qui refuse la passerelle Nouankany mais a des
 * compteurs Modbus sur son réseau. Le flux lit les compteurs chaque minute, convertit dans nos unités, prend un jeton
 * avec l'identifiant et la clé d'une source « Logiciel du client », et envoie les mesures (même contrat que le logiciel).
 *
 * Les corps des nœuds « function » sont écrits ici en texte (c'est ce que Node-RED exécute) et testés tels quels
 * (src/test/nodeRedFlow.test.ts). Le fichier importable `public/outils/nouankany-node-red.json` est construit par
 * `buildFlow()` ; un test vérifie qu'il est à jour.
 *
 * Module Modbus requis : node-red-contrib-modbus (vérifié sur la version 5.60.2 : le nœud « Modbus Flex Getter » prend
 * `msg.payload = {fc, unitid, address, quantity}` et rend les registres de 16 bits dans `msg.payload` ; il ne garde
 * les propriétés du message d'origine que si « keepMsgProperties » est coché, et garde toujours `msg.topic`).
 */

/** Nœud « Réglages » : seul endroit à remplir sur place. Même vocabulaire que la plateforme (« Autre compteur »). */
export const SETTINGS_CODE = `// === À REMPLIR SUR PLACE (voir la documentation du technicien, « Repli : modèle Node-RED ») ===
const reglages = {
    // Adresse de la plateforme Nouankany, sans « / » final
    plateforme: 'https://ADRESSE-DE-LA-PLATEFORME',
    // Source « Logiciel du client » créée sur la plateforme : identifiant et clé (affichés une seule fois)
    identifiant: 'IDENTIFIANT-DE-LA-SOURCE',
    cle: 'CLE-DE-LA-SOURCE',
    // Un bloc par compteur. Appareil : machine_code (code Nouankany) OU external_ref (nom relié sur la plateforme).
    // function : 4 (registres d'entrée, adresses 3xxxx) ou 3 (registres de maintien, 4xxxx).
    // data_type : float32, float32_swapped, int32, uint32, int16, uint16.
    // address : comptée depuis 0 (notice 30053 -> 52). scale : ramène à notre unité (W -> kW : 0.001).
    compteurs: [
        {
            external_ref: 'COMPRESSEUR_1',
            unitid: 1,
            function: 4,
            data_type: 'float32',
            registers: {
                power_kw: { address: 52, scale: 0.001 },
                energy_kwh: { address: 72, scale: 1 },
                voltage_v: { address: 0, scale: 1 },
                current_a: { address: 6, scale: 1 },
                power_factor: { address: 62, scale: 1, abs: true }
            }
        }
    ]
};
flow.set('reglages', reglages);
flow.set('lectures', {});
node.status({ fill: 'green', shape: 'dot', text: reglages.compteurs.length + ' compteur(s) réglé(s)' });
return null;`

/** Nœud « Demandes de lecture » : une demande Modbus par grandeur de chaque compteur. */
export const READ_CODE = `const reglages = flow.get('reglages');
if (!reglages) { node.status({ fill: 'red', shape: 'ring', text: 'réglages absents' }); return null; }
const tick = new Date().toISOString();
const deuxRegistres = ['float32', 'float32_swapped', 'int32', 'uint32'];
reglages.compteurs.forEach(function (compteur, i) {
    Object.keys(compteur.registers).forEach(function (grandeur) {
        const reg = compteur.registers[grandeur];
        node.send({
            topic: i + '|' + grandeur + '|' + tick,
            payload: {
                fc: compteur.function,
                unitid: compteur.unitid,
                address: reg.address,
                quantity: deuxRegistres.indexOf(compteur.data_type) >= 0 ? 2 : 1
            }
        });
    });
});
return null;`

/** Nœud « Convertir en unités Nouankany » : registres lus -> valeur dans notre unité, gardée jusqu'à l'envoi. */
export const CONVERT_CODE = `const reglages = flow.get('reglages');
const morceaux = String(msg.topic || '').split('|');
const compteur = reglages && reglages.compteurs[Number(morceaux[0])];
const grandeur = morceaux[1];
const tick = morceaux[2];
const mots = Array.isArray(msg.payload) ? msg.payload : [];
if (!compteur || !compteur.registers[grandeur] || mots.length === 0) return null;
function lire(mots, type) {
    const b = new ArrayBuffer(4);
    const v = new DataView(b);
    if (type === 'int16' || type === 'uint16') {
        v.setUint16(0, mots[0] & 0xffff);
        return type === 'int16' ? v.getInt16(0) : v.getUint16(0);
    }
    const fort = type === 'float32_swapped' ? mots[1] : mots[0];
    const faible = type === 'float32_swapped' ? mots[0] : mots[1];
    v.setUint16(0, fort & 0xffff);
    v.setUint16(2, faible & 0xffff);
    if (type === 'float32' || type === 'float32_swapped') return v.getFloat32(0);
    return type === 'int32' ? v.getInt32(0) : v.getUint32(0);
}
const reg = compteur.registers[grandeur];
let valeur = lire(mots, compteur.data_type) * (reg.scale || 1);
if (reg.abs) valeur = Math.abs(valeur);
if (!isFinite(valeur)) return null;
const lectures = flow.get('lectures') || {};
const cle = morceaux[0];
if (!lectures[cle] || lectures[cle].recorded_at !== tick) lectures[cle] = { recorded_at: tick };
lectures[cle][grandeur] = Math.round(valeur * 1000000) / 1000000;
flow.set('lectures', lectures);
return null;`

/** Nœud « Préparer l'envoi » : mesures de la minute ; sortie 1 = jeton à demander, sortie 2 = jeton encore valable. */
export const SEND_CODE = `const reglages = flow.get('reglages');
const lectures = flow.get('lectures') || {};
flow.set('lectures', {});
const readings = [];
Object.keys(lectures).forEach(function (cle) {
    const compteur = reglages.compteurs[Number(cle)];
    const l = lectures[cle];
    if (!compteur || typeof l.power_kw !== 'number') return; // la puissance (kW) est obligatoire
    const r = { recorded_at: l.recorded_at, power_kw: l.power_kw };
    if (compteur.machine_code) r.machine_code = compteur.machine_code; else r.external_ref = compteur.external_ref;
    ['energy_kwh', 'voltage_v', 'current_a', 'power_factor'].forEach(function (k) { if (typeof l[k] === 'number') r[k] = l[k]; });
    readings.push(r);
});
if (readings.length === 0) { node.status({ fill: 'yellow', shape: 'ring', text: 'aucune mesure lue cette minute' }); return null; }
const jeton = flow.get('jeton');
const mesures = {
    method: 'POST',
    url: reglages.plateforme + '/api/v1/boitier/measurements',
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + (jeton ? jeton.valeur : '') },
    payload: { readings: readings.slice(0, 500) }
};
if (jeton && jeton.expire > Date.now() + 60000) return [null, mesures];
return [{
    method: 'POST',
    url: reglages.plateforme + '/api/v1/boitier/token',
    headers: { 'Content-Type': 'application/json' },
    payload: { device_id: reglages.identifiant, secret: reglages.cle },
    readings: readings.slice(0, 500)
}, null];`

/** Nœud « Garder le jeton » : réponse de /token -> jeton gardé, puis envoi des mesures. */
export const TOKEN_CODE = `if (msg.statusCode !== 200 || !msg.payload || !msg.payload.token) {
    const raison = msg.payload && msg.payload.detail ? msg.payload.detail : 'statut ' + msg.statusCode;
    node.status({ fill: 'red', shape: 'ring', text: 'jeton refusé : ' + raison });
    node.error('Jeton refusé : ' + raison + ' (identifiant ou clé ? voir la documentation)', msg);
    return null;
}
const reglages = flow.get('reglages');
flow.set('jeton', { valeur: msg.payload.token, expire: Date.now() + (msg.payload.expires_in || 3600) * 1000 });
return {
    method: 'POST',
    url: reglages.plateforme + '/api/v1/boitier/measurements',
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + msg.payload.token },
    payload: { readings: msg.readings }
};`

/** Nœud « Résultat » : mesures gardées ou refusées, avec la raison de chaque refus. */
export const RESULT_CODE = `if (msg.statusCode === 401) {
    flow.set('jeton', null); // jeton expiré ou clé remplacée : un nouveau sera demandé à la prochaine minute
    node.status({ fill: 'yellow', shape: 'ring', text: 'jeton refusé, nouvel essai à la prochaine minute' });
    return null;
}
if (msg.statusCode !== 200 || !msg.payload) {
    node.status({ fill: 'red', shape: 'ring', text: 'envoi refusé : statut ' + msg.statusCode });
    node.error('Envoi refusé : ' + JSON.stringify(msg.payload), msg);
    return null;
}
const refus = msg.payload.rejected || [];
node.status({ fill: refus.length ? 'yellow' : 'green', shape: 'dot', text: msg.payload.accepted + ' gardée(s), ' + refus.length + ' refusée(s)' });
refus.forEach(function (r) { node.warn('Mesure refusée : ' + r.reason); });
return null;`

interface FlowNode {
  id: string
  type: string
  z?: string
  [key: string]: unknown
}

/** Le flux importable (Menu > Importer dans Node-RED). Identifiants fixes : le fichier reste identique d'une génération à l'autre. */
export function buildFlow(): FlowNode[] {
  const z = 'nk-onglet'
  const fn = (id: string, name: string, func: string, x: number, y: number, wires: string[][], outputs = 1): FlowNode => ({
    id, type: 'function', z, name, func, outputs, timeout: 0, noerr: 0, initialize: '', finalize: '', libs: [], x, y, wires,
  })
  const http = (id: string, name: string, x: number, y: number, wires: string[][]): FlowNode => ({
    id, type: 'http request', z, name, method: 'use', ret: 'obj', paytoqs: 'ignore', url: '', tls: '', persist: false, proxy: '', insecureHTTPParser: false,
    authType: '', senderr: false, headers: [], x, y, wires,
  })
  const inject = (id: string, name: string, repeat: string, onceDelay: number, x: number, y: number, wires: string[][]): FlowNode => ({
    id, type: 'inject', z, name, props: [], repeat, crontab: '', once: true, onceDelay, topic: '', x, y, wires,
  })
  return [
    { id: z, type: 'tab', label: 'Nouankany : envoi des compteurs', disabled: false, info: 'Modèle de repli Nouankany. Remplir le nœud « Réglages », régler la liaison Modbus, déployer. Documentation : Nouankany > Documentation > « Repli : modèle Node-RED ».' },
    { id: 'nk-note', type: 'comment', z, name: '1. Remplir « Réglages »  2. Régler la liaison Modbus (RS485 ou réseau)  3. Déployer', info: '', x: 330, y: 40, wires: [] },
    inject('nk-demarrage', 'Au démarrage', '', 0.5, 140, 100, [['nk-reglages']]),
    fn('nk-reglages', 'Réglages', SETTINGS_CODE, 330, 100, []),
    inject('nk-minute', 'Chaque minute', '60', 5, 140, 180, [['nk-lecture']]),
    fn('nk-lecture', 'Demandes de lecture', READ_CODE, 340, 180, [['nk-modbus']]),
    {
      id: 'nk-modbus', type: 'modbus-flex-getter', z, name: 'Lire le compteur', showStatusActivities: true, showErrors: true, showWarnings: true,
      logIOActivities: false, server: 'nk-liaison', useIOFile: false, ioFile: '', useIOForPayload: false, emptyMsgOnFail: false,
      keepMsgProperties: true, delayOnStart: false, startDelayTime: '', enableDeformedMessages: false, x: 560, y: 180, wires: [['nk-conversion'], []],
    },
    fn('nk-conversion', 'Convertir en unités Nouankany', CONVERT_CODE, 800, 180, []),
    inject('nk-envoi-minute', 'Chaque minute (envoi)', '60', 40, 160, 260, [['nk-envoi']]),
    fn('nk-envoi', 'Préparer l’envoi', SEND_CODE, 370, 260, [['nk-http-jeton'], ['nk-http-mesures']], 2),
    http('nk-http-jeton', 'Demander un jeton', 580, 240, [['nk-jeton']]),
    fn('nk-jeton', 'Garder le jeton', TOKEN_CODE, 780, 240, [['nk-http-mesures']]),
    http('nk-http-mesures', 'Envoyer les mesures', 600, 320, [['nk-resultat']]),
    fn('nk-resultat', 'Résultat', RESULT_CODE, 800, 320, []),
    {
      id: 'nk-liaison', type: 'modbus-client', name: 'Liaison compteurs (à régler)', clienttype: 'simpleser', bufferCommands: true,
      stateLogEnabled: false, queueLogEnabled: false, failureLogEnabled: true, tcpHost: '127.0.0.1', tcpPort: '502', tcpType: 'DEFAULT',
      serialPort: '/dev/ttyUSB0', serialType: 'RTU-BUFFERD', serialBaudrate: '9600', serialDatabits: '8', serialStopbits: '1', serialParity: 'none',
      serialConnectionDelay: '100', serialAsciiResponseStartDelimiter: '0x3A', unit_id: '1', commandDelay: '1', clientTimeout: '1000',
      reconnectOnTimeout: true, reconnectTimeout: '2000', parallelUnitIdsAllowed: true, showErrors: false, showWarnings: true, showLogs: true,
    },
  ]
}
