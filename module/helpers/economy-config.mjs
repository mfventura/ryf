import { defaultEconomy, getEconomy } from './economy.mjs';

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

export class EconomyConfig extends FormApplication {

  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      id: 'economy-config',
      title: game.i18n.localize('RYF.Settings.EconomyConfig.Title'),
      template: 'systems/ryf3/templates/settings/economy-config.hbs',
      width: 560,
      height: 'auto',
      closeOnSubmit: true,
      submitOnClose: false,
      submitOnChange: false
    });
  }

  _currencies() {
    if (!this._working) this._working = foundry.utils.deepClone(getEconomy().currencies);
    return this._working;
  }

  getData() {
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
    this.element.find('.currency-row[data-index]').each((_, row) => {
      const $row = $(row);
      captured.push({
        id: String($row.find('[data-field="id"]').val() ?? ''),
        name: String($row.find('[data-field="name"]').val() ?? ''),
        abbr: String($row.find('[data-field="abbr"]').val() ?? ''),
        rate: Number($row.find('[data-field="rate"]').val())
      });
    });
    this._working = captured;
  }

  activateListeners(html) {
    super.activateListeners(html);

    html.find('.add-currency').click(event => {
      event.preventDefault();
      this._captureForm();
      this._working.push({ id: '', name: '', abbr: '', rate: 10 });
      this.render();
    });

    html.find('.remove-currency').click(event => {
      event.preventDefault();
      this._captureForm();
      this._working.splice(Number(event.currentTarget.dataset.index), 1);
      this.render();
    });

    html.find('.move-currency').click(event => {
      event.preventDefault();
      this._captureForm();
      const index = Number(event.currentTarget.dataset.index);
      const target = index + Number(event.currentTarget.dataset.direction);
      if (target < 0 || target >= this._working.length) return;
      [this._working[index], this._working[target]] = [this._working[target], this._working[index]];
      this.render();
    });

    html.find('.preset-button[data-preset]').click(event => {
      event.preventDefault();
      const preset = PRESETS[event.currentTarget.dataset.preset];
      if (!preset) return;
      this._working = preset();
      this.render();
    });
  }

  async _updateObject() {
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
