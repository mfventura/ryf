import { roll1o3d10, rollEffect, calculateCriticalDice, checkFumble, isSuccess, resolveMode } from '../helpers/dice.mjs';
import { getHitLocations, getHitLocation } from '../config/hit-locations.mjs';

export class RyfRoll {

  // Reference: RyF 3.0 PDF, páginas 17-18 y 91-92 - factores que desplazan el
  // rango del dado objetivo. Consume la deuda de token pendiente y gasta el
  // token de la muerte si el jugador lo marcó en el diálogo.
  static async _collectFactors(actor, { untrained = false, specialization = false, spendToken = false } = {}) {
    const ups = [];
    const downs = [];

    if (actor.system.states?.wounded || actor.statuses?.has('wounded')) downs.push('wounded');
    if (untrained) downs.push('untrained');

    // Reference: RyF 3.0 PDF, página 92 - cuando el máster devuelve el token,
    // la siguiente tirada baja un rango el dado objetivo
    if (actor.isOwner && actor.getFlag('ryf3', 'tokenDebt')) {
      downs.push('tokenDebt');
      await actor.unsetFlag('ryf3', 'tokenDebt');
    }

    // Reference: RyF 3.0 PDF, páginas 17-18 y 98 - la especialización aplicable
    // sube un rango el dado objetivo
    if (specialization) ups.push('specialization');

    // Reference: RyF 3.0 PDF, páginas 91-92 - gastar el token antes de la
    // tirada sube un rango el dado objetivo
    if (spendToken && await actor.spendDeathToken?.()) ups.push('token');

    return { ups, downs };
  }

  static async rollSkill(actor, skillName, difficulty = 15, mode = 'normal', modifier = 0, options = {}) {
    const skill = actor.items.find(i => i.type === 'skill' && i.name.toLowerCase() === skillName.toLowerCase());

    if (!skill) {
      ui.notifications.warn(game.i18n.format('RYF.Warnings.SkillNotFound', { skill: skillName }));
      return null;
    }

    const attribute = actor.system.attributes[skill.system.attribute];
    const attributeValue = attribute ? attribute.value : 0;
    const skillLevel = skill.system.level || 0;

    const effectBonus = actor.system.activeEffectBonuses?.skills?.[skill.name] || 0;

    const hindrance = (skill.system.attribute === 'destreza') ? (actor.system.combat?.hindrance || 0) : 0;

    // Reference: RyF 3.0 PDF, páginas 17-18 - desplazamiento de rango del dado objetivo
    const factors = await this._collectFactors(actor, {
      untrained: skillLevel === 0,
      specialization: options.specialization,
      spendToken: options.spendToken
    });
    mode = resolveMode(mode, factors);

    const diceRoll = await roll1o3d10(mode);

    const total = attributeValue + skillLevel + effectBonus + diceRoll.result - hindrance + modifier;

    const fumble = checkFumble(diceRoll.dice, diceRoll.chosen);
    const success = isSuccess(total, difficulty, fumble, diceRoll.chosen);
    const margin = total - difficulty;
    const criticalDice = success ? calculateCriticalDice(total, difficulty) : 0;

    const rollData = {
      type: 'skill',
      actor: actor,
      skill: skill,
      skillName: skillName,
      attribute: skill.system.attribute,
      attributeValue: attributeValue,
      skillLevel: skillLevel,
      effectBonus: effectBonus,
      difficulty: difficulty,
      mode: mode,
      hindrance: hindrance,
      modifier: modifier,
      diceRoll: diceRoll,
      total: total,
      success: success,
      margin: margin,
      fumble: fumble,
      criticalDice: criticalDice
    };

    await this.toMessage(rollData);

    return rollData;
  }
  
