import { CustomPyramidConfig } from './custom-pyramid-config.mjs';

export function registerSystemSettings() {
  
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

  game.settings.register('ryf3', 'healthMultiplier', {
    name: 'RYF.Settings.HealthMultiplier.Name',
    hint: 'RYF.Settings.HealthMultiplier.Hint',
    scope: 'world',
    config: true,
    type: Number,
    range: {
      min: 1,
      max: 10,
      step: 1
    },
    default: 4,
    onChange: value => {
      game.actors.forEach(actor => {
        if (actor.type === 'character' || actor.type === 'npc') {
          actor.prepareData();
        }
      });
    }
  });

  game.settings.register('ryf3', 'manaMultiplier', {
    name: 'RYF.Settings.ManaMultiplier.Name',
    hint: 'RYF.Settings.ManaMultiplier.Hint',
    scope: 'world',
    config: true,
    type: Number,
    range: {
      min: 1,
      max: 10,
      step: 1
    },
    default: 3,
    onChange: value => {
      game.actors.forEach(actor => {
        if (actor.type === 'character' || actor.type === 'npc') {
          actor.prepareData();
        }
      });
    }
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

  game.settings.register('ryf3', 'customPyramid', {
    scope: 'world',
    config: false,
    type: Object,
    default: {
      level6: 0,
      level5: 0,
      level4: 0,
      level3: 0,
      level2: 0,
      level1: 0
    }
  });

  game.settings.register('ryf3', 'attributePoints', {
    name: 'RYF.Settings.AttributePoints.Name',
    hint: 'RYF.Settings.AttributePoints.Hint',
    scope: 'world',
    config: true,
    type: Number,
    range: {
      min: 16,
      max: 40,
      step: 1
    },
    default: 30
  });

  game.settings.register('ryf3', 'autoCalculateDefense', {
    name: 'RYF.Settings.AutoCalculateDefense.Name',
    hint: 'RYF.Settings.AutoCalculateDefense.Hint',
    scope: 'world',
    config: true,
    type: Boolean,
    default: true
  });
}

