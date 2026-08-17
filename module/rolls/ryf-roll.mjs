import { roll1o3d10, rollEffect, calculateCriticalDice, checkFumble, isSuccess, degradeMode } from '../helpers/dice.mjs';

export class RyfRoll {
  
  static async rollSkill(actor, skillName, difficulty = 15, mode = 'normal', modifier = 0) {
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

    // Reference: RyF 3.0 PDF, páginas 18 y 20 - habilidad sin puntos o estar
    // malherido baja un rango el dado objetivo (no acumulable)
    if (skillLevel === 0 || actor.system.states?.wounded) {
      mode = degradeMode(mode);
    }

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
  
  static async rollAttack(actor, weapon, targetDefense, mode = 'normal', modifier = 0) {
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

      if (mode !== 'disadvantage') {
        mode = 'disadvantage';
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

    // Reference: RyF 3.0 PDF, página 20 - malherido baja un rango el dado
    // objetivo (no acumulable con el rango ya bajado por falta de habilidad)
    if (actor.system.states?.wounded) {
      mode = degradeMode(mode);
    }

    const diceRoll = await roll1o3d10(mode);

    const total = attributeValue + skillLevel + skillEffectBonus + attackBonus + weaponAttackBonus + diceRoll.result + modifier;

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
  
  static async rollDamage(weapon, criticalDice = 0, bonus = 0, actor = null) {
    const baseDamage = weapon.system.damage?.base || '1d6';
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

    let winner = null;
    if (attackerSide.total > defenderSide.total) winner = 'attacker';
    else if (defenderSide.total > attackerSide.total) winner = 'defender';

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
    let mode = 'normal';
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

      // Reference: RyF 3.0 PDF, páginas 18 y 20 - sin puntos de habilidad o
      // malherido se guarda el dado menor
      if (skill.system.level === 0 || actor.system.states?.wounded) {
        mode = degradeMode(mode);
      }
    } else {
      attributeValue = flatBonus;
      label = game.i18n.localize('RYF.Modifier');
      if (actor.system.states?.wounded) {
        mode = degradeMode(mode);
      }
    }

    const diceRoll = await roll1o3d10(mode);

    return {
      actor: actor,
      label: label,
      attributeValue: attributeValue,
      skillLevel: skillLevel,
      hindrance: hindrance,
      mode: mode,
      diceRoll: diceRoll,
      total: attributeValue + skillLevel + diceRoll.result - hindrance
    };
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
    const success = isSuccess(total, difficulty, fumble);
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

  static async rollSpellCasting(actor, spell, difficulty, mode = 'normal', modifier = 0) {
    const isNPC = actor.type === 'npc';
    const intelligence = isNPC ? 0 : actor.system.attributes.inteligencia.value;
    const spellLevel = spell.system.level;

    // Reference: RyF 3.0 PDF, página 21 - el estorbo se aplica al lanzamiento
    // de hechizos aunque la tirada vaya por Inteligencia
    const hindrance = actor.system.combat?.hindrance || 0;

    // Reference: RyF 3.0 PDF, página 98 - ventaja Arcano: +1 a tiradas de hechizos
    const advantageBonus = (!isNPC && actor.hasAdvantage?.('arcano'))
      ? CONFIG.RYF.advantages.arcano.spellCastingBonus
      : 0;

    // Reference: RyF 3.0 PDF, página 20 - malherido baja un rango el dado objetivo
    if (actor.system.states?.wounded) {
      mode = degradeMode(mode);
    }

    const diceRoll = await roll1o3d10(mode);

    const total = intelligence + spellLevel + advantageBonus + diceRoll.result - hindrance + modifier;

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
      advantageBonus: advantageBonus,
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

  static async rollAttribute(actor, attributeName, difficulty = 15, mode = 'normal') {
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

    // Reference: RyF 3.0 PDF, página 20 - malherido baja un rango el dado objetivo
    if (actor.system.states?.wounded) {
      mode = degradeMode(mode);
    }

    const diceRoll = await roll1o3d10(mode);

    const total = attributeValue + diceRoll.result;

    const fumble = checkFumble(diceRoll.dice, diceRoll.chosen);
    const success = isSuccess(total, difficulty, fumble);
    const margin = total - difficulty;
    const criticalDice = success ? calculateCriticalDice(total, difficulty) : 0;

    const rollData = {
      type: 'attribute',
      actor: actor,
      attribute: attributeName,
      attributeValue: attributeValue,
      difficulty: difficulty,
      mode: mode,
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
      'opposed': 'systems/ryf3/templates/chat/opposed-roll.hbs'
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