  // Reference: RyF 3.0 PDF, páginas 93-94 - modificadores a la dificultad de
  // los ataques a distancia: cobertura, movimiento del blanco y flanqueos.
  // Campos compartidos por el diálogo de ataque de personaje y el de PNJ.
  static rangedModifiersFields() {
    return `
      <div class="form-group">
        <label>${game.i18n.localize('RYF.Combat.Cover')}</label>
        <select name="cover">
          <option value="0" selected>${game.i18n.localize('RYF.Combat.CoverNone')}</option>
          <option value="2">${game.i18n.localize('RYF.Combat.CoverProne')} (+2)</option>
          <option value="3">${game.i18n.localize('RYF.Combat.CoverSmall')} (+3)</option>
          <option value="4">${game.i18n.localize('RYF.Combat.CoverLarge')} (+4)</option>
          <option value="5">${game.i18n.localize('RYF.Combat.CoverWall')} (+5)</option>
          <option value="10">${game.i18n.localize('RYF.Combat.CoverTotal')} (+10)</option>
        </select>
      </div>
      <div class="form-group">
        <label>${game.i18n.localize('RYF.Combat.TargetMovement')}</label>
        <select name="targetMovement">
          <option value="0" selected>${game.i18n.localize('RYF.Combat.MovementNone')}</option>
          <option value="2">${game.i18n.localize('RYF.Combat.MovementRunning')} (+2)</option>
          <option value="4">${game.i18n.localize('RYF.Combat.MovementVehicle')} (+4)</option>
        </select>
      </div>
      <div class="form-group">
        <label>${game.i18n.localize('RYF.Combat.Flanking')}</label>
        <input type="number" name="flanking" value="0" min="0" step="1"/>
      </div>`;
  }

  static readRangedModifiers(html) {
    const cover = parseInt(html.find('[name="cover"]').val()) || 0;
    const movement = parseInt(html.find('[name="targetMovement"]').val()) || 0;
    // El flanqueo lo aprovecha el atacante: se resta de la dificultad
    // (+1 acumulativo por cada tirador adicional desde otra posición, pág. 93-94)
    const flanking = parseInt(html.find('[name="flanking"]').val()) || 0;
    const total = cover + movement - flanking;

    if (cover === 0 && movement === 0 && flanking === 0) return null;
    return { cover, movement, flanking, total };
  }

  // Reference: RyF 3.0 PDF, página 95 - tiro apuntado: elegir zona concreta
  // sube la defensa del objetivo. Campo compartido por los diálogos de ataque.
  static calledShotField() {
    if (!game.settings.get('ryf3', 'enableHitLocation')) return '';

    const options = Object.entries(getHitLocations()).map(([key, location]) =>
      `<option value="${key}">${game.i18n.localize(location.label)} (+${location.defenseModifier})</option>`
    ).join('');

    return `
      <div class="form-group">
        <label>${game.i18n.localize('RYF.CalledShot')}</label>
        <select name="calledShot">
          <option value="" selected>${game.i18n.localize('RYF.CalledShotRandom')}</option>
          ${options}
        </select>
      </div>`;
  }

  // Reference: RyF 3.0 PDF, página 95 - localización de daño (módulo opcional):
  // 1d10 aleatorio al impactar, o la zona elegida si fue un tiro apuntado
  static async _resolveHitLocation(success, calledShot = null) {
    if (!game.settings.get('ryf3', 'enableHitLocation') || !success) return null;

    const locations = getHitLocations();

    if (calledShot && locations[calledShot]) {
      return { key: calledShot, label: locations[calledShot].label, called: true };
    }

    const roll = await new Roll('1d10').evaluate();
    const key = getHitLocation(roll.total, locations);
    return { key: key, label: locations[key].label, roll: roll.total, called: false };
  }

  // Núcleo compartido de una tirada 1o3d10 contra dificultad: degradación por
  // malherido, pifia y fallo automático con 1 natural (RyF 3.0 PDF, págs. 18-20)
  static async _resolveRoll(base, difficulty, mode, modifier, wounded) {
    mode = resolveMode(mode, { downs: wounded ? ['wounded'] : [] });

    const diceRoll = await roll1o3d10(mode);
    const total = base + diceRoll.result + modifier;

    const fumble = checkFumble(diceRoll.dice, diceRoll.chosen);
    const success = isSuccess(total, difficulty, fumble, diceRoll.chosen);
    const margin = total - difficulty;
    const criticalDice = success ? calculateCriticalDice(total, difficulty) : 0;

    return { mode, diceRoll, total, fumble, success, margin, criticalDice };
  }

