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
  }

  async _preCreate(data, options, user) {
    await super._preCreate(data, options, user);

    if (data.type === 'character') {
      const updates = {};

      if (!data.system?.characterType) {
        updates['system.characterType'] = game.settings.get('ryf', 'defaultCharacterType');
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
    system.combat.hindrance = totalHindrance;
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

  _prepareNpcData(actorData) {
    if (actorData.type !== 'npc') return;

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

    const shieldBonus = this.items
      .filter(i => i.type === 'shield' && i.system.equipped)
      .reduce((sum, shield) => {
        if (typeof shield.system.defense === 'object') {
          return sum + (shield.system.defense.melee || 0);
        }
        return sum + (shield.system.defense || 0);
      }, 0);

    system.defense.base = 5;
    system.defense.value = system.attributes.destreza.value + defenseBonus + system.defense.base + shieldBonus;

    const initiativeSkills = this.items.filter(i => i.type === 'skill' && i.system.category === 'initiative');
    const initiativeBonus = initiativeSkills.reduce((sum, skill) => sum + skill.system.level, 0);

    system.initiative.base = system.attributes.percepcion.value + initiativeBonus;
    system.initiative.value = system.initiative.base;

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
    system.combat.hindrance = totalHindrance;
    system.combat.absorption = armorAbsorption;
  }

  async rollSkill(skillName, advantage = 'normal') {
    const skill = this.items.find(i => i.type === 'skill' && i.name === skillName);

    if (!skill) {
      ui.notifications.warn(game.i18n.format('RYF.Warnings.SkillNotFound', { skill: skillName }));
      return;
    }

    const attribute = this.system.attributes[skill.system.attribute];
    const total = attribute.value + skill.system.level;

    console.log(`RyF | Rolling skill ${skillName}: ${attribute.value} (attr) + ${skill.system.level} (skill) = ${total}`);

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

    console.log(`RyF | ${this.name} gained ${amount} XP. Total: ${newTotal}`);
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

    console.log(`RyF | ${this.name} spent ${amount} XP on ${reason}. Remaining: ${newCurrent}`);
    return true;
  }

  async takeDamage(amount, type = 'physical') {
    const currentHP = this.system.health.value;
    const newHP = Math.max(currentHP - amount, -(this.system.attributes.fisico.value * 6));

    await this.update({
      'system.health.value': newHP
    });

    if (newHP <= 0 && currentHP > 0) {
      ui.notifications.warn(game.i18n.format('RYF.Notifications.ActorUnconscious', { name: this.name }));
    }

    if (newHP <= -(this.system.attributes.fisico.value * 6)) {
      ui.notifications.error(game.i18n.format('RYF.Notifications.ActorDead', { name: this.name }));
    }

    console.log(`RyF | ${this.name} took ${amount} ${type} damage. HP: ${currentHP} → ${newHP}`);
  }

  async heal(amount) {
    const currentHP = this.system.health.value;
    const maxHP = this.system.health.max;
    const newHP = Math.min(currentHP + amount, maxHP);

    await this.update({
      'system.health.value': newHP
    });

    console.log(`RyF | ${this.name} healed ${amount} HP. HP: ${currentHP} → ${newHP}`);
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

    console.log(`RyF | ${this.name} spent ${amount} mana. Remaining: ${newMana}`);
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

    console.log(`RyF | ${this.name} restored ${amount} mana. Mana: ${currentMana} → ${newMana}`);
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
        await RyfRoll.rollDamage(weapon, attackRoll.criticalDice, 0);
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
        await RyfRoll.rollDamage(weapon, attackRoll.criticalDice, 0);
      }
    }

    return attackRoll;
  }

  async applyDamage(damageAmount, damageType = 'physical', source = null) {
    let finalDamage = damageAmount;
    const absorption = this.system.combat?.absorption || 0;

    if (damageType === 'physical' && absorption > 0) {
      finalDamage = Math.max(0, damageAmount - absorption);
      console.log(`RyF | ${this.name} - Daño: ${damageAmount}, Absorción: ${absorption}, Final: ${finalDamage}`);
    }

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

    const template = 'systems/ryf/templates/chat/damage-applied.hbs';
    const html = await renderTemplate(template, templateData);

    await ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ actor: this }),
      content: html,
      type: CONST.CHAT_MESSAGE_TYPES.OTHER
    });

    return finalDamage;
  }
}

