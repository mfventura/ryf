export class RyfItemSheet extends ItemSheet {

  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ["ryf", "sheet", "item"],
      width: 520,
      height: 480,
      tabs: [{ navSelector: ".sheet-tabs", contentSelector: ".sheet-body", initial: "details" }]
    });
  }

  get template() {
    return `systems/ryf3/templates/item/item-${this.item.type}-sheet.hbs`;
  }

  getData() {
    const context = super.getData();

    const itemData = this.item.toObject(false);

    context.system = itemData.system;
    context.flags = itemData.flags;

    context.config = CONFIG.RYF;

    context.isCarismaEnabled = CONFIG.RYF.isCarismaEnabled();
    context.isMagicEnabled = CONFIG.RYF.isMagicEnabled();

    console.log('ItemSheet getData - isCarismaEnabled:', context.isCarismaEnabled);
    console.log('ItemSheet getData - isMagicEnabled:', context.isMagicEnabled);

    context.enrichedDescription = TextEditor.enrichHTML(context.system.description, {async: false});

    if (this.item.type === 'skill') {
      this._prepareSkillData(context);
    }

    return context;
  }

  _prepareSkillData(context) {
    const activeAttributes = CONFIG.RYF.getActiveAttributes();
    context.attributes = Object.entries(activeAttributes).map(([key, value]) => ({
      key: key,
      label: value
    }));

    const availableSkills = CONFIG.RYF.getAvailableSkills();
    context.availableSkills = availableSkills;
  }

  activateListeners(html) {
    super.activateListeners(html);

    if (!this.isEditable) return;

    html.find('.skill-increase').click(this._onSkillIncrease.bind(this));
    html.find('.skill-decrease').click(this._onSkillDecrease.bind(this));
    html.find('.item-toggle').click(this._onItemToggle.bind(this));
    html.find('.spell-cast').click(this._onSpellCast.bind(this));

    html.find('.effect-add').click(this._onEffectAdd.bind(this));
    html.find('.effect-delete').click(this._onEffectDelete.bind(this));
    html.find('.effect-collapse').click(this._onEffectCollapse.bind(this));
    html.find('.effect-type-select').change(this._onEffectTypeChange.bind(this));
    html.find('.range-type-select').change(this._onRangeTypeChange.bind(this));
    html.find('.target-type-select').change(this._onTargetTypeChange.bind(this));
    html.find('.effect-target-select').change(this._onEffectTargetChange.bind(this));
  }

  async _onSkillIncrease(event) {
    event.preventDefault();
    await this.item.increaseLevel();
  }

  async _onSkillDecrease(event) {
    event.preventDefault();
    await this.item.decreaseLevel();
  }

  async _onItemToggle(event) {
    event.preventDefault();
    await this.item.toggleEquipped();
  }

  async _onSpellCast(event) {
    event.preventDefault();
    await this.item.castSpell();
  }

  async _onEffectAdd(event) {
    event.preventDefault();

    let newEffect;

    if (['weapon', 'armor', 'shield', 'equipment'].includes(this.item.type)) {
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

  async _onEffectDelete(event) {
    event.preventDefault();

    const index = parseInt(event.currentTarget.dataset.effectIndex);
    const currentEffects = this.item.system.effects || [];
    const effects = Array.isArray(currentEffects)
      ? foundry.utils.duplicate(currentEffects)
      : Object.values(foundry.utils.duplicate(currentEffects));

    effects.splice(index, 1);

    await this.item.update({ 'system.effects': effects });
  }

  async _onEffectTypeChange(event) {
    event.preventDefault();

    const select = event.currentTarget;
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
    event.preventDefault();
    const select = event.currentTarget;
    const newRangeType = select.value;

    await this.item.update({ 'system.range.type': newRangeType });
  }

  async _onTargetTypeChange(event) {
    event.preventDefault();
    const select = event.currentTarget;
    const newTargetType = select.value;

    await this.item.update({ 'system.targets.type': newTargetType });
  }

  async _onEffectTargetChange(event) {
    event.preventDefault();

    const select = event.currentTarget;
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

      if (newTarget === 'skill' || newTarget === 'weapon') {
        effects[index].targetName = '';
      } else {
        delete effects[index].targetName;
      }
    }

    await this.item.update({ 'system.effects': effects });
  }

  _onEffectCollapse(event) {
    event.preventDefault();
    const button = event.currentTarget;
    const effectItem = button.closest('.effect-item');
    const icon = button.querySelector('i');

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
