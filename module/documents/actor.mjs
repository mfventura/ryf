export class RyfActor extends Actor {

  prepareData() {
    super.prepareData();
  }

  prepareBaseData() {
    super.prepareBaseData();
  }

  prepareDerivedData() {
    const actorData = this;
    const system = actorData.system;
    const flags = actorData.flags.ryf || {};

    this._prepareCharacterData(actorData);
    this._prepareNpcData(actorData);
    this._applyActiveEffects(system);
  }

  async _preCreate(data, options, user) {
    await super._preCreate(data, options, user);

    if (data.type === 'character') {
      const updates = {};

      if (!data.system?.characterType) {
        updates['system.characterType'] = game.settings.get('ryf3', 'defaultCharacterType');
      }

      if (!data.system?.attributePoints) {
        const maxPoints = CONFIG.RYF.getAttributePoints();
        updates['system.attributePoints.max'] = maxPoints;
        updates['system.attributePoints.used'] = 20;
      }

      if (Object.keys(updates).length > 0) {
        this.updateSource(updates);
      }
    }
  }

  _prepareCharacterData(actorData) {
    if (actorData.type !== 'character') return;

    const system = actorData.system;

    if (!CONFIG.RYF.isCarismaEnabled() && system.attributes.carisma) {
      delete system.attributes.carisma;
    }

    const healthMult = CONFIG.RYF.getHealthMultiplier();
    system.health.max = system.attributes.fisico.value * healthMult;

    if (CONFIG.RYF.isMagicEnabled()) {
      const manaMult = CONFIG.RYF.getManaMultiplier();
      system.mana.max = system.attributes.inteligencia.value * manaMult;
    } else {
      system.mana.max = 0;
      system.mana.value = 0;
    }

    const defenseSkills = this.items.filter(i => i.type === 'skill' && i.system.category === 'defense');
    const defenseBonus = defenseSkills.reduce((sum, skill) => sum + skill.system.level, 0);

    const shieldBonusMelee = this.items
      .filter(i => i.type === 'shield' && i.system.equipped)
      .reduce((sum, shield) => {
        if (typeof shield.system.defense === 'object') {
          return sum + (shield.system.defense.melee || 0);
        }
        return sum + (shield.system.defense || 0);
      }, 0);

    const shieldBonusRanged = this.items
      .filter(i => i.type === 'shield' && i.system.equipped)
      .reduce((sum, shield) => {
        if (typeof shield.system.defense === 'object') {
          return sum + (shield.system.defense.ranged || 0);
        }
        return sum;
      }, 0);

    system.defense.base = 5;
    system.defense.value = system.attributes.destreza.value + defenseBonus + system.defense.base + shieldBonusMelee;
    system.defense.ranged = shieldBonusRanged;

    const initiativeSkills = this.items.filter(i => i.type === 'skill' && i.system.category === 'initiative');
    const initiativeBonus = initiativeSkills.reduce((sum, skill) => sum + skill.system.level, 0);

    system.initiative.base = system.attributes.percepcion.value + initiativeBonus;
    system.initiative.value = system.initiative.base;

    system.willpower.base = 5;
    system.willpower.value = system.attributes.carisma.value + system.attributes.inteligencia.value + system.willpower.base;

    const equippedArmor = this.items.find(i => i.type === 'armor' && i.system.equipped);
    const equippedShields = this.items.filter(i => i.type === 'shield' && i.system.equipped);

    let totalHindrance = 0;
    let armorAbsorption = 0;

    if (equippedArmor) {
      totalHindrance += equippedArmor.system.hindrance || 0;
      armorAbsorption = equippedArmor.system.protection || 0;
    }

    equippedShields.forEach(shield => {
      totalHindrance += shield.system.hindrance || 0;
    });

    system.combat = system.combat || {};
    system.combat.baseHindrance = totalHindrance;
    system.combat.hindrance = totalHindrance;
    system.combat.baseAbsorption = armorAbsorption;
    system.combat.absorption = armorAbsorption;

    system.states.wounded = system.health.value <= system.attributes.fisico.value;
    system.states.unconscious = system.health.value <= 0;
    system.states.dead = system.health.value <= -(system.attributes.fisico.value * 6);

    const maxPoints = CONFIG.RYF.getAttributePoints();
    let usedPoints = 0;
    for (const attr of Object.values(system.attributes)) {
      usedPoints += attr.value;
    }
    system.attributePoints.max = maxPoints;
    system.attributePoints.used = usedPoints;
  }

  _applyActiveEffects(system) {
    const activeEffects = this.items.filter(i => i.type === 'active-effect');

    system.activeEffectBonuses = {
      defense: 0,
      initiative: 0,
      hindranceReduction: 0,
      absorption: 0,
      skills: {},
      weapons: {},
      armor: 0
    };

    if (activeEffects.length === 0) return;


    for (const effect of activeEffects) {
      const effectType = effect.system.effectType;
      const targetType = effect.system.targetType;
      const targetName = effect.system.targetName;
      const modifier = effect.system.modifier || 0;


      if (effectType === 'defense-bonus') {
        system.activeEffectBonuses.defense += modifier;
      } else if (effectType === 'initiative-bonus') {
        system.activeEffectBonuses.initiative += modifier;
      } else if (effectType === 'hindrance-reduction') {
        system.activeEffectBonuses.hindranceReduction += modifier;
      } else if (effectType === 'absorption-bonus') {
        system.activeEffectBonuses.absorption += modifier;
      } else if (effectType === 'skill-bonus' && targetType === 'skill') {
        if (!system.activeEffectBonuses.skills[targetName]) {
          system.activeEffectBonuses.skills[targetName] = 0;
        }
        system.activeEffectBonuses.skills[targetName] += modifier;
      } else if (effectType === 'weapon-bonus' && targetType === 'weapon') {
        if (!system.activeEffectBonuses.weapons[targetName]) {
          system.activeEffectBonuses.weapons[targetName] = 0;
        }
        system.activeEffectBonuses.weapons[targetName] += modifier;
      } else if (effectType === 'armor-bonus') {
        system.activeEffectBonuses.armor += modifier;
      }
    }

    if (system.defense) {
      system.defense.value += system.activeEffectBonuses.defense;
    }

    if (system.initiative) {
      system.initiative.value += system.activeEffectBonuses.initiative;
    }

    if (system.combat) {

      const baseHindrance = system.combat.baseHindrance || system.combat.hindrance;
      const baseAbsorption = system.combat.baseAbsorption || system.combat.absorption;

      system.combat.hindrance = Math.max(0, baseHindrance - system.activeEffectBonuses.hindranceReduction);
      system.combat.absorption = baseAbsorption + system.activeEffectBonuses.absorption + system.activeEffectBonuses.armor;

    }
  }

  _prepareNpcData(actorData) {
    if (actorData.type !== 'npc') return;

    const system = actorData.system;

    if (typeof system.initiative === 'number') {
      const initiativeValue = system.initiative;
      system.initiative = {
        value: initiativeValue,
        base: initiativeValue
      };
    } else if (typeof system.initiative === 'object' && system.initiative !== null) {
      if (system.initiative.base !== undefined) {
        system.initiative.value = system.initiative.base;
      }
    }

    if (!system.combat) {
      system.combat = {
        hindrance: 0
      };
    }
  }

  async rollSkill(skillName, advantage = 'normal') {
    const skill = this.items.find(i => i.type === 'skill' && i.name === skillName);

    if (!skill) {
      ui.notifications.warn(game.i18n.format('RYF.Warnings.SkillNotFound', { skill: skillName }));
      return;
    }

    const attribute = this.system.attributes[skill.system.attribute];
    const total = attribute.value + skill.system.level;

    ui.notifications.info(`Sistema de tiradas 1o3d10 pendiente de implementación (Fase 5)`);
  }

  validateSkillPyramid() {
    const skills = this.items.filter(i => i.type === 'skill' && i.system.level > 0);
    const pyramid = CONFIG.RYF.getActivePyramid();

    const skillsByLevel = {};
    for (let i = 0; i <= 10; i++) {
      skillsByLevel[i] = 0;
    }

    skills.forEach(skill => {
      const level = skill.system.level || 0;
      skillsByLevel[level]++;
    });

    const errors = [];

    pyramid.forEach(tier => {
      const expected = tier.count;
      const actual = skillsByLevel[tier.level] || 0;

      if (actual !== expected) {
        errors.push({
          level: tier.level,
          expected: expected,
          actual: actual,
          message: game.i18n.format('RYF.Warnings.SkillPyramidMismatch', {
            level: tier.level,
            expected: expected,
            actual: actual
          })
        });
      }
    });

    const pyramidLevels = pyramid.map(t => t.level);
    for (let level = 1; level <= 10; level++) {
      if (!pyramidLevels.includes(level) && skillsByLevel[level] > 0) {
        errors.push({
          level: level,
          expected: 0,
          actual: skillsByLevel[level],
          message: game.i18n.format('RYF.Warnings.SkillsAbovePyramid', {
            level: level,
            actual: skillsByLevel[level]
          })
        });
      }
    }

    return {
      valid: errors.length === 0,
      errors: errors,
      skillsByLevel: skillsByLevel
    };
  }

  async addExperience(amount, reason = '') {
    if (this.type !== 'character') return;

    const currentXP = this.system.experience.current;
    const totalXP = this.system.experience.total;

    const newCurrent = currentXP + amount;
    const newTotal = totalXP + amount;

    await this.update({
      'system.experience.current': newCurrent,
      'system.experience.total': newTotal
    });

    const message = game.i18n.format('RYF.Notifications.ExperienceGained', {
      amount: amount,
      reason: reason,
      total: newTotal
    });

    ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ actor: this }),
      content: message,
      type: CONST.CHAT_MESSAGE_TYPES.OTHER
    });

  }

  async spendExperience(amount, reason = '') {
    if (this.type !== 'character') return;

    const currentXP = this.system.experience.current;

    if (currentXP < amount) {
      ui.notifications.warn(game.i18n.localize('RYF.Warnings.NotEnoughExperience'));
      return false;
    }

    const newCurrent = currentXP - amount;

    await this.update({
      'system.experience.current': newCurrent
    });

    return true;
  }

  async takeDamage(amount, type = 'physical') {
    const currentHP = this.system.health.value;

    let minHP = 0;
    if (this.type === 'character' && this.system.attributes?.fisico) {
      minHP = -(this.system.attributes.fisico.value * 6);
    }

    const newHP = Math.max(currentHP - amount, minHP);

    await this.update({
      'system.health.value': newHP
    });

    if (newHP <= 0 && currentHP > 0) {
      ui.notifications.warn(game.i18n.format('RYF.Notifications.ActorUnconscious', { name: this.name }));
    }

    if (this.type === 'character' && this.system.attributes?.fisico) {
      if (newHP <= -(this.system.attributes.fisico.value * 6)) {
        ui.notifications.error(game.i18n.format('RYF.Notifications.ActorDead', { name: this.name }));
      }
    } else if (this.type === 'npc' && newHP <= 0) {
      ui.notifications.error(game.i18n.format('RYF.Notifications.ActorDead', { name: this.name }));
    }

  }

  async heal(amount) {
    const currentHP = this.system.health.value;
    const maxHP = this.system.health.max;
    const newHP = Math.min(currentHP + amount, maxHP);

    await this.update({
      'system.health.value': newHP
    });

  }

  async spendMana(amount) {
    if (!CONFIG.RYF.isMagicEnabled()) {
      ui.notifications.warn(game.i18n.localize('RYF.Warnings.MagicDisabled'));
      return false;
    }

    const currentMana = this.system.mana.value;

    if (currentMana < amount) {
      ui.notifications.warn(game.i18n.localize('RYF.Warnings.NotEnoughMana'));
      return false;
    }

    const newMana = currentMana - amount;

    await this.update({
      'system.mana.value': newMana
    });

    return true;
  }

  async restoreMana(amount) {
    if (!CONFIG.RYF.isMagicEnabled()) return;

    const currentMana = this.system.mana.value;
    const maxMana = this.system.mana.max;
    const newMana = Math.min(currentMana + amount, maxMana);

    await this.update({
      'system.mana.value': newMana
    });

  }

  async shortRest() {
    const fisico = this.system.attributes.fisico.value;
    const healAmount = Math.floor(fisico / 2);

    await this.heal(healAmount);

    ui.notifications.info(game.i18n.format('RYF.Notifications.ShortRest', {
      name: this.name,
      amount: healAmount
    }));
  }

  async longRest() {
    const maxHP = this.system.health.max;
    const maxMana = this.system.mana.max;

    await this.update({
      'system.health.value': maxHP,
      'system.mana.value': maxMana
    });

    ui.notifications.info(game.i18n.format('RYF.Notifications.LongRest', {
      name: this.name
    }));
  }

  getRollMode() {
    if (this.system.states.wounded) {
      return 'disadvantage';
    }

    if (this.system.states.unconscious || this.system.states.dead) {
      return null;
    }

    return 'normal';
  }

  async rollMeleeAttack(weapon, targetDefense = null, modeOverride = null, modifier = 0) {
    const autoMode = this.getRollMode();
    if (!autoMode) {
      ui.notifications.warn(game.i18n.localize('RYF.Warnings.CannotActInCurrentState'));
      return null;
    }

    const mode = modeOverride || autoMode;

    if (!targetDefense) {
      const targets = Array.from(game.user.targets);

      if (targets.length > 0 && targets[0].actor) {
        const targetActor = targets[0].actor;
        if (targetActor.type === 'character') {
          targetDefense = targetActor.system.defense?.value || 10;
        } else if (targetActor.type === 'npc') {
          targetDefense = targetActor.system.defense || 10;
        }
        console.log(`RyF | Auto-detected target defense: ${targetDefense} from ${targetActor.name}`);
      }
    }

    if (!targetDefense) {
      const defenseInput = await Dialog.prompt({
        title: game.i18n.localize('RYF.Combat.EnterTargetDefense'),
        content: `
          <form>
            <div class="form-group">
              <label>${game.i18n.localize('RYF.Defense')}</label>
              <input type="number" name="defense" value="10" min="1" autofocus/>
            </div>
          </form>
        `,
        callback: (html) => {
          return html.find('[name="defense"]').val();
        },
        rejectClose: false
      });

      if (!defenseInput) return null;
      targetDefense = parseInt(defenseInput);
    }

    const { RyfRoll } = await import('../rolls/ryf-roll.mjs');
    const attackRoll = await RyfRoll.rollAttack(this, weapon, targetDefense, mode, modifier);

    if (attackRoll && attackRoll.success) {
      const rollDamage = await Dialog.confirm({
        title: game.i18n.localize('RYF.Combat.AttackSuccess'),
        content: `<p>${game.i18n.localize('RYF.Combat.RollDamageQuestion')}</p>`,
        defaultYes: true
      });

      if (rollDamage) {
        await RyfRoll.rollDamage(weapon, attackRoll.criticalDice, 0, this);
      }
    }

    return attackRoll;
  }

  async rollRangedAttack(weapon, range = null, modeOverride = null, targetDefenseRanged = null, modifier = 0) {
    const autoMode = this.getRollMode();
    if (!autoMode) {
      ui.notifications.warn(game.i18n.localize('RYF.Warnings.CannotActInCurrentState'));
      return null;
    }

    const mode = modeOverride || autoMode;

    if (!range) {
      ui.notifications.warn(game.i18n.localize('RYF.Warnings.NoRangeSelected'));
      return null;
    }

    const difficulties = {
      'pointblank': 10,
      'short': 15,
      'medium': 20,
      'long': 25
    };

    let difficulty = difficulties[range] || 15;

    if (targetDefenseRanged) {
      difficulty += targetDefenseRanged;
    }

    const { RyfRoll } = await import('../rolls/ryf-roll.mjs');
    const attackRoll = await RyfRoll.rollAttack(this, weapon, difficulty, mode, modifier);

    if (attackRoll && attackRoll.success) {
      const rollDamage = await Dialog.confirm({
        title: game.i18n.localize('RYF.Combat.AttackSuccess'),
        content: `<p>${game.i18n.localize('RYF.Combat.RollDamageQuestion')}</p>`,
        defaultYes: true
      });

      if (rollDamage) {
        await RyfRoll.rollDamage(weapon, attackRoll.criticalDice, 0, this);
      }
    }

    return attackRoll;
  }

  async rollNpcAttack(attack) {
    if (this.type !== 'npc') {
      ui.notifications.warn('This method is only for NPCs');
      return null;
    }

    const attackType = attack.system.attackType;
    const attackBonus = attack.system.attackBonus || 0;
    const damageBase = attack.system.damage?.base || '1d6';
    const damageBonus = attack.system.damage?.bonus || 0;

    const attackParams = await new Promise((resolve) => {
      new Dialog({
        title: `${game.i18n.localize('RYF.Attack')}: ${attack.name}`,
        content: `
          <form>
            <div class="form-group">
              <label>${game.i18n.localize('RYF.RollMode')}</label>
              <select name="mode">
                <option value="normal">${game.i18n.localize('RYF.Normal')}</option>
                <option value="advantage">${game.i18n.localize('RYF.Advantage')}</option>
                <option value="disadvantage">${game.i18n.localize('RYF.Disadvantage')}</option>
              </select>
            </div>
            <div class="form-group">
              <label>${game.i18n.localize('RYF.Modifier')}</label>
              <input type="number" name="modifier" value="0"/>
            </div>
          </form>
        `,
        buttons: {
          roll: {
            icon: '<i class="fas fa-dice-d20"></i>',
            label: game.i18n.localize('RYF.Roll'),
            callback: (html) => {
              const form = html[0].querySelector('form');
              resolve({
                mode: form.mode.value,
                modifier: parseInt(form.modifier.value) || 0
              });
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

    if (!attackParams) return null;

    const mode = attackParams.mode;
    const modifier = attackParams.modifier;

    let difficulty = 10;

    if (attackType === 'melee') {
      const targets = Array.from(game.user.targets);

      if (targets.length > 0 && targets[0].actor) {
        const targetActor = targets[0].actor;
        if (targetActor.type === 'character') {
          difficulty = targetActor.system.defense?.value || 10;
        } else if (targetActor.type === 'npc') {
          difficulty = targetActor.system.defense || 10;
        }
        console.log(`RyF | Auto-detected target defense: ${difficulty} from ${targetActor.name}`);
      } else {
        const defenseInput = await Dialog.prompt({
          title: game.i18n.localize('RYF.Combat.EnterTargetDefense'),
          content: `
            <form>
              <div class="form-group">
                <label>${game.i18n.localize('RYF.Defense')}</label>
                <input type="number" name="defense" value="10" min="1" autofocus/>
              </div>
            </form>
          `,
          callback: (html) => {
            return html.find('[name="defense"]').val();
          },
          rejectClose: false
        });

        if (!defenseInput) return null;
        difficulty = parseInt(defenseInput);
      }
    } else {
      const rangeInput = await Dialog.prompt({
        title: game.i18n.localize('RYF.Combat.SelectRange'),
        content: `
          <form>
            <div class="form-group">
              <label>${game.i18n.localize('RYF.Range')}</label>
              <select name="range">
                <option value="pointblank">${game.i18n.localize('RYF.Ranges.Pointblank')}</option>
                <option value="short">${game.i18n.localize('RYF.Ranges.Short')}</option>
                <option value="medium">${game.i18n.localize('RYF.Ranges.Medium')}</option>
                <option value="long">${game.i18n.localize('RYF.Ranges.Long')}</option>
              </select>
            </div>
          </form>
        `,
        callback: (html) => {
          return html.find('[name="range"]').val();
        },
        rejectClose: false
      });

      if (!rangeInput) return null;

      const difficulties = {
        'pointblank': 10,
        'short': 15,
        'medium': 20,
        'long': 25
      };

      difficulty = difficulties[rangeInput] || 15;
    }

    const { roll1o3d10, isSuccess, checkFumble, calculateCriticalDice } = await import('../helpers/dice.mjs');
    const diceRoll = await roll1o3d10(mode);
    const total = attackBonus + diceRoll.result + modifier;

    const fumble = checkFumble(diceRoll.dice, diceRoll.chosen);
    const success = isSuccess(total, difficulty, fumble);
    const margin = total - difficulty;
    const criticalDice = success ? calculateCriticalDice(total, difficulty) : 0;

    const chatData = {
      user: game.user.id,
      speaker: ChatMessage.getSpeaker({ actor: this }),
      content: await renderTemplate('systems/ryf3/templates/chat/npc-attack-roll.hbs', {
        actorName: this.name,
        actorImg: this.img,
        attackName: attack.name,
        attackType: attackType,
        attackBonus: attackBonus,
        mode: mode,
        modifier: modifier,
        diceRoll: diceRoll,
        total: total,
        difficulty: difficulty,
        success: success,
        fumble: fumble,
        margin: margin,
        criticalDice: criticalDice
      })
    };

    await ChatMessage.create(chatData);

    if (success) {
      const rollDamage = await Dialog.confirm({
        title: game.i18n.localize('RYF.Combat.AttackSuccess'),
        content: `<p>${game.i18n.localize('RYF.Combat.RollDamageQuestion')}</p>`,
        defaultYes: true
      });

      if (rollDamage) {
        const { rollEffect } = await import('../helpers/dice.mjs');

        const baseRoll = await rollEffect(damageBase);
        let total = baseRoll.total + damageBonus;

        let criticalRoll = null;
        if (criticalDice > 0) {
          criticalRoll = await rollEffect(`${criticalDice}d6`);
          total += criticalRoll.total;
        }

        const damageChatData = {
          user: game.user.id,
          speaker: ChatMessage.getSpeaker({ actor: this }),
          content: await renderTemplate('systems/ryf3/templates/chat/npc-damage-roll.hbs', {
            actorName: this.name,
            attackName: attack.name,
            damageBase: damageBase,
            baseRoll: baseRoll,
            damageBonus: damageBonus,
            criticalDice: criticalDice,
            criticalRoll: criticalRoll,
            total: total
          })
        };

        await ChatMessage.create(damageChatData);
      }
    }

    return { success, total, difficulty, fumble, criticalDice };
  }

  async applyDamage(damageAmount, damageType = 'physical', source = null) {
    let finalDamage = damageAmount;

    let absorption = 0;
    if (this.type === 'character') {
      absorption = this.system.combat?.absorption || 0;
    } else if (this.type === 'npc') {
      absorption = this.system.absorption || 0;
    }

    if (damageType === 'physical' && absorption > 0) {
      finalDamage = Math.max(0, damageAmount - absorption);
    }

    console.log(`RyF | applyDamage called for ${this.name}`);
    console.log(`RyF | ${this.name} - Daño: ${damageAmount}, Absorción: ${absorption}, Final: ${finalDamage}`);

    await this.takeDamage(finalDamage, damageType);

    const templateData = {
      actor: this,
      damageGross: damageAmount,
      absorption: damageType === 'physical' ? absorption : 0,
      damageFinal: finalDamage,
      damageType: damageType,
      health: this.system.health,
      states: this.system.states
    };

    const template = 'systems/ryf3/templates/chat/damage-applied.hbs';
    const html = await renderTemplate(template, templateData);

    await ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ actor: this }),
      content: html,
      type: CONST.CHAT_MESSAGE_TYPES.OTHER
    });

    return finalDamage;
  }

  async castSpell(spell, targets = null, mode = 'normal', modifier = 0) {
    if (!spell || spell.type !== 'spell') {
      ui.notifications.warn(game.i18n.localize('RYF.Warnings.InvalidSpell'));
      return null;
    }

    const manaCost = spell.system.manaCost || 0;
    const currentMana = this.system.mana?.value || 0;

    if (currentMana < manaCost) {
      ui.notifications.warn(game.i18n.format('RYF.Warnings.NotEnoughMana', {
        required: manaCost,
        current: currentMana
      }));
      return null;
    }

    await this.update({
      'system.mana.value': currentMana - manaCost
    });

    ui.notifications.info(game.i18n.format('RYF.Notifications.ManaSpent', {
      name: spell.name,
      cost: manaCost
    }));

    const castingDifficulty = spell.system.castingDifficulty || 15;

    const { RyfRoll } = await import('../rolls/ryf-roll.mjs');
    const castingRoll = await RyfRoll.rollSpellCasting(
      this,
      spell,
      castingDifficulty,
      mode,
      modifier
    );

    if (!castingRoll.success) {
      ui.notifications.warn(game.i18n.format('RYF.Warnings.SpellCastingFailed', { name: spell.name }));
      return null;
    }

    if (!targets || targets.length === 0) {
      const selectedTargets = Array.from(game.user.targets);
      targets = selectedTargets.map(t => t.actor).filter(a => a);
    }

    if (targets.length === 0 && spell.system.targets.type === 'self') {
      targets = [this];
    }

    let result = null;

    switch (spell.system.spellType) {
      case 'damage':
        result = await this._castDamageSpell(spell, targets);
        break;
      case 'healing':
        result = await this._castHealingSpell(spell, targets, castingRoll);
        break;
      case 'buff-skill':
      case 'buff-weapon':
      case 'buff-armor':
        result = await this._castBuffSpell(spell, targets);
        break;
      case 'effect':
        result = await this._castEffectSpell(spell, targets);
        break;
      case 'generic':
        result = await this._castGenericSpell(spell, targets);
        break;
      default:
        ui.notifications.warn(game.i18n.localize('RYF.Warnings.UnknownSpellType'));
        return null;
    }

    return result;
  }

  async _castDamageSpell(spell, targets) {
    const results = [];

    let range = null;
    if (spell.system.attackType === 'ranged') {
      range = await this._promptRangeDialog();
      if (!range) return null;
    }

    if (targets.length === 0) {
      if (spell.system.attackType !== 'none') {
        await this._rollSpellAttack(spell, null, range);
      }
      ui.notifications.info(game.i18n.localize('RYF.Info.NoTargetsForDamage'));
      return results;
    }

    for (const target of targets) {
      let hitSuccess = true;
      let attackRoll = null;

      if (spell.system.attackType !== 'none') {
        attackRoll = await this._rollSpellAttack(spell, target, range);
        hitSuccess = attackRoll.success;

        if (!hitSuccess) {
          results.push({
            target: target,
            hit: false,
            damage: 0
          });
          continue;
        }
      }

      let applyDamage = true;

      if (spell.system.savingThrow.enabled) {
        const savingThrow = await this._rollSavingThrow(target, spell);
        applyDamage = !savingThrow.success;
      }

      if (applyDamage) {
        const criticalDice = attackRoll?.criticalDice || 0;

        const { RyfRoll } = await import('../rolls/ryf-roll.mjs');
        const damageRollData = await RyfRoll.rollSpellDamage(spell, criticalDice);
        const damageAmount = damageRollData.total;

        const targetActor = target.actor || target;
        await targetActor.applyDamage(damageAmount, spell.system.damage.type, this);

        results.push({
          target: target,
          hit: true,
          damage: damageAmount,
          damageRoll: damageRollData
        });
      } else {
        results.push({
          target: target,
          hit: true,
          damage: 0,
          saved: true
        });
      }
    }

    return results;
  }

  async _castHealingSpell(spell, targets, castingRoll) {
    const results = [];

    if (targets.length === 0) {
      ui.notifications.info(game.i18n.localize('RYF.Info.NoTargetsForHealing'));
      return results;
    }

    const criticalDice = castingRoll?.criticalDice || 0;

    for (const target of targets) {
      const targetActor = target.actor || target;


      const { RyfRoll } = await import('../rolls/ryf-roll.mjs');
      const healingRoll = await RyfRoll.rollHealing(spell, targetActor, criticalDice);
      const healingAmount = healingRoll.total;

      const currentHP = targetActor.system.health.value;
      const maxHP = targetActor.system.health.max;
      const newHP = Math.min(maxHP, currentHP + healingAmount);


      await targetActor.update({
        'system.health.value': newHP
      });


      results.push({
        target: targetActor,
        healing: healingAmount,
        healingRoll: healingRoll
      });
    }

    return results;
  }

  async _castBuffSpell(spell, targets) {
    const results = [];
    const { RyfActiveEffect } = await import('./active-effect.mjs');

    if (targets.length === 0) {
      ui.notifications.info(game.i18n.localize('RYF.Info.NoTargetsForBuff'));
      return results;
    }

    for (const target of targets) {
      const targetActor = target.actor || target;

      let duration = spell.system.effect.duration.value;

      if (spell.system.effect.duration.perLevel) {
        duration = duration * spell.system.level;
      }

      const effectData = {
        name: `${spell.name} (${game.i18n.localize('RYF.Buff')})`,
        img: spell.img,
        sourceType: 'spell',
        sourceName: spell.name,
        sourceId: spell.id,
        effectType: this._getEffectTypeFromSpellType(spell.system.spellType),
        targetType: this._getTargetTypeFromSpellType(spell.system.spellType),
        targetName: spell.system.effect.targetName || '',
        modifier: spell.system.effect.modifier,
        duration: {
          remaining: duration,
          total: duration
        },
        appliedBy: this.name
      };


      const effect = await RyfActiveEffect.create(targetActor, effectData);


      results.push({
        target: targetActor,
        effect: effect
      });
    }

    return results;
  }

  async _castEffectSpell(spell, targets) {
    const results = [];
    const { RyfActiveEffect } = await import('./active-effect.mjs');

    for (const target of targets) {
      let applyEffect = true;

      if (spell.system.savingThrow.enabled) {
        const savingThrow = await this._rollSavingThrow(target, spell);
        applyEffect = !savingThrow.success;
      }

      if (applyEffect) {
        let duration = spell.system.effect.duration.value;

        if (spell.system.effect.duration.perLevel) {
          duration = duration * spell.system.level;
        }

        const effectData = {
          name: `${spell.name} (${game.i18n.localize('RYF.Effect')})`,
          img: spell.img,
          sourceType: 'spell',
          sourceName: spell.name,
          sourceId: spell.id,
          effectType: spell.system.effect.type,
          targetType: spell.system.effect.targetType,
          targetName: spell.system.effect.targetName,
          modifier: spell.system.effect.modifier,
          duration: {
            remaining: duration,
            total: duration
          },
          appliedBy: this.name
        };

        const effect = await RyfActiveEffect.create(target.actor, effectData);

        results.push({
          target: target,
          effect: effect,
          saved: false
        });
      } else {
        results.push({
          target: target,
          effect: null,
          saved: true
        });
      }
    }

    return results;
  }

  async _castGenericSpell(spell, targets) {
    if (spell.system.requiresRoll) {
      const attribute = spell.system.rollAttribute;
      const difficulty = spell.system.genericDifficulty;

      const { RyfRoll } = await import('../rolls/ryf-roll.mjs');
      await RyfRoll.rollAttribute(this, attribute, difficulty);
    }

    const templateData = {
      actor: this,
      spell: spell,
      targets: targets,
      description: spell.system.description
    };

    const template = 'systems/ryf3/templates/chat/spell-generic.hbs';
    const html = await renderTemplate(template, templateData);

    await ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ actor: this }),
      content: html,
      type: CONST.CHAT_MESSAGE_TYPES.OTHER
    });

    return { targets: targets };
  }

  async _promptRangeDialog() {
    return new Promise((resolve) => {
      new Dialog({
        title: game.i18n.localize('RYF.Combat.SelectRange'),
        content: `
          <form>
            <div class="form-group">
              <label>${game.i18n.localize('RYF.Combat.Range')}</label>
              <select name="range" autofocus>
                <option value="pointblank">${game.i18n.localize('RYF.Combat.RangePointBlank')} (10)</option>
                <option value="short" selected>${game.i18n.localize('RYF.Combat.RangeShort')} (15)</option>
                <option value="medium">${game.i18n.localize('RYF.Combat.RangeMedium')} (20)</option>
                <option value="long">${game.i18n.localize('RYF.Combat.RangeLong')} (25)</option>
              </select>
            </div>
          </form>
        `,
        buttons: {
          roll: {
            icon: '<i class="fas fa-dice-d10"></i>',
            label: game.i18n.localize('RYF.Roll'),
            callback: (html) => {
              const range = html.find('[name="range"]').val();
              resolve(range);
            }
          },
          cancel: {
            icon: '<i class="fas fa-times"></i>',
            label: game.i18n.localize('Cancel'),
            callback: () => resolve(null)
          }
        },
        default: 'roll',
        close: () => resolve(null)
      }).render(true);
    });
  }

  async _rollSpellAttack(spell, target, range = null) {
    const spellAsWeapon = {
      name: spell.name,
      type: 'weapon',
      system: {
        category: spell.system.attackType
      }
    };

    if (spell.system.attackType === 'melee') {
      let targetDefense = null;

      if (target) {
        const targetActor = target.actor || target;
        if (targetActor.type === 'character') {
          targetDefense = targetActor.system.defense?.value || 10;
        } else if (targetActor.type === 'npc') {
          targetDefense = targetActor.system.defense || 10;
        }
      }

      return await this.rollMeleeAttack(spellAsWeapon, targetDefense, null, 0);
    } else if (spell.system.attackType === 'ranged') {
      let targetDefenseRanged = null;

      if (target) {
        const targetActor = target.actor || target;
        targetDefenseRanged = targetActor.system.defense?.ranged || 0;
      }

      return await this.rollRangedAttack(spellAsWeapon, range, null, targetDefenseRanged, 0);
    }

    return null;
  }

  async _rollSavingThrow(target, spell) {
    const targetActor = target.actor || target;
    const attribute = spell.system.savingThrow.attribute;
    const difficulty = spell.system.savingThrow.difficulty;

    const { RyfRoll } = await import('../rolls/ryf-roll.mjs');

    const savingRoll = await RyfRoll.rollAttribute(
      targetActor,
      attribute,
      difficulty,
      'normal'
    );

    return savingRoll;
  }

  _getEffectTypeFromSpellType(spellType) {
    switch (spellType) {
      case 'buff-skill':
        return 'skill-bonus';
      case 'buff-weapon':
        return 'weapon-bonus';
      case 'buff-armor':
        return 'armor-bonus';
      default:
        return 'skill-bonus';
    }
  }

  _getTargetTypeFromSpellType(spellType) {
    switch (spellType) {
      case 'buff-skill':
        return 'skill';
      case 'buff-weapon':
        return 'weapon';
      case 'buff-armor':
        return 'armor';
      default:
        return 'skill';
    }
  }
}

