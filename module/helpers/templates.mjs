export async function preloadHandlebarsTemplates() {
  const templatePaths = [
    'systems/ryf3/templates/actor/actor-character-sheet.hbs',
    'systems/ryf3/templates/actor/actor-npc-sheet.hbs',
    'systems/ryf3/templates/item/item-skill-sheet.hbs',
    'systems/ryf3/templates/item/item-weapon-sheet.hbs',
    'systems/ryf3/templates/item/item-armor-sheet.hbs',
    'systems/ryf3/templates/item/item-shield-sheet.hbs',
    'systems/ryf3/templates/item/item-equipment-sheet.hbs',
    'systems/ryf3/templates/item/item-spell-sheet.hbs',
    'systems/ryf3/templates/item/partials/effect-immediate-damage.hbs',
    'systems/ryf3/templates/item/partials/effect-immediate-healing.hbs',
    'systems/ryf3/templates/item/partials/effect-buff.hbs',
    'systems/ryf3/templates/item/partials/effect-debuff.hbs',
    'systems/ryf3/templates/item/partials/effect-condition.hbs',
    'systems/ryf3/templates/item/partials/effect-item.hbs',
    'systems/ryf3/templates/chat/skill-roll.hbs',
    'systems/ryf3/templates/chat/attack-roll.hbs',
    'systems/ryf3/templates/chat/damage-roll.hbs',
    'systems/ryf3/templates/chat/spell-roll.hbs',
    'systems/ryf3/templates/chat/initiative-roll.hbs',
    'systems/ryf3/templates/chat/damage-applied.hbs',
    'systems/ryf3/templates/settings/custom-pyramid.hbs'
  ];

  return loadTemplates(templatePaths);
}

