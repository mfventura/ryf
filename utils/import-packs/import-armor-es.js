const armors = [
  { 
    name: "Armadura de cuero", 
    type: "armor", 
    img: "icons/equipment/chest/breastplate-leather-brown.webp", 
    system: { 
      description: "Armadura ligera hecha de cuero endurecido. Proporciona protección básica sin limitar mucho el movimiento.", 
      quantity: 1, 
      weight: 5, 
      price: 50, 
      equipped: false, 
      identified: true, 
      protection: 1, 
      hindrance: 0 
    } 
  },
  { 
    name: "Armadura de cuero tachonado", 
    type: "armor", 
    img: "icons/equipment/chest/breastplate-leather-studded-brown.webp", 
    system: { 
      description: "Armadura de cuero reforzada con tachuelas metálicas. Ofrece mejor protección que el cuero simple con poco estorbo adicional.", 
      quantity: 1, 
      weight: 8, 
      price: 100, 
      equipped: false, 
      identified: true, 
      protection: 2, 
      hindrance: 1 
    } 
  },
  { 
    name: "Cota de mallas", 
    type: "armor", 
    img: "icons/equipment/chest/breastplate-chainmail-steel.webp", 
    system: { 
      description: "Armadura media hecha de anillos de metal entrelazados. Proporciona buena protección contra cortes, pero es pesada.", 
      quantity: 1, 
      weight: 15, 
      price: 300, 
      equipped: false, 
      identified: true, 
      protection: 3, 
      hindrance: 2 
    } 
  },
  { 
    name: "Armadura de placas", 
    type: "armor", 
    img: "icons/equipment/chest/breastplate-layered-steel-grey.webp", 
    system: { 
      description: "Armadura pesada de placas de metal articuladas. Ofrece la máxima protección pero limita significativamente el movimiento.", 
      quantity: 1, 
      weight: 25, 
      price: 1000, 
      equipped: false, 
      identified: true, 
      protection: 4, 
      hindrance: 3 
    } 
  },
  { 
    name: "Chaleco antibalas", 
    type: "armor", 
    img: "icons/equipment/chest/vest-armored-blue.webp", 
    system: { 
      description: "Armadura moderna hecha de materiales balísticos. Protege contra proyectiles de armas de fuego con poco estorbo.", 
      quantity: 1, 
      weight: 3, 
      price: 500, 
      equipped: false, 
      identified: true, 
      protection: 3, 
      hindrance: 1 
    } 
  },
  { 
    name: "Armadura de combate", 
    type: "armor", 
    img: "icons/equipment/chest/breastplate-armored-steel-blue.webp", 
    system: { 
      description: "Armadura táctica avanzada con placas balísticas y protección completa. Máxima protección moderna con movilidad razonable.", 
      quantity: 1, 
      weight: 10, 
      price: 2000, 
      equipped: false, 
      identified: true, 
      protection: 4, 
      hindrance: 2 
    } 
  }
];

const pack = game.packs.get("ryf3.armor-es");
if (!pack) {
  ui.notifications.error("No se encontró el compendio de armaduras en español");
} else {
  let created = 0;
  for (const armorData of armors) {
    await Item.create(armorData, {pack: pack.collection});
    created++;
  }
  ui.notifications.info(`Se crearon ${created} armaduras en el compendio español`);
}

