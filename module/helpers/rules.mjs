// Core rule values for RyF 3.0. Every entry cites the printed page of the
// official PDF it comes from. GMs can override any value from the RulesConfig
// menu (stored in the hidden `ryf3.coreRules` world setting). Code must always
// read these values through getRule() so overrides apply everywhere.
export const DEFAULT_RULES = {
  // Reference: RyF 3.0 PDF, página 21 - Defensa = Destreza + Esquivar + 5
  defenseBase: 5,
  // Reference: RyF 3.0 PDF, página 94 - Voluntad = Carisma + Inteligencia + 5
  willpowerBase: 5,
  // Reference: RyF 3.0 PDF, página 20 - malherido cuando PV <= Físico (x1)
  woundedMultiplier: 1,
  // Reference: RyF 3.0 PDF, página 21 - inconsciente al llegar a 0 PV
  unconsciousThreshold: 0,
  // Reference: RyF 3.0 PDF, página 21 - la muerte requiere Físico x6 de daño;
  // implementado como PV negativos (-Físico x6), desviación intencionada
  deathMultiplier: 6,
  // Reference: RyF 3.0 PDF, páginas 6 y 67 - atributos entre 4 y 10 en creación
  attributeMin: 4,
  attributeMax: 10,
  // Reference: RyF 3.0 PDF, página 20 - 2 acciones con iniciativa 20+, 3 con 30+...
  actionsStep: 10,
  // Reference: RyF 3.0 PDF, página 103 - dos armas ligeras de una mano: +3 al ataque
  dualWieldBonus: 3,
  // Reference: RyF 3.0 PDF, páginas 21 y 93 - dificultad por banda de distancia
  rangePointBlank: 10,
  rangeShort: 15,
  rangeMedium: 20,
  rangeLong: 25,
  // Reference: RyF 3.0 PDF, páginas 14 y 38 - subir una habilidad cuesta el
  // nuevo nivel en PX; multiplicador opcional (x1.5 / x2) para campañas largas
  xpCostMultiplier: 1,
  // Reference: RyF 3.0 PDF, página 43 - Cordura = Inteligencia x N (módulo
  // opcional enableSanity)
  sanityMultiplier: 4,
  // Reference: RyF 3.0 PDF, páginas 11-12 y 45 - curación por habilidad
  // (Medicina, Sanación/Hierbas): dificultad 15, cura 1d6 (realista) / 2d6
  // (heroico) + 1d6 por cada 10 de margen; una vez al día por paciente
  healSkillDifficulty: 15,
  healSkillDice: '2d6',
  // Reference: RyF 3.0 PDF, página 94 - Coger aire: tras un combate, 5-15 min
  // de relajación recuperan 1d6 (realista) / 2d6 (épica) PV, limitado al daño
  // recibido en ese combate
  breatherDice: '2d6',
  // Descanso corto: cura Físico / divisor. Regla de la casa intencionada; el
  // manual solo define la curación natural nocturna (pág. 94)
  shortRestDivisor: 2,
  // Descanso largo con recuperación total: regla de la casa intencionada. Si se
  // desactiva, cura N PV por noche (RyF 3.0 PDF, página 94: 1-2 según comodidad)
  longRestFull: true,
  longRestHealAmount: 2,
  // Reference: RyF 3.0 PDF, página 39 - máximo 6 puntos por habilidad en creación
  creationMaxSkill: 6,
  // Reference: RyF 3.0 PDF, página 39 - atributo + habilidad no puede superar 16
  // al empezar a jugar
  creationMaxSum: 16,
  // Reference: RyF 3.0 PDF, página 95 - tabla de localización de daño con 1d10.
  // La tabla nunca llegó a imprimirse en el manual (errata): estos defaults
  // respetan el único dato canónico del texto (4 = pierna derecha), con el
  // torso como zona más probable y la cabeza en el 10. Los modificadores de
  // defensa del tiro apuntado siguen la escala de cobertura de la pág. 93.
  // Rango en texto ("1-2" o "10"); modificador de defensa numérico.
  hitLocLeftLegRange: '1-2',
  hitLocLeftLegDef: 4,
  hitLocRightLegRange: '3-4',
  hitLocRightLegDef: 4,
  hitLocTorsoRange: '5-7',
  hitLocTorsoDef: 2,
  hitLocLeftArmRange: '8',
  hitLocLeftArmDef: 4,
  hitLocRightArmRange: '9',
  hitLocRightArmDef: 4,
  hitLocHeadRange: '10',
  hitLocHeadDef: 5,
  // Reference: RyF 3.0 PDF, página 103 - PV de la nave = Barreras Defensivas x 10
  shipHullMultiplier: 10,
  // Reference: RyF 3.0 PDF, página 103 - el piloto usa Destreza + Pilotar y el
  // artillero Destreza + Artillería; nombres de habilidad configurables por si
  // la mesa usa otros
  shipPilotSkill: 'Pilotar',
  shipGunnerSkill: 'Artillería'
};

export function getRule(key) {
  const stored = game.settings.get('ryf3', 'coreRules') || {};
  const value = stored[key];
  if (value === undefined || value === null || value === '') return DEFAULT_RULES[key];
  return value;
}