  static async rollAttack(actor, weapon, targetDefense, mode = 'normal', modifier = 0, options = {}) {
    // Reference: RyF 3.0 PDF, páginas 87-88 - los PNJ usan un bono plano de
    // ataque en lugar de atributo + habilidad, pero comparten el resto de
    // reglas de la tirada (malherido, pifia, 1 natural, crítico)
    if (weapon.type === 'npc-attack') {
      // Reference: RyF 3.0 PDF, página 95 - el tiro apuntado sube la defensa
      // del objetivo según la zona elegida
      if (options.calledShot) {
        targetDefense += getHitLocations()[options.calledShot]?.defenseModifier || 0;
      }

      const wounded = actor.system.states?.wounded || actor.statuses?.has('wounded') || false;
      const attackBonus = weapon.system.attackBonus || 0;
      const resolved = await this._resolveRoll(attackBonus, targetDefense, mode, modifier, wounded);

      const rollData = {
        type: 'npc-attack',
        actor: actor,
        actorName: actor.name,
        actorImg: actor.img,
        attackName: weapon.name,
        attackType: weapon.system.attackType,
        attackBonus: attackBonus,
        difficulty: targetDefense,
        modifier: modifier,
        rangedModifiers: options.rangedModifiers || null,
        hitLocation: await this._resolveHitLocation(resolved.success, options.calledShot),
        // Reference: RyF 3.0 PDF, página 87 - esbirros: caen al golpe y cada
        // +5 de margen derriba un esbirro adicional
        minionNote: (resolved.success && options.targetIsMinion) ? { extra: Math.floor(resolved.margin / 5) } : null,
        ...resolved
      };

      await this.toMessage(rollData);

      return rollData;
    }

    // Reference: RyF 3.0 PDF, página 95 - el tiro apuntado sube la defensa
    // del objetivo según la zona elegida
    if (options.calledShot) {
      targetDefense += getHitLocations()[options.calledShot]?.defenseModifier || 0;
    }

    const weaponCategory = this._getWeaponSkillCategory(weapon);

    if (!weaponCategory) {
      ui.notifications.warn(game.i18n.localize('RYF.Warnings.NoWeaponSkill'));
      return null;
    }

    let skill = actor.items.find(i => i.type === 'skill' && i.system.category === weaponCategory);
    let skillLevel = 0;
    let skillName = game.i18n.localize('RYF.Combat.Untrained');
    let attributeName = 'fisico';
    let hasSkill = true;

    if (!skill) {
      ui.notifications.info(game.i18n.format('RYF.Combat.UntrainedAttack', { category: game.i18n.localize(`RYF.SkillCategories.${weaponCategory}`) }));
      hasSkill = false;

      if (weaponCategory === 'melee') {
        attributeName = 'fisico';
      } else if (weaponCategory === 'ranged' || weaponCategory === 'firearms') {
        attributeName = 'destreza';
      }
    } else {
      skillLevel = skill.system.level || 0;
      skillName = skill.name;
      attributeName = skill.system.attribute;
    }

    const attribute = actor.system.attributes[attributeName];
    const attributeValue = attribute ? attribute.value : 0;

    const skillEffectBonus = (skill && actor.system.activeEffectBonuses?.skills?.[skill.name]) || 0;

    const attackBonus = weaponCategory === 'melee'
      ? (actor.system.activeEffectBonuses?.attackMelee || 0)
      : (actor.system.activeEffectBonuses?.attackRanged || 0);

    const weaponAttackBonus = (actor.system.activeEffectBonuses?.weaponsAttack?.[weapon.name]) || 0;

    // Reference: RyF 3.0 PDF, página 95 - la precisión del arma modifica la
    // tirada de ataque
    const precision = weapon.system.precision || 0;

    // Reference: RyF 3.0 PDF, páginas 17-18 - sin puntos en la habilidad (o sin
    // habilidad) y malherido bajan un rango el dado objetivo; especialización y
    // token lo suben. El clamp de resolveMode impide acumular más allá del
    // dado menor/mayor
    const factors = await this._collectFactors(actor, {
      untrained: !hasSkill || skillLevel === 0,
      specialization: options.specialization,
      spendToken: options.spendToken
    });
    mode = resolveMode(mode, factors);

    const diceRoll = await roll1o3d10(mode);

    const total = attributeValue + skillLevel + skillEffectBonus + attackBonus + weaponAttackBonus + precision + diceRoll.result + modifier;

    const fumble = checkFumble(diceRoll.dice, diceRoll.chosen);
    const success = isSuccess(total, targetDefense, fumble, diceRoll.chosen);
    const margin = total - targetDefense;
    const criticalDice = success ? calculateCriticalDice(total, targetDefense) : 0;

    const rollData = {
      type: 'attack',
      actor: actor,
      weapon: weapon,
      skill: skill,
      skillName: skillName,
      attribute: attributeName,
      attributeValue: attributeValue,
      skillLevel: skillLevel,
      skillEffectBonus: skillEffectBonus,
      attackBonus: attackBonus,
      weaponAttackBonus: weaponAttackBonus,
      targetDefense: targetDefense,
      mode: mode,
      modifier: modifier,
      precision: precision,
      range: options.range || null,
      rangedModifiers: options.rangedModifiers || null,
      hitLocation: await this._resolveHitLocation(success, options.calledShot),
      // Reference: RyF 3.0 PDF, página 87 - esbirros: caen al golpe y cada
      // +5 de margen derriba un esbirro adicional
      minionNote: (success && options.targetIsMinion) ? { extra: Math.floor(margin / 5) } : null,
      diceRoll: diceRoll,
      total: total,
      success: success,
      margin: margin,
      fumble: fumble,
      criticalDice: criticalDice,
      untrained: !hasSkill
    };

    await this.toMessage(rollData);

    return rollData;
  }
  
