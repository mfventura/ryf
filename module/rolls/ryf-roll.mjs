import { roll1o3d10, rollEffect, calculateCriticalDice, checkFumble, isSuccess } from '../helpers/dice.mjs';

export class RyfRoll {
  
  static async rollSkill(actor, skillName, difficulty = 15, mode = 'normal') {
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

    const diceRoll = await roll1o3d10(mode);

    const total = attributeValue + skillLevel + effectBonus + diceRoll.result - hindrance;

    const fumble = checkFumble(diceRoll.dice, diceRoll.chosen);
    const success = isSuccess(total, difficulty, fumble);
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

    const diceRoll = await roll1o3d10(mode);

    const total = attributeValue + skillLevel + skillEffectBonus + diceRoll.result + modifier;

    const fumble = checkFumble(diceRoll.dice, diceRoll.chosen);
    const success = isSuccess(total, targetDefense, fumble);
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
      if (actor.system.activeEffectBonuses?.weapons) {
        effectBonus = actor.system.activeEffectBonuses.weapons[weapon.name] || 0;
      }
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

  static async rollSpellDamage(spell, criticalDice = 0) {
    const damageFormula = spell.system.damage?.formula || '1d6';
    const damageType = spell.system.damage?.type || 'magical';

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
    const intelligence = actor.system.attributes.inteligencia.value;
    const spellLevel = spell.system.level;

    const diceRoll = await roll1o3d10(mode);

    const total = intelligence + spellLevel + diceRoll.result + modifier;

    const fumble = checkFumble(diceRoll.dice, diceRoll.chosen);
    const success = isSuccess(total, difficulty, fumble);
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

  static async rollHealing(spell, targetActor, criticalDice = 0) {
    const healingFormula = spell.system.healing?.formula || '1d6';

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
    const attribute = actor.system.attributes[attributeName];

    if (!attribute) {
      ui.notifications.warn(game.i18n.format('RYF.Warnings.AttributeNotFound', { attribute: attributeName }));
      return null;
    }

    const attributeValue = attribute.value;

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
      criticalDice: criticalDice
    };

    await this.toMessage(rollData);

    return rollData;
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
      'healing': 'systems/ryf3/templates/chat/healing-roll.hbs'
    };

    const template = templateMap[rollData.type];

    if (!template) {
      console.error(`RyF | No template found for roll type: ${rollData.type}`);
      return;
    }

    const html = await renderTemplate(template, rollData);

    const chatData = {
      user: game.user.id,
      speaker: ChatMessage.getSpeaker({ actor: rollData.actor }),
      content: html,
      type: CONST.CHAT_MESSAGE_TYPES.ROLL,
      sound: CONFIG.sounds.dice
    };

    return ChatMessage.create(chatData);
  }
}

