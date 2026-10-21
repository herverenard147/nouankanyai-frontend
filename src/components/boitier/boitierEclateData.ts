/**
 * Données de la vue éclatée du boîtier (repris de la page 3D du prototype, boitier-3d/boitier-eclate.html, 2026-10-15).
 * META : centres et tailles en mètres, dans le repère du modèle glTF (y vers le haut), et segment de l'animation
 * « Eclatement » (secondes) qui isole chaque sous-ensemble. COMP : fiche de chaque sous-ensemble. PARTS : ses pièces ;
 * `real` : modèle 3D KiCad du vrai composant, sinon modélisé.
 */
export interface Box { center: [number, number, number]; size: number }
export interface ComponentMeta extends Box { label: string; segment: [number, number] | null }
export interface PartMeta extends Box { top: [number, number, number] }
export interface PartInfo { name: string; meta: string; real: boolean; text: string }

export const META: {
  fps: number
  assembled: Box
  exploded: Box
  components: Record<string, ComponentMeta>
  parts: Record<string, Record<string, PartMeta>>
} = {"fps": 30, "assembled": {"center": [0.00012, 0.0416, -0.0], "size": 0.11524}, "exploded": {"center": [-0.00069, 0.0601, -0.01625], "size": 0.39163}, "components": {"capot": {"label": "Capot supérieur", "segment": [1.3333333333333333, 2.3333333333333335], "center": [0.0, 0.1836, -0.0], "size": 0.113}, "capteurs": {"label": "Carte micros & LED", "segment": [2.6666666666666665, 3.6666666666666665], "center": [0.0, 0.14295, -0.0], "size": 0.096}, "hp": {"label": "Haut-parleur", "segment": [4.0, 5.0], "center": [0.0, 0.0708, -0.0], "size": 0.0476}, "ampli": {"label": "Carte ampli", "segment": [5.333333333333333, 6.333333333333333], "center": [0.0, 0.06407, -0.081], "size": 0.03}, "chassis": {"label": "Châssis acoustique", "segment": null, "center": [0.14031, 0.039, -0.0], "size": 0.10963}, "tissu": {"label": "Habillage tissu", "segment": null, "center": [-0.13938, 0.039, -0.0], "size": 0.11424}, "pi": {"label": "Raspberry Pi 4", "segment": [6.666666666666667, 7.666666666666667], "center": [0.00062, 0.00379, 0.00118], "size": 0.08623}, "socle": {"label": "Socle & lest", "segment": [8.0, 9.0], "center": [0.0, -0.04713, -0.0], "size": 0.115}}, "parts": {"capot": {"coque": {"center": [0.0, 0.1724, -0.0], "size": 0.113, "top": [0.0, 0.1778, -0.0]}, "diffuseur": {"center": [0.0, 0.1879, -0.0], "size": 0.0756, "top": [0.0, 0.18965, -0.0]}, "touche": {"center": [0.0, 0.1999, -0.0], "size": 0.028, "top": [0.0, 0.2002, -0.0]}, "volume_moins": {"center": [-0.024, 0.19928, -0.0], "size": 0.0096, "top": [-0.024, 0.19965, -0.0]}, "volume_plus": {"center": [0.024, 0.19928, -0.0], "size": 0.0096, "top": [0.024, 0.19965, -0.0]}}, "capteurs": {"pcb": {"center": [0.0, 0.1308, -0.0], "size": 0.096, "top": [0.0, 0.1316, -0.0]}, "led": {"center": [0.0, 0.1444, -0.0], "size": 0.077, "top": [0.0, 0.1452, -0.0]}, "micro": {"center": [0.0, 0.15009, 0.0], "size": 0.03829, "top": [0.0, 0.15058, 0.0]}, "electrode": {"center": [0.0, 0.15575, -0.0], "size": 0.024, "top": [0.0, 0.1559, -0.0]}, "electrodes_volume": {"center": [0.0, 0.15575, -0.0], "size": 0.057, "top": [0.0, 0.1559, -0.0]}}, "hp": {"aimant": {"center": [0.0, 0.0505, -0.0], "size": 0.022, "top": [0.0, 0.054, -0.0]}, "saladier": {"center": [0.0, 0.071, -0.0], "size": 0.042, "top": [0.0, 0.076, -0.0]}, "membrane": {"center": [0.0, 0.0845, -0.0], "size": 0.037, "top": [0.0, 0.0875, -0.0]}, "suspension": {"center": [0.0, 0.0913, -0.0], "size": 0.0414, "top": [0.0, 0.09266, -0.0]}, "cache": {"center": [0.0, 0.0916, -0.0], "size": 0.012, "top": [0.0, 0.0946, -0.0]}}, "ampli": {"pcb": {"center": [0.0, 0.0538, -0.081], "size": 0.03, "top": [0.0, 0.0546, -0.081]}, "puce": {"center": [-0.007, 0.06499, -0.084], "size": 0.003, "top": [-0.007, 0.06538, -0.084]}, "condensateur": {"center": [0.007, 0.0713, -0.081], "size": 0.0078, "top": [0.007, 0.074, -0.081]}, "connecteur": {"center": [-0.007, 0.06937, -0.077], "size": 0.01154, "top": [-0.007, 0.07514, -0.077]}}, "chassis": {"tube": {"center": [0.14, 0.039, -0.0], "size": 0.109, "top": [0.14, 0.07, -0.0]}, "plateau": {"center": [0.14, 0.03, -0.0], "size": 0.106, "top": [0.14, 0.031, -0.0]}, "traversee": {"center": [0.1087, 0.01168, 0.03827], "size": 0.00896, "top": [0.1087, 0.01382, 0.03827]}, "cable": {"center": [0.1087, 0.013, 0.03514], "size": 0.01327, "top": [0.1087, 0.0152, 0.03514]}, "ouverture_usb2": {"center": [0.19055, 0.0153, 0.019], "size": 0.01493, "top": [0.19055, 0.0193, 0.019]}, "ouverture_usb3": {"center": [0.19399, 0.0153, 0.001], "size": 0.01552, "top": [0.19399, 0.0193, 0.001]}}, "tissu": {"manchon": {"center": [-0.14, 0.039, -0.0], "size": 0.113, "top": [-0.14, 0.072, -0.0]}, "passage_usb": {"center": [-0.17133, 0.013, 0.04708], "size": 0.00838, "top": [-0.17133, 0.0148, 0.04708]}, "passage_usb2": {"center": [-0.087, 0.0153, 0.019], "size": 0.0156, "top": [-0.087, 0.01955, 0.019]}, "passage_usb3": {"center": [-0.08365, 0.0153, 0.001], "size": 0.01603, "top": [-0.08365, 0.01955, 0.001]}}, "pi": {"pcb": {"center": [0.0, -0.0113, -0.0], "size": 0.085, "top": [0.0, -0.0106, -0.0]}, "usb2": {"center": [0.0361, 0.01737, 0.019], "size": 0.01953, "top": [0.0361, 0.02713, 0.019]}, "usb3": {"center": [0.0361, 0.02537, 0.001], "size": 0.01953, "top": [0.0361, 0.03513, 0.001]}, "rj45": {"center": [0.0347, 0.02156, -0.01775], "size": 0.01868, "top": [0.0347, 0.0309, -0.01775]}, "hdmi": {"center": [-0.00975, 0.00485, 0.0253], "size": 0.02001, "top": [-0.00975, 0.00631, 0.0253]}, "usbc": {"center": [-0.0313, 0.00458, 0.0253], "size": 0.00895, "top": [-0.0313, 0.00672, 0.0253]}, "jack": {"center": [0.0115, 0.0065, 0.0232], "size": 0.0143, "top": [0.0115, 0.0109, 0.0232]}, "gpio": {"center": [-0.01, 0.01017, -0.0245], "size": 0.0508, "top": [-0.01, 0.01594, -0.0245]}, "poe": {"center": [0.0195, 0.00817, -0.018], "size": 0.01154, "top": [0.0195, 0.01394, -0.018]}, "ffc": {"center": [-0.01735, 0.00268, 0.00825], "size": 0.04924, "top": [-0.01735, 0.00396, 0.00825]}, "microsd": {"center": [-0.0355, -0.02678, -0.0], "size": 0.01195, "top": [-0.0355, -0.026, -0.0]}, "soc": {"center": [-0.01325, 0.0023, -0.0045], "size": 0.015, "top": [-0.01325, 0.0032, -0.0045]}, "radiateur": {"center": [-0.01325, 0.02305, -0.0045], "size": 0.014, "top": [-0.01325, 0.0268, -0.0045]}, "ram": {"center": [0.0021, 0.0019, -0.0044], "size": 0.0147, "top": [0.0021, 0.0024, -0.0044]}, "wifi": {"center": [-0.0308, 0.00205, -0.0145], "size": 0.0129, "top": [-0.0308, 0.0027, -0.0145]}, "vl805": {"center": [0.0159, 0.00185, -0.01], "size": 0.006, "top": [0.0159, 0.0023, -0.01]}, "phy": {"center": [0.017, 0.00185, 0.0041], "size": 0.0065, "top": [0.017, 0.0023, 0.0041]}, "pmic": {"center": [-0.0325, 0.00185, 0.0158], "size": 0.005, "top": [-0.0325, 0.0023, 0.0158]}}, "socle": {"pied": {"center": [0.0, -0.055, -0.0], "size": 0.115, "top": [0.0, -0.052, -0.0]}, "lest": {"center": [0.0, -0.0375, -0.0], "size": 0.1, "top": [0.0, -0.03625, -0.0]}}}}

