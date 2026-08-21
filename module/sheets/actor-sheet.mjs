import { RyfRoll } from '../rolls/ryf-roll.mjs';
import { getRule } from '../helpers/rules.mjs';
import { getEconomy, getConversionHint } from '../helpers/economy.mjs';
import { resolveMode, SKILL_DIFFICULTIES, ATTRIBUTE_DIFFICULTIES } from '../helpers/dice.mjs';
import { formDialog, confirmDialog, choiceDialog } from '../helpers/dialogs.mjs';
import { RyfSheetMixin } from './sheet-mixin.mjs';

export class RyfActorSheet extends RyfSheetMixin(foundry.applications.sheets.ActorSheetV2) {

  static DEFAULT_OPTIONS = {
    classes: ['ryf', 'sheet', 'actor'],
    position: { width: 720, height: 800 },
    window: { resizable: true },
    form: { submitOnChange: true, closeOnSubmit: false }
  };

  #dropBound = false;

  async _prepareContext(options) {
    const context = await super._prepareContext(options);

    const source = this.actor.toObject(false);

    context.actor = this.actor;
    context.system = source.system;
    context.flags = source.flags;
    context.items = source.items.sort((a, b) => (a.sort || 0) - (b.sort || 0));
    context.editable = this.isEditable;
    context.owner = this.document.isOwner;
    context.cssClass = this.isEditable ? 'editable' : 'locked';

    context.config = CONFIG.RYF;

    context.isCarismaEnabled = CONFIG.RYF.isCarismaEnabled();
    context.isMagicEnabled = CONFIG.RYF.isMagicEnabled();
    // Reference: RyF 3.0 PDF, páginas 91-92 - módulo opcional Tokens de la muerte
    context.enableTokens = game.settings.get('ryf3', 'enableTokens');
    // Reference: RyF 3.0 PDF, páginas 96-98 - módulo opcional de munición
    context.enableAmmo = game.settings.get('ryf3', 'enableAmmo');
    // Reference: RyF 3.0 PDF, páginas 43 y 98 - módulos opcionales de Cordura y Razas
    context.enableSanity = game.settings.get('ryf3', 'enableSanity');
    context.enableRaces = game.settings.get('ryf3', 'enableRaces');
    context.isGM = game.user.isGM;

    context.enrichedBiography = await foundry.applications.ux.TextEditor.implementation.enrichHTML(
      source.system.biography || '',
      { secrets: this.document.isOwner, relativeTo: this.actor }
    );

    if (this.actor.type === 'character') {
      this._prepareCharacterData(context);
    }

    if (this.actor.type === 'npc') {
      this._prepareNpcData(context);
    }

    this._prepareItems(context);

    return context;
  }

  _prepareCharacterData(context) {
    const pyramid = CONFIG.RYF.getActivePyramid();
    context.pyramid = pyramid;

    const totalXP = context.system.experience?.total || 0;
    const shouldValidatePyramid = totalXP === 0;

    if (shouldValidatePyramid) {
      const validation = this.actor.validateSkillPyramid();
      context.pyramidValidation = validation;
    } else {
      context.pyramidValidation = { valid: true, errors: [] };
    }

    const skills = this.actor.items.filter(i => i.type === 'skill');
    context.hasSkills = skills.length > 0;

    const attributePoints = context.system.attributePoints;
    context.attributePointsRemaining = attributePoints.max - attributePoints.used;

    // Reference: RyF 3.0 PDF, página 26 - dinero; el juego de monedas es
    // configurable por mundo (menú EconomyConfig)
    const economy = getEconomy();
    context.currencies = economy.currencies.map(currency => ({
      ...currency,
      value: context.system.money?.[currency.id] ?? 0
    }));
    context.moneyConversionHint = getConversionHint(economy.currencies);

    const states = context.system.states;
    if (states.dead) {
      context.characterState = 'dead';
    } else if (states.unconscious) {
      context.characterState = 'unconscious';
    } else if (states.wounded) {
      context.characterState = 'wounded';
    } else {
      context.characterState = 'healthy';
    }
  }

  _prepareNpcData(context) {
  }

  _prepareItems(context) {
    const skills = [];
    const weapons = [];
    const armor = [];
    const shields = [];
    const equipment = [];
    const spells = [];
    const npcAttacks = [];
    const advantages = [];
    const races = [];

    for (let i of context.items) {
      i.img = i.img || Item.DEFAULT_ICON;

      if (i.type === 'skill') {
        skills.push(i);
      } else if (i.type === 'weapon') {
        weapons.push(i);
      } else if (i.type === 'armor') {
        armor.push(i);
      } else if (i.type === 'shield') {
        shields.push(i);
      } else if (i.type === 'equipment') {
        equipment.push(i);
      } else if (i.type === 'spell') {
        spells.push(i);
      } else if (i.type === 'npc-attack') {
        npcAttacks.push(i);
      } else if (i.type === 'advantage') {
        i.effectLabel = this._summarizeAdvantageEffects(i);
        advantages.push(i);
      } else if (i.type === 'race') {
        i.effectLabel = this._summarizeAdvantageEffects(i);
        i.grantedLabel = (i.system.grantedAdvantages || []).map(entry => entry.name).join(' / ');
        races.push(i);
      }
    }

    const activeEffects = this.actor.effects
      .filter(e => !e.disabled)
      .map(e => {
        const effect = e.toObject();
        effect.isTemporary = e.duration?.turns > 0;

        const totalTurns = e.duration?.turns || 0;
        let remainingTurns = totalTurns;

        if (e.duration?.startTurn !== undefined && game.combat) {
          const currentTurn = game.combat.turn;
          const currentRound = game.combat.round;
          const startTurn = e.duration.startTurn;
          const startRound = e.duration.startRound || 1;

          const elapsedRounds = currentRound - startRound;
          const elapsedTurns = elapsedRounds * game.combat.combatants.size + (currentTurn - startTurn);
          remainingTurns = Math.max(0, totalTurns - elapsedTurns);
        }

        effect.durationRemaining = remainingTurns;
        effect.durationTotal = totalTurns;

        const isNativeCondition = e.statuses && e.statuses.size > 0;

        if (e.flags?.ryf3) {
          effect.sourceName = e.flags.ryf3.sourceName || e.name;
          effect.sourceType = e.flags.ryf3.sourceType || 'unknown';
          effect.effectType = e.flags.ryf3.effectType || 'unknown';
          effect.targetType = e.flags.ryf3.targetType || 'unknown';
          effect.targetName = e.flags.ryf3.targetName || '';
          effect.modifier = e.system?.changes?.[0]?.value || 0;
        } else if (isNativeCondition) {
          effect.sourceName = e.name;
          effect.sourceType = 'condition';
          effect.effectType = 'condition';
          effect.targetType = 'condition';
          effect.targetName = '';
          effect.modifier = 0;
        } else {
          effect.sourceName = e.name || game.i18n.localize('RYF.Unknown');
          effect.sourceType = 'other';
          effect.effectType = 'other';
          effect.targetType = 'other';
          effect.targetName = '';
          effect.modifier = e.system?.changes?.[0]?.value || 0;
        }

        return effect;
      })
      .sort((a, b) => (b.durationRemaining || 0) - (a.durationRemaining || 0));

    context.skills = skills;
    context.weapons = weapons;
    context.armor = armor;
    context.shields = shields;
    context.equipment = equipment;
    context.spells = spells;
    context.hasSpells = spells.length > 0;
    context.activeEffects = activeEffects;
    context.npcAttacks = npcAttacks;
    context.advantages = advantages;
    context.races = races;
  }

