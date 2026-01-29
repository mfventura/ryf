const npcs = [
  {
    name: "Doscabezas",
    type: "npc",
    img: "icons/creatures/mammals/beast-horned-scaled-glowing-orange.webp",
    system: {
      biography: "Bestia mutante con dos cabezas que puede atacar dos veces por turno. Agresiva y territorial.",
      health: { value: 50, max: 50 },
      initiative: 12,
      defense: 15,
      absorption: 0,
      willpower: 10,
      attacks: [],
      cr: 3,
      isMinion: false
    },
    attack: {
      name: "Mordisco doble",
      attackType: "melee",
      attackBonus: 14,
      damageBase: "2d6",
      damageBonus: 0
    }
  },
  {
    name: "Dragón grande",
    type: "npc",
    img: "icons/creatures/reptiles/dragon-horned-blue.webp",
    system: {
      biography: "Dragón antiguo de gran tamaño y poder. Puede volar y lanzar aliento de fuego devastador.",
      health: { value: 125, max: 125 },
      initiative: 10,
      defense: 20,
      absorption: 5,
      willpower: 18,
      attacks: [],
      cr: 10,
      isMinion: false
    },
    attack: {
      name: "Garra/Mordisco",
      attackType: "melee",
      attackBonus: 19,
      damageBase: "3d6",
      damageBonus: 0
    }
  },
  {
    name: "Dragón pequeño",
    type: "npc",
    img: "icons/creatures/reptiles/dragon-horned-green.webp",
    system: {
      biography: "Dragón joven pero peligroso. Puede volar y lanzar aliento de fuego.",
      health: { value: 65, max: 65 },
      initiative: 10,
      defense: 18,
      absorption: 3,
      willpower: 14,
      attacks: [],
      cr: 5,
      isMinion: false
    },
    attack: {
      name: "Garra/Mordisco",
      attackType: "melee",
      attackBonus: 17,
      damageBase: "2d6",
      damageBonus: 0
    }
  },
  {
    name: "Esqueleto",
    type: "npc",
    img: "icons/magic/death/undead-skeleton-worn-blue.webp",
    system: {
      biography: "Muerto viviente animado por magia oscura. Obedece órdenes simples de su creador.",
      health: { value: 29, max: 29 },
      initiative: 13,
      defense: 15,
      absorption: 0,
      willpower: 8,
      attacks: [],
      cr: 1,
      isMinion: true
    },
    attack: {
      name: "Espada oxidada",
      attackType: "melee",
      attackBonus: 13,
      damageBase: "1d6",
      damageBonus: 2
    }
  },
  {
    name: "Esqueleto caballero",
    type: "npc",
    img: "icons/magic/death/undead-skeleton-armor-helm-blue.webp",
    system: {
      biography: "Guerrero no-muerto con armadura y armas. Más peligroso que un esqueleto común.",
      health: { value: 32, max: 32 },
      initiative: 14,
      defense: 16,
      absorption: 0,
      willpower: 10,
      attacks: [],
      cr: 2,
      isMinion: false
    },
    attack: {
      name: "Espada larga",
      attackType: "melee",
      attackBonus: 14,
      damageBase: "2d6",
      damageBonus: 0
    }
  },
  {
    name: "Gárgola",
    type: "npc",
    img: "icons/creatures/magical/construct-stone-earth-gray.webp",
    system: {
      biography: "Criatura de piedra animada que puede volar. Guardián de lugares antiguos.",
      health: { value: 45, max: 45 },
      initiative: 16,
      defense: 18,
      absorption: 2,
      willpower: 12,
      attacks: [],
      cr: 4,
      isMinion: false
    },
    attack: {
      name: "Garra de piedra",
      attackType: "melee",
      attackBonus: 17,
      damageBase: "2d6",
      damageBonus: 0
    }
  },
  {
    name: "Goblin",
    type: "npc",
    img: "icons/creatures/humanoids/goblin-masked-green.webp",
    system: {
      biography: "Criatura pequeña y astuta. Suele atacar en grupo y usar tácticas cobardes.",
      health: { value: 13, max: 13 },
      initiative: 15,
      defense: 16,
      absorption: 0,
      willpower: 8,
      attacks: [],
      cr: 0.5,
      isMinion: true
    },
    attack: {
      name: "Daga",
      attackType: "melee",
      attackBonus: 14,
      damageBase: "1d6",
      damageBonus: 2
    }
  },
  {
    name: "Arpía",
    type: "npc",
    img: "icons/creatures/birds/harpy-flying-wings-blue.webp",
    system: {
      biography: "Criatura con cuerpo de ave y torso de mujer. Puede volar y tiene un canto hipnótico.",
      health: { value: 36, max: 36 },
      initiative: 16,
      defense: 15,
      absorption: 0,
      willpower: 12,
      attacks: [],
      cr: 3,
      isMinion: false
    },
    attack: {
      name: "Garras",
      attackType: "melee",
      attackBonus: 16,
      damageBase: "2d6",
      damageBonus: 0
    }
  },
  {
    name: "Hombre-lagarto",
    type: "npc",
    img: "icons/creatures/reptiles/lizardman-green.webp",
    system: {
      biography: "Humanoide reptiliano que habita en pantanos y junglas. Guerrero tribal hábil.",
      health: { value: 30, max: 30 },
      initiative: 18,
      defense: 14,
      absorption: 0,
      willpower: 10,
      attacks: [],
      cr: 2,
      isMinion: false
    },
    attack: {
      name: "Lanza",
      attackType: "melee",
      attackBonus: 14,
      damageBase: "1d6",
      damageBonus: 2
    }
  },
  {
    name: "Hombre-rata",
    type: "npc",
    img: "icons/creatures/mammals/rodent-rat-diseased-gray.webp",
    system: {
      biography: "Humanoide roedor que vive en alcantarillas y túneles. Portador de enfermedades.",
      health: { value: 17, max: 17 },
      initiative: 17,
      defense: 16,
      absorption: 0,
      willpower: 8,
      attacks: [],
      cr: 1,
      isMinion: true
    },
    attack: {
      name: "Daga sucia",
      attackType: "melee",
      attackBonus: 12,
      damageBase: "1d6",
      damageBonus: 2
    }
  },
  {
    name: "Liche",
    type: "npc",
    img: "icons/magic/death/undead-lich-humanoid-purple.webp",
    system: {
      biography: "Mago no-muerto de gran poder. Maestro de la magia necrótica y prácticamente inmortal.",
      health: { value: 55, max: 55 },
      initiative: 15,
      defense: 16,
      absorption: 0,
      willpower: 18,
      attacks: [],
      cr: 6,
      isMinion: false
    },
    attack: {
      name: "Toque necrótico",
      attackType: "melee",
      attackBonus: 16,
      damageBase: "3d6",
      damageBonus: 0
    }
  },
  {
    name: "Lobo",
    type: "npc",
    img: "icons/environment/creatures/wolf-shadow-black.webp",
    system: {
      biography: "Depredador salvaje que caza en manada. Rápido y letal.",
      health: { value: 20, max: 20 },
      initiative: 15,
      defense: 16,
      absorption: 0,
      willpower: 8,
      attacks: [],
      cr: 1,
      isMinion: true
    },
    attack: {
      name: "Mordisco",
      attackType: "melee",
      attackBonus: 11,
      damageBase: "1d6",
      damageBonus: 2
    }
  },
  {
    name: "Lord esqueleto",
    type: "npc",
    img: "icons/magic/death/undead-skeleton-armor-helm-horned-blue.webp",
    system: {
      biography: "Guerrero no-muerto de élite. Comandante de ejércitos de esqueletos.",
      health: { value: 34, max: 34 },
      initiative: 15,
      defense: 17,
      absorption: 0,
      willpower: 12,
      attacks: [],
      cr: 3,
      isMinion: false
    },
    attack: {
      name: "Espadón maldito",
      attackType: "melee",
      attackBonus: 15,
      damageBase: "3d6",
      damageBonus: 0
    }
  },
  {
    name: "Lord liche",
    type: "npc",
    img: "icons/magic/death/undead-lich-humanoid-crown-blue.webp",
    system: {
      biography: "Archimago no-muerto de poder legendario. Domina la magia más oscura y terrible.",
      health: { value: 90, max: 90 },
      initiative: 16,
      defense: 17,
      absorption: 0,
      willpower: 20,
      attacks: [],
      cr: 8,
      isMinion: false
    },
    attack: {
      name: "Toque de muerte",
      attackType: "melee",
      attackBonus: 17,
      damageBase: "4d6",
      damageBonus: 0
    }
  },
  {
    name: "Ogro",
    type: "npc",
    img: "icons/creatures/humanoids/ogre-giant-brown.webp",
    system: {
      biography: "Gigante brutal y estúpido. Increíblemente fuerte pero lento.",
      health: { value: 60, max: 60 },
      initiative: 10,
      defense: 14,
      absorption: 1,
      willpower: 8,
      attacks: [],
      cr: 5,
      isMinion: false
    },
    attack: {
      name: "Garrote enorme",
      attackType: "melee",
      attackBonus: 15,
      damageBase: "3d6",
      damageBonus: 0
    }
  },
  {
    name: "Orco",
    type: "npc",
    img: "icons/creatures/humanoids/orc-green.webp",
    system: {
      biography: "Guerrero salvaje y agresivo. Vive para la batalla y el saqueo.",
      health: { value: 20, max: 20 },
      initiative: 14,
      defense: 17,
      absorption: 0,
      willpower: 10,
      attacks: [],
      cr: 1,
      isMinion: true
    },
    attack: {
      name: "Hacha de batalla",
      attackType: "melee",
      attackBonus: 14,
      damageBase: "1d6",
      damageBonus: 2
    }
  },
  {
    name: "Troll",
    type: "npc",
    img: "icons/creatures/humanoids/troll-green.webp",
    system: {
      biography: "Criatura grande con regeneración. Muy difícil de matar permanentemente.",
      health: { value: 50, max: 50 },
      initiative: 12,
      defense: 12,
      absorption: 1,
      willpower: 10,
      attacks: [],
      cr: 4,
      isMinion: false
    },
    attack: {
      name: "Garras",
      attackType: "melee",
      attackBonus: 14,
      damageBase: "3d6",
      damageBonus: 0
    }
  }
];

const pack = game.packs.get("ryf3.npcs-es");
if (!pack) {
  ui.notifications.error("No se encontró el compendio de NPCs en español");
} else {
  let created = 0;
  for (const npcData of npcs) {
    const attackData = npcData.attack;
    delete npcData.attack;

    const npc = await Actor.create(npcData, { pack: pack.collection });

    const attackItemData = {
      name: attackData.name,
      type: "npc-attack",
      img: "icons/skills/melee/strike-sword-steel-yellow.webp",
      system: {
        description: "",
        attackType: attackData.attackType,
        attackBonus: attackData.attackBonus,
        damage: {
          base: attackData.damageBase,
          bonus: attackData.damageBonus
        }
      }
    };

    await npc.createEmbeddedDocuments("Item", [attackItemData]);
    created++;
  }
  ui.notifications.info(`Se crearon ${created} NPCs en el compendio español`);
}

