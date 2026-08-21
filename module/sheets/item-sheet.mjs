import { RyfSheetMixin } from './sheet-mixin.mjs';

const ITEM_SHEET_TYPES = ['skill', 'weapon', 'armor', 'shield', 'equipment', 'spell', 'npc-attack', 'advantage', 'race'];

export class RyfItemSheet extends RyfSheetMixin(foundry.applications.sheets.ItemSheetV2) {

  static DEFAULT_OPTIONS = {
    classes: ['ryf', 'sheet', 'item'],
    position: { width: 520, height: 480 },
    window: { resizable: true },
    form: { submitOnChange: true, closeOnSubmit: false }
  };

  static INITIAL_TAB = 'details';

  #dropBound = false;

  async _prepareContext(options) {
    const context = await super._prepareContext(options);

    const itemData = this.item.toObject(false);

    context.item = this.item;
    context.actor = this.item.actor;
    context.system = itemData.system;
    context.flags = itemData.flags;
    context.editable = this.isEditable;
    context.owner = this.document.isOwner;
    context.cssClass = this.isEditable ? 'editable' : 'locked';

    context.config = CONFIG.RYF;

    context.isCarismaEnabled = CONFIG.RYF.isCarismaEnabled();
    context.isMagicEnabled = CONFIG.RYF.isMagicEnabled();

    context.enrichedDescription = await this.#enrichDescription(itemData.system.description || '');

    if (this.item.type === 'skill') {
      this._prepareSkillData(context);
    }

    if (this.item.type === 'advantage') {
      this._prepareAdvantageData(context);
    }

    // Reference: RyF 3.0 PDF, página 98 - Razas con tope de atributo
    if (this.item.type === 'race') {
      this._prepareAdvantageData(context);
    }

    return context;
  }

  // Los items de compendio con translationKey muestran la descripción
  // localizada (antes en el hook renderItemSheet)
  async #enrichDescription(description) {
    const translationKey = this.item.flags?.ryf?.translationKey;
    if (translationKey && description?.startsWith('RYF.ITEMS.')) {
      const descKey = `RYF.ITEMS.${translationKey}.description`;
      const translated = game.i18n.localize(descKey);
      if (translated !== descKey) description = `<p>${translated}</p>`;
    }

