import { getRule } from '../helpers/rules.mjs';

export class RyfActor extends Actor {

  prepareData() {
    super.prepareData();
  }

  prepareBaseData() {
    super.prepareBaseData();

    const system = this.system;

    system.activeEffectBonuses = {
      defense: 0,
      defenseMelee: 0,
      defenseRanged: 0,
      attackMelee: 0,
      attackRanged: 0,
      damageMelee: 0,
      damageRanged: 0,
      spellCasting: 0,
      healingReceived: 0,
      healthMultiplier: 0,
      manaMultiplier: 0,
      maxHealth: 0,
      initiative: 0,
      hindranceReduction: 0,
      absorption: 0,
      skills: {},
      weaponsDamage: {},
      weaponsAttack: {},
      armor: 0
    };
  }

  prepareDerivedData() {
    const actorData = this;
    const system = actorData.system;
    const flags = actorData.flags.ryf || {};

    this._prepareCharacterData(actorData);
    this._prepareNpcData(actorData);

    this._applyActiveEffectBonuses(system);
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

    // Reference: RyF 3.0 PDF, página 98 - efectos health-multiplier (ej. Muro:
    // PV = Físico x5 en lugar de x4) suman al multiplicador base
    const healthMult = CONFIG.RYF.getHealthMultiplier() + (system.activeEffectBonuses?.healthMultiplier || 0);
    system.health.max = system.attributes.fisico.value * healthMult;

    if (CONFIG.RYF.isMagicEnabled()) {
      // Reference: RyF 3.0 PDF, página 98 - efectos mana-multiplier (ej. Maná
      // abundante: maná INT x4 en lugar de x3)
      const manaMult = CONFIG.RYF.getManaMultiplier() + (system.activeEffectBonuses?.manaMultiplier || 0);
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

    // Reference: RyF 3.0 PDF, página 21 - Defensa = Destreza + Esquivar + 5
    system.defense.base = getRule('defenseBase');
    system.defense.value = system.attributes.destreza.value + defenseBonus + system.defense.base + shieldBonusMelee;
    system.defense.ranged = shieldBonusRanged;

    const initiativeSkills = this.items.filter(i => i.type === 'skill' && i.system.category === 'initiative');
    const initiativeBonus = initiativeSkills.reduce((sum, skill) => sum + skill.system.level, 0);

    system.initiative.base = system.attributes.percepcion.value + initiativeBonus;
    system.initiative.value = system.initiative.base;

    // Reference: RyF 3.0 PDF, página 94 - Voluntad = Carisma + Inteligencia + 5.
    // Sin el módulo de Carisma se calcula igualmente (Inteligencia + base) para
    // que las tiradas sociales enfrentadas no lean el valor estático de plantilla
    system.willpower.base = getRule('willpowerBase');
    if (CONFIG.RYF.isCarismaEnabled() && system.attributes.carisma) {
      system.willpower.value = system.attributes.carisma.value + system.attributes.inteligencia.value + system.willpower.base;
    } else {
      system.willpower.value = system.attributes.inteligencia.value + system.willpower.base;
    }

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

    // Reference: RyF 3.0 PDF, páginas 20-21 - malherido con PV <= Físico,
    // inconsciente a 0 PV, muerte a Físico x6 de daño (PV negativos)
    system.states.wounded = system.health.value <= system.attributes.fisico.value * getRule('woundedMultiplier');
    system.states.unconscious = system.health.value <= getRule('unconsciousThreshold');
    system.states.dead = system.health.value <= -(system.attributes.fisico.value * getRule('deathMultiplier'));

    const maxPoints = CONFIG.RYF.getAttributePoints();
    let usedPoints = 0;
    for (const attr of Object.values(system.attributes)) {
      usedPoints += attr.value;
    }
    system.attributePoints.max = maxPoints;
    system.attributePoints.used = usedPoints;
  }

  _applyActiveEffectBonuses(system) {
    if (system.defense) {
      if (typeof system.defense === 'object' && system.defense.value !== undefined) {
        system.defense.value += system.activeEffectBonuses.defense + system.activeEffectBonuses.defenseMelee;
        system.defense.ranged = (system.defense.ranged || 0) + system.activeEffectBonuses.defenseRanged;
      } else if (typeof system.defense === 'number') {
        system.defense += system.activeEffectBonuses.defense + system.activeEffectBonuses.defenseMelee;
      }
    }

    if (system.health && typeof system.health === 'object' && system.health.max !== undefined) {
      system.health.max += system.activeEffectBonuses.maxHealth;
      if (system.health.value > system.health.max) {
        system.health.value = system.health.max;
      }
    }

    if (system.initiative) {
      if (typeof system.initiative === 'object' && system.initiative.value !== undefined) {
        system.initiative.value += system.activeEffectBonuses.initiative;
      } else if (typeof system.initiative === 'number') {
        system.initiative += system.activeEffectBonuses.initiative;
      }
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

    if (!system.states) {
      system.states = {
        wounded: false,
        unconscious: false,
        dead: false
      };
    }

    system.states.unconscious = system.health.value <= 0;
    system.states.dead = system.health.value <= 0;
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
    const spells = this.items.filter(i => i.type === 'spell' && i.system.level > 0);
    const allSkillsAndSpells = [...skills, ...spells];
    const pyramid = CONFIG.RYF.getActivePyramid();

    const skillsByLevel = {};
    for (let i = 0; i <= 10; i++) {
      skillsByLevel[i] = 0;
    }

    allSkillsAndSpells.forEach(item => {
      const level = item.system.level || 0;
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

    // Reference: RyF 3.0 PDF, página 39 - límites de creación: máximo 6 puntos
    // por habilidad y atributo + habilidad no superior a 16 al empezar
    const creationMaxSkill = getRule('creationMaxSkill');
    const creationMaxSum = getRule('creationMaxSum');
    allSkillsAndSpells.forEach(item => {
      const level = item.system.level || 0;

      if (level > creationMaxSkill) {
        errors.push({
          level: level,
          expected: creationMaxSkill,
          actual: level,
          message: game.i18n.format('RYF.Warnings.CreationSkillTooHigh', {
            name: item.name,
            max: creationMaxSkill
          })
        });
      }

      const attributeName = item.type === 'spell' ? 'inteligencia' : item.system.attribute;
      const attributeValue = this.system.attributes?.[attributeName]?.value || 0;
      if (attributeValue + level > creationMaxSum) {
        errors.push({
          level: level,
          expected: creationMaxSum,
          actual: attributeValue + level,
          message: game.i18n.format('RYF.Warnings.CreationSumTooHigh', {
            name: item.name,
            max: creationMaxSum
          })
        });
      }
    });

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
      style: CONST.CHAT_MESSAGE_STYLES.OTHER
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

    // Reference: RyF 3.0 PDF, página 21 - la muerte llega a Físico x6 de daño
    let minHP = 0;
    if (this.type === 'character' && this.system.attributes?.fisico) {
      minHP = -(this.system.attributes.fisico.value * getRule('deathMultiplier'));
    }

    const newHP = Math.max(currentHP - amount, minHP);

    await this.update({
      'system.health.value': newHP
    });

    // Reference: RyF 3.0 PDF, página 94 - Coger aire solo recupera el daño
    // recibido en el combate actual: se acumula mientras hay un combate activo
    if (game.combat?.started && newHP < currentHP) {
      const combatDamage = (this.getFlag('ryf3', 'combatDamage') || 0) + (currentHP - newHP);
      await this.setFlag('ryf3', 'combatDamage', combatDamage);
    }

    if (newHP <= 0 && currentHP > 0) {
      ui.notifications.warn(game.i18n.format('RYF.Notifications.ActorUnconscious', { name: this.name }));
    }

    if (this.type === 'character' && this.system.attributes?.fisico) {
      if (newHP <= -(this.system.attributes.fisico.value * getRule('deathMultiplier'))) {
        ui.notifications.error(game.i18n.format('RYF.Notifications.ActorDead', { name: this.name }));
      }
    } else if (this.type === 'npc' && newHP <= 0) {
      ui.notifications.error(game.i18n.format('RYF.Notifications.ActorDead', { name: this.name }));
    }

  }

  async _updateStatusEffects() {
    const stateEffects = ['dead', 'unconscious', 'wounded'];

    const currentStateEffects = this.effects.filter(e =>
      e.statuses && stateEffects.some(s => e.statuses.has(s))
    );

    const shouldHaveEffects = new Set();

    if (this.system.states?.dead) {
      shouldHaveEffects.add('dead');
    } else if (this.system.states?.unconscious) {
      shouldHaveEffects.add('unconscious');
    } else if (this.system.states?.wounded) {
      shouldHaveEffects.add('wounded');
    }

    const currentEffectIds = new Set();
    for (const effect of currentStateEffects) {
      for (const status of effect.statuses) {
        if (stateEffects.includes(status)) {
          currentEffectIds.add(status);
        }
      }
    }

    const toAdd = [...shouldHaveEffects].filter(e => !currentEffectIds.has(e));
    const toRemove = currentStateEffects.filter(e => {
      for (const status of e.statuses) {
        if (stateEffects.includes(status) && !shouldHaveEffects.has(status)) {
          return true;
        }
      }
      return false;
    });

    if (toRemove.length > 0) {
      const removeIds = toRemove.map(e => e.id);
      await this.deleteEmbeddedDocuments('ActiveEffect', removeIds);
    }

    for (const statusId of toAdd) {
      const statusEffect = CONFIG.statusEffects.find(s => s.id === statusId);
      const statusName = statusEffect ? game.i18n.localize(statusEffect.name) : game.i18n.localize(`RYF.States.${statusId}`);

      const effectConfig = {
        name: statusName,
        img: statusEffect?.img || `icons/svg/statuses/${statusId}.svg`,
        disabled: false,
        transfer: false,
        statuses: [statusId],
        flags: {
          ryf3: {
            sourceType: 'system',
            appliedBy: 'system',
            appliedAt: Date.now(),
            effectType: 'state',
            condition: statusId
          }
        }
      };

      await this.createEmbeddedDocuments('ActiveEffect', [effectConfig]);
    }
  }

  async heal(amount) {
    // Reference: RyF 3.0 PDF, página 98 - efectos healing-received (ej.
    // Recuperación: +2 PV en cada curación, natural o mágica)
    amount += this.system.activeEffectBonuses?.healingReceived || 0;

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

  // Descanso corto: cura Físico / divisor (regla de la casa intencionada,
  // configurable en el menú de reglas)
  async shortRest() {
    const fisico = this.system.attributes.fisico.value;
    const healAmount = Math.floor(fisico / getRule('shortRestDivisor'));

    await this.heal(healAmount);

    ui.notifications.info(game.i18n.format('RYF.Notifications.ShortRest', {
      name: this.name,
      amount: healAmount
    }));
  }

  // Descanso largo: recuperación total por defecto (regla de la casa
  // intencionada). Alternativa configurable: curación natural nocturna de
  // 1-2 PV según comodidad (RyF 3.0 PDF, página 94); el maná se recupera
  // completo en ambos casos
  async longRest() {
    const maxMana = this.system.mana.max;

    // Dormir una noche resetea el límite diario de curación por habilidad
    // (pág. 11) y el daño acumulado del último combate (pág. 94)
    await this.unsetFlag('ryf3', 'healedToday');
    await this.unsetFlag('ryf3', 'combatDamage');

    if (getRule('longRestFull')) {
      await this.update({
        'system.health.value': this.system.health.max,
        'system.mana.value': maxMana
      });

      ui.notifications.info(game.i18n.format('RYF.Notifications.LongRest', {
        name: this.name
      }));
    } else {
      const healAmount = getRule('longRestHealAmount');
      await this.heal(healAmount);
      await this.update({ 'system.mana.value': maxMana });

      ui.notifications.info(game.i18n.format('RYF.Notifications.LongRestPartial', {
        name: this.name,
        amount: healAmount
      }));
    }
  }

  // Reference: RyF 3.0 PDF, página 94 - Coger aire: 5-15 minutos de relajación
  // tras un combate recuperan 1d6 (realista) / 2d6 (épica) PV, solo hasta el
  // daño recibido en ese combate; permite salir de la inconsciencia
  async breather() {
    const combatDamage = this.getFlag('ryf3', 'combatDamage') || 0;
    if (combatDamage <= 0) {
      ui.notifications.warn(game.i18n.localize('RYF.Warnings.NoCombatDamage'));
      return;
    }

    const { rollEffect } = await import('../helpers/dice.mjs');
    const roll = await rollEffect(getRule('breatherDice'));
    const healed = Math.min(roll.total, combatDamage);

    await this.heal(healed);
    await this.unsetFlag('ryf3', 'combatDamage');

    ui.notifications.info(game.i18n.format('RYF.Notifications.Breather', {
      name: this.name,
      amount: healed,
      rolled: roll.total
    }));
  }

  // Reference: RyF 3.0 PDF, páginas 11-12 y 45 - curación por habilidad
  // (Medicina, Sanación/Hierbas): tirada contra dificultad 15; cura 1d6
  // (realista) / 2d6 (heroico) más 1d6 por cada 10 de margen; una vez al día
  // por paciente (aviso no bloqueante)
  async rollHealingSkill(skill, patient = null, { difficulty = null, mode = 'normal', modifier = 0, specialization = false, spendToken = false } = {}) {
    patient = patient || this;
    difficulty = difficulty ?? getRule('healSkillDifficulty');

    if (patient.getFlag('ryf3', 'healedToday')) {
      ui.notifications.warn(game.i18n.format('RYF.Warnings.AlreadyHealedToday', { name: patient.name }));
    }

    const { RyfRoll } = await import('../rolls/ryf-roll.mjs');
    const skillRoll = await RyfRoll.rollSkill(this, skill.name, difficulty, mode, modifier, {
      specialization: specialization,
      spendToken: spendToken
    });
    if (!skillRoll || !skillRoll.success) return skillRoll;

    const healingRoll = await RyfRoll.rollHealing(skill, patient, skillRoll.criticalDice, getRule('healSkillDice'));
    await patient.heal(healingRoll.total);

    // El límite diario se limpia con el descanso largo (nuevo día)
    if (patient.isOwner) {
      await patient.setFlag('ryf3', 'healedToday', true);
    }

    return { skillRoll: skillRoll, healingRoll: healingRoll };
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

  // Reference: RyF 3.0 PDF, páginas 91-92 - Tokens de la muerte (módulo
  // opcional): gastarlo antes de una tirada sube un rango el dado objetivo
  async spendDeathToken() {
    if (!game.settings.get('ryf3', 'enableTokens') || this.type !== 'character') return false;

    const tokens = this.system.tokens || { value: 0 };
    if (tokens.value <= 0) {
      ui.notifications.warn(game.i18n.localize('RYF.Warnings.NoTokens'));
      return false;
    }

    await this.update({ 'system.tokens.value': tokens.value - 1 });
    return true;
  }

  // Reference: RyF 3.0 PDF, página 92 - el máster puede devolver el token en
  // cualquier momento; la siguiente tirada del personaje baja un rango el dado
  // objetivo (flag tokenDebt, consumida por la próxima tirada)
  async returnDeathToken() {
    if (this.type !== 'character') return;

    const tokens = this.system.tokens || { value: 0, max: 1 };
    await this.update({ 'system.tokens.value': Math.min(tokens.value + 1, tokens.max || 1) });
    await this.setFlag('ryf3', 'tokenDebt', true);

    await ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ actor: this }),
      content: game.i18n.format('RYF.Notifications.TokenReturned', { name: this.name }),
      whisper: game.users.filter(u => this.testUserPermission(u, 'OWNER')).map(u => u.id)
    });
  }

  async rollMeleeAttack(weapon, targetDefense = null, modeOverride = null, modifier = 0, offhandWeapon = null, options = {}) {
    if (!this.getRollMode()) {
      ui.notifications.warn(game.i18n.localize('RYF.Warnings.CannotActInCurrentState'));
      return null;
    }

    // Malherido ya no se aplica aquí: es un factor de rango dentro de
    // RyfRoll.rollAttack (RyF 3.0 PDF, páginas 17-18)
    const mode = modeOverride || 'normal';

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
    const attackRoll = await RyfRoll.rollAttack(this, weapon, targetDefense, mode, modifier, options);

    if (attackRoll && attackRoll.success) {
      const rollDamage = await Dialog.confirm({
        title: game.i18n.localize('RYF.Combat.AttackSuccess'),
        content: `<p>${game.i18n.localize('RYF.Combat.RollDamageQuestion')}</p>`,
        defaultYes: true
      });

      if (rollDamage) {
        if (offhandWeapon) {
          // Reference: RyF 3.0 PDF, página 103 (detalle en RyF 3.0 Medieval) -
          // con dos armas ligeras el daño causado es el mayor de las dos
          await RyfRoll.rollDualDamage(weapon, offhandWeapon, attackRoll.criticalDice, this);
        } else {
          await RyfRoll.rollDamage(weapon, attackRoll.criticalDice, 0, this);
        }
      }
    }

    return attackRoll;
  }

  async rollRangedAttack(weapon, range = null, modeOverride = null, targetDefenseRanged = null, modifier = 0, options = {}) {
    if (!this.getRollMode()) {
      ui.notifications.warn(game.i18n.localize('RYF.Warnings.CannotActInCurrentState'));
      return null;
    }

    // Malherido ya no se aplica aquí: es un factor de rango dentro de
    // RyfRoll.rollAttack (RyF 3.0 PDF, páginas 17-18)
    const mode = modeOverride || 'normal';

    if (!range) {
      ui.notifications.warn(game.i18n.localize('RYF.Warnings.NoRangeSelected'));
      return null;
    }

    // Reference: RyF 3.0 PDF, páginas 21 y 93 - dificultad por banda de distancia
    const difficulties = {
      'pointblank': getRule('rangePointBlank'),
      'short': getRule('rangeShort'),
      'medium': getRule('rangeMedium'),
      'long': getRule('rangeLong')
    };

    let difficulty = difficulties[range] || getRule('rangeShort');

    if (targetDefenseRanged) {
      difficulty += targetDefenseRanged;
    }

    // Reference: RyF 3.0 PDF, páginas 93-94 - cobertura y movimiento del
    // blanco suben la dificultad; el flanqueo del atacante la baja
    if (options.rangedModifiers) {
      difficulty += options.rangedModifiers.total;
    }

    const { RyfRoll } = await import('../rolls/ryf-roll.mjs');
    const attackRoll = await RyfRoll.rollAttack(this, weapon, difficulty, mode, modifier, options);

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

    if (!this.getRollMode()) {
      ui.notifications.warn(game.i18n.localize('RYF.Warnings.CannotActInCurrentState'));
      return null;
    }

    const attackType = attack.system.attackType;

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
    }

    const { RyfRoll } = await import('../rolls/ryf-roll.mjs');
    let rangedModifiers = null;

    if (attackType !== 'melee') {
      const rangeParams = await Dialog.prompt({
        title: game.i18n.localize('RYF.Combat.SelectRange'),
        content: `
          <form>
            <div class="form-group">
              <label>${game.i18n.localize('RYF.Range')}</label>
              <select name="range">
                <option value="pointblank">${game.i18n.localize('RYF.Combat.RangePointBlank')} (${getRule('rangePointBlank')})</option>
                <option value="short" selected>${game.i18n.localize('RYF.Combat.RangeShort')} (${getRule('rangeShort')})</option>
                <option value="medium">${game.i18n.localize('RYF.Combat.RangeMedium')} (${getRule('rangeMedium')})</option>
                <option value="long">${game.i18n.localize('RYF.Combat.RangeLong')} (${getRule('rangeLong')})</option>
              </select>
            </div>
            ${RyfRoll.rangedModifiersFields()}
          </form>
        `,
        callback: (html) => ({
          range: html.find('[name="range"]').val(),
          rangedModifiers: RyfRoll.readRangedModifiers(html)
        }),
        rejectClose: false
      });

      if (!rangeParams) return null;

      // Reference: RyF 3.0 PDF, páginas 21 y 93 - dificultad por banda de distancia
      const difficulties = {
        'pointblank': getRule('rangePointBlank'),
        'short': getRule('rangeShort'),
        'medium': getRule('rangeMedium'),
        'long': getRule('rangeLong')
      };

      difficulty = difficulties[rangeParams.range] || getRule('rangeShort');

      // Reference: RyF 3.0 PDF, páginas 93-94 - cobertura, movimiento del
      // blanco y flanqueo modifican la dificultad
      rangedModifiers = rangeParams.rangedModifiers;
      if (rangedModifiers) {
        difficulty += rangedModifiers.total;
      }
    }

    // El ataque y el daño se resuelven por el mismo camino que los personajes
    // (RyfRoll), de modo que malherido, pifias y el 1 natural aplican también
    // a los PNJ
    const attackRoll = await RyfRoll.rollAttack(this, attack, difficulty, mode, modifier, { rangedModifiers: rangedModifiers });

    if (attackRoll && attackRoll.success) {
      const rollDamage = await Dialog.confirm({
        title: game.i18n.localize('RYF.Combat.AttackSuccess'),
        content: `<p>${game.i18n.localize('RYF.Combat.RollDamageQuestion')}</p>`,
        defaultYes: true
      });

      if (rollDamage) {
        await RyfRoll.rollDamage(attack, attackRoll.criticalDice, 0, this);
      }
    }

    return attackRoll;
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
      style: CONST.CHAT_MESSAGE_STYLES.OTHER
    });