export const COMP: Record<string, { dims: string; text: string }> = {
    capot: { dims: "Ø115 × 11 mm", text: "Coque en polycarbonate mat. Le diffuseur répartit la lumière des 12 LED en anneau continu ; la touche centrale recouvre l'électrode tactile." },
    capteurs: { dims: "Ø96 × 1,6 mm", text: "Carte du dessus, disposée comme un ReSpeaker 4-Mic : 12 LED RGB sous le diffuseur, 4 micros MEMS en réseau pour entendre « Hey Nouankany » de toutes les directions, électrode tactile au centre. Reliée au GPIO du Raspberry Pi." },
    hp: { dims: "Ø40 × 19 mm", text: "Haut-parleur large bande 4 Ω, 3 W, orienté vers le haut. Le son traverse le capot et le tissu." },
    ampli: { dims: "30 × 18 mm", text: "Petite carte posée sur le plateau : l'ampli audio du haut-parleur. Le boîtier ne coupe rien lui-même : il transmet l'ordre au capteur « mesure + coupure » de l'appareil." },
    chassis: { dims: "Ø109 × 62 mm", text: "Cylindre rigide en ABS. Il ferme la caisse de résonance, porte le plateau, et tient la prise USB-C de façade reliée au Raspberry Pi par un câble court." },
    tissu: { dims: "Ø113 × 66 mm", text: "Manchon en tissu qui laisse passer le son. Ouvertures : USB-C d'alimentation, USB 2.0 et USB 3.0." },
    pi: { dims: "85 × 56 mm · plan officiel", text: "Le cerveau : Raspberry Pi 4 Model B à plat au fond du boîtier. Il fait tourner l'assistant, la reconnaissance de « Hey Nouankany » et la liaison Wi-Fi. Seul son USB-C sert ; les autres ports restent à l'intérieur." },
    socle: { dims: "Ø115 × 6 mm", text: "Pied en caoutchouc antidérapant et plaque d'acier qui abaisse le centre de gravité." }
  }