  static async rollDamage(weapon, criticalDice = 0, bonus = 0, actor = null, range = null) {
    // Reference: RyF 3.0 PDF, página 25 - algunas armas tienen daño distinto
    // por banda de distancia (ej. escopeta recortada 4d6/3d6/2d6); a bocajarro
    // se usa el daño de la banda corta
    const byRange = weapon.system.damage?.byRange || {};
    const bandKey = range === 'pointblank' ? 'short' : range;
    const baseDamage = (bandKey && byRange[bandKey])
      ? byRange[bandKey]
      : (weapon.system.damage?.base || '1d6');
    const damageBonus = weapon.system.damage?.bonus || 0;

    let effectBonus = 0;
    if (actor) {
      if (actor.system.activeEffectBonuses?.weaponsDamage) {
        effectBonus = actor.system.activeEffectBonuses.weaponsDamage[weapon.name] || 0;
      }

      // Reference: RyF 3.0 PDF, página 98 - ventajas Golpe Duro (+1 daño CC)
      // y Certero (+1 daño a distancia)
      const category = weapon.system.category || 'melee';
      effectBonus += category === 'melee'
        ? (actor.system.activeEffectBonuses?.damageMelee || 0)
        : (actor.system.activeEffectBonuses?.damageRanged || 0);
    }

    const baseRoll = await rollEffect(baseDamage);
    let total = baseRoll.total + damageBonus + bonus + effectBonus;

    let criticalRoll = null;
    if (criticalDice > 0) {
      criticalRoll = await rollEffect(`${criticalDice}d6`);
      total += criticalRoll.total;
    }

    const rollData = {
      type: 'damage',
      weapon: weapon,
      actor: actor,
      baseDamage: baseDamage,
      baseRoll: baseRoll,
      damageBonus: damageBonus,
      bonus: bonus,
      effectBonus: effectBonus,
      criticalDice: criticalDice,
      criticalRoll: criticalRoll,
      // Reference: RyF 3.0 PDF, página 22 - armas que ignoran la absorción (mazas)
      ignoresArmor: !!weapon.system.ignoresArmor,
      total: total
    };

    await this.toMessage(rollData);

    return rollData;
  }

  // Reference: RyF 3.0 PDF, página 103 (detalle en el doc "RyF 3.0 Medieval") -
  // luchando con dos armas ligeras el daño causado es el mayor de las armas usadas
  static async rollDualDamage(weaponA, weaponB, criticalDice = 0, actor = null) {
    const rollWeaponDamage = async (weapon) => {
      const baseRoll = await rollEffect(weapon.system.damage?.base || '1d6');
      let total = baseRoll.total + (weapon.system.damage?.bonus || 0);
      if (actor) {
        total += actor.system.activeEffectBonuses?.weaponsDamage?.[weapon.name] || 0;
        total += actor.system.activeEffectBonuses?.damageMelee || 0;
      }
      return { weapon: weapon, baseRoll: baseRoll, total: total };
    };

    const resultA = await rollWeaponDamage(weaponA);
    const resultB = await rollWeaponDamage(weaponB);
    const kept = resultA.total >= resultB.total ? resultA : resultB;

    let criticalRoll = null;
    let total = kept.total;
    if (criticalDice > 0) {
      criticalRoll = await rollEffect(`${criticalDice}d6`);
      total += criticalRoll.total;
    }

    const rollData = {
      type: 'dual-damage',
      actor: actor,
      resultA: resultA,
      resultB: resultB,
      keptA: kept === resultA,
      criticalDice: criticalDice,
      criticalRoll: criticalRoll,
      // Reference: RyF 3.0 PDF, página 22 - el daño lo causa el arma que más
      // sacó; si esa ignora armadura, aplica su propiedad
      ignoresArmor: !!kept.weapon.system.ignoresArmor,
      total: total
    };

    await this.toMessage(rollData);

    return rollData;
  }

