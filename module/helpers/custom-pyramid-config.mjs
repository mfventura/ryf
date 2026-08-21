const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

export class CustomPyramidConfig extends HandlebarsApplicationMixin(ApplicationV2) {

  static DEFAULT_OPTIONS = {
    id: 'custom-pyramid-config',
    tag: 'form',
    classes: ['ryf'],
    window: { title: 'RYF.Settings.CustomPyramidMenu.Title' },
    position: { width: 500, height: 'auto' },
    form: {
      handler: CustomPyramidConfig.onSubmitForm,
      submitOnChange: false,
      closeOnSubmit: true
    }
  };

  static PARTS = {
    form: { template: 'systems/ryf3/templates/settings/custom-pyramid.hbs' }
  };

  async _prepareContext(options) {
    const current = game.settings.get('ryf3', 'customPyramid');
    const maxLevel = game.settings.get('ryf3', 'maxSkillLevel');

    const levels = [];
    let totalSkills = 0;

    for (let i = maxLevel; i >= 1; i--) {
      const count = current[`level${i}`] || 0;
      levels.push({ level: i, count: count });
      totalSkills += count;
    }

    return {
      pyramid: current,
      levels: levels,
      maxLevel: maxLevel,
      totalSkills: totalSkills,
      presets: {
        specialistHeroic: {
          name: game.i18n.localize('RYF.Settings.CharacterTypes.SpecialistHeroic'),
          description: '1×6, 3×5, 3×4, 3×3, 3×2, 3×1 (16 habilidades)'
        },
        versatileHeroic: {
          name: game.i18n.localize('RYF.Settings.CharacterTypes.VersatileHeroic'),
          description: '1×6, 2×5, 3×4, 4×3, 5×2, 6×1 (21 habilidades)'
        },
        specialistRealistic: {
          name: game.i18n.localize('RYF.Settings.CharacterTypes.SpecialistRealistic'),
          description: '2×5, 2×4, 2×3, 2×2, 2×1 (10 habilidades)'
        },
        versatileRealistic: {
          name: game.i18n.localize('RYF.Settings.CharacterTypes.VersatileRealistic'),
          description: '1×5, 2×4, 3×3, 4×2, 5×1 (15 habilidades)'
        }
      }
    };
  }

  _onRender(context, options) {
    super._onRender(context, options);
    for (const input of this.element.querySelectorAll('input[type="number"]')) {
      input.addEventListener('change', () => this._updateTotal());
    }
  }

  _onClickAction(event, target) {
    if (target.dataset.action === 'applyPreset') return this._onPresetClick(target);
  }

  _onPresetClick(target) {
    const preset = target.dataset.preset;
    const maxLevel = game.settings.get('ryf3', 'maxSkillLevel');

    const presets = {
      specialistHeroic: { level6: 1, level5: 3, level4: 3, level3: 3, level2: 3, level1: 3 },
      versatileHeroic: { level6: 1, level5: 2, level4: 3, level3: 4, level2: 5, level1: 6 },
      specialistRealistic: { level6: 0, level5: 2, level4: 2, level3: 2, level2: 2, level1: 2 },
      versatileRealistic: { level6: 0, level5: 1, level4: 2, level3: 3, level2: 4, level1: 5 }
    };

    const values = presets[preset];
    if (values) {
      for (let i = 1; i <= maxLevel; i++) {
        const input = this.element.querySelector(`input[name="level${i}"]`);
        if (input) input.value = values[`level${i}`] || 0;
      }

      this._updateTotal();
    }
  }

  _updateTotal() {
    const maxLevel = game.settings.get('ryf3', 'maxSkillLevel');
    let total = 0;

    for (let i = 1; i <= maxLevel; i++) {
      const input = this.element.querySelector(`input[name="level${i}"]`);
      total += parseInt(input?.value) || 0;
    }

    const totalEl = this.element.querySelector('.total-skills');
    if (totalEl) totalEl.textContent = total;
  }

  static async onSubmitForm(event, form, formData) {
    const data = formData.object;
    const maxLevel = game.settings.get('ryf3', 'maxSkillLevel');
    const pyramid = {};
    let total = 0;

    for (let i = 1; i <= maxLevel; i++) {
      const value = Number(data[`level${i}`]) || 0;
      pyramid[`level${i}`] = value;
      total += value;
    }

    if (total === 0) {
      ui.notifications.warn(game.i18n.localize('RYF.Warnings.EmptyPyramid'));
      return;
    }

    await game.settings.set('ryf3', 'customPyramid', pyramid);

    ui.notifications.info(game.i18n.localize('RYF.Notifications.PyramidSaved'));
  }
}
