export const RYF = {};

RYF.attributes = {
  fisico: "RYF.Attributes.Fisico",
  destreza: "RYF.Attributes.Destreza",
  inteligencia: "RYF.Attributes.Inteligencia",
  percepcion: "RYF.Attributes.Percepcion",
  carisma: "RYF.Attributes.Carisma"
};

RYF.skillPyramids = {
  specialistHeroic: [
    { level: 6, count: 1 },
    { level: 5, count: 3 },
    { level: 4, count: 3 },
    { level: 3, count: 3 },
    { level: 2, count: 3 },
    { level: 1, count: 3 }
  ],
  versatileHeroic: [
    { level: 6, count: 1 },
    { level: 5, count: 2 },
    { level: 4, count: 3 },
    { level: 3, count: 4 },
    { level: 2, count: 5 },
    { level: 1, count: 6 }
  ],
  specialistRealistic: [
    { level: 5, count: 2 },
    { level: 4, count: 2 },
    { level: 3, count: 2 },
    { level: 2, count: 2 },
    { level: 1, count: 2 }
  ],
  versatileRealistic: [
    { level: 5, count: 1 },
    { level: 4, count: 2 },
    { level: 3, count: 3 },
    { level: 2, count: 4 },
    { level: 1, count: 5 }
  ]
};

// Reference: RyF 3.0 PDF, página 98 - Ventajas: cada jugador podrá escoger en
// la creación tan sólo una, siempre que cumpla el requisito entre paréntesis.
// `bonuses` alimenta system.activeEffectBonuses; el resto son ganchos específicos.
RYF.advantages = {
  arcano: {
    requirement: { attribute: 'inteligencia', value: 8 },
    spellCastingBonus: 1
  },
  berseker: {
    requirement: { attribute: 'fisico', value: 8 },
    bonuses: { attackMelee: 2 }
  },
  certero: {
    requirement: { attribute: 'percepcion', value: 8 },
    bonuses: { damageRanged: 1 }
  },
  defensor: {
    requirement: { attribute: 'destreza', value: 8 },
    bonuses: { defense: 1 }
  },
  despiadado: {
    requirement: { attribute: 'fisico', value: 8 },
    manual: true
  },
  golpeDuro: {
    requirement: { attribute: 'fisico', value: 8 },
    bonuses: { damageMelee: 1 }
  },
  manaAbundante: {
    requirement: { attribute: 'inteligencia', value: 8 },
    manaMultiplierBonus: 1
  },
  mulaDeCarga: {
    requirement: { attribute: 'fisico', value: 8 },
    bonuses: { hindranceReduction: 1 }
  },
  muro: {
    requirement: { attribute: 'fisico', value: 8 },
    healthMultiplierBonus: 1
  },
  pielDePiedra: {
    requirement: { attribute: 'fisico', value: 8 },
    bonuses: { absorption: 1 }
  },
  punteria: {
    requirement: { attribute: 'destreza', value: 8 },
    bonuses: { attackRanged: 2 }
  },
  rapido: {
    requirement: { attribute: 'percepcion', value: 8 },
    bonuses: { initiative: 2 }
  },
  recuperacion: {
    requirement: { attribute: 'fisico', value: 8 },
    healingBonus: 2
  },
  suerte: {
    requirement: null,
    manual: true
  }
};

RYF.isCarismaEnabled = function() {
  return game.settings.get('ryf3', 'enableCarisma');
};

RYF.isMagicEnabled = function() {
  return game.settings.get('ryf3', 'enableMagia');
};

RYF.getHealthMultiplier = function() {
  return game.settings.get('ryf3', 'healthMultiplier');
};

RYF.getManaMultiplier = function() {
  return game.settings.get('ryf3', 'manaMultiplier');
};

RYF.getAttributePoints = function() {
  return game.settings.get('ryf3', 'attributePoints');
};

RYF.getActiveAttributes = function() {
  const attrs = {
    fisico: "RYF.Attributes.Fisico",
    destreza: "RYF.Attributes.Destreza",
    inteligencia: "RYF.Attributes.Inteligencia",
    percepcion: "RYF.Attributes.Percepcion"
  };
  
  if (RYF.isCarismaEnabled()) {
    attrs.carisma = "RYF.Attributes.Carisma";
  }
  
  return attrs;
};

RYF.getActivePyramid = function() {
  const type = game.settings.get('ryf3', 'defaultCharacterType');

  if (type === 'custom') {
    const custom = game.settings.get('ryf3', 'customPyramid');
    const maxLevel = game.settings.get('ryf3', 'maxSkillLevel');
    const pyramid = [];

    for (let i = maxLevel; i >= 1; i--) {
      if (custom[`level${i}`] > 0) {
        pyramid.push({ level: i, count: custom[`level${i}`] });
      }
    }

    return pyramid;
  }

  return RYF.skillPyramids[type] || RYF.skillPyramids.specialistHeroic;
};

