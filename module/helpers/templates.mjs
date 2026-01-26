export async function preloadHandlebarsTemplates() {
  const templatePaths = [
    'systems/ryf/templates/actor/actor-character-sheet.hbs',
    'systems/ryf/templates/actor/actor-npc-sheet.hbs',
    'systems/ryf/templates/actor/parts/actor-attributes.hbs',
    'systems/ryf/templates/actor/parts/actor-skills.hbs',
    'systems/ryf/templates/actor/parts/actor-inventory.hbs',
    'systems/ryf/templates/actor/parts/actor-effects.hbs',
    'systems/ryf/templates/actor/parts/actor-biography.hbs',
    'systems/ryf/templates/item/item-skill-sheet.hbs',
    'systems/ryf/templates/item/item-weapon-sheet.hbs',
    'systems/ryf/templates/item/item-armor-sheet.hbs',
    'systems/ryf/templates/item/item-shield-sheet.hbs',
    'systems/ryf/templates/item/item-equipment-sheet.hbs',
    'systems/ryf/templates/item/item-spell-sheet.hbs',
    'systems/ryf/templates/item/item-active-effect-sheet.hbs',
    'systems/ryf/templates/chat/skill-roll.hbs',
    'systems/ryf/templates/chat/attack-roll.hbs',
    'systems/ryf/templates/chat/damage-roll.hbs',
    'systems/ryf/templates/chat/spell-roll.hbs',
    'systems/ryf/templates/chat/initiative-roll.hbs',
    'systems/ryf/templates/chat/damage-applied.hbs',
    'systems/ryf/templates/settings/custom-pyramid.hbs'
  ];

  return loadTemplates(templatePaths);
}

