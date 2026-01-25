import { RyfRoll } from '../rolls/ryf-roll.mjs';

export class RyfActorSheet extends ActorSheet {

  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ["ryf", "sheet", "actor"],
      width: 720,
      height: 800,
      tabs: [{ navSelector: ".sheet-tabs", contentSelector: ".sheet-body", initial: "attributes" }],
      dragDrop: [{ dragSelector: ".item-list .item", dropSelector: null }]
    });
  }

  get template() {
    return `systems/ryf/templates/actor/actor-${this.actor.type}-sheet.hbs`;
  }

  getData() {
    const context = super.getData();

    const actorData = this.actor.toObject(false);

    context.system = actorData.system;
    context.flags = actorData.flags;

    context.config = CONFIG.RYF;

    context.isCarismaEnabled = CONFIG.RYF.isCarismaEnabled();
    context.isMagicEnabled = CONFIG.RYF.isMagicEnabled();

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
      }
    }

    skills.sort((a, b) => (b.system.level || 0) - (a.system.level || 0));

    context.skills = skills;
    context.weapons = weapons;
    context.armor = armor;
    context.shields = shields;
    context.equipment = equipment;
    context.spells = spells;
  }

  activateListeners(html) {
    super.activateListeners(html);

    if (!this.isEditable) return;

    html.find('.item-create').click(this._onItemCreate.bind(this));
    html.find('.item-edit').click(this._onItemEdit.bind(this));
    html.find('.item-delete').click(this._onItemDelete.bind(this));
    html.find('.item-toggle').click(this._onItemToggle.bind(this));

    html.find('.item-attack').click(this._onWeaponAttack.bind(this));

    html.find('.skill-roll').click(this._onSkillRoll.bind(this));
    html.find('.skill-increase').click(this._onSkillIncrease.bind(this));
    html.find('.skill-decrease').click(this._onSkillDecrease.bind(this));

    html.find('.spell-cast').click(this._onSpellCast.bind(this));

    html.find('.short-rest').click(this._onShortRest.bind(this));
    html.find('.long-rest').click(this._onLongRest.bind(this));

    html.find('.add-experience').click(this._onAddExperience.bind(this));

    html.find('.attribute-input').change(this._onAttributeChange.bind(this));
  }

  async _onItemCreate(event) {
    event.preventDefault();
    const header = event.currentTarget;
    const type = header.dataset.type;
    const data = {
      name: game.i18n.format('RYF.Items.New', { type: game.i18n.localize(`ITEM.Type${type.capitalize()}`) }),
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

    let targetDefense = null;
    let targetDefenseRanged = null;
    const targets = Array.from(game.user.targets);

    if (targets.length === 1) {
      const targetActor = targets[0].actor;
      if (targetActor && targetActor.system.defense) {
        targetDefense = targetActor.system.defense.value;
        targetDefenseRanged = targetActor.system.defense.ranged || 0;
      }
    }

    const isRanged = weapon.system.category !== 'melee';
    const rollParams = await this._promptAttackDialog(weapon.name, isRanged, targetDefense !== null);
    if (!rollParams) return;

    const mode = rollParams.mode;
    const modifier = rollParams.modifier || 0;

    if (isRanged) {
      await this.actor.rollRangedAttack(weapon, rollParams.range, mode, targetDefenseRanged, modifier);
    } else {
      const defense = targetDefense || rollParams.defense;
      await this.actor.rollMeleeAttack(weapon, defense, mode, modifier);
    }
  }

  async _promptAttackDialog(weaponName, isRanged, hasTarget) {
    const isWounded = this.actor.system.states?.wounded || false;
    const defaultMode = isWounded ? 'disadvantage' : 'normal';

    return new Promise((resolve) => {
      const content = `
        <form>
          ${isRanged ? `
          <div class="form-group">
            <label>${game.i18n.localize('RYF.Combat.Range')}</label>
            <select name="range" autofocus>
              <option value="pointblank">${game.i18n.localize('RYF.Combat.RangePointBlank')} (10)</option>
              <option value="short" selected>${game.i18n.localize('RYF.Combat.RangeShort')} (15)</option>
              <option value="medium">${game.i18n.localize('RYF.Combat.RangeMedium')} (20)</option>
              <option value="long">${game.i18n.localize('RYF.Combat.RangeLong')} (25)</option>
            </select>
          </div>
          ` : !hasTarget ? `
          <div class="form-group">
            <label>${game.i18n.localize('RYF.Defense')}</label>
            <input type="number" name="defense" value="10" min="1"/>
          </div>
          ` : ''}
          ${isWounded ? `
          <div class="wounded-warning" style="background: var(--ryf-warning); padding: 8px; border-radius: 4px; margin-bottom: 8px; text-align: center;">
            <i class="fas fa-heart-broken"></i> <strong>${game.i18n.localize('RYF.States.Wounded')}</strong> - ${game.i18n.localize('RYF.Combat.AutoDisadvantage')}
          </div>
          ` : ''}
          <div class="form-group">
            <label>${game.i18n.localize('RYF.RollMode')}</label>
            <select name="mode">
              <option value="normal" ${defaultMode === 'normal' ? 'selected' : ''}>${game.i18n.localize('RYF.Normal')}</option>
              <option value="advantage" ${defaultMode === 'advantage' ? 'selected' : ''}>${game.i18n.localize('RYF.Advantage')}</option>
              <option value="disadvantage" ${defaultMode === 'disadvantage' ? 'selected' : ''}>${game.i18n.localize('RYF.Disadvantage')}</option>
            </select>
          </div>
          <div class="form-group">
            <label>${game.i18n.localize('RYF.Modifier')}</label>
            <input type="number" name="modifier" value="0" step="1"/>
          </div>
        </form>
      `;

      new Dialog({
        title: `${game.i18n.localize('RYF.Attack')}: ${weaponName}`,
        content: content,
        buttons: {
          roll: {
            icon: '<i class="fas fa-dice-d20"></i>',
            label: game.i18n.localize('RYF.Attack'),
            callback: (html) => {
              const mode = html.find('[name="mode"]').val();
              const defense = hasTarget || isRanged ? null : parseInt(html.find('[name="defense"]').val());
              const range = isRanged ? html.find('[name="range"]').val() : null;
              const modifier = parseInt(html.find('[name="modifier"]').val()) || 0;
              resolve({ mode, defense, range, modifier });
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

  async _onSkillRoll(event) {
    event.preventDefault();
    const li = $(event.currentTarget).parents(".item");
    const item = this.actor.items.get(li.data("itemId"));

    if (item && item.type === 'skill') {
      let defaultDifficulty = null;
      let targetWillpower = null;

      if (item.system.category === 'social') {
        const targets = Array.from(game.user.targets);
        if (targets.length === 1) {
          const targetActor = targets[0].actor;
          if (targetActor && targetActor.system.willpower) {
            targetWillpower = targetActor.system.willpower.value;
            defaultDifficulty = targetWillpower;
          }
        }
      }

      const rollParams = await this._promptRollDialog(item.name, defaultDifficulty, targetWillpower);
      if (!rollParams) return;

      await RyfRoll.rollSkill(this.actor, item.name, rollParams.difficulty, rollParams.mode);
    }
  }

  async _promptRollDialog(skillName, defaultDifficulty = null, targetWillpower = null) {
    const isWounded = this.actor.system.states?.wounded || false;
    const defaultMode = isWounded ? 'disadvantage' : 'normal';
    const difficulty = defaultDifficulty || 15;

    return new Promise((resolve) => {
      new Dialog({
        title: `${game.i18n.localize('RYF.Roll')}: ${skillName}`,
        content: `
          <form>
            ${isWounded ? `
            <div class="wounded-warning" style="background: var(--ryf-warning); padding: 8px; border-radius: 4px; margin-bottom: 8px; text-align: center;">
              <i class="fas fa-heart-broken"></i> <strong>${game.i18n.localize('RYF.States.Wounded')}</strong> - ${game.i18n.localize('RYF.Combat.AutoDisadvantage')}
            </div>
            ` : ''}
            ${targetWillpower ? `
            <div class="target-willpower-info" style="background: var(--ryf-secondary); padding: 8px; border-radius: 4px; margin-bottom: 8px; text-align: center;">
              <i class="fas fa-brain"></i> <strong>${game.i18n.localize('RYF.TargetWillpower')}: ${targetWillpower}</strong>
            </div>
            ` : ''}
            <div class="form-group">
              <label>${game.i18n.localize('RYF.Difficulty')}</label>
              <select name="difficulty" autofocus>
                <option value="10" ${difficulty === 10 ? 'selected' : ''}>${game.i18n.localize('RYF.Difficulty.VeryEasy')} (10)</option>
                <option value="15" ${difficulty === 15 ? 'selected' : ''}>${game.i18n.localize('RYF.Difficulty.Easy')} (15)</option>
                <option value="20" ${difficulty === 20 ? 'selected' : ''}>${game.i18n.localize('RYF.Difficulty.Average')} (20)</option>
                <option value="25" ${difficulty === 25 ? 'selected' : ''}>${game.i18n.localize('RYF.Difficulty.Hard')} (25)</option>
                <option value="30" ${difficulty === 30 ? 'selected' : ''}>${game.i18n.localize('RYF.Difficulty.VeryHard')} (30)</option>
                <option value="35" ${difficulty === 35 ? 'selected' : ''}>${game.i18n.localize('RYF.Difficulty.NearlyImpossible')} (35)</option>
                ${targetWillpower && ![10, 15, 20, 25, 30, 35].includes(targetWillpower) ? `<option value="${targetWillpower}" selected>${game.i18n.localize('RYF.Willpower')} (${targetWillpower})</option>` : ''}
              </select>
            </div>
            <div class="form-group">
              <label>${game.i18n.localize('RYF.RollMode')}</label>
              <select name="mode">
                <option value="normal" ${defaultMode === 'normal' ? 'selected' : ''}>${game.i18n.localize('RYF.Normal')}</option>
                <option value="advantage" ${defaultMode === 'advantage' ? 'selected' : ''}>${game.i18n.localize('RYF.Advantage')}</option>
                <option value="disadvantage" ${defaultMode === 'disadvantage' ? 'selected' : ''}>${game.i18n.localize('RYF.Disadvantage')}</option>
              </select>
            </div>
          </form>
        `,
        buttons: {
          roll: {
            icon: '<i class="fas fa-dice-d10"></i>',
            label: game.i18n.localize('RYF.Roll'),
            callback: (html) => {
              const difficulty = parseInt(html.find('[name="difficulty"]').val());
              const mode = html.find('[name="mode"]').val();
              resolve({ difficulty, mode });
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
    const item = this.actor.items.get(li.data("itemId"));

    if (item) {
      await item.castSpell();
    }
  }

  async _onShortRest(event) {
    event.preventDefault();
    await this.actor.shortRest();
  }

  async _onLongRest(event) {
    event.preventDefault();
    await this.actor.longRest();
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

    if (newUsed > attributePoints.max) {
      ui.notifications.warn(game.i18n.localize('RYF.Warnings.NotEnoughAttributePoints'));
      input.value = currentValue;
      return;
    }

    if (value < 1) {
      ui.notifications.warn(game.i18n.localize('RYF.Warnings.MinAttributeValue'));
      input.value = currentValue;
      return;
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

