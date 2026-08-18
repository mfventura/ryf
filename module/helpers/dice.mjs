export async function roll1o3d10(mode = 'normal') {
  const roll = await new Roll('3d10').evaluate();
  const dice = roll.terms[0].results.map(r => r.result);
  
  const sorted = [...dice].sort((a, b) => a - b);
  
  let chosenIndex;
  let chosenValue;
  
  switch (mode) {
    case 'advantage':
      chosenIndex = 2;
      chosenValue = sorted[2];
      break;
    case 'disadvantage':
      chosenIndex = 0;
      chosenValue = sorted[0];
      break;
    default:
      chosenIndex = 1;
      chosenValue = sorted[1];
      break;
  }
  
  let result = chosenValue;
  let exploded = false;
  let explosions = [];

  // Reference: RyF 3.0 PDF, página 19 - la explosión se re-tira con 1o3d10
  // completo y se suma el nuevo dado objetivo (mismo rango), repitiendo
  // mientras salga el máximo. Ej. del manual: 10 (3,10,10) + 4 (3,4,7) = 14.
  let explosionValue = chosenValue;
  while (explosionValue === 10) {
    exploded = true;
    const explosionRoll = await new Roll('3d10').evaluate();
    const explosionDice = explosionRoll.terms[0].results.map(r => r.result);
    const explosionSorted = [...explosionDice].sort((a, b) => a - b);
    explosionValue = explosionSorted[chosenIndex];
    explosions.push(explosionValue);
    result += explosionValue;
  }

  return {
    result: result,
    dice: dice,
    sorted: sorted,
    chosen: chosenValue,
    chosenIndex: chosenIndex,
    exploded: exploded,
    explosions: explosions,
    mode: mode,
    roll: roll
  };
}

export async function rollEffect(formula) {
  const roll = await new Roll(formula).evaluate();
  
  let total = 0;
  let allRolls = [];
  let explosions = [];
  
  for (const term of roll.terms) {
    if (term instanceof Die) {
      for (const result of term.results) {
        const value = result.result;
        allRolls.push(value);
        total += value;
        
        if (value === term.faces) {
          let explosionRoll = await new Roll(`1d${term.faces}`).evaluate();
          let explosionValue = explosionRoll.total;
          explosions.push(explosionValue);
          total += explosionValue;
          
          while (explosionValue === term.faces) {
            explosionRoll = await new Roll(`1d${term.faces}`).evaluate();
            explosionValue = explosionRoll.total;
            explosions.push(explosionValue);
            total += explosionValue;
          }
        }
      }
    } else if (term instanceof NumericTerm) {
      total += term.number;
    }
  }
  
  return {
    total: total,
    rolls: allRolls,
    explosions: explosions,
    formula: formula,
    roll: roll
  };
}

export function calculateCriticalDice(result, difficulty) {
  if (result < difficulty) return 0;
  const margin = result - difficulty;
  return Math.floor(margin / 10);
}

export function checkFumble(dice, chosen) {
  const sorted = [...dice].sort((a, b) => a - b);

  if (sorted[0] === 1 && sorted[1] === 1 && sorted[2] === 1) {
    return true;
  }

  if (chosen === 1) {
    let foundChosen = false;
    for (let die of sorted) {
      if (die === 1 && !foundChosen) {
        foundChosen = true;
        continue;
      }
      if (die <= 5) {
        return true;
      }
    }
  }

  return false;
}

// Reference: RyF 3.0 PDF, página 18 - tabla de dificultades de habilidad
export const SKILL_DIFFICULTIES = [
  { value: 10, label: 'RYF.Difficulty.Easy' },
  { value: 15, label: 'RYF.Difficulty.Average' },
  { value: 18, label: 'RYF.Difficulty.Moderate' },
  { value: 20, label: 'RYF.Difficulty.Hard' },
  { value: 25, label: 'RYF.Difficulty.VeryHard' },
  { value: 30, label: 'RYF.Difficulty.NearlyImpossible' }
];

// Reference: RyF 3.0 PDF, página 18 - las tiradas de atributo puro usan una
// tabla de dificultades propia, más baja que la de habilidad
export const ATTRIBUTE_DIFFICULTIES = [
  { value: 9, label: 'RYF.Difficulty.Easy' },
  { value: 12, label: 'RYF.Difficulty.Average' },
  { value: 15, label: 'RYF.Difficulty.Hard' },
  { value: 18, label: 'RYF.Difficulty.VeryHard' },
  { value: 21, label: 'RYF.Difficulty.NearlyImpossible' }
];

export function getDifficultyLabel(difficulty, type = 'skill') {
  const table = type === 'attribute' ? ATTRIBUTE_DIFFICULTIES : SKILL_DIFFICULTIES;
  for (const entry of table) {
    if (difficulty <= entry.value) return entry.label;
  }
  return 'RYF.Difficulty.NearlyImpossible';
}

export function getSuccessMargin(result, difficulty) {
  return result - difficulty;
}

export function isSuccess(result, difficulty, fumble = false, chosenDie = null) {
  if (fumble) return false;
  // Reference: RyF 3.0 PDF, página 18 - un 1 natural en el dado objetivo
  // siempre es fallo en tiradas de habilidad, aunque el total supere la dificultad
  if (chosenDie === 1) return false;
  return result >= difficulty;
}

const MODE_RANKS = { disadvantage: -1, normal: 0, advantage: 1 };
const RANK_MODES = { '-1': 'disadvantage', '0': 'normal', '1': 'advantage' };

// Reference: RyF 3.0 PDF, páginas 17-18 - desplazamiento de rango del dado
// objetivo: los factores favorables (especialización, token) lo suben un rango
// y los desfavorables (malherido, habilidad sin puntos, deuda de token) lo
// bajan; el resultado se acota entre el dado menor y el mayor
export function resolveMode(baseMode = 'normal', { ups = [], downs = [] } = {}) {
  const rank = (MODE_RANKS[baseMode] ?? 0) + ups.length - downs.length;
  return RANK_MODES[String(Math.max(-1, Math.min(1, rank)))];
}