    return foundry.applications.ux.TextEditor.implementation.enrichHTML(description, {
      secrets: this.document.isOwner,
      relativeTo: this.item
    });
  }

  _prepareSkillData(context) {
    const activeAttributes = CONFIG.RYF.getActiveAttributes();
    context.attributes = Object.entries(activeAttributes).map(([key, value]) => ({
      key: key,
      label: value
    }));
  }

  // Reference: RyF 3.0 PDF, página 98 - Ventajas con requisito de atributo
  _prepareAdvantageData(context) {
    const activeAttributes = CONFIG.RYF.getActiveAttributes();
    context.attributes = Object.entries(activeAttributes).map(([key, value]) => ({
      key: key,
      label: value
    }));
  }

  _onRender(context, options) {
    super._onRender(context, options);
    this.#applyNameTranslation();
    this.#bindDrop();
  }

  // Nombre localizado en el input para items de compendio con translationKey
  // (antes en el hook renderItemSheet)
  #applyNameTranslation() {
    const translationKey = this.item.flags?.ryf?.translationKey;
    if (!translationKey) return;

    const nameKey = `RYF.ITEMS.${translationKey}.name`;
    const translatedName = game.i18n.localize(nameKey);

    if (translatedName !== nameKey && this.item.name.startsWith('RYF.ITEMS.')) {
      const input = this.element.querySelector('input[name="name"]');
      if (input) input.value = translatedName;
    }
  }

  #bindDrop() {
    if (this.#dropBound) return;
    this.element.addEventListener('dragover', event => event.preventDefault());
    this.element.addEventListener('drop', this._onDrop.bind(this));
    this.#dropBound = true;
  }

  // Reference: RyF 3.0 PDF, página 98 - las razas conceden una ventaja
  // gratuita: se enlazan soltando items de ventaja sobre la hoja de la raza
  async _onDrop(event) {
    if (this.item.type !== 'race' || !this.isEditable) return;
    event.preventDefault();

    const data = foundry.applications.ux.TextEditor.implementation.getDragEventData(event);
    if (data?.type !== 'Item' || !data.uuid) return;

    const dropped = await fromUuid(data.uuid);
    if (!dropped || dropped.type !== 'advantage') {
      ui.notifications.warn(game.i18n.localize('RYF.Warnings.OnlyAdvantagesOnRace'));
      return;
    }

    const granted = [...(this.item.system.grantedAdvantages || [])];
    if (granted.some(entry => entry.uuid === data.uuid)) return;

    granted.push({ uuid: data.uuid, name: dropped.name });
    await this.item.update({ 'system.grantedAdvantages': granted });
  }

  async _handleSheetAction(action, event, target) {
    if (!this.isEditable) return;

    switch (action) {
      case 'increaseSkill': return this.item.increaseLevel();
      case 'decreaseSkill': return this.item.decreaseLevel();
      case 'toggleEquipped': return this.item.toggleEquipped();
      case 'castSpell': return this.item.castSpell();
      case 'deleteGrantedAdvantage': return this._onGrantedAdvantageDelete(target);
      case 'addEffect': return this._onEffectAdd();
      case 'deleteEffect': return this._onEffectDelete(target);
      case 'collapseEffect': return this._onEffectCollapse(target);
    }
  }

  // Los selects de efectos reconstruyen el objeto de efecto en vez de pasar
  // por el submit genérico del formulario
  _onChangeForm(formConfig, event) {
    const target = event.target;

    if (target.classList.contains('effect-type-select')) return this._onEffectTypeChange(event);
    if (target.classList.contains('effect-target-select')) return this._onEffectTargetChange(event);
    if (target.classList.contains('range-type-select')) return this._onRangeTypeChange(event);
    if (target.classList.contains('target-type-select')) return this._onTargetTypeChange(event);

    return super._onChangeForm(formConfig, event);
  }

  async _onGrantedAdvantageDelete(target) {
    const index = parseInt(target.dataset.index);
    const granted = [...(this.item.system.grantedAdvantages || [])];
    if (Number.isNaN(index) || index < 0 || index >= granted.length) return;

    granted.splice(index, 1);
    await this.item.update({ 'system.grantedAdvantages': granted });
  }

  async _onEffectAdd() {
    let newEffect;

    if (['weapon', 'armor', 'shield', 'equipment', 'advantage'].includes(this.item.type)) {
      newEffect = {
        id: foundry.utils.randomID(),
        type: 'buff',
        target: 'skill',
        targetName: '',
        modifier: 1,
        collapsed: false
      };
    } else {
      const { createDefaultEffect } = await import('../config/spell-effects.mjs');
      newEffect = createDefaultEffect('buff');
    }

    const currentEffects = this.item.system.effects || [];
    const effects = Array.isArray(currentEffects)
      ? foundry.utils.duplicate(currentEffects)
      : Object.values(foundry.utils.duplicate(currentEffects));

    effects.push(newEffect);

    await this.item.update({ 'system.effects': effects });
  }

  async _onEffectDelete(target) {
    const index = parseInt(target.dataset.effectIndex);
    const currentEffects = this.item.system.effects || [];
    const effects = Array.isArray(currentEffects)
      ? foundry.utils.duplicate(currentEffects)
      : Object.values(foundry.utils.duplicate(currentEffects));

    effects.splice(index, 1);

    await this.item.update({ 'system.effects': effects });
  }

  async _onEffectTypeChange(event) {
    const select = event.target;
    const index = select.name.match(/system\.effects\.(\d+)\.type/)[1];
    const newType = select.value;

    const currentEffects = this.item.system.effects || [];
    const effects = Array.isArray(currentEffects)
      ? foundry.utils.duplicate(currentEffects)
      : Object.values(foundry.utils.duplicate(currentEffects));

    if (effects[index]) {
      const { createDefaultEffect } = await import('../config/spell-effects.mjs');
      effects[index] = createDefaultEffect(newType);
    }

    await this.item.update({ 'system.effects': effects });
  }

  async _onRangeTypeChange(event) {
    await this.item.update({ 'system.range.type': event.target.value });
  }

  async _onTargetTypeChange(event) {
    await this.item.update({ 'system.targets.type': event.target.value });
  }

  async _onEffectTargetChange(event) {
    const select = event.target;
    const match = select.name.match(/system\.effects\.(\d+)\.target/);

    if (!match) return;

    const index = parseInt(match[1]);
    const newTarget = select.value;

    const currentEffects = this.item.system.effects || [];
    const effects = Array.isArray(currentEffects)
      ? foundry.utils.duplicate(currentEffects)
      : Object.values(foundry.utils.duplicate(currentEffects));

    if (effects[index]) {
      effects[index].target = newTarget;

      if (newTarget === 'skill' || newTarget === 'weapon-damage' || newTarget === 'weapon-attack') {
        effects[index].targetName = '';
      } else {
        delete effects[index].targetName;
      }
    }

    await this.item.update({ 'system.effects': effects });
  }

  _onEffectCollapse(target) {
    const effectItem = target.closest('.effect-item');
    const icon = target.querySelector('i');
    if (!effectItem) return;

    effectItem.classList.toggle('collapsed');

    if (effectItem.classList.contains('collapsed')) {
      icon.classList.remove('fa-chevron-down');
      icon.classList.add('fa-chevron-right');
    } else {
      icon.classList.remove('fa-chevron-right');
      icon.classList.add('fa-chevron-down');
    }
  }
}

// Una subclase por tipo de item: PARTS es estático en ApplicationV2, así que
// el antiguo `get template()` dinámico se sustituye por registro por tipo
export function registerItemSheets(ItemsCollection) {
  for (const type of ITEM_SHEET_TYPES) {
    const cls = class extends RyfItemSheet {};
    Object.defineProperty(cls, 'name', { value: `RyfItemSheet_${type.replace(/-/g, '_')}` });
    cls.PARTS = {
      body: { template: `systems/ryf3/templates/item/item-${type}-sheet.hbs`, scrollable: ['.sheet-body .tab'] }
    };
    ItemsCollection.registerSheet('ryf', cls, {
      types: [type],
      makeDefault: true,
      label: 'RYF.SheetLabels.Item'
    });
  }
}
