const shields = [
  { name: "Escudo normal", type: "shield", img: "icons/equipment/shield/buckler-wooden-boss-brown.webp", system: { description: "Escudo pequeño y manejable. Proporciona protección básica sin estorbar.", quantity: 1, weight: 3, price: 50, equipped: false, identified: true, defense: { melee: 1, ranged: 2 }, hindrance: 0 } },
  { name: "Escudo mediano", type: "shield", img: "icons/equipment/shield/heater-steel-worn-blue.webp", system: { description: "Escudo de tamaño medio. Ofrece buena protección con estorbo mínimo.", quantity: 1, weight: 5, price: 100, equipped: false, identified: true, defense: { melee: 2, ranged: 4 }, hindrance: 1 } },
  { name: "Escudo pesado", type: "shield", img: "icons/equipment/shield/kite-steel-grey.webp", system: { description: "Escudo grande y robusto. Proporciona excelente protección pero dificulta el movimiento.", quantity: 1, weight: 8, price: 200, equipped: false, identified: true, defense: { melee: 3, ranged: 6 }, hindrance: 3 } },
  { name: "Escudo torre", type: "shield", img: "icons/equipment/shield/tower-steel-blue.webp", system: { description: "Escudo enorme que cubre casi todo el cuerpo. Máxima protección pero muy estorboso.", quantity: 1, weight: 15, price: 300, equipped: false, identified: true, defense: { melee: 4, ranged: 8 }, hindrance: 5 } },
  { name: "Escudo táctico", type: "shield", img: "icons/equipment/shield/riot-steel-blue.webp", system: { description: "Escudo moderno de materiales compuestos. Ligero y resistente, ideal para fuerzas de seguridad.", quantity: 1, weight: 4, price: 500, equipped: false, identified: true, defense: { melee: 2, ranged: 4 }, hindrance: 1 } },
  { name: "Escudo antidisturbios", type: "shield", img: "icons/equipment/shield/riot-steel-reinforced.webp", system: { description: "Escudo transparente de policarbonato. Permite ver a través mientras protege.", quantity: 1, weight: 6, price: 400, equipped: false, identified: true, defense: { melee: 2, ranged: 5 }, hindrance: 2 } },
  { name: "Escudo balístico", type: "shield", img: "icons/equipment/shield/heater-steel-reinforced-blue.webp", system: { description: "Escudo táctico con placas balísticas. Protección superior contra proyectiles.", quantity: 1, weight: 12, price: 1500, equipped: false, identified: true, defense: { melee: 3, ranged: 7 }, hindrance: 4 } },
  { name: "Escudo de energía personal", type: "shield", img: "icons/magic/defensive/shield-barrier-glowing-triangle-blue.webp", system: { description: "Generador de campo de fuerza portátil. Protección avanzada sin peso físico.", quantity: 1, weight: 1, price: 5000, equipped: false, identified: true, defense: { melee: 2, ranged: 5 }, hindrance: 0 } },
  { name: "Campo de fuerza portátil", type: "shield", img: "icons/magic/defensive/shield-barrier-glowing-pentagon-blue.webp", system: { description: "Escudo de energía de alta tecnología. Excelente protección con mínimo estorbo.", quantity: 1, weight: 2, price: 8000, equipped: false, identified: true, defense: { melee: 3, ranged: 6 }, hindrance: 1 } },
  { name: "Escudo de combate avanzado", type: "shield", img: "icons/magic/defensive/shield-barrier-glowing-triangle-magenta.webp", system: { description: "Escudo militar futurista con tecnología de absorción de impactos. Máxima protección tecnológica.", quantity: 1, weight: 3, price: 12000, equipped: false, identified: true, defense: { melee: 4, ranged: 8 }, hindrance: 2 } }
];

const pack = game.packs.get("ryf3.shields-es");
if (!pack) {
  ui.notifications.error("No se encontró el compendio de escudos en español");
} else {
  let created = 0;
  for (const shieldData of shields) {
    await Item.create(shieldData, {pack: pack.collection});
    created++;
  }
  ui.notifications.info(`Se crearon ${created} escudos en el compendio español`);
}

