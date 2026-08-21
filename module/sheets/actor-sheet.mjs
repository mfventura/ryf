import { RyfRoll } from '../rolls/ryf-roll.mjs';
import { getRule } from '../helpers/rules.mjs';
import { getEconomy, getConversionHint } from '../helpers/economy.mjs';
import { resolveMode, SKILL_DIFFICULTIES, ATTRIBUTE_DIFFICULTIES } from '../helpers/dice.mjs';

export class RyfActorSheet extends ActorSheet {

  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ["ryf", "sheet", "actor"],
      width: 720,
      height: 800,
      tabs: [{ navSelector: ".sheet-tabs", contentSelector: ".sheet-body", initial: "attributes" }],
      dragDrop: [{ dragSelector: ".item-list .item", dropSelector: null }],
      submitOnChange: true,
      closeOnSubmit: false,
      scrollY: [".tab", ".scrollable", ".sheet-body", ".item-list"]
    });
  }

  get template() {
    return `systems/ryf3/templates/actor/actor-${this.actor.type}-sheet.hbs`;
  }

  getData() {
    const context = super.getData();

    const actorData = this.actor.toObject(false);

    context.system = actorData.system;
    context.flags = actorData.flags;

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

  activateListeners(html) {
    super.activateListeners(html);

    if (!this.isEditable) return;

    html.find('.item-create').click(this._onItemCreate.bind(this));
    html.find('.item-edit').click(this._onItemEdit.bind(this));
    html.find('.item-delete').click(this._onItemDelete.bind(this));
    html.find('.item-toggle').click(this._onItemToggle.bind(this));

    html.find('.item-attack').click(this._onWeaponAttack.bind(this));
    html.find('.weapon-reload').click(this._onWeaponReload.bind(this));

    html.find('.skill-opposed').click(this._onSkillOpposed.bind(this));

    html.find('.skill-roll').click(this._onSkillRoll.bind(this));
    html.find('.skill-increase').click(this._onSkillIncrease.bind(this));
    html.find('.skill-decrease').click(this._onSkillDecrease.bind(this));

    html.find('.spell-cast').click(this._onSpellCast.bind(this));
    html.find('.effect-remove').click(this._onRemoveEffect.bind(this));
    html.find('.effect-toggle').click(this._onToggleEffect.bind(this));

    html.find('.npc-attack-roll').click(this._onNpcAttackRoll.bind(this));

    html.find('.short-rest').click(this._onShortRest.bind(this));
    html.find('.long-rest').click(this._onLongRest.bind(this));
    html.find('.breather').click(this._onBreather.bind(this));

    html.find('.attribute-roll').click(this._onAttributeRoll.bind(this));
    html.find('.skill-heal').click(this._onSkillHeal.bind(this));

    html.find('.add-experience').click(this._onAddExperience.bind(this));

    html.find('.attribute-input').change(this._onAttributeChange.bind(this));

    html.find('.token-return').click(this._onTokenReturn.bind(this));

    html.find('.sanity-loss').click(this._onSanityLoss.bind(this));

    html.find('.ship-attack').click(this._onShipAttack.bind(this));
    html.find('.ship-defense').click(this._onShipDefense.bind(this));
    html.find('.ship-chase').click(this._onShipChase.bind(this));
    html.find('.crew-clear').click(this._onCrewClear.bind(this));
  }

  // Reference: RyF 3.0 PDF, páginas 103-104 - cada nave tira su lado de la
  // enfrentada por separado, cuando le toca; los totales se comparan en el
  // chat. El bono del tripulante se calcula de su ficha vinculada (Destreza +
  // habilidad) o de la base manual de la nave.
  async _onShipAttack(event) {
    event.preventDefault();
    const ship = this.actor;
    const crew = await ship.getCrewBonus('gunner');

    const params = await new Promise((resolve) => {
      new Dialog({
        title: `${game.i18n.localize('RYF.Ship.AttackTitle')}: ${ship.name}`,
        content: `
          <form>
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
          </form>
        `,
        render: (html) => {
          html.find('[name="weapon"]').on('change', (ev) => {
            html.find('[name="damageFormula"]').val(ev.currentTarget.value);
          });
        },
        buttons: {
          roll: {
            icon: '<i class="fas fa-crosshairs"></i>',
            label: game.i18n.localize('RYF.Ship.Attack'),
            callback: (html) => resolve({
              bonus: parseInt(html.find('[name="bonus"]').val()) || 0,
              weapon: html.find('[name="weapon"]').val(),
              damageFormula: html.find('[name="damageFormula"]').val() || '1d6',
              modifier: parseInt(html.find('[name="modifier"]').val()) || 0
            })
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

  async _onShipDefense(event) {
    event.preventDefault();
    await this._rollShipPilotSide('defense');
  }

  async _onShipChase(event) {
    event.preventDefault();
    await this._rollShipPilotSide('chase');
  }

  // Defensa (Destreza + Pilotar + Maniobrabilidad) y persecución (Destreza +
  // Pilotar + Velocidad) comparten diálogo: solo cambia el atributo de la nave
  async _rollShipPilotSide(contest) {
    const ship = this.actor;
    const crew = await ship.getCrewBonus('pilot');
    const titleKey = contest === 'defense' ? 'RYF.Ship.DefenseTitle' : 'RYF.Ship.ChaseTitle';

    const params = await new Promise((resolve) => {
      new Dialog({
        title: `${game.i18n.localize(titleKey)}: ${ship.name}`,
        content: `
          <form>
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
          </form>
        `,
        buttons: {
          roll: {
            icon: '<i class="fas fa-dice-d10"></i>',
            label: game.i18n.localize('RYF.Roll'),
            callback: (html) => resolve({
              bonus: parseInt(html.find('[name="bonus"]').val()) || 0,
              modifier: parseInt(html.find('[name="modifier"]').val()) || 0
            })
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

    const role = await new Promise((resolve) => {
      new Dialog({
        title: game.i18n.format('RYF.Ship.AssignCrewTitle', { name: dropped.name }),
        content: `<p>${game.i18n.localize('RYF.Ship.AssignCrewHint')}</p>`,
        buttons: {
          pilot: {
            icon: '<i class="fas fa-user-astronaut"></i>',
            label: game.i18n.localize('RYF.Ship.Pilot'),
            callback: () => resolve('pilot')
          },
          gunner: {
            icon: '<i class="fas fa-crosshairs"></i>',
            label: game.i18n.localize('RYF.Ship.Gunner'),
            callback: () => resolve('gunner')
          }
        },
        default: 'pilot',
        close: () => resolve(null)
      }).render(true);
    });

    if (!role) return;

    await this.actor.update({
      [`system.${role}.uuid`]: dropped.uuid,
      [`system.${role}.name`]: dropped.name
    });
  }

  async _onCrewClear(event) {
    event.preventDefault();
    const role = event.currentTarget.dataset.role;
    if (!['pilot', 'gunner'].includes(role)) return;

    await this.actor.update({
      [`system.${role}.uuid`]: '',
      [`system.${role}.name`]: ''
    });
  }

  // Reference: RyF 3.0 PDF, página 43 - pérdida de Cordura en d6 según gravedad
  async _onSanityLoss(event) {
    event.preventDefault();

    const formula = await Dialog.prompt({
      title: game.i18n.localize('RYF.Sanity.Loss'),
      content: `
        <form>
          <p class="hint">${game.i18n.localize('RYF.Sanity.LossHint')}</p>
          <div class="form-group">
            <label>${game.i18n.localize('RYF.Sanity.LossFormula')}</label>
            <input type="text" name="formula" value="1d6" autofocus/>
          </div>
        </form>
      `,
      callback: (html) => html.find('[name="formula"]').val() || '1d6',
      rejectClose: false
    });

    if (!formula) return;

    await this.actor.loseSanity(formula);
  }

  // Reference: RyF 3.0 PDF, página 92 - el máster devuelve el token forzando
  // bajar un rango el dado objetivo en la siguiente tirada
  async _onTokenReturn(event) {
    event.preventDefault();
    await this.actor.returnDeathToken();
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
  _bindModePreview(html, downs) {
    const labels = {
      advantage: 'RYF.RollFactors.DieHigh',
      normal: 'RYF.RollFactors.DieMiddle',
      disadvantage: 'RYF.RollFactors.DieLow'
    };

    const update = () => {
      const base = html.find('[name="mode"]').val() || 'normal';
      const ups = [];
      if (html.find('[name="applySpecialization"]').is(':checked')) ups.push('specialization');
      if (html.find('[name="spendToken"]').is(':checked')) ups.push('token');
      const mode = resolveMode(base, { ups: ups, downs: downs });
      html.find('.mode-preview-value').text(game.i18n.localize(labels[mode]));
    };

    html.find('[name="mode"], [name="applySpecialization"], [name="spendToken"]').on('change', update);
    update();
  }

  async _onItemCreate(event) {
    event.preventDefault();
    const header = event.currentTarget;
    const type = header.dataset.type;
    const data = {
      name: game.i18n.format('RYF.Items.New', { type: game.i18n.localize(`TYPES.Item.${type}`) }),
      type: type,
      system: {}
    };
    
    const item = await Item.create(data, { parent: this.actor });
    item.sheet.render(true);
  }

  _onItemEdit(event) {
    event.preventDefault();
    const li = $(event.currentTarget).parents(".item");
    const item = this.actor.items.get(li.data("itemId"));
    item.sheet.render(true);
  }

  async _onItemDelete(event) {
    event.preventDefault();
    const li = $(event.currentTarget).parents(".item");
    const item = this.actor.items.get(li.data("itemId"));
    
    const confirmed = await Dialog.confirm({
      title: game.i18n.localize('RYF.Dialogs.DeleteItem'),
      content: game.i18n.format('RYF.Dialogs.DeleteItemConfirm', { name: item.name })
    });
    
    if (confirmed) {
      await item.delete();
      li.slideUp(200, () => this.render(false));
    }
  }

  async _onItemToggle(event) {
    event.preventDefault();
    const li = $(event.currentTarget).parents(".item");
    const item = this.actor.items.get(li.data("itemId"));
    await item.toggleEquipped();
  }

  async _onWeaponAttack(event) {
    event.preventDefault();
    const button = event.currentTarget;
    const itemId = button.dataset.itemId;
    const weapon = this.actor.items.get(itemId);

    if (!weapon) {
      ui.notifications.warn(game.i18n.localize('RYF.Warnings.WeaponNotFound'));
      return;
    }

    await this.rollWeaponItem(weapon);
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

    return new Promise((resolve) => {
      const content = `
        <form>
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
        </form>
      `;

      new Dialog({
        title: `${game.i18n.localize('RYF.Attack')}: ${weaponName}`,
        content: content,
        render: (html) => this._bindModePreview(html, factors.downs),
        buttons: {
          roll: {
            icon: '<i class="fas fa-dice-d20"></i>',
            label: game.i18n.localize('RYF.Attack'),
            callback: (html) => {
              const mode = html.find('[name="mode"]').val();
              const defense = hasTarget || isRanged ? null : parseInt(html.find('[name="defense"]').val());
              const range = isRanged ? html.find('[name="range"]').val() : null;
              const modifier = parseInt(html.find('[name="modifier"]').val()) || 0;
              const dualWield = dualWieldAvailable ? html.find('[name="dualWield"]').is(':checked') : false;
              const specialization = html.find('[name="applySpecialization"]').is(':checked');
              const spendToken = html.find('[name="spendToken"]').is(':checked');
              const rangedModifiers = isRanged ? RyfRoll.readRangedModifiers(html) : null;
              const calledShot = html.find('[name="calledShot"]').val() || null;
              resolve({ mode, defense, range, modifier, dualWield, specialization, spendToken, rangedModifiers, calledShot });
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

  // Reference: RyF 3.0 PDF, página 18 - tiradas enfrentadas
  async _onSkillOpposed(event) {
    event.preventDefault();
    const li = $(event.currentTarget).parents(".item");
    const skill = this.actor.items.get(li.data("itemId"));
    if (!skill || skill.type !== 'skill') return;

    const targets = Array.from(game.user.targets);
    if (targets.length !== 1 || !targets[0].actor) {
      ui.notifications.warn(game.i18n.localize('RYF.Warnings.NoTargetSelected'));
      return;
    }

    const targetActor = targets[0].actor;
    const targetSkills = targetActor.items.filter(i => i.type === 'skill');

    const params = await new Promise((resolve) => {
      new Dialog({
        title: `${game.i18n.localize('RYF.OpposedRoll')}: ${skill.name} vs ${targetActor.name}`,
        content: `
          <form>
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
          </form>
        `,
        buttons: {
          roll: {
            icon: '<i class="fas fa-dice-d10"></i>',
            label: game.i18n.localize('RYF.Roll'),
            callback: (html) => {
              resolve({
                defenderSkillName: html.find('[name="defenderSkill"]').val() || null,
                defenderBonus: parseInt(html.find('[name="defenderBonus"]').val()) || 0
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

    if (!params) return;

    const { RyfRoll } = await import('../rolls/ryf-roll.mjs');
    await RyfRoll.rollOpposed(this.actor, skill.name, targetActor, params);
  }

  async _onSkillRoll(event) {
    event.preventDefault();
    const li = $(event.currentTarget).parents(".item");
    const item = this.actor.items.get(li.data("itemId"));

    if (item && item.type === 'skill') {
      await this.rollSkillItem(item);
    }
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

    return new Promise((resolve) => {
      new Dialog({
        title: `${game.i18n.localize('RYF.Roll')}: ${skillName}`,
        content: `
          <form>
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
          </form>
        `,
        render: (html) => this._bindModePreview(html, factors.downs),
        buttons: {
          roll: {
            icon: '<i class="fas fa-dice-d10"></i>',
            label: game.i18n.localize('RYF.Roll'),
            callback: (html) => {
              const difficulty = parseInt(html.find('[name="difficulty"]').val());
              const mode = html.find('[name="mode"]').val();
              const modifier = parseInt(html.find('[name="modifier"]').val()) || 0;
              const specialization = html.find('[name="applySpecialization"]').is(':checked');
              const spendToken = html.find('[name="spendToken"]').is(':checked');
              resolve({ difficulty, mode, modifier, specialization, spendToken });
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

  async _onSkillIncrease(event) {
    event.preventDefault();
    const li = $(event.currentTarget).parents(".item");
    const item = this.actor.items.get(li.data("itemId"));

    if (item) {
      await item.increaseLevel();
    }
  }

  async _onSkillDecrease(event) {
    event.preventDefault();
    const li = $(event.currentTarget).parents(".item");
    const item = this.actor.items.get(li.data("itemId"));

    if (item) {
      await item.decreaseLevel();
    }
  }

  async _onSpellCast(event) {
    event.preventDefault();
    const li = $(event.currentTarget).parents(".item");
    const spell = this.actor.items.get(li.data("itemId"));

    if (!spell) return;

    await this.castSpellItem(spell);
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

    return new Promise((resolve) => {
      new Dialog({
        title: `${game.i18n.localize('RYF.CastSpell')}: ${spell.name}`,
        content: `
          <form>
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
          </form>
        `,
        render: (html) => this._bindModePreview(html, factors.downs),
        buttons: {
          cast: {
            icon: '<i class="fas fa-magic"></i>',
            label: game.i18n.localize('RYF.Cast'),
            callback: (html) => {
              const mode = html.find('[name="mode"]').val();
              const modifier = parseInt(html.find('[name="modifier"]').val()) || 0;
              const spendToken = html.find('[name="spendToken"]').is(':checked');
              const extraMana = parseInt(html.find('[name="extraMana"]').val()) || 0;
              resolve({ mode, modifier, spendToken, extraMana });
            }
          },
          cancel: {
            icon: '<i class="fas fa-times"></i>',
            label: game.i18n.localize('RYF.Cancel'),
            callback: () => resolve(null)
          }
        },
        default: 'cast',
        close: () => resolve(null)
      }).render(true);
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

  async _onRemoveEffect(event) {
    event.preventDefault();
    const effectId = event.currentTarget.dataset.effectId;
    const effect = this.actor.effects.get(effectId);

    if (effect) {
      const confirmed = await Dialog.confirm({
        title: game.i18n.localize('RYF.Dialogs.RemoveEffect'),
        content: game.i18n.format('RYF.Dialogs.RemoveEffectConfirm', { name: effect.name })
      });

      if (confirmed) {
        await effect.delete();
        ui.notifications.info(game.i18n.format('RYF.Notifications.EffectRemoved', { name: effect.name }));
      }
    }
  }

  async _onToggleEffect(event) {
    event.preventDefault();
    const effectId = event.currentTarget.dataset.effectId;
    const effect = this.actor.effects.get(effectId);

    if (effect) {
      await effect.update({ disabled: !effect.disabled });
    }
  }

  async _onNpcAttackRoll(event) {
    event.preventDefault();
    const li = $(event.currentTarget).parents(".item");
    const attack = this.actor.items.get(li.data("itemId"));

    if (!attack) return;

    await this.actor.rollNpcAttack(attack);
  }

  async _onShortRest(event) {
    event.preventDefault();
    await this.actor.shortRest();
  }

  async _onLongRest(event) {
    event.preventDefault();
    await this.actor.longRest();
  }

  // Reference: RyF 3.0 PDF, página 94 - Coger aire tras un combate
  async _onBreather(event) {
    event.preventDefault();
    await this.actor.breather();
  }

  // Reference: RyF 3.0 PDF, páginas 96-98 - recargar el arma
  async _onWeaponReload(event) {
    event.preventDefault();
    const li = $(event.currentTarget).parents(".item");
    const weapon = this.actor.items.get(li.data("itemId"));
    if (!weapon) return;

    await this.actor.reloadWeapon(weapon);
  }

  // Reference: RyF 3.0 PDF, página 18 - tirada de atributo puro con su propia
  // tabla de dificultades (9/12/15/18/21)
  async _onAttributeRoll(event) {
    event.preventDefault();
    const attribute = event.currentTarget.dataset.attribute;
    if (!attribute) return;

    const factors = this._rollFactorsSection();
    const attributeLabel = game.i18n.localize(`RYF.Attributes.${attribute.charAt(0).toUpperCase() + attribute.slice(1)}`);

    const difficultyOptions = ATTRIBUTE_DIFFICULTIES.map(d =>
      `<option value="${d.value}" ${d.value === 12 ? 'selected' : ''}>${game.i18n.localize(d.label)} (${d.value})</option>`
    ).join('');

    const rollParams = await new Promise((resolve) => {
      new Dialog({
        title: `${game.i18n.localize('RYF.Roll')}: ${attributeLabel}`,
        content: `
          <form>
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
          </form>
        `,
        render: (html) => this._bindModePreview(html, factors.downs),
        buttons: {
          roll: {
            icon: '<i class="fas fa-dice-d10"></i>',
            label: game.i18n.localize('RYF.Roll'),
            callback: (html) => resolve({
              difficulty: parseInt(html.find('[name="difficulty"]').val()),
              mode: html.find('[name="mode"]').val(),
              modifier: parseInt(html.find('[name="modifier"]').val()) || 0,
              spendToken: html.find('[name="spendToken"]').is(':checked')
            })
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

    if (!rollParams) return;

    await RyfRoll.rollAttribute(this.actor, attribute, rollParams.difficulty, rollParams.mode, {
      modifier: rollParams.modifier,
      spendToken: rollParams.spendToken
    });
  }

  // Reference: RyF 3.0 PDF, páginas 11-12 y 45 - curación por habilidad sobre
  // el objetivo seleccionado (o uno mismo si no hay objetivo)
  async _onSkillHeal(event) {
    event.preventDefault();
    const li = $(event.currentTarget).parents(".item");
    const skill = this.actor.items.get(li.data("itemId"));
    if (!skill || skill.type !== 'skill') return;

    const targets = Array.from(game.user.targets);
    const patient = (targets.length > 0 && targets[0].actor) ? targets[0].actor : this.actor;

    const factors = this._rollFactorsSection({
      untrained: (skill.system.level || 0) === 0,
      specialization: skill.system.specialization?.trim() || null
    });

    const alreadyHealed = patient.getFlag('ryf3', 'healedToday');

    const rollParams = await new Promise((resolve) => {
      new Dialog({
        title: `${game.i18n.localize('RYF.Healing')}: ${skill.name}`,
        content: `
          <form>
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
          </form>
        `,
        render: (html) => this._bindModePreview(html, factors.downs),
        buttons: {
          roll: {
            icon: '<i class="fas fa-briefcase-medical"></i>',
            label: game.i18n.localize('RYF.Healing'),
            callback: (html) => resolve({
              difficulty: parseInt(html.find('[name="difficulty"]').val()) || getRule('healSkillDifficulty'),
              mode: html.find('[name="mode"]').val(),
              modifier: parseInt(html.find('[name="modifier"]').val()) || 0,
              specialization: html.find('[name="applySpecialization"]').is(':checked'),
              spendToken: html.find('[name="spendToken"]').is(':checked')
            })
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

    if (!rollParams) return;

    await this.actor.rollHealingSkill(skill, patient, rollParams);
  }

  async _onAddExperience(event) {
    event.preventDefault();

    const amount = await Dialog.prompt({
      title: game.i18n.localize('RYF.AddExperience'),
      content: `
        <form>
          <div class="form-group">
            <label>${game.i18n.localize('RYF.ExperienceAmount')}</label>
            <input type="number" name="amount" value="10" min="1" autofocus/>
          </div>
          <div class="form-group">
            <label>${game.i18n.localize('RYF.Reason')}</label>
            <input type="text" name="reason" value="" placeholder="${game.i18n.localize('RYF.ReasonPlaceholder')}"/>
          </div>
        </form>
      `,
      callback: (html) => {
        const form = html[0].querySelector('form');
        return {
          amount: parseInt(form.amount.value),
          reason: form.reason.value
        };
      },
      rejectClose: false
    });

    if (amount && amount.amount > 0) {
      await this.actor.addExperience(amount.amount, amount.reason);
    }
  }

  async _onAttributeChange(event) {
    event.preventDefault();
    const input = event.currentTarget;
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
    if (event.target.classList.contains("content-link")) return;

    const item = this.actor.items.get(li.dataset.itemId);
    const dragData = item.toDragData();

    event.dataTransfer.setData("text/plain", JSON.stringify(dragData));
  }

  async _onDrop(event) {
    const data = TextEditor.getDragEventData(event);
    const actor = this.actor;

    // Reference: RyF 3.0 PDF, página 103 - asignar piloto/artillero soltando
    // un personaje sobre la ficha de nave
    if (actor.type === 'ship' && data.type === 'Actor') {
      return this._onDropCrewMember(data);
    }

    if (data.type === "Item") {
      return this._onDropItem(event, data);
    }

    return super._onDrop(event);
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
    return this.actor.createEmbeddedDocuments("Item", itemData);
  }
}

