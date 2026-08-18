import { getRule } from '../helpers/rules.mjs';

// Reference: RyF 3.0 PDF, página 95 - localización de daño con 1d10 (módulo
// opcional). NOTA: la tabla nunca llegó a imprimirse en el manual (errata);
// la distribución por defecto respeta el único dato canónico del texto
// (ejemplo de la pág. 95: 4 = pierna derecha), con el torso como zona más
// probable y la cabeza en el 10. Toda la tabla es editable desde el menú de
// Reglas del Sistema (claves hitLoc* en DEFAULT_RULES).
const ZONES = [
  { key: 'leftLeg', label: 'RYF.HitLocations.LeftLeg', rangeRule: 'hitLocLeftLegRange', defRule: 'hitLocLeftLegDef' },
  { key: 'rightLeg', label: 'RYF.HitLocations.RightLeg', rangeRule: 'hitLocRightLegRange', defRule: 'hitLocRightLegDef' },
  { key: 'torso', label: 'RYF.HitLocations.Torso', rangeRule: 'hitLocTorsoRange', defRule: 'hitLocTorsoDef' },
  { key: 'leftArm', label: 'RYF.HitLocations.LeftArm', rangeRule: 'hitLocLeftArmRange', defRule: 'hitLocLeftArmDef' },
  { key: 'rightArm', label: 'RYF.HitLocations.RightArm', rangeRule: 'hitLocRightArmRange', defRule: 'hitLocRightArmDef' },
  { key: 'head', label: 'RYF.HitLocations.Head', rangeRule: 'hitLocHeadRange', defRule: 'hitLocHeadDef' }
];

// Acepta "5-7" (rango) o "10" (valor único)
function parseRange(text) {
  const match = String(text ?? '').trim().match(/^(\d+)(?:\s*-\s*(\d+))?$/);
  if (!match) return null;

  const min = parseInt(match[1]);
  const max = match[2] ? parseInt(match[2]) : min;
  return { min: Math.min(min, max), max: Math.max(min, max) };
}

export function getHitLocations() {
  const locations = {};

  for (const zone of ZONES) {
    const range = parseRange(getRule(zone.rangeRule));
    if (!range) continue;

    locations[zone.key] = {
      min: range.min,
      max: range.max,
      label: zone.label,
      defenseModifier: getRule(zone.defRule) || 0
    };
  }

  return locations;
}

export function getHitLocation(dieValue, locations = null) {
  locations = locations || getHitLocations();
  const entry = Object.entries(locations)
    .find(([, location]) => dieValue >= location.min && dieValue <= location.max);
  return entry ? entry[0] : 'torso';
}
