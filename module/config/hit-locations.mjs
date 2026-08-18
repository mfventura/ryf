// Reference: RyF 3.0 PDF, página 95 - localización de daño con 1d10 (módulo
// opcional). NOTA: la tabla nunca llegó a imprimirse en el manual (errata);
// esta distribución se acordó con la mesa respetando el único dato canónico
// del texto (ejemplo de la pág. 95: 4 = pierna derecha), con el torso como
// zona más probable y la cabeza en el 10. Los modificadores de defensa del
// tiro apuntado siguen la escala de cobertura de la pág. 93.
export const HIT_LOCATIONS = {
  leftLeg: { min: 1, max: 2, label: 'RYF.HitLocations.LeftLeg', defenseModifier: 4 },
  rightLeg: { min: 3, max: 4, label: 'RYF.HitLocations.RightLeg', defenseModifier: 4 },
  torso: { min: 5, max: 7, label: 'RYF.HitLocations.Torso', defenseModifier: 2 },
  leftArm: { min: 8, max: 8, label: 'RYF.HitLocations.LeftArm', defenseModifier: 4 },
  rightArm: { min: 9, max: 9, label: 'RYF.HitLocations.RightArm', defenseModifier: 4 },
  head: { min: 10, max: 10, label: 'RYF.HitLocations.Head', defenseModifier: 5 }
};

export function getHitLocation(dieValue) {
  const entry = Object.entries(HIT_LOCATIONS)
    .find(([, location]) => dieValue >= location.min && dieValue <= location.max);
  return entry ? entry[0] : 'torso';
}
