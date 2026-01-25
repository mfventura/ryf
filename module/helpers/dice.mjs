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
  
  if (chosenValue === 10) {
    exploded = true;
    let explosionRoll = await new Roll('1d10').evaluate();
    let explosionValue = explosionRoll.total;
    explosions.push(explosionValue);
    result += explosionValue;
    
    while (explosionValue === 10) {
      explosionRoll = await new Roll('1d10').evaluate();
      explosionValue = explosionRoll.total;
      explosions.push(explosionValue);
      result += explosionValue;
    }
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

export function isSuccess(result, difficulty) {
  return result >= difficulty;
}