  // Reference: RyF 3.0 PDF, página 18 - tiradas enfrentadas: gana quien saque
  // el resultado más alto; el empate queda a discreción del máster
  static async rollOpposed(actor, skillName, targetActor, { defenderSkillName = null, defenderBonus = 0 } = {}) {
    const attackerSide = await this._rollOpposedSide(actor, skillName, 0);
    if (!attackerSide) return null;

    const defenderSide = defenderSkillName
      ? await this._rollOpposedSide(targetActor, defenderSkillName, 0)
      : await this._rollOpposedSide(targetActor, null, defenderBonus);
    if (!defenderSide) return null;

    // Reference: RyF 3.0 PDF, página 18 - el 1 natural en el dado objetivo es
    // fallo automático también en tiradas enfrentadas (y la pifia igualmente);
    // si fallan ambos lados, el empate queda a discreción del máster
    const attackerFails = attackerSide.fumble || attackerSide.naturalOne;
    const defenderFails = defenderSide.fumble || defenderSide.naturalOne;

    let winner = null;
    if (attackerFails && !defenderFails) winner = 'defender';
    else if (defenderFails && !attackerFails) winner = 'attacker';
    else if (!attackerFails && !defenderFails) {
      if (attackerSide.total > defenderSide.total) winner = 'attacker';
      else if (defenderSide.total > attackerSide.total) winner = 'defender';
    }

    const rollData = {
      type: 'opposed',
      actor: actor,
      attacker: attackerSide,
      defender: defenderSide,
      winner: winner,
      tie: winner === null
    };

    await this.toMessage(rollData);

    return rollData;
  }

  static async _rollOpposedSide(actor, skillName, flatBonus = 0) {
    let attributeValue = 0;
    let skillLevel = 0;
    let label = game.i18n.localize('RYF.Attribute');
    let untrained = false;
    let hindrance = 0;

    if (skillName) {
      const skill = actor.items.find(i => i.type === 'skill' && i.name.toLowerCase() === skillName.toLowerCase());
      if (!skill) {
        ui.notifications.warn(game.i18n.format('RYF.Warnings.SkillNotFound', { skill: skillName }));
        return null;
      }
      attributeValue = actor.system.attributes?.[skill.system.attribute]?.value || 0;
      skillLevel = skill.system.level || 0;
      skillLevel += actor.system.activeEffectBonuses?.skills?.[skill.name] || 0;
      hindrance = (skill.system.attribute === 'destreza') ? (actor.system.combat?.hindrance || 0) : 0;
      label = skill.name;
      untrained = skill.system.level === 0;
    } else {
      attributeValue = flatBonus;
      label = game.i18n.localize('RYF.Modifier');
    }

    // Reference: RyF 3.0 PDF, páginas 17-18 - sin puntos de habilidad o
    // malherido bajan un rango el dado objetivo también en las enfrentadas
    const factors = await this._collectFactors(actor, { untrained: untrained });
    const mode = resolveMode('normal', factors);

    const diceRoll = await roll1o3d10(mode);

    return {
      actor: actor,
      label: label,
      attributeValue: attributeValue,
      skillLevel: skillLevel,
      hindrance: hindrance,
      mode: mode,
      diceRoll: diceRoll,
      fumble: checkFumble(diceRoll.dice, diceRoll.chosen),
      naturalOne: diceRoll.chosen === 1,
      total: attributeValue + skillLevel + diceRoll.result - hindrance
    };
  }

