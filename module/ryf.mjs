import { RYF } from './helpers/config.mjs';
import { registerSystemSettings } from './helpers/settings.mjs';
import { preloadHandlebarsTemplates } from './helpers/templates.mjs';
import { RyfActor } from './documents/actor.mjs';
import { RyfItem } from './documents/item.mjs';
import { RyfActorSheet } from './sheets/actor-sheet.mjs';
import { RyfItemSheet } from './sheets/item-sheet.mjs';

Hooks.once('init', async function() {

  game.ryf = {
    RyfActor,
    RyfItem,
    config: RYF
  };

  CONFIG.RYF = RYF;

  CONFIG.Actor.documentClass = RyfActor;
  CONFIG.Item.documentClass = RyfItem;

  CONFIG.Combat.initiative = {
    formula: '1d10x + @initiative.base - @combat.hindrance',
    decimals: 2
  };

  Actors.unregisterSheet("core", ActorSheet);
  Actors.registerSheet("ryf", RyfActorSheet, {
    types: ["character", "npc"],
    makeDefault: true,
    label: "RYF.SheetLabels.Actor"
  });

  Items.unregisterSheet("core", ItemSheet);
  Items.registerSheet("ryf", RyfItemSheet, {
    types: ["skill", "weapon", "armor", "shield", "equipment", "spell", "active-effect", "npc-attack"],
    makeDefault: true,
    label: "RYF.SheetLabels.Item"
  });

  registerSystemSettings();

  Handlebars.registerHelper('times', function(n, block) {
    let accum = '';
    for (let i = 0; i < n; ++i) {
      accum += block.fn(i);
    }
    return accum;
  });

  Handlebars.registerHelper('eq', function(a, b) {
    return a === b;
  });

  Handlebars.registerHelper('ne', function(a, b) {
    return a !== b;
  });

  Handlebars.registerHelper('gt', function(a, b) {
    return a > b;
  });

  Handlebars.registerHelper('lt', function(a, b) {
    return a < b;
  });

  Handlebars.registerHelper('gte', function(a, b) {
    return a >= b;
  });

  Handlebars.registerHelper('lte', function(a, b) {
    return a <= b;
  });

  Handlebars.registerHelper('and', function() {
    return Array.prototype.slice.call(arguments, 0, -1).every(Boolean);
  });

  Handlebars.registerHelper('or', function() {
    return Array.prototype.slice.call(arguments, 0, -1).some(Boolean);
  });

  Handlebars.registerHelper('not', function(value) {
    return !value;
  });

  Handlebars.registerHelper('multiply', function(a, b) {
    return a * b;
  });

  Handlebars.registerHelper('divide', function(a, b) {
    return b !== 0 ? a / b : 0;
  });

  Handlebars.registerHelper('lookup', function(obj, key) {
    return obj?.[key];
  });

  Handlebars.registerHelper('add', function(a, b) {
    return a + b;
  });

  Handlebars.registerHelper('checked', function(value) {
    return value ? 'checked' : '';
  });

  Handlebars.registerHelper('localize', function(key) {
    return game.i18n.localize(key);
  });

  Handlebars.registerHelper('concat', function(...args) {
    args.pop();
    return args.join('');
  });

  await preloadHandlebarsTemplates();

});

Hooks.once('ready', async function() {
  
  const enableCarisma = game.settings.get('ryf3', 'enableCarisma');
  const enableMagia = game.settings.get('ryf3', 'enableMagia');
  const healthMult = game.settings.get('ryf3', 'healthMultiplier');
  const characterType = game.settings.get('ryf3', 'defaultCharacterType');
  
});

Hooks.on('createChatMessage', async (message) => {
  if (!message.rolls || message.rolls.length === 0) return;

  const flavor = message.flavor || '';
  const isInitiative = flavor.toLowerCase().includes('initiative') || flavor.toLowerCase().includes('iniciativa');

  if (!isInitiative) return;

  const actor = ChatMessage.getSpeakerActor(message.speaker);
  if (!actor) return;

  const roll = message.rolls[0];
  const initiativeBase = actor.system?.initiative?.base || 0;
  const hindrance = actor.system?.combat?.hindrance || 0;
  const wounded = actor.system?.states?.wounded || false;

  const diceResult = roll.total - initiativeBase + hindrance;
  const total = roll.total;

  const rollData = {
    actor: actor,
    initiativeBase: initiativeBase,
    hindrance: hindrance,
    diceResult: diceResult,
    total: total,
    wounded: wounded
  };

  const template = 'systems/ryf3/templates/chat/initiative-roll.hbs';
  const html = await renderTemplate(template, rollData);

  await message.update({ content: html });
});

Hooks.on('renderChatMessage', (message, html) => {
  html.find('.roll-damage').click(async (event) => {
    event.preventDefault();
    const button = $(event.currentTarget);
    const weaponId = button.data('weapon-id');
    const criticalDice = button.data('critical-dice') || 0;

    const speaker = message.speaker;
    const actor = ChatMessage.getSpeakerActor(speaker);

    if (!actor) {
      ui.notifications.warn(game.i18n.localize('RYF.Warnings.NoActor'));
      return;
    }

    const weapon = actor.items.get(weaponId);

    if (!weapon) {
      ui.notifications.warn(game.i18n.localize('RYF.Warnings.WeaponNotFound'));
      return;
    }

    const { RyfRoll } = await import('./rolls/ryf-roll.mjs');
    await RyfRoll.rollDamage(weapon, criticalDice, 0, actor);
  });

  html.find('.apply-damage-button').click(async (event) => {
    event.preventDefault();
    const button = $(event.currentTarget);
    const damage = parseInt(button.data('damage'));
    const damageType = button.data('damage-type') || 'physical';

    const targets = Array.from(game.user.targets);

    if (targets.length === 0) {
      ui.notifications.warn(game.i18n.localize('RYF.Warnings.NoTargetSelected'));
      return;
    }

    for (const token of targets) {
      if (token.actor) {
        await token.actor.applyDamage(damage, damageType);
      }
    }
  });
});

Hooks.on('updateCombat', async (combat, updateData, updateOptions) => {

  if (!updateData.turn && !updateData.round) {
    return;
  }


  const combatant = combat.combatant;

  if (!combatant || !combatant.actor) {
    return;
  }

  const actor = combatant.actor;

  const { RyfActiveEffect } = await import('./documents/active-effect.mjs');

  const effectsBefore = actor.items.filter(i => i.type === 'active-effect');

  await RyfActiveEffect.decrementAllEffects(actor);

  const activeEffects = actor.items.filter(i => i.type === 'active-effect');

  if (activeEffects.length > 0) {
    const effectsList = activeEffects.map(e => {
      const remaining = e.system.duration.remaining;
      return `${e.name} (${remaining} ${game.i18n.localize('RYF.Turns')})`;
    }).join(', ');

    ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ actor: actor }),
      content: `<div class="ryf chat-card">
        <h3>${game.i18n.localize('RYF.Magic.ActiveEffects')}</h3>
        <p>${effectsList}</p>
      </div>`,
      whisper: [game.user.id]
    });
  }
});