    return finalDamage;
  }

  async castSpell(spell, targets = null, mode = 'normal', modifier = 0, options = {}) {
    if (!spell || spell.type !== 'spell') {
      ui.notifications.warn(game.i18n.localize('RYF.Warnings.InvalidSpell'));
      return null;
    }

    // Reference: RyF 3.0 PDF, página 101 - Quemar maná: cada 2 puntos de maná
    // extra gastados dan +1 a la tirada de lanzamiento (repetible)
    const extraMana = this.type === 'character' ? Math.max(0, options.extraMana || 0) : 0;
    options.extraMana = extraMana;
    options.burnBonus = Math.floor(extraMana / 2);

    if (this.type === 'character') {
      const manaCost = (spell.system.manaCost || 0) + extraMana;
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
    }

    const castingDifficulty = spell.system.castingDifficulty || 15;

    const { RyfRoll } = await import('../rolls/ryf-roll.mjs');
    const castingRoll = await RyfRoll.rollSpellCasting(
      this,
      spell,
      castingDifficulty,
      mode,
      modifier,
      options
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

    const rawEffects = spell.system.effects || [];
    const effects = Array.isArray(rawEffects) ? rawEffects : Object.values(rawEffects);

    if (effects.length === 0) {
      ui.notifications.warn(game.i18n.localize('RYF.Warnings.SpellHasNoEffects'));
      return null;
    }

    const results = [];

    for (const effect of effects) {
      let effectResult = null;

      switch (effect.type) {
        case 'immediate-damage':
          effectResult = await this._applyImmediateDamage(effect, targets, spell, castingRoll.criticalDice);
          break;
        case 'immediate-healing':
          effectResult = await this._applyImmediateHealing(effect, targets, spell, castingRoll.criticalDice);
          break;
        case 'buff':
        case 'debuff':
          effectResult = await this._applyTemporalEffect(effect, targets, spell, castingRoll.criticalDice);
          break;
        case 'condition':
          effectResult = await this._applyCondition(effect, targets, spell);
          break;
        default:
          console.warn(`RyF | Unknown effect type: ${effect.type}`);
      }

      if (effectResult) {
        results.push(effectResult);
      }
    }

    return results;
  }

  async _applyImmediateDamage(effect, targets, spell, castingCriticalDice = 0) {
    const results = [];

    let range = null;
    if (effect.requiresAttack && effect.attackType === 'ranged') {
      range = await this._promptRangeDialog();
      if (!range) return null;
    }

    if (targets.length === 0) {
      if (effect.requiresAttack) {
        await this._rollSpellAttackForEffect(spell, effect, null, range);
      }
      ui.notifications.info(game.i18n.localize('RYF.Info.NoTargetsForDamage'));
      return results;
    }

    for (const target of targets) {
      let hitSuccess = true;
      let attackRoll = null;

      if (effect.requiresAttack) {
        attackRoll = await this._rollSpellAttackForEffect(spell, effect, target, range);
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

      let damageMultiplier = 1;

      if (effect.savingThrow?.enabled) {
        const savingThrow = await this._rollSavingThrowForEffect(target, spell, effect);
        if (savingThrow.success) {
          if (effect.savingThrow.halfDamageOnSave) {
            damageMultiplier = 0.5;
          } else {
            damageMultiplier = 0;
          }
        }
      }

      if (damageMultiplier > 0) {
        // El crítico viene de la tirada de ataque si el efecto la requiere,
        // o de la tirada de lanzamiento en caso contrario
        const criticalDice = effect.requiresAttack ? (attackRoll?.criticalDice || 0) : castingCriticalDice;

        // Reference: RyF 3.0 PDF, página 19 - los dados de efecto explotan y
        // cada 10 de margen añade 1d6 al daño
        const { RyfRoll } = await import('../rolls/ryf-roll.mjs');
        const damageRoll = await RyfRoll.rollSpellDamage(spell, criticalDice, effect.formula, effect.damageType);

        const damageAmount = Math.floor(damageRoll.total * damageMultiplier);

        const targetActor = target.actor || target;
        await targetActor.applyDamage(damageAmount, effect.damageType, this);

        results.push({
          target: target,
          hit: true,
          damage: damageAmount,
          damageRoll: damageRoll,
          saved: damageMultiplier < 1
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

  async _applyImmediateHealing(effect, targets, spell, castingCriticalDice = 0) {
    const results = [];

    if (targets.length === 0) {
      ui.notifications.info(game.i18n.localize('RYF.Info.NoTargetsForHealing'));
      return results;
    }

    const { RyfRoll } = await import('../rolls/ryf-roll.mjs');

    for (const target of targets) {
      const targetActor = target.actor || target;

      // Reference: RyF 3.0 PDF, página 19 - los dados de efecto explotan y el
      // crítico también añade 1d6 por cada 10 de margen a la curación
      const healingRoll = await RyfRoll.rollHealing(spell, targetActor, castingCriticalDice, effect.formula);
      const healingAmount = healingRoll.total;

      // heal() aplica también la ventaja Recuperación del objetivo (pág. 98)
      await targetActor.heal(healingAmount);

      results.push({
        target: targetActor,
        healing: healingAmount,
        healingRoll: healingRoll
      });
    }

    return results;
  }

  async _applyTemporalEffect(effect, targets, spell, castingCriticalDice = 0) {
    const results = [];
    const { RyfActiveEffect } = await import('./ryf-active-effect.mjs');

    // Reference: RyF 3.0 PDF, página 19 - el crítico también se aplica a los
    // turnos: cada 10 de margen añade 1d6 (explosivo) de duración extra
    let criticalTurns = 0;
    if (castingCriticalDice > 0) {
      const { rollEffect } = await import('../helpers/dice.mjs');
      const criticalRoll = await rollEffect(`${castingCriticalDice}d6`);
      criticalTurns = criticalRoll.total;
    }

    if (targets.length === 0) {
      ui.notifications.info(game.i18n.localize('RYF.Info.NoTargetsForBuff'));
      return results;
    }

    for (const target of targets) {
      let applyEffect = true;

      if (effect.savingThrow?.enabled) {
        const savingThrow = await this._rollSavingThrowForEffect(target, spell, effect);
        applyEffect = !savingThrow.success;
      }

      if (applyEffect) {
        const targetActor = target.actor || target;

        let duration = effect.duration.value;

        if (effect.duration.type === 'perLevel') {
          duration = duration * spell.system.level;
        }

        duration += criticalTurns;

        const effectType = effect.type === 'buff' ? 'RYF.Magic.EffectTypes.Buff' : 'RYF.Magic.EffectTypes.Debuff';

        const effectData = {
          name: `${spell.name} (${game.i18n.localize(effectType)})`,
          img: spell.img,
          sourceType: 'spell',
          sourceName: spell.name,
          sourceId: spell.id,
          effectType: this._getEffectTypeFromTarget(effect.target),
          targetType: effect.target,
          targetName: effect.targetName || '',
          modifier: effect.modifier,
          duration: {
            total: duration
          },
          appliedBy: this.name
        };

        const activeEffect = await RyfActiveEffect.createFromSpell(targetActor, spell, effectData);

        results.push({
          target: targetActor,
          effect: activeEffect
        });
      } else {
        results.push({
          target: target,
          saved: true
        });
      }
    }

    return results;
  }

  async _applyCondition(effect, targets, spell) {
    const results = [];

    if (targets.length === 0) {
      ui.notifications.info(game.i18n.localize('RYF.Info.NoTargetsForBuff'));
      return results;
    }

    const conditionMapping = {
      'paralyzed': 'paralysis',
      'blinded': 'blind',
      'stunned': 'stun',
      'prone': 'prone',
      'frightened': 'fear',
      'charmed': 'charmed'
    };

    for (const target of targets) {
      let applyEffect = true;

      if (effect.savingThrow?.enabled) {
        const savingThrow = await this._rollSavingThrowForEffect(target, spell, effect);
        applyEffect = !savingThrow.success;
      }

      if (applyEffect) {
        const targetActor = target.actor || target;

        let duration = effect.duration.value;

        if (effect.duration.type === 'perLevel') {
          duration = duration * spell.system.level;
        }

        const statusId = conditionMapping[effect.condition] || effect.condition;

        const durationConfig = {
          turns: duration
        };

        if (game.combat && game.combat.started && game.combat.round >= 1) {
          durationConfig.startRound = game.combat.round;
          durationConfig.startTurn = game.combat.turn;
        }

        const statusEffect = CONFIG.statusEffects.find(s => s.id === statusId);
        const conditionName = statusEffect ? game.i18n.localize(statusEffect.name) : game.i18n.localize(`RYF.Magic.Conditions.${effect.condition.charAt(0).toUpperCase() + effect.condition.slice(1)}`);

        const effectConfig = {
          name: conditionName,
          img: statusEffect?.img || `icons/svg/statuses/${statusId}.svg`,
          origin: spell.uuid,
          disabled: false,
          transfer: false,
          statuses: [statusId],
          duration: durationConfig,
          flags: {
            ryf3: {
              sourceType: 'spell',
              sourceName: spell.name,
              sourceId: spell.id,
              appliedBy: this.name,
              appliedAt: Date.now(),
              effectType: 'condition',
              targetType: 'condition',
              targetName: '',
              condition: statusId
            }
          }
        };

        const created = await targetActor.createEmbeddedDocuments('ActiveEffect', [effectConfig]);

        if (created && created.length > 0) {
          const notificationName = `${spell.name} (${conditionName})`;
          ui.notifications.info(game.i18n.format('RYF.Notifications.ConditionApplied', {
            condition: notificationName,
            actor: targetActor.name,
            duration: duration
          }));

          results.push({
            target: targetActor,
            condition: effect.condition,
            duration: duration,
            effect: created[0]
          });
        }
      } else {
        results.push({
          target: target,
          saved: true
        });
      }
    }

    return results;
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
    const { RyfActiveEffect } = await import('./ryf-active-effect.mjs');

    if (targets.length === 0) {
      ui.notifications.info(game.i18n.localize('RYF.Info.NoTargetsForBuff'));
      return results;
    }

    for (const target of targets) {
      const targetActor = target.actor || target;

      let duration = spell.system.effect.duration.value;

      if (spell.system.effect.duration.type === 'perLevel') {
        duration = duration * spell.system.level;
      }

      const effectData = {
        name: `${spell.name} (${game.i18n.localize('RYF.Magic.EffectTypes.Buff')})`,
        img: spell.img,
        sourceType: 'spell',
        sourceName: spell.name,
        sourceId: spell.id,
        effectType: this._getEffectTypeFromSpellType(spell.system.spellType),
        targetType: this._getTargetTypeFromSpellType(spell.system.spellType),
        targetName: spell.system.effect.targetName || '',
        modifier: spell.system.effect.modifier,
        duration: {
          total: duration
        },
        appliedBy: this.name
      };

      const effect = await RyfActiveEffect.createFromSpell(targetActor, spell, effectData);

      results.push({
        target: targetActor,
        effect: effect
      });
    }

    return results;
  }

  async _castEffectSpell(spell, targets) {
    const results = [];
    const { RyfActiveEffect } = await import('./ryf-active-effect.mjs');

    for (const target of targets) {
      let applyEffect = true;

      if (spell.system.savingThrow.enabled) {
        const savingThrow = await this._rollSavingThrow(target, spell);
        applyEffect = !savingThrow.success;
      }

      if (applyEffect) {
        let duration = spell.system.effect.duration.value;

        if (spell.system.effect.duration.type === 'perLevel') {
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
            total: duration
          },
          appliedBy: this.name
        };

        const effect = await RyfActiveEffect.createFromSpell(target.actor, spell, effectData);

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
      style: CONST.CHAT_MESSAGE_STYLES.OTHER
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
                <option value="pointblank">${game.i18n.localize('RYF.Combat.RangePointBlank')} (${getRule('rangePointBlank')})</option>
                <option value="short" selected>${game.i18n.localize('RYF.Combat.RangeShort')} (${getRule('rangeShort')})</option>
                <option value="medium">${game.i18n.localize('RYF.Combat.RangeMedium')} (${getRule('rangeMedium')})</option>
                <option value="long">${game.i18n.localize('RYF.Combat.RangeLong')} (${getRule('rangeLong')})</option>
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
            label: game.i18n.localize('RYF.Cancel'),
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

  async _rollSpellAttackForEffect(spell, effect, target, range = null) {
    const spellAsWeapon = {
      name: spell.name,
      type: 'weapon',
      system: {
        category: effect.attackType
      }
    };

    if (effect.attackType === 'melee') {
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
    } else if (effect.attackType === 'ranged') {
      let targetDefenseRanged = null;

      if (target) {
        const targetActor = target.actor || target;
        targetDefenseRanged = targetActor.system.defense?.ranged || 0;
      }

      return await this.rollRangedAttack(spellAsWeapon, range, null, targetDefenseRanged, 0);
    }

    return null;
  }

  async _rollSavingThrowForEffect(target, spell, effect) {
    const targetActor = target.actor || target;
    const attribute = effect.savingThrow.attribute;
    const difficulty = effect.savingThrow.difficulty;

    const { RyfRoll } = await import('../rolls/ryf-roll.mjs');

    const savingRoll = await RyfRoll.rollAttribute(
      targetActor,
      attribute,
      difficulty,
      'normal'
    );

    return savingRoll;
  }

  _getEffectTypeFromTarget(target) {
    switch (target) {
      case 'attribute':
        return 'attribute-bonus';
      case 'skill':
        return 'skill-bonus';
      case 'weapon-damage':
        return 'weapon-damage-bonus';
      case 'weapon-attack':
        return 'weapon-attack-bonus';
      case 'armor':
        return 'armor-bonus';
      case 'defense':
        return 'defense-bonus';
      case 'defense-melee':
        return 'defense-melee-bonus';
      case 'defense-ranged':
        return 'defense-ranged-bonus';
      case 'attack-melee':
        return 'attack-melee-bonus';
      case 'attack-ranged':
        return 'attack-ranged-bonus';
      case 'max-health':
        return 'max-health-bonus';
      case 'initiative':
        return 'initiative-bonus';
      case 'absorption':
        return 'absorption-bonus';
      case 'hindrance-reduction':
        return 'hindrance-reduction';
      case 'damage-melee':
        return 'damage-melee-bonus';
      case 'damage-ranged':
        return 'damage-ranged-bonus';
      case 'spell-casting':
        return 'spell-casting-bonus';
      case 'healing-received':
        return 'healing-received-bonus';
      case 'health-multiplier':
        return 'health-multiplier-bonus';
      case 'mana-multiplier':
        return 'mana-multiplier-bonus';
      default:
        return 'skill-bonus';
    }
  }
}
