import { DEFAULT_RULES, getRule } from './rules.mjs';

// Grouped field layout for the form. Every field is a free input: the
// Heroico/Realista presets only pre-fill values, they never restrict them.
const FIELD_GROUPS = [
  {
    key: 'GroupCreation',
    fields: [
      // Mirrors of standalone visible settings, included here so the presets
      // can batch-fill them alongside the core rules
      { key: 'attributePoints', setting: 'attributePoints', step: 1 },
      { key: 'attributeMin', step: 1 },
      { key: 'attributeMax', step: 1 },
      { key: 'creationMaxSkill', step: 1 },
      { key: 'creationMaxSum', step: 1 }
    ]
  },
  {
    key: 'GroupHealth',
    fields: [
      { key: 'healthMultiplier', setting: 'healthMultiplier', step: 1 },
      { key: 'woundedMultiplier', step: 0.5 },
      { key: 'unconsciousThreshold', step: 1 },
      { key: 'deathMultiplier', step: 1 }
    ]
  },
  {
    key: 'GroupCombat',
    fields: [
      { key: 'defenseBase', step: 1 },
      { key: 'willpowerBase', step: 1 },
      { key: 'actionsStep', step: 1 },
      { key: 'dualWieldBonus', step: 1 },
      { key: 'rangePointBlank', step: 1 },
      { key: 'rangeShort', step: 1 },
      { key: 'rangeMedium', step: 1 },
      { key: 'rangeLong', step: 1 }
    ]
  },
  {
    key: 'GroupProgression',
    fields: [
      { key: 'xpCostMultiplier', step: 0.1 },
      { key: 'shortRestDivisor', step: 1 },
      { key: 'longRestFull', type: 'checkbox' },
      { key: 'longRestHealAmount', step: 1 }
    ]
  }
];

// Reference: RyF 3.0 PDF, páginas 6, 14 y 21 - modos heroico (30 puntos, PV x4)
// y realista (22 puntos, PV x3). Solo rellenan campos; todo sigue siendo editable.
const PRESETS = {
  heroic: { attributePoints: 30, healthMultiplier: 4 },
  realistic: { attributePoints: 22, healthMultiplier: 3 }
};

export class RulesConfig extends FormApplication {

  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      id: 'rules-config',
      title: game.i18n.localize('RYF.Settings.RulesConfig.Title'),
      template: 'systems/ryf3/templates/settings/rules-config.hbs',
      width: 560,
      height: 'auto',
      closeOnSubmit: true,
      submitOnClose: false,
      submitOnChange: false
    });
  }

  _fieldValue(field) {
    if (field.setting) return game.settings.get('ryf3', field.setting);
    return getRule(field.key);
  }

  getData() {
    const groups = FIELD_GROUPS.map(group => ({
      label: game.i18n.localize(`RYF.Settings.RulesConfig.${group.key}`),
      fields: group.fields.map(field => ({
        key: field.key,
        type: field.type || 'number',
        step: field.step || 1,
        value: this._fieldValue(field),
        label: game.i18n.localize(`RYF.Settings.CoreRules.${field.key}.Name`),
        hint: game.i18n.localize(`RYF.Settings.CoreRules.${field.key}.Hint`)
      }))
    }));

    return { groups };
  }

  activateListeners(html) {
    super.activateListeners(html);

    html.find('.preset-button').click(this._onPresetClick.bind(this));
    html.find('.reset-defaults-button').click(this._onResetDefaults.bind(this));
  }

  _onPresetClick(event) {
    event.preventDefault();
    const preset = PRESETS[event.currentTarget.dataset.preset];
    if (!preset) return;

    for (const [key, value] of Object.entries(preset)) {
      this.element.find(`input[name="${key}"]`).val(value);
    }
  }

  _onResetDefaults(event) {
    event.preventDefault();

    for (const [key, value] of Object.entries(DEFAULT_RULES)) {
      const input = this.element.find(`input[name="${key}"]`);
      if (!input.length) continue;
      if (input.attr('type') === 'checkbox') {
        input.prop('checked', value === true);
      } else {
        input.val(value);
      }
    }

    for (const setting of ['attributePoints', 'healthMultiplier']) {
      const defaultValue = game.settings.settings.get(`ryf3.${setting}`)?.default;
      if (defaultValue !== undefined) {
        this.element.find(`input[name="${setting}"]`).val(defaultValue);
      }
    }
  }

  async _updateObject(event, formData) {
    const rules = {};

    for (const group of FIELD_GROUPS) {
      for (const field of group.fields) {
        const raw = formData[field.key];

        if (field.setting) {
          const value = Number(raw);
          if (!Number.isNaN(value)) {
            await game.settings.set('ryf3', field.setting, value);
          }
          continue;
        }

        if (field.type === 'checkbox') {
          rules[field.key] = raw === true || raw === 'true' || raw === 'on';
        } else {
          const value = Number(raw);
          rules[field.key] = Number.isNaN(value) ? DEFAULT_RULES[field.key] : value;
        }
      }
    }

    await game.settings.set('ryf3', 'coreRules', rules);

    ui.notifications.info(game.i18n.localize('RYF.Notifications.RulesSaved'));
  }
}
