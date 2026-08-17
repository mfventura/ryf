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

export function getDifficultyLabel(difficulty) {
  if (difficulty <= 10) return 'RYF.Difficulty.VeryEasy';
  if (difficulty <= 15) return 'RYF.Difficulty.Easy';
  if (difficulty <= 20) return 'RYF.Difficulty.Average';
  if (difficulty <= 25) return 'RYF.Difficulty.Hard';
  if (difficulty <= 30) return 'RYF.Difficulty.VeryHard';
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

// Reference: RyF 3.0 PDF, páginas 18 y 20 - un factor negativo (malherido,
// habilidad sin puntos) baja un rango el dado objetivo; no se acumula si ya
// se guarda el dado menor
export function degradeMode(mode) {
  if (mode === 'advantage') return 'normal';
  return 'disadvantage';
}