export const PARTS: Record<string, Record<string, PartInfo>> = {
    capot: {
      coque: { name: "Coque du capot", meta: "polycarbonate mat", real: false, text: "Ferme le dessus et laisse passer la lumière par l'anneau." },
      diffuseur: { name: "Diffuseur LED", meta: "anneau Ø72", real: false, text: "Transforme les 12 points lumineux en un anneau continu ; c'est lui qui affiche les 4 états." },
      touche: { name: "Touche tactile", meta: "Ø28", real: false, text: "Zone à toucher pour couper les micros ou répondre." },
      volume_moins: { name: "Touche volume −", meta: "tactile, Ø9.6", real: false, text: "Baisse le volume du haut-parleur, à gauche de la touche centrale." },
      volume_plus: { name: "Touche volume +", meta: "tactile, Ø9.6", real: false, text: "Monte le volume, à droite de la touche centrale." }
    },
    capteurs: {
      pcb: { name: "Circuit imprimé micros & LED", meta: "Ø96 × 1,6 mm", real: false, text: "Masque noir, sérigraphie D1 à D12 et MIC1 à MIC4." },
      led: { name: "12 × LED WS2812B", meta: "5,0 × 5,0 × 1,6 mm · PLCC4", real: true, text: "LED RGB adressables en chaîne : une seule broche du Pi les pilote toutes." },
      micro: { name: "4 × micro InvenSense ICS-43434", meta: "3,5 × 2,65 × 1 mm · MEMS I2S", real: true, text: "Micros numériques à 90° les uns des autres pour localiser la voix et filtrer le bruit." },
      electrode: { name: "Électrode tactile", meta: "cuivre Ø24", real: false, text: "Capte le doigt à travers le capot." },
      electrodes_volume: { name: "Électrodes de volume", meta: "cuivre Ø9", real: false, text: "Sous les touches − et + du capot, elles détectent le doigt comme l'électrode centrale." }
    },
    hp: {
      aimant: { name: "Aimant", meta: "Ø22 × 7 mm", real: false, text: "Moteur du haut-parleur." },
      saladier: { name: "Saladier", meta: "Ø42", real: false, text: "Châssis métallique qui tient la membrane." },
      membrane: { name: "Membrane", meta: "Ø37", real: false, text: "Pousse l'air pour produire le son." },
      suspension: { name: "Suspension", meta: "caoutchouc", real: false, text: "Laisse la membrane bouger tout en la centrant." },
      cache: { name: "Cache-noyau", meta: "Ø12", real: false, text: "Protège la bobine." }
    },
    ampli: {
      pcb: { name: "Circuit imprimé ampli", meta: "30 × 18 × 1,6 mm", real: false, text: "Petite carte basse tension (5 V) : pas de 230 V dans le boîtier." },
      puce: { name: "Ampli audio I2S type MAX98357A", meta: "TQFN-16 3 × 3 mm · 3 W sur 4 Ω", real: true, text: "Reçoit le son numérique du Pi et alimente le haut-parleur." },
      condensateur: { name: "Condensateur électrolytique", meta: "Ø6,3 × 5,4 mm", real: true, text: "Réserve d'énergie pour les pointes de volume de l'ampli." },
      connecteur: { name: "Connecteur 2 × 2", meta: "pas 2,54 mm", real: true, text: "Arrivée I2S et 5 V depuis le GPIO du Pi." }
    },
    chassis: {
      tube: { name: "Tube du châssis", meta: "ABS, Ø109", real: false, text: "Caisse de résonance du haut-parleur." },
      plateau: { name: "Plateau support", meta: "Ø106 × 2 mm", real: false, text: "Porte le haut-parleur et la carte ampli, au-dessus du Pi." },
      traversee: { name: "USB-C de façade GCT USB4105", meta: "8,9 × 7,4 mm", real: true, text: "La prise que l'on branche de l'extérieur." },
      cable: { name: "Câble USB-C court", meta: "≈ 15 mm", real: false, text: "Relie la prise de façade à l'USB-C d'alimentation du Pi." },
      ouverture_usb2: { name: "Ouverture USB 2.0", meta: "15,5 × 8 mm", real: false, text: "Laisse accéder au port USB 2.0 du bas du Pi." },
      ouverture_usb3: { name: "Ouverture USB 3.0", meta: "15,5 × 8 mm", real: false, text: "Laisse accéder au port USB 3.0 du bas du Pi." }
    },
    tissu: {
      manchon: { name: "Manchon tissu", meta: "Ø113 × 66 mm", real: false, text: "Tissu acoustiquement transparent." },
      passage_usb: { name: "Prise USB-C d'alimentation", meta: "coque métal, 9,6 × 3,6 mm", real: false, text: "On y branche le chargeur 5 V / 3 A ; elle est reliée à l'USB-C du Pi à l'intérieur." },
      passage_usb2: { name: "Port USB 2.0 externe", meta: "languette claire", real: false, text: "Pour brancher une clé ou un périphérique." },
      passage_usb3: { name: "Port USB 3.0 externe", meta: "languette bleue", real: false, text: "Port rapide, pour un stockage externe." }
    },
    pi: {
      pcb: { name: "Carte Raspberry Pi 4 Model B", meta: "85 × 56 × 1,4 mm · fixations 58 × 49 mm", real: false, text: "Contour, trous et positions des ports relevés sur le plan mécanique officiel." },
      soc: { name: "Processeur Broadcom BCM2711", meta: "15 × 15 mm · 4 × Cortex-A72 1,5 GHz", real: false, text: "Sous son capot métal. C'est lui qui fait tourner l'assistant." },
      radiateur: { name: "Radiateur aluminium", meta: "14 × 14 × 7,5 mm", real: false, text: "Indispensable dans un boîtier fermé : le BCM2711 chauffe sous charge." },
      ram: { name: "Mémoire LPDDR4", meta: "1 à 8 Go", real: false, text: "À côté du processeur, comme sur la vraie carte." },
      wifi: { name: "Module Wi-Fi 5 GHz / Bluetooth 5.0", meta: "capot blindé ≈ 11 × 13 mm", real: false, text: "La liaison avec la plateforme Nouankany." },
      vl805: { name: "Contrôleur USB 3 VL805", meta: "≈ 6 × 6 mm", real: false, text: "Gère les deux ports bleus." },
      phy: { name: "Puce Ethernet Gigabit", meta: "≈ 6,5 × 6,5 mm", real: false, text: "Derrière la prise RJ45." },
      pmic: { name: "Gestion d'alimentation", meta: "≈ 5 × 5 mm", real: false, text: "Produit les tensions de la carte à partir du 5 V USB-C." },
      usb2: { name: "2 × USB 2.0 (Molex 67643)", meta: "empilés, 16 mm de haut", real: true, text: "Ports noirs, en bas à droite de la carte." },
      usb3: { name: "2 × USB 3.0 (Molex 67643)", meta: "empilés, languettes bleues", real: true, text: "Ports du milieu, à droite." },
      rj45: { name: "Prise Ethernet RJ45 (Amphenol RJHSE538X)", meta: "avec voyants", real: true, text: "En haut à droite ; possible repli filaire si le Wi-Fi est faible." },
      hdmi: { name: "2 × micro-HDMI (Molex 46765)", meta: "à 26 et 39,5 mm du bord", real: true, text: "Inutilisés dans le boîtier, présents sur la carte." },
      usbc: { name: "USB-C d'alimentation (GCT USB4105)", meta: "5 V / 3 A, à 11,2 mm du bord", real: true, text: "Relié à la prise de façade par le câble court." },
      jack: { name: "Prise audio 3,5 mm (CUI SJ1-3523N)", meta: "à 54 mm du bord", real: true, text: "Inutilisée : le son passe par l'ampli I2S." },
      gpio: { name: "Connecteur GPIO 40 broches", meta: "2 × 20, pas 2,54 mm", real: true, text: "Relie la carte micros & LED et la carte ampli." },
      poe: { name: "Connecteur PoE", meta: "2 × 2, pas 2,54 mm", real: true, text: "Pour une alimentation par câble Ethernet (option)." },
      ffc: { name: "Connecteurs caméra et écran", meta: "nappe 15 points, pas 1 mm (TE 1-84953-5)", real: true, text: "CSI à droite des HDMI, DSI sur le bord gauche." },
      microsd: { name: "Lecteur micro-SD (Hirose DM3D)", meta: "sous la carte", real: true, text: "Porte le système et l'assistant." }
    },
    socle: {
      pied: { name: "Pied caoutchouc", meta: "Ø115", real: false, text: "Antidérapant." },
      lest: { name: "Plaque de lest acier", meta: "Ø100 × 2,5 mm", real: false, text: "Abaisse le centre de gravité." }
    }
  }
