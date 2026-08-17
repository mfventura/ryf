// Reference: RyF 3.0 PDF, página 98 - Ventajas
// Ejecutar como macro o en la consola de Foundry con un mundo RyF 3.0 abierto
const advantages = [
  { name: "Arcano", type: "advantage", img: "icons/magic/symbols/runes-star-pentagon-blue.webp", system: { description: "+1 a tiradas de hechizos.", advantageKey: "arcano", requirement: { attribute: "inteligencia", value: 8 } } },
  { name: "Berseker", type: "advantage", img: "icons/skills/melee/strike-axe-blood-red.webp", system: { description: "+2 a tiradas de combate cuerpo a cuerpo.", advantageKey: "berseker", requirement: { attribute: "fisico", value: 8 } } },
  { name: "Certero", type: "advantage", img: "icons/skills/ranged/target-bullseye-arrow-blue.webp", system: { description: "+1 al daño en armas a distancia.", advantageKey: "certero", requirement: { attribute: "percepcion", value: 8 } } },
  { name: "Defensor", type: "advantage", img: "icons/equipment/shield/heater-steel-boss-red.webp", system: { description: "+1 a defensa.", advantageKey: "defensor", requirement: { attribute: "destreza", value: 8 } } },
  { name: "Despiadado", type: "advantage", img: "icons/skills/melee/strike-dagger-blood-red.webp", system: { description: "Puede repetir tiradas de daño usando token o mecanismos similares.", advantageKey: "despiadado", requirement: { attribute: "fisico", value: 8 } } },
  { name: "Golpe Duro", type: "advantage", img: "icons/skills/melee/unarmed-punch-fist.webp", system: { description: "+1 al daño en cuerpo a cuerpo.", advantageKey: "golpeDuro", requirement: { attribute: "fisico", value: 8 } } },
  { name: "Maná abundante", type: "advantage", img: "icons/magic/water/orb-water-bubbles.webp", system: { description: "El Maná es Inteligencia x4, en lugar de x3.", advantageKey: "manaAbundante", requirement: { attribute: "inteligencia", value: 8 } } },
  { name: "Mula de carga", type: "advantage", img: "icons/containers/bags/pack-leather-brown.webp", system: { description: "Ignora 1 punto de estorbo.", advantageKey: "mulaDeCarga", requirement: { attribute: "fisico", value: 8 } } },
  { name: "Muro", type: "advantage", img: "icons/magic/defensive/shield-barrier-flaming-pentagon-red.webp", system: { description: "PV = Físico x5, en lugar de x4.", advantageKey: "muro", requirement: { attribute: "fisico", value: 8 } } },
  { name: "Piel de Piedra", type: "advantage", img: "icons/magic/earth/strike-fist-stone-gray.webp", system: { description: "+1 a absorción.", advantageKey: "pielDePiedra", requirement: { attribute: "fisico", value: 8 } } },
  { name: "Puntería", type: "advantage", img: "icons/skills/ranged/archery-bow-attack-yellow.webp", system: { description: "+2 a tiradas de armas a distancia.", advantageKey: "punteria", requirement: { attribute: "destreza", value: 8 } } },
  { name: "Rápido", type: "advantage", img: "icons/magic/movement/trail-streak-zigzag-yellow.webp", system: { description: "+2 a iniciativa.", advantageKey: "rapido", requirement: { attribute: "percepcion", value: 8 } } },
  { name: "Recuperación", type: "advantage", img: "icons/magic/life/heart-glowing-red.webp", system: { description: "Cura 2 PV adicionales en cada curación, natural o mágica.", advantageKey: "recuperacion", requirement: { attribute: "fisico", value: 8 } } },
  { name: "Suerte", type: "advantage", img: "icons/sundries/gaming/dice-pair-white-green.webp", system: { description: "Puede repetir una tirada por escena. Sin requisito.", advantageKey: "suerte", requirement: { attribute: "", value: 0 } } }
];

const pack = game.packs.get("ryf3.advantages-es");
if (!pack) {
  ui.notifications.error("No se encontró el compendio de ventajas en español");
} else {
  let created = 0;
  for (const advantageData of advantages) {
    await Item.create(advantageData, {pack: pack.collection});
    created++;
  }
  ui.notifications.info(`Se crearon ${created} ventajas en el compendio`);
}