  // Resumen legible de los efectos de una ventaja para la lista de la ficha
  _summarizeAdvantageEffects(item) {
    const rawEffects = item.system.effects || [];
    const effects = Array.isArray(rawEffects) ? rawEffects : Object.values(rawEffects);

    return effects.map(effect => {
      if (effect.type === 'note') return effect.text;

      const pascal = (effect.target || '').split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1)).join('');
      let label = game.i18n.localize(`RYF.Magic.EffectTargets.${pascal}`);
      if (effect.targetName) label += ` (${effect.targetName})`;
      const modifier = effect.modifier || 0;
      return `${label} ${modifier > 0 ? '+' : ''}${modifier}`;
    }).filter(Boolean).join(', ');
  }

  _onRender(context, options) {
    super._onRender(context, options);
    this.#bindDragDrop();
    this.#applyItemTranslations();
  }

  // Nombres traducidos de los items de compendio con translationKey (antes en
  // el hook renderActorSheet)
  #applyItemTranslations() {
    for (const nameEl of this.element.querySelectorAll('.item .item-name')) {
      const itemId = nameEl.closest('.item')?.dataset.itemId;
      const item = this.actor.items.get(itemId);
      if (!item?.flags?.ryf?.translationKey) continue;

      const nameKey = `RYF.ITEMS.${item.flags.ryf.translationKey}.name`;
      const translatedName = game.i18n.localize(nameKey);

      if (translatedName !== nameKey && item.name.startsWith('RYF.ITEMS.')) {
        const heading = nameEl.querySelector('h4');
        if (heading) heading.textContent = translatedName;
      }
    }
  }

  #bindDragDrop() {
    for (const li of this.element.querySelectorAll('.item-list .item')) {
      if (!li.dataset.itemId) continue;
      li.setAttribute('draggable', 'true');
      li.addEventListener('dragstart', this._onDragStart.bind(this));
    }

    // El elemento raíz sobrevive a los re-renders: el listener de drop se
    // engancha una sola vez
    if (!this.#dropBound) {
      this.element.addEventListener('dragover', event => event.preventDefault());
      this.element.addEventListener('drop', this._onDrop.bind(this));
      this.#dropBound = true;
    }
  }

  #itemFromTarget(target) {
    const li = target.closest('[data-item-id]');
    return li ? this.actor.items.get(li.dataset.itemId) : null;
  }

  async _handleSheetAction(action, event, target) {
    if (!this.isEditable) return;

    switch (action) {
      case 'createItem': return this._onItemCreate(target);
      case 'editItem': return this.#itemFromTarget(target)?.sheet.render(true);
      case 'deleteItem': return this._onItemDelete(target);
      case 'toggleItem': return this.#itemFromTarget(target)?.toggleEquipped();
      case 'attackWeapon': {
        const weapon = this.#itemFromTarget(target);
        if (weapon) await this.rollWeaponItem(weapon);
        return;
      }
      case 'reloadWeapon': {
        const weapon = this.#itemFromTarget(target);
        if (weapon) await this.actor.reloadWeapon(weapon);
        return;
      }
      case 'opposedSkill': return this._onSkillOpposed(target);
      case 'rollSkill': {
        const skill = this.#itemFromTarget(target);
        if (skill?.type === 'skill') await this.rollSkillItem(skill);
        return;
      }
      case 'increaseSkill': return this.#itemFromTarget(target)?.increaseLevel();
      case 'decreaseSkill': return this.#itemFromTarget(target)?.decreaseLevel();
      case 'castSpell': {
        const spell = this.#itemFromTarget(target);
        if (spell) await this.castSpellItem(spell);
        return;
      }
      case 'removeEffect': return this._onRemoveEffect(target);
      case 'toggleEffect': return this._onToggleEffect(target);
      case 'rollNpcAttack': {
        const attack = this.#itemFromTarget(target);
        if (attack) await this.actor.rollNpcAttack(attack);
        return;
      }
      case 'shortRest': return this.actor.shortRest();
      case 'longRest': return this.actor.longRest();
      // Reference: RyF 3.0 PDF, página 94 - Coger aire tras un combate
      case 'breather': return this.actor.breather();
      case 'rollAttribute': return this._onAttributeRoll(target);
      case 'healSkill': return this._onSkillHeal(target);
      case 'addExperience': return this._onAddExperience();
      // Reference: RyF 3.0 PDF, página 92 - el máster devuelve el token
      case 'returnToken': return this.actor.returnDeathToken();
      case 'sanityLoss': return this._onSanityLoss();
      case 'shipAttack': return this._onShipAttack();
      case 'shipDefense': return this._rollShipPilotSide('defense');
      case 'shipChase': return this._rollShipPilotSide('chase');
      case 'clearCrew': return this._onCrewClear(target);
    }
  }

  // El input de atributo aplica su propia lógica de puntos de creación en vez
  // del submit genérico del formulario
  _onChangeForm(formConfig, event) {
    if (event.target.classList.contains('attribute-input')) {
      return this._onAttributeChange(event);
    }
    return super._onChangeForm(formConfig, event);
  }

  // Reference: RyF 3.0 PDF, páginas 103-104 - cada nave tira su lado de la
  // enfrentada por separado, cuando le toca; los totales se comparan en el
  // chat. El bono del tripulante se calcula de su ficha vinculada (Destreza +
  // habilidad) o de la base manual de la nave.
  async _onShipAttack() {
    const ship = this.actor;
    const crew = await ship.getCrewBonus('gunner');

    const params = await formDialog({
      title: `${game.i18n.localize('RYF.Ship.AttackTitle')}: ${ship.name}`,
      okLabel: game.i18n.localize('RYF.Ship.Attack'),
      okIcon: 'fas fa-crosshairs',
      content: `
        <div class="crew-bonus-info" style="background: var(--ryf-secondary); padding: 8px; border-radius: 4px; margin-bottom: 8px;">
          <i class="fas fa-crosshairs"></i>
          ${crew.source
            ? `${game.i18n.localize('RYF.Ship.Gunner')}: <strong>${crew.source}</strong> (${crew.detail})`
            : crew.detail}
          ${crew.skillFound ? '' : `<br><em>${game.i18n.format('RYF.Ship.SkillMissing', { skill: getRule('shipGunnerSkill') })}</em>`}
        </div>
        <div class="form-group">
          <label>${game.i18n.localize('RYF.Bonus')}</label>
          <input type="number" name="bonus" value="${crew.value}" step="1"/>
        </div>
        <div class="form-group">
          <label>${game.i18n.localize('RYF.Ship.Weapon')}</label>
          <select name="weapon">
            <option value="1d6" selected>${game.i18n.localize('RYF.Ship.WeaponLaser')} (1d6)</option>
            <option value="3d6">${game.i18n.localize('RYF.Ship.WeaponMissile')} (3d6)</option>
          </select>
        </div>
        <div class="form-group">
          <label>${game.i18n.localize('RYF.Magic.DamageFormula')}</label>
          <input type="text" name="damageFormula" value="1d6"/>
        </div>
        <div class="form-group">
          <label>${game.i18n.localize('RYF.Modifier')}</label>
          <input type="number" name="modifier" value="0" step="1"/>
        </div>
      `,
      onRender: (root) => {
        root.querySelector('[name="weapon"]')?.addEventListener('change', event => {
          const formula = root.querySelector('[name="damageFormula"]');
          if (formula) formula.value = event.currentTarget.value;
        });
      },
      read: (fields) => ({
        bonus: parseInt(fields.bonus.value) || 0,
        weapon: fields.weapon.value,
        damageFormula: fields.damageFormula.value || '1d6',
        modifier: parseInt(fields.modifier.value) || 0
      })
    });

    if (!params) return;

    // Reference: RyF 3.0 PDF, página 103 - los misiles se consumen al dispararse
    const isMissile = params.weapon === '3d6';
    let weaponLabel = game.i18n.localize('RYF.Ship.WeaponLaser');
    if (isMissile) {
      weaponLabel = game.i18n.localize('RYF.Ship.WeaponMissile');
      if ((ship.system.missiles || 0) <= 0) {
        ui.notifications.warn(game.i18n.format('RYF.Warnings.NoMissiles', { name: ship.name }));
        return;
      }
      await ship.update({ 'system.missiles': ship.system.missiles - 1 });
    }

    await RyfRoll.rollShipRoll(ship, {
      contest: 'attack',
      bonus: params.bonus,
      bonusSource: crew.source,
      modifier: params.modifier,
      weaponLabel: weaponLabel,
      damageFormula: params.damageFormula
    });
  }

  // Defensa (Destreza + Pilotar + Maniobrabilidad) y persecución (Destreza +
  // Pilotar + Velocidad) comparten diálogo: solo cambia el atributo de la nave
  async _rollShipPilotSide(contest) {
    const ship = this.actor;
    const crew = await ship.getCrewBonus('pilot');
    const titleKey = contest === 'defense' ? 'RYF.Ship.DefenseTitle' : 'RYF.Ship.ChaseTitle';

    const params = await formDialog({
      title: `${game.i18n.localize(titleKey)}: ${ship.name}`,
      content: `
        <div class="crew-bonus-info" style="background: var(--ryf-secondary); padding: 8px; border-radius: 4px; margin-bottom: 8px;">
          <i class="fas fa-user-astronaut"></i>
          ${crew.source
            ? `${game.i18n.localize('RYF.Ship.Pilot')}: <strong>${crew.source}</strong> (${crew.detail})`
            : crew.detail}
          ${crew.skillFound ? '' : `<br><em>${game.i18n.format('RYF.Ship.SkillMissing', { skill: getRule('shipPilotSkill') })}</em>`}
        </div>
        <div class="form-group">
          <label>${game.i18n.localize('RYF.Bonus')}</label>
          <input type="number" name="bonus" value="${crew.value}" step="1" autofocus/>
        </div>
        <div class="form-group">
          <label>${game.i18n.localize('RYF.Modifier')}</label>
          <input type="number" name="modifier" value="0" step="1"/>
        </div>
      `,
      read: (fields) => ({
        bonus: parseInt(fields.bonus.value) || 0,
        modifier: parseInt(fields.modifier.value) || 0
      })
    });

    if (!params) return;

    await RyfRoll.rollShipRoll(ship, {
      contest: contest,
      bonus: params.bonus,
      bonusSource: crew.source,
      modifier: params.modifier
    });
  }

  // Reference: RyF 3.0 PDF, página 103 - asignación de piloto y artillero:
  // se suelta un personaje sobre la ficha de nave y se elige el rol
  async _onDropCrewMember(data) {
    const dropped = await fromUuid(data.uuid);
    if (!dropped || dropped.documentName !== 'Actor' || dropped.type !== 'character') {
      ui.notifications.warn(game.i18n.localize('RYF.Warnings.OnlyCharactersAsCrew'));
      return;
    }

    const role = await choiceDialog({
      title: game.i18n.format('RYF.Ship.AssignCrewTitle', { name: dropped.name }),
      content: `<p>${game.i18n.localize('RYF.Ship.AssignCrewHint')}</p>`,
      choices: [
        { action: 'pilot', label: game.i18n.localize('RYF.Ship.Pilot'), icon: 'fas fa-user-astronaut', default: true },
        { action: 'gunner', label: game.i18n.localize('RYF.Ship.Gunner'), icon: 'fas fa-crosshairs' }
      ]
    });

    if (!role) return;

    await this.actor.update({
      [`system.${role}.uuid`]: dropped.uuid,
      [`system.${role}.name`]: dropped.name
    });
  }

  async _onCrewClear(target) {
    const role = target.dataset.role;
    if (!['pilot', 'gunner'].includes(role)) return;

    await this.actor.update({
      [`system.${role}.uuid`]: '',
      [`system.${role}.name`]: ''
    });
  }

  // Reference: RyF 3.0 PDF, página 43 - pérdida de Cordura en d6 según gravedad
  async _onSanityLoss() {
    const params = await formDialog({
      title: game.i18n.localize('RYF.Sanity.Loss'),
      okLabel: game.i18n.localize('RYF.Roll'),
      content: `
        <p class="hint">${game.i18n.localize('RYF.Sanity.LossHint')}</p>
        <div class="form-group">
          <label>${game.i18n.localize('RYF.Sanity.LossFormula')}</label>
          <input type="text" name="formula" value="1d6" autofocus/>
        </div>
      `,
      read: (fields) => ({ formula: fields.formula.value || '1d6' })
    });

    if (!params) return;

    await this.actor.loseSanity(params.formula);
  }

  // Bloque compartido de los diálogos de tirada: factores automáticos que
  // bajan el rango, mejoras opcionales (especialización, token) y
  // previsualización del dado objetivo.
  // Reference: RyF 3.0 PDF, páginas 17-18 y 91-92
  _rollFactorsSection({ untrained = false, specialization = null } = {}) {
    const downs = [];
    if (this.actor.system.states?.wounded || this.actor.statuses?.has('wounded')) {
      downs.push({ key: 'wounded', label: game.i18n.localize('RYF.RollFactors.FactorWounded') });
    }
    if (untrained) {
      downs.push({ key: 'untrained', label: game.i18n.localize('RYF.RollFactors.FactorUntrained') });
    }
    if (this.actor.getFlag('ryf3', 'tokenDebt')) {
      downs.push({ key: 'tokenDebt', label: game.i18n.localize('RYF.RollFactors.FactorTokenDebt') });
    }

    const tokensEnabled = game.settings.get('ryf3', 'enableTokens') && this.actor.type === 'character';
    const tokenCount = this.actor.system.tokens?.value || 0;

    let html = '';

    if (downs.length > 0) {
      html += `
        <div class="roll-factors" style="background: var(--ryf-warning); padding: 8px; border-radius: 4px; margin-bottom: 8px;">
          ${downs.map(d => `<div><i class="fas fa-arrow-down"></i> ${d.label}</div>`).join('')}
        </div>`;
    }

    if (specialization) {
      html += `
        <div class="form-group">
          <label>${game.i18n.format('RYF.RollFactors.ApplySpecialization', { name: specialization })}</label>
          <input type="checkbox" name="applySpecialization"/>
        </div>`;
    }

    if (tokensEnabled && tokenCount > 0) {
      html += `
        <div class="form-group">
          <label>${game.i18n.format('RYF.RollFactors.SpendToken', { count: tokenCount })}</label>
          <input type="checkbox" name="spendToken"/>
        </div>`;
    }

    html += `
      <div class="mode-preview" style="text-align: center; margin-bottom: 8px; padding: 4px; background: var(--ryf-light); border-radius: 4px;">
        ${game.i18n.localize('RYF.RollFactors.TargetDie')}: <strong class="mode-preview-value"></strong>
      </div>`;

    return { html, downs: downs.map(d => d.key) };
  }

  // Actualiza en vivo la previsualización del dado objetivo cuando cambian el
  // modo base o las mejoras opcionales del diálogo
  _bindModePreview(root, downs) {
    const labels = {
      advantage: 'RYF.RollFactors.DieHigh',
      normal: 'RYF.RollFactors.DieMiddle',
      disadvantage: 'RYF.RollFactors.DieLow'
    };

    const update = () => {
      const base = root.querySelector('[name="mode"]')?.value || 'normal';
      const ups = [];
      if (root.querySelector('[name="applySpecialization"]')?.checked) ups.push('specialization');
      if (root.querySelector('[name="spendToken"]')?.checked) ups.push('token');
      const mode = resolveMode(base, { ups: ups, downs: downs });
      const preview = root.querySelector('.mode-preview-value');
      if (preview) preview.textContent = game.i18n.localize(labels[mode]);
    };

    for (const el of root.querySelectorAll('[name="mode"], [name="applySpecialization"], [name="spendToken"]')) {
      el.addEventListener('change', update);
    }
    update();
  }

  async _onItemCreate(target) {
    const type = target.dataset.type;
    const data = {
      name: game.i18n.format('RYF.Items.New', { type: game.i18n.localize(`TYPES.Item.${type}`) }),
      type: type,
      system: {}
    };

    const item = await Item.create(data, { parent: this.actor });
    item.sheet.render(true);
  }

  async _onItemDelete(target) {
    const item = this.#itemFromTarget(target);
    if (!item) return;

    const confirmed = await confirmDialog({
      title: game.i18n.localize('RYF.Dialogs.DeleteItem'),
      content: game.i18n.format('RYF.Dialogs.DeleteItemConfirm', { name: item.name })
    });

    if (confirmed) {
      await item.delete();
    }
  }

  async rollWeaponItem(weapon) {
    let targetDefense = null;
    let targetDefenseRanged = null;
    let targetIsMinion = false;
    const targets = Array.from(game.user.targets);

    if (targets.length === 1) {
      const targetActor = targets[0].actor;
      if (targetActor && targetActor.system.defense) {
        targetDefense = targetActor.system.defense.value;
        targetDefenseRanged = targetActor.system.defense.ranged || 0;
      }
      if (targetActor && targetActor.type === 'npc') {
        // Reference: RyF 3.0 PDF, página 87 - esbirros: caen al golpe
        targetDefense = targetDefense ?? (targetActor.system.defense || null);
        targetIsMinion = !!targetActor.system.isMinion;
      }
    }

    const isRanged = weapon.system.category !== 'melee';

    // Reference: RyF 3.0 PDF, página 103 - dos armas ligeras (de una mano): +3 al ataque
    const offhandWeapons = !isRanged
      ? this.actor.items.filter(i =>
          i.type === 'weapon' && i.system.equipped && i.system.category === 'melee' &&
          !i.system.twoHanded && !weapon.system.twoHanded && i.id !== weapon.id)
      : [];

    // La especialización de la habilidad de arma sube un rango el dado
    // objetivo si el jugador la marca (RyF 3.0 PDF, páginas 17-18 y 98)
    const weaponCategory = weapon.system.category || 'melee';
    const weaponSkill = this.actor.items.find(i => i.type === 'skill' && i.system.category === weaponCategory);
    const specialization = weaponSkill?.system.specialization?.trim() || null;
    const untrained = !weaponSkill || (weaponSkill.system.level || 0) === 0;

    const rollParams = await this._promptAttackDialog(weapon.name, isRanged, targetDefense !== null, offhandWeapons.length > 0, {
      specialization: specialization,
      untrained: untrained
    });
    if (!rollParams) return;

    const mode = rollParams.mode;
    const modifier = rollParams.modifier || 0;
    const options = {
      specialization: rollParams.specialization,
      spendToken: rollParams.spendToken,
      rangedModifiers: rollParams.rangedModifiers || null,
      calledShot: rollParams.calledShot || null,
      targetIsMinion: targetIsMinion
    };

    if (isRanged) {
      await this.actor.rollRangedAttack(weapon, rollParams.range, mode, targetDefenseRanged, modifier, options);
    } else {
      const defense = targetDefense || rollParams.defense;
      const offhand = rollParams.dualWield ? offhandWeapons[0] : null;
      const dualBonus = offhand ? getRule('dualWieldBonus') : 0;
      await this.actor.rollMeleeAttack(weapon, defense, mode, modifier + dualBonus, offhand, options);
    }
  }

  async _promptAttackDialog(weaponName, isRanged, hasTarget, dualWieldAvailable = false, { specialization = null, untrained = false } = {}) {
    // Reference: RyF 3.0 PDF, páginas 17-18 - factores de rango del dado objetivo
    const factors = this._rollFactorsSection({ untrained: untrained, specialization: specialization });

    return formDialog({
      title: `${game.i18n.localize('RYF.Attack')}: ${weaponName}`,
      okLabel: game.i18n.localize('RYF.Attack'),
      okIcon: 'fas fa-dice-d20',
      content: `
        ${factors.html}
        ${isRanged ? `
        <div class="form-group">
          <label>${game.i18n.localize('RYF.Combat.Range')}</label>
          <select name="range" autofocus>
            <option value="pointblank">${game.i18n.localize('RYF.Combat.RangePointBlank')} (${getRule('rangePointBlank')})</option>
            <option value="short" selected>${game.i18n.localize('RYF.Combat.RangeShort')} (${getRule('rangeShort')})</option>
            <option value="medium">${game.i18n.localize('RYF.Combat.RangeMedium')} (${getRule('rangeMedium')})</option>
            <option value="long">${game.i18n.localize('RYF.Combat.RangeLong')} (${getRule('rangeLong')})</option>
          </select>
        </div>
        ${RyfRoll.rangedModifiersFields()}
        ` : !hasTarget ? `
        <div class="form-group">
          <label>${game.i18n.localize('RYF.Defense')}</label>
          <input type="number" name="defense" value="10" min="1"/>
        </div>
        ` : ''}
        <div class="form-group">
          <label>${game.i18n.localize('RYF.RollMode')}</label>
          <select name="mode">
            <option value="normal" selected>${game.i18n.localize('RYF.Normal')}</option>
            <option value="advantage">${game.i18n.localize('RYF.Advantage')}</option>
            <option value="disadvantage">${game.i18n.localize('RYF.Disadvantage')}</option>
          </select>
        </div>
        <div class="form-group">
          <label>${game.i18n.localize('RYF.Modifier')}</label>
          <input type="number" name="modifier" value="0" step="1"/>
        </div>
        ${RyfRoll.calledShotField()}
        ${dualWieldAvailable ? `
        <div class="form-group">
          <label>${game.i18n.localize('RYF.DualWield')} (+${getRule('dualWieldBonus')})</label>
          <input type="checkbox" name="dualWield"/>
        </div>
        ` : ''}
      `,
      onRender: (root) => this._bindModePreview(root, factors.downs),
      read: (fields) => ({
        mode: fields.mode.value,
        defense: hasTarget || isRanged ? null : parseInt(fields.defense?.value),
        range: isRanged ? fields.range.value : null,
        modifier: parseInt(fields.modifier.value) || 0,
        dualWield: dualWieldAvailable ? !!fields.dualWield?.checked : false,
        specialization: !!fields.applySpecialization?.checked,
        spendToken: !!fields.spendToken?.checked,
        rangedModifiers: isRanged ? RyfRoll.readRangedModifiers(fields) : null,
        calledShot: fields.calledShot?.value || null
      })
    });
  }

  // Reference: RyF 3.0 PDF, página 18 - tiradas enfrentadas
  async _onSkillOpposed(target) {
    const skill = this.#itemFromTarget(target);
    if (!skill || skill.type !== 'skill') return;

    const targets = Array.from(game.user.targets);
    if (targets.length !== 1 || !targets[0].actor) {
      ui.notifications.warn(game.i18n.localize('RYF.Warnings.NoTargetSelected'));
      return;
    }

    const targetActor = targets[0].actor;
    const targetSkills = targetActor.items.filter(i => i.type === 'skill');

    const params = await formDialog({
      title: `${game.i18n.localize('RYF.OpposedRoll')}: ${skill.name} vs ${targetActor.name}`,
      content: `
        <div class="form-group">
          <label>${game.i18n.localize('RYF.OpposedDefenderSkill')}</label>
          <select name="defenderSkill" autofocus>
            ${targetSkills.map(s => `<option value="${s.name}">${s.name} (${s.system.level})</option>`).join('')}
            <option value="">${game.i18n.localize('RYF.OpposedManualBonus')}</option>
          </select>
        </div>
        <div class="form-group">
          <label>${game.i18n.localize('RYF.Modifier')}</label>
          <input type="number" name="defenderBonus" value="0" step="1"/>
        </div>
      `,
      read: (fields) => ({
        defenderSkillName: fields.defenderSkill.value || null,
        defenderBonus: parseInt(fields.defenderBonus.value) || 0
      })
    });

    if (!params) return;

    const { RyfRoll } = await import('../rolls/ryf-roll.mjs');
    await RyfRoll.rollOpposed(this.actor, skill.name, targetActor, params);
  }

  async rollSkillItem(item) {
    let defaultDifficulty = null;
    let targetWillpower = null;

    if (item.system.category === 'social') {
      const targets = Array.from(game.user.targets);
      if (targets.length === 1) {
        // Los personajes guardan la Voluntad como objeto {value} y los PNJ
        // como número plano (template.json)
        const willpower = targets[0].actor?.system.willpower;
        const willpowerValue = typeof willpower === 'number' ? willpower : willpower?.value;
        if (willpowerValue) {
          targetWillpower = willpowerValue;
          defaultDifficulty = willpowerValue;
        }
      }
    }

    const rollParams = await this._promptRollDialog(item, defaultDifficulty, targetWillpower);
    if (!rollParams) return;

    await RyfRoll.rollSkill(this.actor, item.name, rollParams.difficulty, rollParams.mode, rollParams.modifier, {
      specialization: rollParams.specialization,
      spendToken: rollParams.spendToken
    });
  }

  async _promptRollDialog(skill, defaultDifficulty = null, targetWillpower = null) {
    const skillName = skill.name;
    const difficulty = defaultDifficulty || 15;

    // Reference: RyF 3.0 PDF, páginas 17-18 - factores de rango del dado objetivo
    const factors = this._rollFactorsSection({
      untrained: (skill.system.level || 0) === 0,
      specialization: skill.system.specialization?.trim() || null
    });

    return formDialog({
      title: `${game.i18n.localize('RYF.Roll')}: ${skillName}`,
      content: `
        ${factors.html}
        ${targetWillpower ? `
        <div class="target-willpower-info" style="background: var(--ryf-secondary); padding: 8px; border-radius: 4px; margin-bottom: 8px; text-align: center;">
          <i class="fas fa-brain"></i> <strong>${game.i18n.localize('RYF.TargetWillpower')}: ${targetWillpower}</strong>
        </div>
        ` : ''}
        <div class="form-group">
          <label>${game.i18n.localize('RYF.DifficultyLabel')}</label>
          <!-- Reference: RyF 3.0 PDF, página 18 - tabla de dificultades de habilidad -->
          <select name="difficulty" autofocus>
            ${SKILL_DIFFICULTIES.map(d => `<option value="${d.value}" ${difficulty === d.value ? 'selected' : ''}>${game.i18n.localize(d.label)} (${d.value})</option>`).join('')}
            ${targetWillpower && !SKILL_DIFFICULTIES.some(d => d.value === targetWillpower) ? `<option value="${targetWillpower}" selected>${game.i18n.localize('RYF.Willpower')} (${targetWillpower})</option>` : ''}
          </select>
        </div>
        <div class="form-group">
          <label>${game.i18n.localize('RYF.RollMode')}</label>
          <select name="mode">
            <option value="normal" selected>${game.i18n.localize('RYF.Normal')}</option>
            <option value="advantage">${game.i18n.localize('RYF.Advantage')}</option>
            <option value="disadvantage">${game.i18n.localize('RYF.Disadvantage')}</option>
          </select>
        </div>
        <div class="form-group">
          <label>${game.i18n.localize('RYF.Modifier')}</label>
          <input type="number" name="modifier" value="0" step="1"/>
        </div>
      `,
      onRender: (root) => this._bindModePreview(root, factors.downs),
      read: (fields) => ({
        difficulty: parseInt(fields.difficulty.value),
        mode: fields.mode.value,
        modifier: parseInt(fields.modifier.value) || 0,
        specialization: !!fields.applySpecialization?.checked,
        spendToken: !!fields.spendToken?.checked
      })
    });
  }

  async castSpellItem(spell) {
    const castParams = await this._promptSpellCastDialog(spell);
    if (!castParams) return;

    const targets = await this._promptSpellDialog(spell);
    if (targets === null) return;

    await this.actor.castSpell(spell, targets, castParams.mode, castParams.modifier, {
      spendToken: castParams.spendToken,
      extraMana: castParams.extraMana
    });
  }

  async _promptSpellCastDialog(spell) {
    const castingDifficulty = spell.system.castingDifficulty || 15;
    const isNPC = this.actor.type === 'npc';
    const manaCost = spell.system.manaCost || 0;
    const currentMana = this.actor.system.mana?.value || 0;

    // Reference: RyF 3.0 PDF, páginas 17-18 - factores de rango del dado objetivo
    const factors = this._rollFactorsSection();

    return formDialog({
      title: `${game.i18n.localize('RYF.CastSpell')}: ${spell.name}`,
      okLabel: game.i18n.localize('RYF.Cast'),
      okIcon: 'fas fa-magic',
      content: `
        ${factors.html}
        <div class="spell-info" style="background: var(--ryf-secondary); padding: 8px; border-radius: 4px; margin-bottom: 8px;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
            <span><i class="fas fa-magic"></i> ${game.i18n.localize('RYF.Level')}: ${spell.system.level}</span>
            ${!isNPC ? `<span><i class="fas fa-droplet"></i> ${game.i18n.localize('RYF.ManaCost')}: ${manaCost}</span>` : ''}
          </div>
          <div style="display: flex; justify-content: space-between;">
            <span><i class="fas fa-bullseye"></i> ${game.i18n.localize('RYF.Magic.CastingDifficulty')}: ${castingDifficulty}</span>
            ${!isNPC ? `<span><i class="fas fa-flask"></i> ${game.i18n.localize('RYF.CurrentMana')}: ${currentMana}</span>` : ''}
          </div>
        </div>
        <div class="form-group">
          <label>${game.i18n.localize('RYF.RollMode')}</label>
          <select name="mode" autofocus>
            <option value="normal" selected>${game.i18n.localize('RYF.Normal')}</option>
            <option value="advantage">${game.i18n.localize('RYF.Advantage')}</option>
            <option value="disadvantage">${game.i18n.localize('RYF.Disadvantage')}</option>
          </select>
        </div>
        <div class="form-group">
          <label>${game.i18n.localize('RYF.Modifier')}</label>
          <input type="number" name="modifier" value="0" step="1"/>
        </div>
        ${!isNPC ? `
        <!-- Reference: RyF 3.0 PDF, página 101 - Quemar maná: +1 por cada 2 puntos extra -->
        <div class="form-group">
          <label>${game.i18n.localize('RYF.Magic.BurnMana')}</label>
          <input type="number" name="extraMana" value="0" min="0" step="1"/>
        </div>
        <p class="hint" style="margin: 0 0 8px 0;">${game.i18n.localize('RYF.Magic.BurnManaHint')}</p>
        ` : ''}
      `,
      onRender: (root) => this._bindModePreview(root, factors.downs),
      read: (fields) => ({
        mode: fields.mode.value,
        modifier: parseInt(fields.modifier.value) || 0,
        spendToken: !!fields.spendToken?.checked,
        extraMana: parseInt(fields.extraMana?.value) || 0
      })
    });
  }

  async _promptSpellDialog(spell) {
    const targetType = spell.system.targets?.type || 'single';
    const targetCount = spell.system.targets?.count || 1;

    let selectedTargets = Array.from(game.user.targets);

    if (selectedTargets.length === 0) {
      if (targetType === 'single') {
        ui.notifications.info(game.i18n.localize('RYF.Info.NoTargetsSelected'));
      } else if (targetType === 'multiple') {
        ui.notifications.info(game.i18n.format('RYF.Info.NoTargetsForMultiple', { count: targetCount }));
      } else if (targetType === 'area') {
        const areaRadius = spell.system.targets?.areaRadius || 0;
        ui.notifications.info(game.i18n.format('RYF.Info.AreaSpell', { radius: areaRadius }));
      }
    }

    return selectedTargets.map(t => t.actor).filter(a => a);
  }

  async _onRemoveEffect(target) {
    const effectId = target.dataset.effectId;
    const effect = this.actor.effects.get(effectId);

    if (effect) {
      const confirmed = await confirmDialog({
        title: game.i18n.localize('RYF.Dialogs.RemoveEffect'),
        content: game.i18n.format('RYF.Dialogs.RemoveEffectConfirm', { name: effect.name })
      });

      if (confirmed) {
        await effect.delete();
        ui.notifications.info(game.i18n.format('RYF.Notifications.EffectRemoved', { name: effect.name }));
      }
    }
  }

  async _onToggleEffect(target) {
    const effectId = target.dataset.effectId;
    const effect = this.actor.effects.get(effectId);

    if (effect) {
      await effect.update({ disabled: !effect.disabled });
    }
  }

  // Reference: RyF 3.0 PDF, página 18 - tirada de atributo puro con su propia
  // tabla de dificultades (9/12/15/18/21)
  async _onAttributeRoll(target) {
    const attribute = target.dataset.attribute;
    if (!attribute) return;

    const factors = this._rollFactorsSection();
    const attributeLabel = game.i18n.localize(`RYF.Attributes.${attribute.charAt(0).toUpperCase() + attribute.slice(1)}`);

    const difficultyOptions = ATTRIBUTE_DIFFICULTIES.map(d =>
      `<option value="${d.value}" ${d.value === 12 ? 'selected' : ''}>${game.i18n.localize(d.label)} (${d.value})</option>`
    ).join('');

    const rollParams = await formDialog({
      title: `${game.i18n.localize('RYF.Roll')}: ${attributeLabel}`,
      content: `
        ${factors.html}
        <div class="form-group">
          <label>${game.i18n.localize('RYF.DifficultyLabel')}</label>
          <select name="difficulty" autofocus>${difficultyOptions}</select>
        </div>
        <div class="form-group">
          <label>${game.i18n.localize('RYF.RollMode')}</label>
          <select name="mode">
            <option value="normal" selected>${game.i18n.localize('RYF.Normal')}</option>
            <option value="advantage">${game.i18n.localize('RYF.Advantage')}</option>
            <option value="disadvantage">${game.i18n.localize('RYF.Disadvantage')}</option>
          </select>
        </div>
        <div class="form-group">
          <label>${game.i18n.localize('RYF.Modifier')}</label>
          <input type="number" name="modifier" value="0" step="1"/>
        </div>
      `,
      onRender: (root) => this._bindModePreview(root, factors.downs),
      read: (fields) => ({
        difficulty: parseInt(fields.difficulty.value),
        mode: fields.mode.value,
        modifier: parseInt(fields.modifier.value) || 0,
        spendToken: !!fields.spendToken?.checked
      })
    });

    if (!rollParams) return;

    await RyfRoll.rollAttribute(this.actor, attribute, rollParams.difficulty, rollParams.mode, {
      modifier: rollParams.modifier,
      spendToken: rollParams.spendToken
    });
  }

  // Reference: RyF 3.0 PDF, páginas 11-12 y 45 - curación por habilidad sobre
  // el objetivo seleccionado (o uno mismo si no hay objetivo)
  async _onSkillHeal(target) {
    const skill = this.#itemFromTarget(target);
    if (!skill || skill.type !== 'skill') return;

    const targets = Array.from(game.user.targets);
    const patient = (targets.length > 0 && targets[0].actor) ? targets[0].actor : this.actor;

    const factors = this._rollFactorsSection({
      untrained: (skill.system.level || 0) === 0,
      specialization: skill.system.specialization?.trim() || null
    });

    const alreadyHealed = patient.getFlag('ryf3', 'healedToday');

    const rollParams = await formDialog({
      title: `${game.i18n.localize('RYF.Healing')}: ${skill.name}`,
      okLabel: game.i18n.localize('RYF.Healing'),
      okIcon: 'fas fa-briefcase-medical',
      content: `
        <div class="heal-target-info" style="background: var(--ryf-secondary); padding: 8px; border-radius: 4px; margin-bottom: 8px; text-align: center;">
          <i class="fas fa-user-injured"></i> ${game.i18n.localize('RYF.HealTarget')}: <strong>${patient.name}</strong>
        </div>
        ${alreadyHealed ? `
        <div class="roll-factors" style="background: var(--ryf-warning); padding: 8px; border-radius: 4px; margin-bottom: 8px;">
          <i class="fas fa-exclamation-triangle"></i> ${game.i18n.format('RYF.Warnings.AlreadyHealedToday', { name: patient.name })}
        </div>
        ` : ''}
        ${factors.html}
        <div class="form-group">
          <label>${game.i18n.localize('RYF.DifficultyLabel')}</label>
          <input type="number" name="difficulty" value="${getRule('healSkillDifficulty')}" step="1"/>
        </div>
        <div class="form-group">
          <label>${game.i18n.localize('RYF.RollMode')}</label>
          <select name="mode">
            <option value="normal" selected>${game.i18n.localize('RYF.Normal')}</option>
            <option value="advantage">${game.i18n.localize('RYF.Advantage')}</option>
            <option value="disadvantage">${game.i18n.localize('RYF.Disadvantage')}</option>
          </select>
        </div>
        <div class="form-group">
          <label>${game.i18n.localize('RYF.Modifier')}</label>
          <input type="number" name="modifier" value="0" step="1"/>
        </div>
      `,
      onRender: (root) => this._bindModePreview(root, factors.downs),
      read: (fields) => ({
        difficulty: parseInt(fields.difficulty.value) || getRule('healSkillDifficulty'),
        mode: fields.mode.value,
        modifier: parseInt(fields.modifier.value) || 0,
        specialization: !!fields.applySpecialization?.checked,
        spendToken: !!fields.spendToken?.checked
      })
    });

    if (!rollParams) return;

    await this.actor.rollHealingSkill(skill, patient, rollParams);
  }

  async _onAddExperience() {
    const params = await formDialog({
      title: game.i18n.localize('RYF.AddExperience'),
      okLabel: game.i18n.localize('RYF.AddExperience'),
      okIcon: 'fas fa-plus',
      content: `
        <div class="form-group">
          <label>${game.i18n.localize('RYF.ExperienceAmount')}</label>
          <input type="number" name="amount" value="10" min="1" autofocus/>
        </div>
        <div class="form-group">
          <label>${game.i18n.localize('RYF.Reason')}</label>
          <input type="text" name="reason" value="" placeholder="${game.i18n.localize('RYF.ReasonPlaceholder')}"/>
        </div>
      `,
      read: (fields) => ({
        amount: parseInt(fields.amount.value),
        reason: fields.reason.value
      })
    });

    if (params && params.amount > 0) {
      await this.actor.addExperience(params.amount, params.reason);
    }
  }

  async _onAttributeChange(event) {
    const input = event.target;
    const attribute = input.dataset.attribute;
    const value = parseInt(input.value);

    const currentValue = this.actor.system.attributes[attribute].value;
    const diff = value - currentValue;

    const attributePoints = this.actor.system.attributePoints;
    const newUsed = attributePoints.used + diff;

    const totalXP = this.actor.system.experience?.total || 0;
    const hasExperience = totalXP > 0;

    if (!hasExperience && newUsed > attributePoints.max) {
      ui.notifications.warn(game.i18n.localize('RYF.Warnings.NotEnoughAttributePoints'));
    }

    if (value < 1) {
      ui.notifications.warn(game.i18n.localize('RYF.Warnings.MinAttributeValue'));
      input.value = currentValue;
      return;
    }

    // Reference: RyF 3.0 PDF, página 13 - los atributos van de 4 (mínimo) a 10 (máximo)
    const attributeMin = getRule('attributeMin');
    const attributeMax = getRule('attributeMax');
    if (!hasExperience && (value < attributeMin || value > attributeMax)) {
      ui.notifications.warn(game.i18n.format('RYF.Warnings.AttributeOutOfRange', {
        min: attributeMin,
        max: attributeMax
      }));
    }

    // Reference: RyF 3.0 PDF, página 98 - topes de atributo por raza
    // (ej. Mediano: Físico máximo 7). Aviso no bloqueante.
    const race = this.actor.items.find(i =>
      i.type === 'race' && i.system.attributeCap?.attribute === attribute && i.system.attributeCap?.max > 0
    );
    if (race && value > race.system.attributeCap.max) {
      ui.notifications.warn(game.i18n.format('RYF.Warnings.RaceAttributeCap', {
        race: race.name,
        attribute: game.i18n.localize(CONFIG.RYF.attributes[attribute]),
        max: race.system.attributeCap.max
      }));
    }

    await this.actor.update({
      [`system.attributes.${attribute}.value`]: value,
      'system.attributePoints.used': newUsed
    });
  }

  _onDragStart(event) {
    const li = event.currentTarget;
    if (event.target.classList.contains('content-link')) return;

    const item = this.actor.items.get(li.dataset.itemId);
    if (!item) return;
    const dragData = item.toDragData();

    event.dataTransfer.setData('text/plain', JSON.stringify(dragData));
  }

  async _onDrop(event) {
    event.preventDefault();
    const data = foundry.applications.ux.TextEditor.implementation.getDragEventData(event);
    const actor = this.actor;

    // Reference: RyF 3.0 PDF, página 103 - asignar piloto/artillero soltando
    // un personaje sobre la ficha de nave
    if (actor.type === 'ship' && data.type === 'Actor') {
      return this._onDropCrewMember(data);
    }

    if (data.type === 'Item') {
      return this._onDropItem(event, data);
    }
  }

  async _onDropItem(event, data) {
    if (!this.actor.isOwner) return false;

    const item = await Item.implementation.fromDropData(data);
    const itemData = item.toObject();

    if (this.actor.uuid === item.parent?.uuid) return this._onSortItem(event, itemData);

    return this._onDropItemCreate(itemData);
  }

  async _onDropItemCreate(itemData) {
    itemData = itemData instanceof Array ? itemData : [itemData];
    return this.actor.createEmbeddedDocuments('Item', itemData);
  }

  _onSortItem(event, itemData) {
    const items = this.actor.items;
    const source = items.get(itemData._id);
    const dropTarget = event.target.closest('[data-item-id]');
    if (!dropTarget || !source) return;

    const target = items.get(dropTarget.dataset.itemId);
    if (!target || source.id === target.id) return;

    const siblings = [];
    for (const el of dropTarget.parentElement.children) {
      const siblingId = el.dataset?.itemId;
      if (siblingId && siblingId !== source.id) siblings.push(items.get(siblingId));
    }

    const performSort = foundry.utils.performIntegerSort ?? foundry.utils.SortingHelpers?.performIntegerSort;
    if (!performSort) return;

    const sortUpdates = performSort(source, { target: target, siblings: siblings });
    const updateData = sortUpdates.map(u => ({ _id: u.target.id, ...u.update }));
    return this.actor.updateEmbeddedDocuments('Item', updateData);
  }
}

export class RyfCharacterSheet extends RyfActorSheet {
  static PARTS = {
    body: { template: 'systems/ryf3/templates/actor/actor-character-sheet.hbs', scrollable: ['.sheet-body .tab'] }
  };
  static INITIAL_TAB = 'attributes';
}

export class RyfNpcSheet extends RyfActorSheet {
  static PARTS = {
    body: { template: 'systems/ryf3/templates/actor/actor-npc-sheet.hbs', scrollable: ['.sheet-body .tab'] }
  };
  static INITIAL_TAB = 'attacks';
}

export class RyfShipSheet extends RyfActorSheet {
  static PARTS = {
    body: { template: 'systems/ryf3/templates/actor/actor-ship-sheet.hbs', scrollable: ['.sheet-body .tab'] }
  };
  static INITIAL_TAB = 'details';
}
