const equipment = [
  { name: "Cuerda (15m)", type: "equipment", img: "icons/sundries/survival/rope-wrapped-brown.webp", system: { description: "Cuerda resistente de 15 metros. Útil para escalar, atar o crear trampas.", quantity: 1, weight: 2, price: 10, equipped: false, identified: true } },
  { name: "Antorcha", type: "equipment", img: "icons/sundries/lights/torch-brown-lit.webp", system: { description: "Antorcha de madera que proporciona luz durante 1 hora.", quantity: 1, weight: 0.5, price: 1, equipped: false, identified: true } },
  { name: "Mochila", type: "equipment", img: "icons/containers/bags/pack-leather-brown-white.webp", system: { description: "Mochila de viaje que permite cargar más equipo cómodamente.", quantity: 1, weight: 1, price: 5, equipped: false, identified: true } },
  { name: "Saco de dormir", type: "equipment", img: "icons/sundries/survival/bedroll-brown.webp", system: { description: "Saco para dormir que proporciona comodidad y protección contra el frío.", quantity: 1, weight: 2, price: 5, equipped: false, identified: true } },
  { name: "Tienda de campaña", type: "equipment", img: "icons/environment/settlement/tent-leather-brown.webp", system: { description: "Tienda pequeña para 2 personas. Protege de la intemperie.", quantity: 1, weight: 5, price: 25, equipped: false, identified: true } },
  { name: "Pedernal y yesca", type: "equipment", img: "icons/sundries/survival/flint-steel-brown.webp", system: { description: "Kit para encender fuego. Permite hacer fuego en condiciones normales.", quantity: 1, weight: 0.5, price: 2, equipped: false, identified: true } },
  { name: "Raciones (1 día)", type: "equipment", img: "icons/consumables/meat/haunch-cooked-brown.webp", system: { description: "Comida preservada para un día. Necesaria para viajes largos.", quantity: 1, weight: 1, price: 2, equipped: false, identified: true } },
  { name: "Odre de agua", type: "equipment", img: "icons/consumables/drinks/waterskin-leather-brown-grey.webp", system: { description: "Recipiente de cuero para transportar agua (1 litro).", quantity: 1, weight: 1, price: 1, equipped: false, identified: true } },
  { name: "Ganzúas", type: "equipment", img: "icons/sundries/misc/lockpicks-steel.webp", system: { description: "Set de ganzúas para abrir cerraduras. Otorga +2 a Trampas/Cerraduras.", quantity: 1, weight: 0.5, price: 50, equipped: false, identified: true } },
  { name: "Kit de sanación", type: "equipment", img: "icons/sundries/survival/bandage-wound-brown-red.webp", system: { description: "Vendas, hierbas y ungüentos. Otorga +2 a Sanación/Hierbas. 5 usos.", quantity: 1, weight: 1, price: 25, equipped: false, identified: true } },
  { name: "Catalejo", type: "equipment", img: "icons/tools/navigation/spyglass-brass.webp", system: { description: "Telescopio portátil. Otorga +2 a Vigilar a larga distancia.", quantity: 1, weight: 1, price: 100, equipped: false, identified: true } },
  { name: "Libro en blanco", type: "equipment", img: "icons/sundries/books/book-worn-brown.webp", system: { description: "Libro vacío para escribir notas, hechizos o diario.", quantity: 1, weight: 1, price: 10, equipped: false, identified: true } },
  { name: "Símbolo sagrado", type: "equipment", img: "icons/magic/holy/chalice-glowing-gold-water.webp", system: { description: "Símbolo religioso. Necesario para algunos rituales y oraciones.", quantity: 1, weight: 0.5, price: 25, equipped: false, identified: true } },
  { name: "Grimorio", type: "equipment", img: "icons/sundries/books/book-embossed-gold-red.webp", system: { description: "Libro de hechizos. Necesario para magos. Puede contener hasta 20 hechizos.", quantity: 1, weight: 2, price: 100, equipped: false, identified: true } },
  { name: "Linterna", type: "equipment", img: "icons/sundries/lights/lantern-iron-yellow.webp", system: { description: "Linterna de aceite. Ilumina 10m durante 6 horas con 1 frasco de aceite.", quantity: 1, weight: 1, price: 10, equipped: false, identified: true } },
  { name: "Aceite (frasco)", type: "equipment", img: "icons/consumables/potions/bottle-round-corked-labeled-brown.webp", system: { description: "Frasco de aceite para linterna. También puede usarse como arma incendiaria.", quantity: 1, weight: 0.5, price: 2, equipped: false, identified: true } },
  { name: "Espejo de mano", type: "equipment", img: "icons/sundries/misc/mirror-hand-steel.webp", system: { description: "Pequeño espejo de metal pulido. Útil para ver alrededor de esquinas.", quantity: 1, weight: 0.5, price: 10, equipped: false, identified: true } },
  { name: "Cadena (3m)", type: "equipment", img: "icons/sundries/survival/chain-steel.webp", system: { description: "Cadena de hierro de 3 metros. Más resistente que la cuerda.", quantity: 1, weight: 5, price: 50, equipped: false, identified: true } },
  { name: "Grilletes", type: "equipment", img: "icons/equipment/hand/shackles-steel.webp", system: { description: "Esposas de hierro con llave. Para inmovilizar prisioneros.", quantity: 1, weight: 1, price: 20, equipped: false, identified: true } },
  { name: "Pértiga (3m)", type: "equipment", img: "icons/weapons/staves/staff-simple-wood.webp", system: { description: "Vara larga de madera. Útil para activar trampas a distancia.", quantity: 1, weight: 3, price: 2, equipped: false, identified: true } },
  { name: "Teléfono móvil", type: "equipment", img: "icons/sundries/gaming/playing-cards-grey.webp", system: { description: "Dispositivo de comunicación moderno. Permite llamadas y mensajes.", quantity: 1, weight: 0.2, price: 300, equipped: false, identified: true } },
  { name: "Ordenador portátil", type: "equipment", img: "icons/sundries/gaming/playing-cards-grey.webp", system: { description: "Computadora portátil. Otorga +2 a Informática. Requiere electricidad.", quantity: 1, weight: 2, price: 1000, equipped: false, identified: true } },
  { name: "Kit de herramientas", type: "equipment", img: "icons/tools/hand/hammer-and-nail.webp", system: { description: "Set de herramientas mecánicas. Otorga +2 a Ingeniería y reparaciones.", quantity: 1, weight: 3, price: 150, equipped: false, identified: true } },
  { name: "Prismáticos", type: "equipment", img: "icons/tools/navigation/spyglass-brass.webp", system: { description: "Binoculares modernos. Otorga +3 a Vigilar a larga distancia.", quantity: 1, weight: 1, price: 200, equipped: false, identified: true } },
  { name: "Linterna táctica", type: "equipment", img: "icons/sundries/lights/lantern-iron-yellow.webp", system: { description: "Linterna LED potente. Ilumina 20m. Batería dura 10 horas.", quantity: 1, weight: 0.5, price: 50, equipped: false, identified: true } },
  { name: "Kit médico", type: "equipment", img: "icons/sundries/survival/bandage-wound-brown-red.webp", system: { description: "Botiquín moderno completo. Otorga +3 a Medicina. 10 usos.", quantity: 1, weight: 2, price: 100, equipped: false, identified: true } },
  { name: "Chaleco táctico", type: "equipment", img: "icons/equipment/chest/vest-armored-blue.webp", system: { description: "Chaleco con múltiples bolsillos. Permite acceso rápido a 6 objetos.", quantity: 1, weight: 2, price: 150, equipped: false, identified: true } },
  { name: "Cámara de vigilancia", type: "equipment", img: "icons/sundries/gaming/playing-cards-grey.webp", system: { description: "Cámara pequeña con grabación. Útil para vigilancia y reconocimiento.", quantity: 1, weight: 0.5, price: 300, equipped: false, identified: true } },
  { name: "Comunicador cuántico", type: "equipment", img: "icons/sundries/gaming/playing-cards-grey.webp", system: { description: "Dispositivo de comunicación instantánea. Alcance ilimitado en el sistema solar.", quantity: 1, weight: 0.1, price: 2000, equipped: false, identified: true } },
  { name: "Escáner multiespectral", type: "equipment", img: "icons/sundries/gaming/playing-cards-grey.webp", system: { description: "Escáner avanzado. Detecta formas de vida, energía y materiales. Otorga +3 a Buscar.", quantity: 1, weight: 1, price: 3000, equipped: false, identified: true } },
  { name: "Kit de nanotecnología", type: "equipment", img: "icons/tools/laboratory/beaker-fluid-blue.webp", system: { description: "Nanobots programables. Otorga +4 a Ingeniería y reparaciones. 5 usos.", quantity: 1, weight: 0.5, price: 5000, equipped: false, identified: true } },
  { name: "Generador de campo de fuerza", type: "equipment", img: "icons/magic/defensive/shield-barrier-glowing-triangle-blue.webp", system: { description: "Dispositivo portátil que crea un campo protector temporal. Otorga +2 a Defensa durante 1 minuto. 3 usos por día.", quantity: 1, weight: 1, price: 8000, equipped: false, identified: true } }
];

const pack = game.packs.get("ryf3.equipment-es");
if (!pack) {
  ui.notifications.error("No se encontró el compendio de equipamiento en español");
} else {
  let created = 0;
  for (const equipData of equipment) {
    await Item.create(equipData, {pack: pack.collection});
    created++;
  }
  ui.notifications.info(`Se crearon ${created} items de equipamiento en el compendio español`);
}

