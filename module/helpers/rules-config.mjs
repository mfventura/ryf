import { DEFAULT_RULES, getRule } from './rules.mjs';

const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

// Grouped field layout for the form. Every field is a free input: the
// Heroico/Realista presets only pre-fill values, they never restrict them.
const FIELD_GROUPS = [
  {
    key: 'GroupCreation',
    fields: [
      // Fields with `setting` mirror standalone world settings (hidden from
      // the general config window to avoid duplicate configuration points);
      // this menu is their only UI, and the presets can batch-fill them
      { key: 'attributePoints', setting: 'attributePoints', step: 1 },
      { key: 'attributeMin', step: 1 },
      { key: 'attributeMax', step: 1 },
      { key: 'creationMaxSkill', step: 1 },
      { key: 'creationMaxSum', step: 1 },
      { key: 'maxAdvantages', setting: 'maxAdvantages', step: 1 }
    ]
  },
  {
    key: 'GroupHealth',
    fields: [
      { key: 'healthMultiplier', setting: 'healthMultiplier', step: 1 },
      { key: 'manaMultiplier', setting: 'manaMultiplier', step: 1 },
      { key: 'woundedMultiplier', step: 0.5 },
      { key: 'unconsciousThreshold', step: 1 },
      { key: 'deathMultiplier', step: 1 },
      { key: 'healSkillDifficulty', step: 1 },
      { key: 'healSkillDice', type: 'text' },
      { key: 'breatherDice', type: 'text' },
      { key: 'sanityMultiplier', step: 1 }
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
      { key: 'maxSkillLevel', setting: 'maxSkillLevel', step: 1 },
      { key: 'xpCostMultiplier', step: 0.1 },
      { key: 'shortRestDivisor', step: 1 },
      { key: 'longRestFull', type: 'checkbox' },
      { key: 'longRestHealAmount', step: 1 }
    ]
  },
  {
    // Reference: RyF 3.0 PDF, página 95 - localización de daño (módulo
    // opcional); tabla reconstruida por errata del manual, por eso editable
    key: 'GroupHitLocation',
    fields: [
      { key: 'hitLocLeftLegRange', type: 'text' },
      { key: 'hitLocLeftLegDef', step: 1 },
      { key: 'hitLocRightLegRange', type: 'text' },
      { key: 'hitLocRightLegDef', step: 1 },
      { key: 'hitLocTorsoRange', type: 'text' },
      { key: 'hitLocTorsoDef', step: 1 },
      { key: 'hitLocLeftArmRange', type: 'text' },
      { key: 'hitLocLeftArmDef', step: 1 },
      { key: 'hitLocRightArmRange', type: 'text' },
      { key: 'hitLocRightArmDef', step: 1 },
      { key: 'hitLocHeadRange', type: 'text' },
      { key: 'hitLocHeadDef', step: 1 }
    ]
  },
  {
    // Reference: RyF 3.0 PDF, página 103 - naves espaciales (módulo opcional)
    key: 'GroupShips',
    fields: [
      { key: 'shipHullMultiplier', step: 1 },
      { key: 'shipPilotSkill', type: 'text' },
      { key: 'shipGunnerSkill', type: 'text' }
    ]
  }
];

// Reference: RyF 3.0 PDF, páginas 6, 14, 21, 45 y 94 - modos heroico (30
// puntos, PV x4, curación 2d6) y realista (22 puntos, PV x3, curación 1d6).
// Solo rellenan campos; todo sigue siendo editable.
const PRESETS = {
  heroic: { attributePoints: 30, healthMultiplier: 4, healSkillDice: '2d6', breatherDice: '2d6' },
  realistic: { attributePoints: 22, healthMultiplier: 3, healSkillDice: '1d6', breatherDice: '1d6' }
};

export class RulesConfig extends HandlebarsApplicationMixin(ApplicationV2) {

  static DEFAULT_OPTIONS = {
    id: 'rules-config',
    tag: 'form',
    classes: ['ryf', 'themed', 'theme-light'],
    window: { title: 'RYF.Settings.RulesConfig.Title' },
    position: { width: 560, height: 'auto' },
    form: {
      handler: RulesConfig.onSubmitForm,
      submitOnChange: false,
      closeOnSubmit: true
    }
  };

  static PARTS = {
    form: { template: 'systems/ryf3/templates/settings/rules-config.hbs' }
  };

  _fieldValue(field) {
    if (field.setting) return game.settings.get('ryf3', field.setting);
    return getRule(field.key);
  }

  async _prepareContext(options) {
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

  _onClickAction(event, target) {
    switch (target.dataset.action) {
      case 'applyPreset': return this._onPresetClick(target);
      case 'resetDefaults': return this._onResetDefaults();
    }
  }

  _onPresetClick(target) {
    const preset = PRESETS[target.dataset.preset];
    if (!preset) return;

    for (const [key, value] of Object.entries(preset)) {
      const input = this.element.querySelector(`input[name="${key}"]`);
      if (input) input.value = value;
    }
  }

  _onResetDefaults() {
    for (const [key, value] of Object.entries(DEFAULT_RULES)) {
      const input = this.element.querySelector(`input[name="${key}"]`);
      if (!input) continue;
      if (input.type === 'checkbox') {
        input.checked = value === true;
      } else {
        input.value = value;
      }
    }

    const mirrored = FIELD_GROUPS.flatMap(g => g.fields).filter(f => f.setting);
    for (const field of mirrored) {
      const defaultValue = game.settings.settings.get(`ryf3.${field.setting}`)?.default;
      if (defaultValue !== undefined) {
        const input = this.element.querySelector(`input[name="${field.key}"]`);
        if (input) input.value = defaultValue;
      }
    }
  }

  static async onSubmitForm(event, form, formData) {
    const data = formData.object;
    const rules = {};

    for (const group of FIELD_GROUPS) {
      for (const field of group.fields) {
        const raw = data[field.key];

        if (field.setting) {
          const value = Number(raw);
          // Solo escribir si cambió, para no disparar onChange (avisos de
          // recarga, re-render de fichas) innecesariamente
          if (!Number.isNaN(value) && value !== game.settings.get('ryf3', field.setting)) {
            await game.settings.set('ryf3', field.setting, value);
          }
          continue;
        }

        if (field.type === 'checkbox') {
          rules[field.key] = raw === true || raw === 'true' || raw === 'on';
        } else if (field.type === 'text') {
          const value = String(raw ?? '').trim();
          rules[field.key] = value || DEFAULT_RULES[field.key];
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