  // Reference: RyF 3.0 PDF, página 103 - combate de naves: Atacante = Destreza +
  // Artillería + Maniobrabilidad + 1o3d10 vs Defensor = Destreza + Pilotar +
  // Maniobrabilidad + 1o3d10 (los bonos de tripulación se introducen a mano).
  // Persecución (págs. 103-104): Destreza + Pilotar + Velocidad + 1o3d10
  // enfrentada; quien más saca acorta o abre la distancia.
  static async rollShipOpposed(attackerShip, defenderShip, { contest = 'attack', attackerBonus = 0, defenderBonus = 0, damageFormula = null, weaponLabel = null } = {}) {
    const statKey = contest === 'attack' ? 'maneuverability' : 'speed';

    const rollSide = async (ship, bonus) => {
      const diceRoll = await roll1o3d10('normal');
      const shipStat = ship.system[statKey] || 0;
      return {
        ship: ship,
        bonus: bonus,
        shipStat: shipStat,
        diceRoll: diceRoll,
        fumble: checkFumble(diceRoll.dice, diceRoll.chosen),
        naturalOne: diceRoll.chosen === 1,
        total: bonus + shipStat + diceRoll.result
      };
    };

    const attacker = await rollSide(attackerShip, attackerBonus);
    const defender = await rollSide(defenderShip, defenderBonus);

    // Reference: RyF 3.0 PDF, página 18 - el 1 natural y la pifia pierden
    // también las enfrentadas; si fallan ambos, empate a discreción del máster
    const attackerFails = attacker.fumble || attacker.naturalOne;
    const defenderFails = defender.fumble || defender.naturalOne;

    let winner = null;
    if (attackerFails && !defenderFails) winner = 'defender';
    else if (defenderFails && !attackerFails) winner = 'attacker';
    else if (!attackerFails && !defenderFails) {
      if (attacker.total > defender.total) winner = 'attacker';
      else if (defender.total > attacker.total) winner = 'defender';
    }

    // Reference: RyF 3.0 PDF, página 103 - si gana el atacante, impacta y
    // tira el daño del arma (cañón láser 1d6, misil 3d6); si gana el
    // defensor, esquiva
    let damageRoll = null;
    if (contest === 'attack' && winner === 'attacker' && damageFormula) {
      damageRoll = await rollEffect(damageFormula);
    }

    const rollData = {
      type: 'ship',
      actor: attackerShip,
      contest: contest,
      statKey: statKey,
      attacker: attacker,
      defender: defender,
      winner: winner,
      tie: winner === null,
      weaponLabel: weaponLabel,
      damageFormula: damageFormula,
      damageRoll: damageRoll
    };

    await this.toMessage(rollData);

    return rollData;
  }

  static async rollSpellDamage(spell, criticalDice = 0, formula = null, type = null) {
    const damageFormula = formula || spell.system.damage?.formula || '1d6';
    const damageType = type || spell.system.damage?.type || 'magical';

    const baseRoll = await rollEffect(damageFormula);
    let total = baseRoll.total;

    let criticalRoll = null;
    if (criticalDice > 0) {
      criticalRoll = await rollEffect(`${criticalDice}d6`);
      total += criticalRoll.total;
    }

    const rollData = {
      type: 'spell-damage',
      spell: spell,
      damageFormula: damageFormula,
      damageType: damageType,
      baseRoll: baseRoll,
      criticalDice: criticalDice,
      criticalRoll: criticalRoll,
      total: total
    };

    await this.toMessage(rollData);

    return rollData;
  }
  
  static async rollSpell(actor, spell, difficulty = 15, mode = 'normal') {
    const attributeValue = actor.system.attributes.inteligencia.value;
    const spellLevel = spell.system.level || 1;

    const diceRoll = await roll1o3d10(mode);

    const total = attributeValue + spellLevel + diceRoll.result;

    const fumble = checkFumble(diceRoll.dice, diceRoll.chosen);
    const success = isSuccess(total, difficulty, fumble, diceRoll.chosen);
    const margin = total - difficulty;
    const criticalDice = success ? calculateCriticalDice(total, difficulty) : 0;

    const rollData = {
      type: 'spell',
      actor: actor,
      spell: spell,
      attributeValue: attributeValue,
      spellLevel: spellLevel,
      difficulty: difficulty,
      mode: mode,
      diceRoll: diceRoll,
      total: total,
      success: success,
      margin: margin,
      fumble: fumble,
      criticalDice: criticalDice
    };

    await this.toMessage(rollData);

    return rollData;
  }

  static _getWeaponSkillCategory(weapon) {
    return weapon.system.category || 'melee';
  }

