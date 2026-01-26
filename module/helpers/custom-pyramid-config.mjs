export class CustomPyramidConfig extends FormApplication {
  
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      id: 'custom-pyramid-config',
      title: game.i18n.localize('RYF.Settings.CustomPyramidMenu.Title'),
      template: 'systems/ryf3/templates/settings/custom-pyramid.hbs',
      width: 500,
      height: 'auto',
      closeOnSubmit: true,
      submitOnClose: false,
      submitOnChange: false
    });
  }

  getData() {
    const current = game.settings.get('ryf3', 'customPyramid');
    
    const totalSkills = current.level6 + current.level5 + current.level4 + 
                        current.level3 + current.level2 + current.level1;
    
    return {
      pyramid: current,
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

  activateListeners(html) {
    super.activateListeners(html);
    
    html.find('.preset-button').click(this._onPresetClick.bind(this));
    
    html.find('input[type="number"]').change(this._onInputChange.bind(this));
  }

  _onPresetClick(event) {
    event.preventDefault();
    const preset = event.currentTarget.dataset.preset;
    
    const presets = {
      specialistHeroic: { level6: 1, level5: 3, level4: 3, level3: 3, level2: 3, level1: 3 },
      versatileHeroic: { level6: 1, level5: 2, level4: 3, level3: 4, level2: 5, level1: 6 },
      specialistRealistic: { level6: 0, level5: 2, level4: 2, level3: 2, level2: 2, level1: 2 },
      versatileRealistic: { level6: 0, level5: 1, level4: 2, level3: 3, level2: 4, level1: 5 }
    };
    
    const values = presets[preset];
    if (values) {
      this.element.find('input[name="level6"]').val(values.level6);
      this.element.find('input[name="level5"]').val(values.level5);
      this.element.find('input[name="level4"]').val(values.level4);
      this.element.find('input[name="level3"]').val(values.level3);
      this.element.find('input[name="level2"]').val(values.level2);
      this.element.find('input[name="level1"]').val(values.level1);
      
      this._updateTotal();
    }
  }

  _onInputChange(event) {
    this._updateTotal();
  }

  _updateTotal() {
    const level6 = parseInt(this.element.find('input[name="level6"]').val()) || 0;
    const level5 = parseInt(this.element.find('input[name="level5"]').val()) || 0;
    const level4 = parseInt(this.element.find('input[name="level4"]').val()) || 0;
    const level3 = parseInt(this.element.find('input[name="level3"]').val()) || 0;
    const level2 = parseInt(this.element.find('input[name="level2"]').val()) || 0;
    const level1 = parseInt(this.element.find('input[name="level1"]').val()) || 0;
    
    const total = level6 + level5 + level4 + level3 + level2 + level1;
    
    this.element.find('.total-skills').text(total);
  }

  async _updateObject(event, formData) {
    const pyramid = {
      level6: formData.level6 || 0,
      level5: formData.level5 || 0,
      level4: formData.level4 || 0,
      level3: formData.level3 || 0,
      level2: formData.level2 || 0,
      level1: formData.level1 || 0
    };
    
    const total = pyramid.level6 + pyramid.level5 + pyramid.level4 + 
                  pyramid.level3 + pyramid.level2 + pyramid.level1;
    
    if (total === 0) {
      ui.notifications.warn(game.i18n.localize('RYF.Warnings.EmptyPyramid'));
      return;
    }
    
    await game.settings.set('ryf3', 'customPyramid', pyramid);
    
    ui.notifications.info(game.i18n.localize('RYF.Notifications.PyramidSaved'));
  }
}

