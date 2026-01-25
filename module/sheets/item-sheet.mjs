export class RyfItemSheet extends ItemSheet {

  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ["ryf", "sheet", "item"],
      width: 520,
      height: 480,
      tabs: [{ navSelector: ".sheet-tabs", contentSelector: ".sheet-body", initial: "description" }]
    });
  }

  get template() {
    return `systems/ryf/templates/item/item-${this.item.type}-sheet.hbs`;
  }

  getData() {
    const context = super.getData();

    const itemData = this.item.toObject(false);

    context.system = itemData.system;
    context.flags = itemData.flags;

    context.config = CONFIG.RYF;

    context.isCarismaEnabled = CONFIG.RYF.isCarismaEnabled();
    context.isMagicEnabled = CONFIG.RYF.isMagicEnabled();

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
}

