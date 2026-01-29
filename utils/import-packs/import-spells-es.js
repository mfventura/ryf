const spells = [
  // DIFICULTAD 12 - COSTE 1 MANÁ (6 hechizos)
  {
    name: "Disipar Magia",
    type: "spell",
    img: "icons/magic/defensive/shield-barrier-deflect-blue.webp",
    system: {
      description: "Permite cancelar un hechizo activo. La dificultad es igual a la dificultad del hechizo original +2, y el coste de maná es el mismo que el hechizo a disipar.",
      level: 1,
      manaCost: 1,
      castingDifficulty: 12,
      range: { type: "distance", maxDistance: 50 },
      targets: { type: "single", count: 1, areaRadius: 0 },
      effects: []
    }
  },
  {
    name: "Comunicación a distancia",
    type: "spell",
    img: "icons/magic/perception/eye-ringed-glow-angry-large-red.webp",
    system: {
      description: "Permite comunicación telepática con otra persona conocida a cualquier distancia. Dura 10 minutos mientras se mantenga la concentración.",
      level: 1,
      manaCost: 1,
      castingDifficulty: 12,
      range: { type: "personal", maxDistance: 0 },
      targets: { type: "single", count: 2, areaRadius: 0 },
      effects: []
    }
  },
  {
    name: "Convertir Agua",
    type: "spell",
    img: "icons/consumables/drinks/potion-bottle-corked-blue.webp",
    system: {
      description: "Convierte agua en vino, o purifica agua contaminada. El efecto es permanente.",
      level: 1,
      manaCost: 1,
      castingDifficulty: 12,
      range: { type: "touch", maxDistance: 0 },
      targets: { type: "single", count: 1, areaRadius: 0 },
      effects: []
    }
  },
  {
    name: "Luz",
    type: "spell",
    img: "icons/magic/light/orb-lightbulb-gray.webp",
    system: {
      description: "Crea una luz brillante que ilumina 10 metros. Dura 1 hora por nivel del mago.",
      level: 1,
      manaCost: 1,
      castingDifficulty: 12,
      range: { type: "personal", maxDistance: 0 },
      targets: { type: "single", count: 1, areaRadius: 0 },
      effects: []
    }
  },
  {
    name: "Mano de Mago",
    type: "spell",
    img: "icons/magic/control/hand-glow-blue.webp",
    system: {
      description: "Crea una mano invisible que puede manipular objetos a distancia (hasta 5kg). Dura 1 minuto.",
      level: 1,
      manaCost: 1,
      castingDifficulty: 12,
      range: { type: "distance", maxDistance: 10 },
      targets: { type: "single", count: 1, areaRadius: 0 },
      effects: []
    }
  },
  {
    name: "Detectar Magia",
    type: "spell",
    img: "icons/magic/perception/eye-ringed-glow-angry-small-teal.webp",
    system: {
      description: "Permite detectar la presencia de magia en un radio de 10 metros. Dura 10 minutos.",
      level: 1,
      manaCost: 1,
      castingDifficulty: 12,
      range: { type: "personal", maxDistance: 0 },
      targets: { type: "area", count: 1, areaRadius: 10 },
      effects: []
    }
  },

  // DIFICULTAD 14 - COSTE 1 MANÁ (7 hechizos)
  {
    name: "Toque Eléctrico",
    type: "spell",
    img: "icons/magic/lightning/bolt-strike-blue.webp",
    system: {
      description: "Ataque de contacto que inflige 1d6+2 de daño eléctrico.",
      level: 1,
      manaCost: 1,
      castingDifficulty: 14,
      range: { type: "touch", maxDistance: 0 },
      targets: { type: "single", count: 1, areaRadius: 0 },
      effects: [
        {
          id: foundry.utils.randomID(),
          type: "immediate-damage",
          formula: "1d6+2",
          damageType: "lightning",
          requiresAttack: true,
          attackType: "melee",
          savingThrow: { enabled: false, attribute: "destreza", difficulty: 14, halfDamageOnSave: false }
        }
      ]
    }
  },
  {
    name: "Amistad Animal",
    type: "spell",
    img: "icons/environment/creatures/horse-white.webp",
    system: {
      description: "Calma a un animal y lo hace amistoso. El animal no atacará y puede seguir órdenes simples. Dura 1 hora.",
      level: 1,
      manaCost: 1,
      castingDifficulty: 14,
      range: { type: "distance", maxDistance: 10 },
      targets: { type: "single", count: 1, areaRadius: 0 },
      effects: []
    }
  },
  {
    name: "Caída de Pluma",
    type: "spell",
    img: "icons/commodities/materials/feather-white.webp",
    system: {
      description: "Ralentiza la caída de una criatura, evitando daño por caída. Dura 1 minuto.",
      level: 1,
      manaCost: 1,
      castingDifficulty: 14,
      range: { type: "distance", maxDistance: 20 },
      targets: { type: "single", count: 1, areaRadius: 0 },
      effects: []
    }
  },
  {
    name: "Convocatoria",
    type: "spell",
    img: "icons/magic/symbols/runes-star-pentagon-orange.webp",
    system: {
      description: "Invoca a una persona conocida para que aparezca junto al mago. La persona puede resistirse con una tirada de Voluntad.",
      level: 1,
      manaCost: 1,
      castingDifficulty: 14,
      range: { type: "personal", maxDistance: 0 },
      targets: { type: "single", count: 1, areaRadius: 0 },
      effects: []
    }
  },
  {
    name: "Curación",
    type: "spell",
    img: "icons/magic/life/heart-cross-strong-flame-green-yellow.webp",
    system: {
      description: "Cura 1d6+2 puntos de vida al objetivo.",
      level: 1,
      manaCost: 1,
      castingDifficulty: 14,
      range: { type: "touch", maxDistance: 0 },
      targets: { type: "single", count: 1, areaRadius: 0 },
      effects: [
        {
          id: foundry.utils.randomID(),
          type: "immediate-healing",
          formula: "1d6+2"
        }
      ]
    }
  },
  {
    name: "Materializar Arma",
    type: "spell",
    img: "icons/weapons/swords/sword-guard-steel-blue.webp",
    system: {
      description: "Crea un arma mágica temporal (espada, hacha, lanza, etc.) que dura 1 hora. El arma hace 2d6 de daño.",
      level: 1,
      manaCost: 1,
      castingDifficulty: 14,
      range: { type: "personal", maxDistance: 0 },
      targets: { type: "single", count: 1, areaRadius: 0 },
      effects: []
    }
  },
  {
    name: "Pies de Araña",
    type: "spell",
    img: "icons/creatures/invertebrates/spider-large-black.webp",
    system: {
      description: "Permite caminar por paredes y techos como una araña. Dura 10 minutos.",
      level: 1,
      manaCost: 1,
      castingDifficulty: 14,
      range: { type: "personal", maxDistance: 0 },
      targets: { type: "single", count: 1, areaRadius: 0 },
      effects: []
    }
  },

  // DIFICULTAD 16 - COSTE 2 MANÁ (11 hechizos)
  {
    name: "Arma de Fuego",
    type: "spell",
    img: "icons/magic/fire/projectile-fireball-smoke-orange.webp",
    system: {
      description: "Encanta un arma para que haga +1d6 de daño de fuego adicional. Dura 1 minuto.",
      level: 2,
      manaCost: 2,
      castingDifficulty: 16,
      range: { type: "touch", maxDistance: 0 },
      targets: { type: "single", count: 1, areaRadius: 0 },
      effects: [
        {
          id: foundry.utils.randomID(),
          type: "buff",
          target: "weapon-damage",
          targetName: "",
          modifier: 6,
          duration: { type: "fixed", value: 10 }
        }
      ]
    }
  },
  {
    name: "Atravesar",
    type: "spell",
    img: "icons/magic/movement/trail-streak-zigzag-yellow.webp",
    system: {
      description: "Permite atravesar una pared o barrera sólida de hasta 3 metros de grosor.",
      level: 2,
      manaCost: 2,
      castingDifficulty: 16,
      range: { type: "touch", maxDistance: 0 },
      targets: { type: "single", count: 1, areaRadius: 0 },
      effects: []
    }
  },
  {
    name: "Aura de Curación",
    type: "spell",
    img: "icons/magic/life/heart-area-circle-green-yellow.webp",
    system: {
      description: "Crea un aura de 5 metros que cura 1d6 puntos de vida por turno a todos los aliados dentro. Dura 3 turnos.",
      level: 2,
      manaCost: 2,
      castingDifficulty: 16,
      range: { type: "personal", maxDistance: 0 },
      targets: { type: "area", count: 1, areaRadius: 5 },
      effects: [
        {
          id: foundry.utils.randomID(),
          type: "immediate-healing",
          formula: "1d6"
        }
      ]
    }
  },
  {
    name: "Espejo",
    type: "spell",
    img: "icons/magic/control/silhouette-hold-change-blue.webp",
    system: {
      description: "Crea 1d4 copias ilusorias del mago que lo rodean. Cada vez que es atacado, hay una probabilidad de que el ataque golpee una copia en su lugar. Dura 1 minuto.",
      level: 2,
      manaCost: 2,
      castingDifficulty: 16,
      range: { type: "personal", maxDistance: 0 },
      targets: { type: "single", count: 1, areaRadius: 0 },
      effects: []
    }
  },
  {
    name: "Invisibilidad",
    type: "spell",
    img: "icons/magic/perception/shadow-stealth-eyes-purple.webp",
    system: {
      description: "Hace invisible al objetivo. Dura 10 minutos o hasta que el objetivo ataque.",
      level: 2,
      manaCost: 2,
      castingDifficulty: 16,
      range: { type: "touch", maxDistance: 0 },
      targets: { type: "single", count: 1, areaRadius: 0 },
      effects: []
    }
  },
  {
    name: "Rastro Secreto",
    type: "spell",
    img: "icons/environment/wilderness/paw-print.webp",
    system: {
      description: "Permite seguir el rastro de una criatura específica sin importar el terreno. Dura 1 hora.",
      level: 2,
      manaCost: 2,
      castingDifficulty: 16,
      range: { type: "personal", maxDistance: 0 },
      targets: { type: "single", count: 1, areaRadius: 0 },
      effects: []
    }
  },
  {
    name: "Respirar Bajo el Agua",
    type: "spell",
    img: "icons/magic/water/wave-water-blue.webp",
    system: {
      description: "Permite respirar bajo el agua. Dura 1 hora.",
      level: 2,
      manaCost: 2,
      castingDifficulty: 16,
      range: { type: "touch", maxDistance: 0 },
      targets: { type: "single", count: 1, areaRadius: 0 },
      effects: []
    }
  },
  {
    name: "Silencio",
    type: "spell",
    img: "icons/magic/sonic/scream-wail-shout-teal.webp",
    system: {
      description: "Crea una zona de silencio absoluto de 5 metros de radio. No se puede lanzar hechizos verbales dentro. Dura 10 minutos.",
      level: 2,
      manaCost: 2,
      castingDifficulty: 16,
      range: { type: "distance", maxDistance: 30 },
      targets: { type: "area", count: 1, areaRadius: 5 },
      effects: []
    }
  },
  {
    name: "Amistad",
    type: "spell",
    img: "icons/skills/social/diplomacy-handshake.webp",
    system: {
      description: "Hace que el objetivo se vuelva amistoso hacia el mago. El objetivo puede resistirse con una tirada de Voluntad. Dura 1 hora.",
      level: 2,
      manaCost: 2,
      castingDifficulty: 16,
      range: { type: "distance", maxDistance: 10 },
      targets: { type: "single", count: 1, areaRadius: 0 },
      effects: [
        {
          id: foundry.utils.randomID(),
          type: "condition",
          condition: "charmed",
          duration: { type: "fixed", value: 60 },
          savingThrow: { enabled: true, attribute: "carisma", difficulty: 16 }
        }
      ]
    }
  },
  {
    name: "Proyectil Mágico",
    type: "spell",
    img: "icons/magic/light/projectile-beams-salvo-blue.webp",
    system: {
      description: "Lanza 3 proyectiles mágicos que impactan automáticamente. Cada proyectil hace 1d6 de daño de fuerza.",
      level: 2,
      manaCost: 2,
      castingDifficulty: 16,
      range: { type: "distance", maxDistance: 30 },
      targets: { type: "multiple", count: 3, areaRadius: 0 },
      effects: [
        {
          id: foundry.utils.randomID(),
          type: "immediate-damage",
          formula: "1d6",
          damageType: "force",
          requiresAttack: false,
          attackType: "ranged",
          savingThrow: { enabled: false, attribute: "destreza", difficulty: 16, halfDamageOnSave: false }
        }
      ]
    }
  },
  {
    name: "Invocar Lobo",
    type: "spell",
    img: "icons/environment/creatures/wolf-shadow-black.webp",
    system: {
      description: "Invoca un lobo que obedece las órdenes del mago. Dura 1 hora.",
      level: 2,
      manaCost: 2,
      castingDifficulty: 16,
      range: { type: "personal", maxDistance: 0 },
      targets: { type: "single", count: 1, areaRadius: 0 },
      effects: []
    }
  },

  // DIFICULTAD 18 - COSTE 3 MANÁ (16 hechizos)
  {
    name: "Lanza de Sombras",
    type: "spell",
    img: "icons/magic/death/projectile-shadow-bolt-purple.webp",
    system: {
      description: "Lanza un proyectil de energía necrótica que inflige 3d6 de daño necrótico.",
      level: 4,
      manaCost: 3,
      castingDifficulty: 18,
      range: { type: "distance", maxDistance: 30 },
      targets: { type: "single", count: 1, areaRadius: 0 },
      effects: [
        {
          id: foundry.utils.randomID(),
          type: "immediate-damage",
          formula: "3d6",
          damageType: "necrotic",
          requiresAttack: true,
          attackType: "ranged",
          savingThrow: { enabled: false, attribute: "destreza", difficulty: 18, halfDamageOnSave: false }
        }
      ]
    }
  },
  {
    name: "Relámpago",
    type: "spell",
    img: "icons/magic/lightning/bolt-strike-blue.webp",
    system: {
      description: "Lanza un rayo eléctrico en línea recta que inflige 2d6 de daño eléctrico a todos en su trayectoria (30m).",
      level: 4,
      manaCost: 3,
      castingDifficulty: 18,
      range: { type: "distance", maxDistance: 30 },
      targets: { type: "area", count: 1, areaRadius: 30 },
      effects: [
        {
          id: foundry.utils.randomID(),
          type: "immediate-damage",
          formula: "2d6",
          damageType: "lightning",
          requiresAttack: false,
          attackType: "ranged",
          savingThrow: { enabled: true, attribute: "destreza", difficulty: 18, halfDamageOnSave: true }
        }
      ]
    }
  },
  {
    name: "Atar Demonio",
    type: "spell",
    img: "icons/magic/symbols/runes-star-pentagon-orange.webp",
    system: {
      description: "Ata a un demonio o criatura extraplanar, obligándola a obedecer una orden. El objetivo puede resistirse con Voluntad.",
      level: 4,
      manaCost: 3,
      castingDifficulty: 18,
      range: { type: "distance", maxDistance: 10 },
      targets: { type: "single", count: 1, areaRadius: 0 },
      effects: []
    }
  },
  {
    name: "Tentáculos Negros",
    type: "spell",
    img: "icons/magic/death/hand-dirt-undead-zombie.webp",
    system: {
      description: "Invoca tentáculos oscuros del suelo que agarran a todos en un área de 5 metros. Los afectados quedan inmovilizados. Dura 1 minuto.",
      level: 4,
      manaCost: 3,
      castingDifficulty: 18,
      range: { type: "distance", maxDistance: 20 },
      targets: { type: "area", count: 1, areaRadius: 5 },
      effects: [
        {
          id: foundry.utils.randomID(),
          type: "condition",
          condition: "paralyzed",
          duration: { type: "fixed", value: 10 },
          savingThrow: { enabled: true, attribute: "fisico", difficulty: 18 }
        }
      ]
    }
  },
  {
    name: "Infundir Terror",
    type: "spell",
    img: "icons/magic/death/skull-horned-worn-fire-blue.webp",
    system: {
      description: "Causa terror sobrenatural en el objetivo. El objetivo debe superar una tirada de Voluntad o huir aterrorizado. Dura 1 minuto.",
      level: 4,
      manaCost: 3,
      castingDifficulty: 18,
      range: { type: "distance", maxDistance: 20 },
      targets: { type: "single", count: 1, areaRadius: 0 },
      effects: [
        {
          id: foundry.utils.randomID(),
          type: "condition",
          condition: "frightened",
          duration: { type: "fixed", value: 10 },
          savingThrow: { enabled: true, attribute: "carisma", difficulty: 18 }
        }
      ]
    }
  },
  {
    name: "Espejo de Sombras",
    type: "spell",
    img: "icons/magic/control/silhouette-hold-change-blue.webp",
    system: {
      description: "Crea una copia de sombra del mago que puede actuar independientemente. Dura 10 minutos.",
      level: 4,
      manaCost: 3,
      castingDifficulty: 18,
      range: { type: "personal", maxDistance: 0 },
      targets: { type: "single", count: 1, areaRadius: 0 },
      effects: []
    }
  },
  {
    name: "Niebla",
    type: "spell",
    img: "icons/magic/air/fog-gas-smoke-dense-white.webp",
    system: {
      description: "Crea una niebla densa en un área de 10 metros que oscurece la visión. Dura 10 minutos.",
      level: 4,
      manaCost: 3,
      castingDifficulty: 18,
      range: { type: "distance", maxDistance: 30 },
      targets: { type: "area", count: 1, areaRadius: 10 },
      effects: []
    }
  },
  {
    name: "Sentidos Puros",
    type: "spell",
    img: "icons/magic/perception/eye-ringed-glow-angry-large-blue.webp",
    system: {
      description: "Mejora los sentidos del objetivo, otorgando +4 a Percepción. Dura 1 hora por nivel del mago.",
      level: 4,
      manaCost: 3,
      castingDifficulty: 18,
      range: { type: "personal", maxDistance: 0 },
      targets: { type: "single", count: 1, areaRadius: 0 },
      effects: [
        {
          id: foundry.utils.randomID(),
          type: "buff",
          target: "attribute",
          targetName: "percepcion",
          modifier: 4,
          duration: { type: "perLevel", value: 60 }
        }
      ]
    }
  },
  {
    name: "Absorción",
    type: "spell",
    img: "icons/magic/defensive/shield-barrier-glowing-triangle-magenta.webp",
    system: {
      description: "Crea una barrera que reduce todo el daño recibido en 4 puntos. Dura 1 hora por nivel del mago.",
      level: 4,
      manaCost: 3,
      castingDifficulty: 18,
      range: { type: "personal", maxDistance: 0 },
      targets: { type: "single", count: 1, areaRadius: 0 },
      effects: [
        {
          id: foundry.utils.randomID(),
          type: "buff",
          target: "absorption",
          targetName: "",
          modifier: 4,
          duration: { type: "perLevel", value: 60 }
        }
      ]
    }
  },
  {
    name: "Fuerza Sobrehumana",
    type: "spell",
    img: "icons/magic/fire/flame-burning-fist-strike.webp",
    system: {
      description: "Aumenta la fuerza física del objetivo, otorgando +4 a Físico. Dura 1 hora por nivel del mago.",
      level: 4,
      manaCost: 3,
      castingDifficulty: 18,
      range: { type: "personal", maxDistance: 0 },
      targets: { type: "single", count: 1, areaRadius: 0 },
      effects: [
        {
          id: foundry.utils.randomID(),
          type: "buff",
          target: "attribute",
          targetName: "fisico",
          modifier: 4,
          duration: { type: "perLevel", value: 60 }
        }
      ]
    }
  },
  {
    name: "Defensa Mental",
    type: "spell",
    img: "icons/magic/defensive/shield-barrier-glowing-triangle-blue.webp",
    system: {
      description: "Protege la mente del objetivo contra magia, otorgando +4 a salvaciones contra hechizos. Dura 1 hora por nivel del mago.",
      level: 4,
      manaCost: 3,
      castingDifficulty: 18,
      range: { type: "personal", maxDistance: 0 },
      targets: { type: "single", count: 1, areaRadius: 0 },
      effects: [
        {
          id: foundry.utils.randomID(),
          type: "buff",
          target: "defense",
          targetName: "",
          modifier: 4,
          duration: { type: "perLevel", value: 60 }
        }
      ]
    }
  },
  {
    name: "Aura de Poder",
    type: "spell",
    img: "icons/magic/fire/barrier-wall-flame-ring-yellow.webp",
    system: {
      description: "Crea un aura de 10 metros que otorga +1 al ataque y daño de todos los aliados dentro. Dura 1 hora por nivel del mago.",
      level: 4,
      manaCost: 3,
      castingDifficulty: 18,
      range: { type: "personal", maxDistance: 0 },
      targets: { type: "area", count: 1, areaRadius: 10 },
      effects: [
        {
          id: foundry.utils.randomID(),
          type: "buff",
          target: "attack-melee",
          targetName: "",
          modifier: 1,
          duration: { type: "perLevel", value: 60 }
        },
        {
          id: foundry.utils.randomID(),
          type: "buff",
          target: "weapon-damage",
          targetName: "",
          modifier: 1,
          duration: { type: "perLevel", value: 60 }
        }
      ]
    }
  },
  {
    name: "Baile de Viento",
    type: "spell",
    img: "icons/magic/air/wind-tornado-wall-blue.webp",
    system: {
      description: "Crea un vórtice de viento que otorga +4 a Defensa. Dura 1 hora por nivel del mago.",
      level: 4,
      manaCost: 3,
      castingDifficulty: 18,
      range: { type: "personal", maxDistance: 0 },
      targets: { type: "single", count: 1, areaRadius: 0 },
      effects: [
        {
          id: foundry.utils.randomID(),
          type: "buff",
          target: "defense",
          targetName: "",
          modifier: 4,
          duration: { type: "perLevel", value: 60 }
        }
      ]
    }
  },
  {
    name: "Caminar entre Sueños",
    type: "spell",
    img: "icons/magic/perception/eye-ringed-glow-angry-small-purple.webp",
    system: {
      description: "Permite entrar en el plano de los sueños y comunicarse con criaturas dormidas. Dura 1 hora.",
      level: 4,
      manaCost: 3,
      castingDifficulty: 18,
      range: { type: "personal", maxDistance: 0 },
      targets: { type: "single", count: 1, areaRadius: 0 },
      effects: []
    }
  },
  {
    name: "Anticipación",
    type: "spell",
    img: "icons/magic/time/clock-stopwatch-white-blue.webp",
    system: {
      description: "Permite anticipar los movimientos del enemigo, otorgando +2 al ataque y +2 a la defensa. Dura 1 minuto.",
      level: 4,
      manaCost: 3,
      castingDifficulty: 18,
      range: { type: "personal", maxDistance: 0 },
      targets: { type: "single", count: 1, areaRadius: 0 },
      effects: [
        {
          id: foundry.utils.randomID(),
          type: "buff",
          target: "attack-melee",
          targetName: "",
          modifier: 2,
          duration: { type: "fixed", value: 10 }
        },
        {
          id: foundry.utils.randomID(),
          type: "buff",
          target: "defense",
          targetName: "",
          modifier: 2,
          duration: { type: "fixed", value: 10 }
        }
      ]
    }
  },
  {
    name: "Alzar Muerto Viviente",
    type: "spell",
    img: "icons/magic/death/skull-horned-worn-fire-green.webp",
    system: {
      description: "Anima un cadáver como esqueleto o zombi bajo el control del mago. El no-muerto permanece hasta ser destruido.",
      level: 4,
      manaCost: 3,
      castingDifficulty: 18,
      range: { type: "touch", maxDistance: 0 },
      targets: { type: "single", count: 1, areaRadius: 0 },
      effects: []
    }
  },

  // DIFICULTAD 20 - COSTE 4 MANÁ (8 hechizos)
  {
    name: "Bola de Fuego",
    type: "spell",
    img: "icons/magic/fire/projectile-fireball-smoke-large-orange.webp",
    system: {
      description: "Lanza una bola de fuego explosiva que inflige 4d6 de daño de fuego en un área de 5 metros.",
      level: 5,
      manaCost: 4,
      castingDifficulty: 20,
      range: { type: "distance", maxDistance: 40 },
      targets: { type: "area", count: 1, areaRadius: 5 },
      effects: [
        {
          id: foundry.utils.randomID(),
          type: "immediate-damage",
          formula: "4d6",
          damageType: "fire",
          requiresAttack: false,
          attackType: "ranged",
          savingThrow: { enabled: true, attribute: "destreza", difficulty: 20, halfDamageOnSave: true }
        }
      ]
    }
  },
  {
    name: "Toque Vampírico",
    type: "spell",
    img: "icons/magic/death/hand-dirt-undead-zombie-green.webp",
    system: {
      description: "Ataque de contacto que inflige 3d6 de daño necrótico y cura al mago por la mitad del daño infligido.",
      level: 5,
      manaCost: 4,
      castingDifficulty: 20,
      range: { type: "touch", maxDistance: 0 },
      targets: { type: "single", count: 1, areaRadius: 0 },
      effects: [
        {
          id: foundry.utils.randomID(),
          type: "immediate-damage",
          formula: "3d6",
          damageType: "necrotic",
          requiresAttack: true,
          attackType: "melee",
          savingThrow: { enabled: false, attribute: "destreza", difficulty: 20, halfDamageOnSave: false }
        }
      ]
    }
  },
  {
    name: "Campo Antimágico",
    type: "spell",
    img: "icons/magic/defensive/shield-barrier-glowing-triangle-blue.webp",
    system: {
      description: "Crea un campo de 5 metros donde la magia no funciona. Dura 10 minutos.",
      level: 5,
      manaCost: 4,
      castingDifficulty: 20,
      range: { type: "personal", maxDistance: 0 },
      targets: { type: "area", count: 1, areaRadius: 5 },
      effects: []
    }
  },
  {
    name: "Terremoto",
    type: "spell",
    img: "icons/magic/earth/projectile-boulder-brown.webp",
    system: {
      description: "Causa un terremoto en un área de 10 metros. Todos deben superar una tirada de Físico o caer al suelo.",
      level: 5,
      manaCost: 4,
      castingDifficulty: 20,
      range: { type: "distance", maxDistance: 30 },
      targets: { type: "area", count: 1, areaRadius: 10 },
      effects: [
        {
          id: foundry.utils.randomID(),
          type: "condition",
          condition: "prone",
          duration: { type: "fixed", value: 1 },
          savingThrow: { enabled: true, attribute: "fisico", difficulty: 20 }
        }
      ]
    }
  },
  {
    name: "Robar Identidad",
    type: "spell",
    img: "icons/magic/control/silhouette-hold-change-blue.webp",
    system: {
      description: "Permite al mago adoptar la apariencia física y voz de otra persona. Dura 1 hora por nivel del mago.",
      level: 5,
      manaCost: 4,
      castingDifficulty: 20,
      range: { type: "personal", maxDistance: 0 },
      targets: { type: "single", count: 1, areaRadius: 0 },
      effects: []
    }
  },
  {
    name: "Posesión Mental",
    type: "spell",
    img: "icons/magic/control/hypnosis-mesmerism-eye-tan.webp",
    system: {
      description: "Permite al mago poseer el cuerpo de otra criatura. El objetivo puede resistirse con Voluntad. Dura 10 minutos.",
      level: 5,
      manaCost: 4,
      castingDifficulty: 20,
      range: { type: "distance", maxDistance: 10 },
      targets: { type: "single", count: 1, areaRadius: 0 },
      effects: []
    }
  },
  {
    name: "Olvido",
    type: "spell",
    img: "icons/magic/control/hypnosis-mesmerism-swirl-purple.webp",
    system: {
      description: "Borra los recuerdos del objetivo de los últimos 10 minutos. El objetivo puede resistirse con Voluntad.",
      level: 5,
      manaCost: 4,
      castingDifficulty: 20,
      range: { type: "distance", maxDistance: 10 },
      targets: { type: "single", count: 1, areaRadius: 0 },
      effects: []
    }
  },
  {
    name: "Esconderse en las Sombras",
    type: "spell",
    img: "icons/magic/perception/shadow-stealth-eyes-purple.webp",
    system: {
      description: "Permite al mago fundirse con las sombras, volviéndose invisible en áreas oscuras. Dura 1 hora.",
      level: 5,
      manaCost: 4,
      castingDifficulty: 20,
      range: { type: "personal", maxDistance: 0 },
      targets: { type: "single", count: 1, areaRadius: 0 },
      effects: []
    }
  },

  // DIFICULTAD 22 - COSTE 5 MANÁ (5 hechizos)
  {
    name: "Cadena de Relámpagos",
    type: "spell",
    img: "icons/magic/lightning/bolt-strike-forked-blue.webp",
    system: {
      description: "Lanza un relámpago que salta entre objetivos, infligiendo 3d6 de daño eléctrico a hasta 5 objetivos.",
      level: 6,
      manaCost: 5,
      castingDifficulty: 22,
      range: { type: "distance", maxDistance: 40 },
      targets: { type: "multiple", count: 5, areaRadius: 0 },
      effects: [
        {
          id: foundry.utils.randomID(),
          type: "immediate-damage",
          formula: "3d6",
          damageType: "lightning",
          requiresAttack: false,
          attackType: "ranged",
          savingThrow: { enabled: true, attribute: "destreza", difficulty: 22, halfDamageOnSave: true }
        }
      ]
    }
  },
  {
    name: "Rayo Solar",
    type: "spell",
    img: "icons/magic/light/beam-rays-yellow-large.webp",
    system: {
      description: "Invoca un rayo de luz solar que inflige 5d6 de daño radiante. Doble daño contra no-muertos.",
      level: 6,
      manaCost: 5,
      castingDifficulty: 22,
      range: { type: "distance", maxDistance: 50 },
      targets: { type: "single", count: 1, areaRadius: 0 },
      effects: [
        {
          id: foundry.utils.randomID(),
          type: "immediate-damage",
          formula: "5d6",
          damageType: "force",
          requiresAttack: true,
          attackType: "ranged",
          savingThrow: { enabled: false, attribute: "destreza", difficulty: 22, halfDamageOnSave: false }
        }
      ]
    }
  },
  {
    name: "Duplicación",
    type: "spell",
    img: "icons/magic/control/silhouette-hold-change-blue.webp",
    system: {
      description: "Crea una copia física perfecta del mago que puede actuar independientemente. Dura 1 hora.",
      level: 6,
      manaCost: 5,
      castingDifficulty: 22,
      range: { type: "personal", maxDistance: 0 },
      targets: { type: "single", count: 1, areaRadius: 0 },
      effects: []
    }
  },
  {
    name: "Escudo Anti-magia",
    type: "spell",
    img: "icons/magic/defensive/shield-barrier-glowing-triangle-magenta.webp",
    system: {
      description: "Crea un escudo que refleja hechizos de vuelta al lanzador. Dura 10 minutos.",
      level: 6,
      manaCost: 5,
      castingDifficulty: 22,
      range: { type: "personal", maxDistance: 0 },
      targets: { type: "single", count: 1, areaRadius: 0 },
      effects: []
    }
  },
  {
    name: "Ojos de Lince",
    type: "spell",
    img: "icons/magic/perception/eye-ringed-glow-angry-large-red.webp",
    system: {
      description: "Otorga visión perfecta, incluyendo visión en la oscuridad, visión a través de ilusiones y +6 a Percepción. Dura 1 hora por nivel del mago.",
      level: 6,
      manaCost: 5,
      castingDifficulty: 22,
      range: { type: "personal", maxDistance: 0 },
      targets: { type: "single", count: 1, areaRadius: 0 },
      effects: [
        {
          id: foundry.utils.randomID(),
          type: "buff",
          target: "attribute",
          targetName: "percepcion",
          modifier: 6,
          duration: { type: "perLevel", value: 60 }
        }
      ]
    }
  },

  // DIFICULTAD 24 - COSTE 6 MANÁ (2 hechizos)
  {
    name: "Tormenta de Fuego",
    type: "spell",
    img: "icons/magic/fire/explosion-fireball-large-orange.webp",
    system: {
      description: "Crea una tormenta de fuego devastadora en un área de 10 metros que inflige 6d6 de daño de fuego.",
      level: 7,
      manaCost: 6,
      castingDifficulty: 24,
      range: { type: "distance", maxDistance: 50 },
      targets: { type: "area", count: 1, areaRadius: 10 },
      effects: [
        {
          id: foundry.utils.randomID(),
          type: "immediate-damage",
          formula: "6d6",
          damageType: "fire",
          requiresAttack: false,
          attackType: "ranged",
          savingThrow: { enabled: true, attribute: "destreza", difficulty: 24, halfDamageOnSave: true }
        }
      ]
    }
  },
  {
    name: "Teleportarse",
    type: "spell",
    img: "icons/magic/movement/trail-streak-zigzag-yellow.webp",
    system: {
      description: "Permite al mago teleportarse instantáneamente a cualquier lugar que conozca, sin importar la distancia.",
      level: 7,
      manaCost: 6,
      castingDifficulty: 24,
      range: { type: "personal", maxDistance: 0 },
      targets: { type: "single", count: 1, areaRadius: 0 },
      effects: []
    }
  }
];

(async () => {
  const pack = game.packs.get("ryf3.spells-es");
  if (!pack) {
    ui.notifications.error("No se encontró el compendio 'ryf3.spells-es'");
    return;
  }

  ui.notifications.info(`Importando ${spells.length} hechizos al compendio...`);

  for (const spellData of spells) {
    try {
      await Item.create(spellData, { pack: pack.collection });
      console.log(`✓ Hechizo creado: ${spellData.name}`);
    } catch (error) {
      console.error(`✗ Error creando hechizo ${spellData.name}:`, error);
    }
  }

  ui.notifications.info(`¡${spells.length} hechizos importados correctamente!`);
})();
