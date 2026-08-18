import { CustomPyramidConfig } from './custom-pyramid-config.mjs';
import { RulesConfig } from './rules-config.mjs';

// Recalcula los datos derivados de todos los actores y refresca sus fichas
// abiertas para que los cambios de regla se vean sin recargar
function refreshActors() {
  game.actors.forEach(actor => {
    if (actor.type === 'character' || actor.type === 'npc') {
      actor.prepareData();
      actor.sheet?.rendered && actor.sheet.render(false);
    }
  });
}

export function registerSystemSettings() {

  // Toggles de módulo: los únicos settings visibles en la ventana general de
  // configuración. Los valores numéricos de regla se editan solo desde el
  // menú RulesConfig para no duplicar puntos de configuración.
  game.settings.register('ryf3', 'enableCarisma', {
    name: 'RYF.Settings.EnableCarisma.Name',
    hint: 'RYF.Settings.EnableCarisma.Hint',
    scope: 'world',
    config: true,
    type: Boolean,
    default: false,
    requiresReload: true
  });

  game.settings.register('ryf3', 'enableMagia', {
    name: 'RYF.Settings.EnableMagia.Name',
    hint: 'RYF.Settings.EnableMagia.Hint',
    scope: 'world',
    config: true,
    type: Boolean,
    default: false,
    requiresReload: true
  });

  // Reference: RyF 3.0 PDF, páginas 96-98 - módulo opcional de munición:
  // las tablas de armas de fuego incluyen cargador (balas) y recarga
  game.settings.register('ryf3', 'enableAmmo', {
    name: 'RYF.Settings.EnableAmmo.Name',
    hint: 'RYF.Settings.EnableAmmo.Hint',
    scope: 'world',
    config: true,
    type: Boolean,
    default: false
  });

  // Reference: RyF 3.0 PDF, páginas 91-92 - módulo opcional Tokens de la muerte
  game.settings.register('ryf3', 'enableTokens', {
    name: 'RYF.Settings.EnableTokens.Name',
    hint: 'RYF.Settings.EnableTokens.Hint',
    scope: 'world',
    config: true,
    type: Boolean,
    default: false,
    requiresReload: true
  });

  game.settings.register('ryf3', 'healthMultiplier', {
    name: 'RYF.Settings.HealthMultiplier.Name',
    hint: 'RYF.Settings.HealthMultiplier.Hint',
    scope: 'world',
    config: false,
    type: Number,
    default: 4,
    onChange: refreshActors
  });

  game.settings.register('ryf3', 'manaMultiplier', {
    name: 'RYF.Settings.ManaMultiplier.Name',
    hint: 'RYF.Settings.ManaMultiplier.Hint',
    scope: 'world',
    config: false,
    type: Number,
    default: 3,
    onChange: refreshActors
  });

  game.settings.register('ryf3', 'defaultCharacterType', {
    name: 'RYF.Settings.DefaultCharacterType.Name',
    hint: 'RYF.Settings.DefaultCharacterType.Hint',
    scope: 'world',
    config: true,
    type: String,
    choices: {
      specialistHeroic: 'RYF.Settings.CharacterTypes.SpecialistHeroic',
      versatileHeroic: 'RYF.Settings.CharacterTypes.VersatileHeroic',
      specialistRealistic: 'RYF.Settings.CharacterTypes.SpecialistRealistic',
      versatileRealistic: 'RYF.Settings.CharacterTypes.VersatileRealistic',
      custom: 'RYF.Settings.CharacterTypes.Custom'
    },
    default: 'specialistHeroic',
    requiresReload: true
  });

  game.settings.registerMenu('ryf3', 'customPyramidMenu', {
    name: 'RYF.Settings.CustomPyramidMenu.Name',
    label: 'RYF.Settings.CustomPyramidMenu.Label',
    hint: 'RYF.Settings.CustomPyramidMenu.Hint',
    icon: 'fas fa-cogs',
    type: CustomPyramidConfig,
    restricted: true
  });

  game.settings.register('ryf3', 'maxSkillLevel', {
    name: 'RYF.Settings.MaxSkillLevel.Name',
    hint: 'RYF.Settings.MaxSkillLevel.Hint',
    scope: 'world',
    config: false,
    type: Number,
    default: 10,
    onChange: () => {
      ui.notifications.info(game.i18n.localize('RYF.Notifications.ReloadRequired'));
    }
  });

  game.settings.register('ryf3', 'customPyramid', {
    scope: 'world',
    config: false,
    type: Object,
    default: {}
  });

  game.settings.register('ryf3', 'attributePoints', {
    name: 'RYF.Settings.AttributePoints.Name',
    hint: 'RYF.Settings.AttributePoints.Hint',
    scope: 'world',
    config: false,
    type: Number,
    default: 30,
    onChange: refreshActors
  });

  // Valores de regla configurables (bases, umbrales, bandas de distancia...).
  // Se editan con el menú RulesConfig; el código los lee vía getRule(), que
  // aplica los defaults de DEFAULT_RULES (module/helpers/rules.mjs) con sus
  // citas de página del PDF
  game.settings.registerMenu('ryf3', 'rulesConfigMenu', {
    name: 'RYF.Settings.RulesConfig.Name',
    label: 'RYF.Settings.RulesConfig.Label',
    hint: 'RYF.Settings.RulesConfig.Hint',
    icon: 'fas fa-sliders-h',
    type: RulesConfig,
    restricted: true
  });

  game.settings.register('ryf3', 'coreRules', {
    scope: 'world',
    config: false,
    type: Object,
    default: {},
    onChange: refreshActors
  });

  // Reference: RyF 3.0 PDF, página 98 - una sola ventaja por personaje;
  // configurable porque RyF es genérico (0 = sin límite)
  game.settings.register('ryf3', 'maxAdvantages', {
    name: 'RYF.Settings.MaxAdvantages.Name',
    hint: 'RYF.Settings.MaxAdvantages.Hint',
    scope: 'world',
    config: false,
    type: Number,
    default: 1
  });
}
