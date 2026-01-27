export class RyfItem extends Item {

  prepareData() {
    super.prepareData();
  }

  prepareBaseData() {
    super.prepareBaseData();
  }

  prepareDerivedData() {
    const itemData = this;
    const system = itemData.system;
    const flags = itemData.flags.ryf || {};

    this._prepareSkillData(itemData);
    this._prepareWeaponData(itemData);
    this._prepareArmorData(itemData);
    this._prepareShieldData(itemData);
    this._prepareSpellData(itemData);
  }

  _prepareSkillData(itemData) {
    if (itemData.type !== 'skill') return;

    const system = itemData.system;

    if (system.level < 0) system.level = 0;
    if (system.level > 10) system.level = 10;

    if (!CONFIG.RYF.isCarismaEnabled() && system.attribute === 'carisma') {
      system.attribute = 'fisico';
    }
  }

  _prepareWeaponData(itemData) {
    if (itemData.type !== 'weapon') return;

    const system = itemData.system;
  }

  _prepareArmorData(itemData) {
    if (itemData.type !== 'armor') return;

    const system = itemData.system;
  }

  _prepareShieldData(itemData) {
    if (itemData.type !== 'shield') return;

    const system = itemData.system;
  }

  _prepareSpellData(itemData) {
    if (itemData.type !== 'spell') return;

    const system = itemData.system;

    if (system.level < 1) system.level = 1;
    if (system.level > 10) system.level = 10;

    if (system.manaCost < 0) system.manaCost = 0;
  }

  static async create(data, options) {
    if (data.type === 'spell' && !CONFIG.RYF.isMagicEnabled()) {
      ui.notifications.warn(game.i18n.localize('RYF.Warnings.MagicDisabled'));
      return null;
    }

    if (data.type === 'skill' && data.system?.attribute === 'carisma') {
      if (!CONFIG.RYF.isCarismaEnabled()) {
        ui.notifications.warn(game.i18n.localize('RYF.Warnings.CarismaDisabled'));
        return null;
      }
    }

    return super.create(data, options);
  }

  async roll() {
    const item = this;

    if (item.type === 'skill') {
      if (!item.actor) {
        ui.notifications.warn(game.i18n.localize('RYF.Warnings.NoActor'));
        return;
      }
      
      await item.actor.rollSkill(item.name);
    }

    if (item.type === 'weapon') {
      ui.notifications.info('Sistema de combate pendiente de implementación (Fase 6)');
    }

    if (item.type === 'spell') {
      ui.notifications.info('Sistema de magia pendiente de implementación (Fase 8)');
    }
  }

  async use() {
    return this.roll();
  }

  async toggleEquipped() {
    if (!['weapon', 'armor', 'shield', 'equipment'].includes(this.type)) {
      ui.notifications.warn(game.i18n.localize('RYF.Warnings.CannotEquip'));
      return;
    }

    if (!this.actor) {
      ui.notifications.warn(game.i18n.localize('RYF.Warnings.NoActor'));
      return;
    }

    const currentlyEquipped = this.system.equipped;

    if (!currentlyEquipped && (this.type === 'armor' || this.type === 'shield')) {
      const equippedItems = this.actor.items.filter(i =>
        i.type === this.type && i.system.equipped && i.id !== this.id
      );

      if (equippedItems.length > 0) {
        for (const item of equippedItems) {
          await item.update({ 'system.equipped': false });
        }
      }
    }

    await this.update({ 'system.equipped': !currentlyEquipped });

    if (this.actor) {
      await this.actor.prepareData();
    }

    const message = currentlyEquipped
      ? game.i18n.format('RYF.Notifications.ItemUnequipped', { name: this.name })
      : game.i18n.format('RYF.Notifications.ItemEquipped', { name: this.name });

    ui.notifications.info(message);
  }

  async _onUpdate(changed, options, userId) {
    await super._onUpdate(changed, options, userId);

    if (!this.actor) return;

    if (changed.system?.equipped !== undefined) {
      const isEquipped = changed.system.equipped;

      if (isEquipped) {
        await this._applyItemEffects();
      } else {
        await this._removeItemEffects();
      }
    }
  }

  async _applyItemEffects() {
    if (!this.actor) return;

    const currentEffects = this.system.effects || [];
    const effects = Array.isArray(currentEffects)
      ? currentEffects
      : Object.values(currentEffects);

    if (effects.length === 0) return;

    const { RyfActiveEffect } = await import('./ryf-active-effect.mjs');

    for (const effect of effects) {
      const effectType = this.actor._getEffectTypeFromTarget(effect.target);

      const effectData = {
        name: `${this.name} (${game.i18n.localize('RYF.Effect')})`,
        img: this.img,
        sourceType: 'item',
        sourceName: this.name,
        sourceId: this.id,
        effectType: effectType,
        targetType: effect.target,
        targetName: effect.targetName || '',
        modifier: effect.modifier || 0,
        appliedBy: game.user.name
      };

      await RyfActiveEffect.createFromItem(this.actor, this, effectData);
    }
  }

  async _removeItemEffects() {
    if (!this.actor) return;

    const itemEffects = this.actor.effects.filter(e =>
      e.flags?.ryf3?.sourceType === 'item' &&
      e.flags?.ryf3?.sourceId === this.id
    );

    if (itemEffects.length > 0) {
      const effectIds = itemEffects.map(e => e.id);
      await this.actor.deleteEmbeddedDocuments('ActiveEffect', effectIds);

      ui.notifications.info(game.i18n.format('RYF.Notifications.EffectsRemoved', {
        count: effectIds.length,
        item: this.name
      }));
    }
  }

  async increaseLevel() {
    if (this.type !== 'skill' && this.type !== 'spell') {
      ui.notifications.warn(game.i18n.localize('RYF.Warnings.NotASkillOrSpell'));
      return;
    }

    const currentLevel = this.system.level;

    if (currentLevel >= 10) {
      ui.notifications.warn(game.i18n.localize('RYF.Warnings.MaxSkillLevel'));
      return;
    }

    const newLevel = currentLevel + 1;
    const xpCost = this.calculateSkillUpgradeCost(currentLevel, newLevel);

    if (this.actor && this.actor.type === 'character') {
      const totalXP = this.actor.system.experience.total;

      if (totalXP > 0) {
        const success = await this.actor.spendExperience(xpCost, `${this.name} ${currentLevel} → ${newLevel}`);

        if (!success) return;
      }
    }

    await this.update({ 'system.level': newLevel });

    const messageKey = this.type === 'spell' ? 'RYF.Notifications.SpellIncreased' : 'RYF.Notifications.SkillIncreased';
    ui.notifications.info(game.i18n.format(messageKey, {
      name: this.name,
      level: newLevel
    }));
  }

  async decreaseLevel() {
    if (this.type !== 'skill' && this.type !== 'spell') {
      ui.notifications.warn(game.i18n.localize('RYF.Warnings.NotASkillOrSpell'));
      return;
    }

    const currentLevel = this.system.level;

    if (currentLevel <= 0) {
      ui.notifications.warn(game.i18n.localize('RYF.Warnings.MinSkillLevel'));
      return;
    }

    const newLevel = currentLevel - 1;

    await this.update({ 'system.level': newLevel });

    const messageKey = this.type === 'spell' ? 'RYF.Notifications.SpellDecreased' : 'RYF.Notifications.SkillDecreased';
    ui.notifications.info(game.i18n.format(messageKey, {
      name: this.name,
      level: newLevel
    }));
  }

  calculateSkillUpgradeCost(fromLevel, toLevel) {
    const baseCost = 1;
    let totalCost = 0;

    for (let level = fromLevel + 1; level <= toLevel; level++) {
      totalCost += baseCost * level;
    }

    return totalCost;
  }

  async castSpell() {
    if (this.type !== 'spell') {
      ui.notifications.warn(game.i18n.localize('RYF.Warnings.NotASpell'));
      return;
    }

    if (!CONFIG.RYF.isMagicEnabled()) {
      ui.notifications.warn(game.i18n.localize('RYF.Warnings.MagicDisabled'));
      return;
    }

    if (!this.actor) {
      ui.notifications.warn(game.i18n.localize('RYF.Warnings.NoActor'));
      return;
    }

    const manaCost = this.system.manaCost;
    const success = await this.actor.spendMana(manaCost);

    if (!success) return;

    ui.notifications.info(game.i18n.format('RYF.Notifications.SpellCast', {
      name: this.name,
      cost: manaCost
    }));

  }
}