  static async rollSpellCasting(actor, spell, difficulty, mode = 'normal', modifier = 0, options = {}) {
    const isNPC = actor.type === 'npc';
    const intelligence = isNPC ? 0 : actor.system.attributes.inteligencia.value;
    const spellLevel = spell.system.level;

    // Reference: RyF 3.0 PDF, página 21 - el estorbo se aplica al lanzamiento
    // de hechizos aunque la tirada vaya por Inteligencia
    const hindrance = actor.system.combat?.hindrance || 0;

    // Reference: RyF 3.0 PDF, página 98 - efectos spell-casting (ej. ventaja
    // Arcano: +1 a tiradas de hechizos)
    const castingBonus = actor.system.activeEffectBonuses?.spellCasting || 0;

    // Reference: RyF 3.0 PDF, página 101 - Quemar maná: +1 a la tirada de
    // lanzamiento por cada 2 puntos de maná extra gastados
    const burnBonus = options.burnBonus || 0;

    // Reference: RyF 3.0 PDF, páginas 17-18 - desplazamiento de rango del dado objetivo
    const factors = await this._collectFactors(actor, { spendToken: options.spendToken });
    mode = resolveMode(mode, factors);

    const diceRoll = await roll1o3d10(mode);

    const total = intelligence + spellLevel + castingBonus + burnBonus + diceRoll.result - hindrance + modifier;

    const fumble = checkFumble(diceRoll.dice, diceRoll.chosen);
    const success = isSuccess(total, difficulty, fumble, diceRoll.chosen);
    const margin = total - difficulty;
    const criticalDice = success ? calculateCriticalDice(total, difficulty) : 0;

    const rollData = {
      type: 'spell-casting',
      actor: actor,
      spell: spell,
      intelligence: intelligence,
      spellLevel: spellLevel,
      difficulty: difficulty,
      mode: mode,
      hindrance: hindrance,
      castingBonus: castingBonus,
      burnBonus: burnBonus,
      extraMana: options.extraMana || 0,
      modifier: modifier,
      diceRoll: diceRoll,
      total: total,
      success: success,
      margin: margin,
      fumble: fumble,
      criticalDice: criticalDice,
      isNPC: isNPC
    };

    await this.toMessage(rollData);

    return rollData;
  }

  static async rollHealing(spell, targetActor, criticalDice = 0, formula = null) {
    const healingFormula = formula || spell.system.healing?.formula || '1d6';

    const baseRoll = await rollEffect(healingFormula);
    let total = baseRoll.total;

    let criticalRoll = null;
    if (criticalDice > 0) {
      criticalRoll = await rollEffect(`${criticalDice}d6`);
      total += criticalRoll.total;
    }

    const rollData = {
      type: 'healing',
      spell: spell,
      target: targetActor,
      healingFormula: healingFormula,
      baseRoll: baseRoll,
      criticalDice: criticalDice,
      criticalRoll: criticalRoll,
      total: total
    };

    await this.toMessage(rollData);

    return rollData;
  }

  static async rollAttribute(actor, attributeName, difficulty = 15, mode = 'normal', options = {}) {
    let attributeValue;

    if (actor.type === 'npc') {
      const bonus = await this._promptNPCSavingThrowBonus(actor, attributeName, difficulty);
      if (bonus === null) return null;
      attributeValue = bonus;
    } else {
      const attribute = actor.system.attributes[attributeName];

      if (!attribute) {
        ui.notifications.warn(game.i18n.format('RYF.Warnings.AttributeNotFound', { attribute: attributeName }));
        return null;
      }

      attributeValue = attribute.value;
    }

    // Reference: RyF 3.0 PDF, páginas 17-18 - desplazamiento de rango del dado objetivo
    const factors = await this._collectFactors(actor, { spendToken: options.spendToken });
    mode = resolveMode(mode, factors);

    // Reference: RyF 3.0 PDF, página 21 - el estorbo se resta a todas las
    // tiradas de Destreza, también las de atributo puro
    const hindrance = (attributeName === 'destreza') ? (actor.system.combat?.hindrance || 0) : 0;

    const modifier = options.modifier || 0;

    const diceRoll = await roll1o3d10(mode);

    const total = attributeValue + diceRoll.result - hindrance + modifier;

    const fumble = checkFumble(diceRoll.dice, diceRoll.chosen);
    // Reference: RyF 3.0 PDF, página 18 - el 1 natural en el dado objetivo
    // también es fallo automático en salvaciones y tiradas de atributo
    const success = isSuccess(total, difficulty, fumble, diceRoll.chosen);
    const margin = total - difficulty;
    const criticalDice = success ? calculateCriticalDice(total, difficulty) : 0;

    const rollData = {
      type: 'attribute',
      actor: actor,
      attribute: attributeName,
      attributeValue: attributeValue,
      difficulty: difficulty,
      mode: mode,
      hindrance: hindrance,
      modifier: modifier,
      diceRoll: diceRoll,
      total: total,
      success: success,
      margin: margin,
      fumble: fumble,
      criticalDice: criticalDice,
      isNPC: actor.type === 'npc'
    };

    await this.toMessage(rollData);

    return rollData;
  }

