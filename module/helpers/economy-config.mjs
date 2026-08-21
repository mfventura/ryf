import { defaultEconomy, getEconomy } from './economy.mjs';

const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

// Simple slug for currency ids: they become keys inside system.money, so
// they must be safe as object property path segments
function slugId(text) {
  return String(text)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// Preset economies: like the rules presets, they only pre-fill the list —
// every row stays freely editable afterwards
const PRESETS = {
  fantasy: () => defaultEconomy().currencies,
  modern: () => [
    { id: '', name: game.i18n.localize('RYF.Settings.EconomyConfig.PresetModernCurrency'), abbr: '€', rate: 0 }
  ],
  futuristic: () => [
    { id: '', name: game.i18n.localize('RYF.Settings.EconomyConfig.PresetFuturisticCurrency'), abbr: 'cr', rate: 0 }
  ]
};

export class EconomyConfig extends HandlebarsApplicationMixin(ApplicationV2) {

  static DEFAULT_OPTIONS = {
    id: 'economy-config',
    tag: 'form',
    classes: ['ryf'],
    window: { title: 'RYF.Settings.EconomyConfig.Title' },
    position: { width: 560, height: 'auto' },
    form: {
      handler: EconomyConfig.onSubmitForm,
      submitOnChange: false,
      closeOnSubmit: true
    }
  };

  static PARTS = {
    form: { template: 'systems/ryf3/templates/settings/economy-config.hbs' }
  };

  _currencies() {
    if (!this._working) this._working = foundry.utils.deepClone(getEconomy().currencies);
    return this._working;
  }

  async _prepareContext(options) {
    const currencies = this._currencies();
    return {
      currencies: currencies.map((c, i) => ({
        ...c,
        index: i,
        isLast: i === currencies.length - 1
      }))
    };
  }

  // Copies the current inputs into the working array before re-rendering so
  // edits are not lost when adding/removing/moving rows
  _captureForm() {
    const captured = [];
    for (const row of this.element.querySelectorAll('.currency-row[data-index]')) {
      captured.push({
        id: String(row.querySelector('[data-field="id"]')?.value ?? ''),
        name: String(row.querySelector('[data-field="name"]')?.value ?? ''),
        abbr: String(row.querySelector('[data-field="abbr"]')?.value ?? ''),
        rate: Number(row.querySelector('[data-field="rate"]')?.value)
      });
    }
    this._working = captured;
  }

  _onClickAction(event, target) {
    switch (target.dataset.action) {
      case 'addCurrency': {
        this._captureForm();
        this._working.push({ id: '', name: '', abbr: '', rate: 10 });
        return this.render();
      }
      case 'removeCurrency': {
        this._captureForm();
        this._working.splice(Number(target.dataset.index), 1);
        return this.render();
      }
      case 'moveCurrency': {
        this._captureForm();
        const index = Number(target.dataset.index);
        const destination = index + Number(target.dataset.direction);
        if (destination < 0 || destination >= this._working.length) return;
        [this._working[index], this._working[destination]] = [this._working[destination], this._working[index]];
        return this.render();
      }
      case 'applyPreset': {
        const preset = PRESETS[target.dataset.preset];
        if (!preset) return;
        this._working = preset();
        return this.render();
      }
    }
  }

  static async onSubmitForm(event, form, formData) {
    this._captureForm();

    const cleaned = [];
    const usedIds = new Set();
    for (const row of this._working) {
      const name = row.name.trim();
      if (!name) continue;
      const abbr = row.abbr.trim();
      let rate = Number(row.rate);
      if (!Number.isFinite(rate) || rate < 0) rate = 0;
      // Existing rows keep their id so actor money data stays attached; new
      // rows get one derived from the abbreviation/name
      let id = row.id.trim();
      if (!id) id = slugId(abbr || name) || foundry.utils.randomID(8).toLowerCase();
      while (usedIds.has(id)) id = `${id}-${foundry.utils.randomID(4).toLowerCase()}`;
      usedIds.add(id);
      cleaned.push({ id, name, abbr, rate });
    }

    if (!cleaned.length) {
      ui.notifications.warn(game.i18n.localize('RYF.Settings.EconomyConfig.NeedOneCurrency'));
      return;
    }

    await game.settings.set('ryf3', 'economy', { currencies: cleaned });
    ui.notifications.info(game.i18n.localize('RYF.Settings.EconomyConfig.Saved'));
  }
}
