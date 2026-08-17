// Reference: RyF 3.0 PDF, página 98 - Ventajas del manual como ejemplos
// construidos con el sistema de efectos configurable.
// Ejecutar como macro o en la consola de Foundry con un mundo RyF 3.0 abierto.
const buff = (target, modifier, targetName = '') => ({
  id: foundry.utils.randomID(),
  type: 'buff',
  target: target,
  targetName: targetName,
  modifier: modifier,
  collapsed: false
});

const note = (text) => ({
  id: foundry.utils.randomID(),
  type: 'note',
  text: text,
  collapsed: false
});

const advantages = [
  { name: "Arcano", type: "advantage", img: "icons/magic/symbols/runes-star-pentagon-blue.webp", system: { description: "+1 a tiradas de hechizos.", requirement: { attribute: "inteligencia", value: 8 }, effects: [buff("spell-casting", 1)] } },
  { name: "Berseker", type: "advantage", img: "icons/skills/melee/strike-axe-blood-red.webp", system: { description: "+2 a tiradas de combate cuerpo a cuerpo.", requirement: { attribute: "fisico", value: 8 }, effects: [buff("attack-melee", 2)] } },
  { name: "Certero", type: "advantage", img: "icons/skills/ranged/target-bullseye-arrow-blue.webp", system: { description: "+1 al daño en armas a distancia.", requirement: { attribute: "percepcion", value: 8 }, effects: [buff("damage-ranged", 1)] } },
  { name: "Defensor", type: "advantage", img: "icons/equipment/shield/heater-steel-boss-red.webp", system: { description: "+1 a defensa.", requirement: { attribute: "destreza", value: 8 }, effects: [buff("defense", 1)] } },
  { name: "Despiadado", type: "advantage", img: "icons/skills/melee/strike-dagger-blood-red.webp", system: { description: "Puede repetir tiradas de daño usando token o mecanismos similares.", requirement: { attribute: "fisico", value: 8 }, effects: [note("Puede repetir tiradas de daño usando token o mecanismos similares")] } },
  { name: "Golpe Duro", type: "advantage", img: "icons/skills/melee/unarmed-punch-fist.webp", system: { description: "+1 al daño en cuerpo a cuerpo.", requirement: { attribute: "fisico", value: 8 }, effects: [buff("damage-melee", 1)] } },
  { name: "Maná abundante", type: "advantage", img: "icons/magic/water/orb-water-bubbles.webp", system: { description: "El Maná es Inteligencia x4, en lugar de x3.", requirement: { attribute: "inteligencia", value: 8 }, effects: [buff("mana-multiplier", 1)] } },
  { name: "Mula de carga", type: "advantage", img: "icons/containers/bags/pack-leather-brown.webp", system: { description: "Ignora 1 punto de estorbo.", requirement: { attribute: "fisico", value: 8 }, effects: [buff("hindrance-reduction", 1)] } },
  { name: "Muro", type: "advantage", img: "icons/magic/defensive/shield-barrier-flaming-pentagon-red.webp", system: { description: "PV = Físico x5, en lugar de x4.", requirement: { attribute: "fisico", value: 8 }, effects: [buff("health-multiplier", 1)] } },
  { name: "Piel de Piedra", type: "advantage", img: "icons/magic/earth/strike-fist-stone-gray.webp", system: { description: "+1 a absorción.", requirement: { attribute: "fisico", value: 8 }, effects: [buff("absorption", 1)] } },
  { name: "Puntería", type: "advantage", img: "icons/skills/ranged/archery-bow-attack-yellow.webp", system: { description: "+2 a tiradas de armas a distancia.", requirement: { attribute: "destreza", value: 8 }, effects: [buff("attack-ranged", 2)] } },
  { name: "Rápido", type: "advantage", img: "icons/magic/movement/trail-streak-zigzag-yellow.webp", system: { description: "+2 a iniciativa.", requirement: { attribute: "percepcion", value: 8 }, effects: [buff("initiative", 2)] } },
  { name: "Recuperación", type: "advantage", img: "icons/magic/life/heart-glowing-red.webp", system: { description: "Cura 2 PV adicionales en cada curación, natural o mágica.", requirement: { attribute: "fisico", value: 8 }, effects: [buff("healing-received", 2)] } },
  { name: "Suerte", type: "advantage", img: "icons/sundries/gaming/dice-pair-white-green.webp", system: { description: "Puede repetir una tirada por escena. Sin requisito.", requirement: { attribute: "", value: 0 }, effects: [note("Puede repetir una tirada por escena")] } }
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