  static async _promptNPCSavingThrowBonus(actor, attributeName, difficulty) {
    const attributeLabel = game.i18n.localize(`RYF.Attributes.${attributeName.charAt(0).toUpperCase() + attributeName.slice(1)}`);

    return new Promise((resolve) => {
      new Dialog({
        title: game.i18n.localize('RYF.NPC.SavingThrowBonus'),
        content: `
          <form>
            <div class="npc-info" style="background: var(--ryf-secondary); padding: 8px; border-radius: 4px; margin-bottom: 12px;">
              <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
                <img src="${actor.img}" alt="${actor.name}" style="width: 32px; height: 32px; border-radius: 4px; border: 1px solid var(--ryf-border);"/>
                <strong>${actor.name}</strong>
              </div>
              <div style="display: flex; justify-content: space-between;">
                <span><i class="fas fa-shield-alt"></i> ${game.i18n.localize('RYF.SavingThrow')}: ${attributeLabel}</span>
                <span><i class="fas fa-bullseye"></i> ${game.i18n.localize('RYF.DifficultyLabel')}: ${difficulty}</span>
              </div>
            </div>
            <p style="margin-bottom: 12px; color: var(--ryf-text-secondary);">
              ${game.i18n.localize('RYF.NPC.SavingThrowBonusDescription')}
            </p>
            <div class="form-group">
              <label>${game.i18n.localize('RYF.NPC.SavingThrowBonusLabel')}</label>
              <input type="number" name="bonus" value="0" step="1" autofocus style="width: 100%;"/>
            </div>
          </form>
        `,
        buttons: {
          roll: {
            icon: '<i class="fas fa-dice-d20"></i>',
            label: game.i18n.localize('RYF.Roll'),
            callback: (html) => {
              const bonus = parseInt(html.find('[name="bonus"]').val()) || 0;
              resolve(bonus);
            }
          },
          cancel: {
            icon: '<i class="fas fa-times"></i>',
            label: game.i18n.localize('RYF.Cancel'),
            callback: () => resolve(null)
          }
        },
        default: 'roll',
        close: () => resolve(null)
      }).render(true);
    });
  }

  static async toMessage(rollData) {
    const templateMap = {
      'skill': 'systems/ryf3/templates/chat/skill-roll.hbs',
      'attack': 'systems/ryf3/templates/chat/attack-roll.hbs',
      'damage': 'systems/ryf3/templates/chat/damage-roll.hbs',
      'spell': 'systems/ryf3/templates/chat/spell-roll.hbs',
      'attribute': 'systems/ryf3/templates/chat/attribute-roll.hbs',
      'spell-casting': 'systems/ryf3/templates/chat/spell-casting-roll.hbs',
      'spell-damage': 'systems/ryf3/templates/chat/spell-damage.hbs',
      'healing': 'systems/ryf3/templates/chat/healing-roll.hbs',
      'dual-damage': 'systems/ryf3/templates/chat/dual-damage-roll.hbs',
      'opposed': 'systems/ryf3/templates/chat/opposed-roll.hbs',
      'npc-attack': 'systems/ryf3/templates/chat/npc-attack-roll.hbs',
      'ship': 'systems/ryf3/templates/chat/ship-roll.hbs'
    };

    const template = templateMap[rollData.type];

    if (!template) {
      console.error(`RyF | No template found for roll type: ${rollData.type}`);
      return;
    }

    const html = await renderTemplate(template, rollData);

    const chatData = {
      author: game.user.id,
      speaker: ChatMessage.getSpeaker({ actor: rollData.actor }),
      content: html,
      sound: CONFIG.sounds.dice
    };

    return ChatMessage.create(chatData);
  }
}

