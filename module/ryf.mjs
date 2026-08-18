import { RYF } from './helpers/config.mjs';
import { registerSystemSettings } from './helpers/settings.mjs';
import { preloadHandlebarsTemplates } from './helpers/templates.mjs';
import { RyfActor } from './documents/actor.mjs';
import { RyfItem } from './documents/item.mjs';
import { RyfActiveEffect } from './documents/ryf-active-effect.mjs';
import { RyfCombat } from './documents/combat.mjs';
import { RyfActorSheet } from './sheets/actor-sheet.mjs';
import { RyfItemSheet } from './sheets/item-sheet.mjs';

Hooks.once('init', async function() {

  game.ryf = {
    RyfActor,
    RyfItem,
    RyfActiveEffect,
    config: RYF
  };

  CONFIG.RYF = RYF;

  CONFIG.Actor.documentClass = RyfActor;
  CONFIG.Item.documentClass = RyfItem;
  CONFIG.ActiveEffect.documentClass = RyfActiveEffect;
  CONFIG.Combat.documentClass = RyfCombat;

  // Fallback para tiradas fuera de RyfCombat.rollInitiative: 3d10 quedándose
  // el dado medio (sin explosión, que la fórmula no puede expresar)
  // Reference: RyF 3.0 PDF, página 20 - Iniciativa = Percepción + Reflejos + 1o3d10
  CONFIG.Combat.initiative = {
    formula: '3d10dl1dh1 + @initiative.base - @combat.hindrance',
    decimals: 0
  };

  CONFIG.statusEffects.push({
    id: 'wounded',
    name: 'RYF.States.wounded',
    img: 'icons/svg/blood.svg'
  });

  Actors.unregisterSheet("core", ActorSheet);
  Actors.registerSheet("ryf", RyfActorSheet, {
    types: ["character", "npc"],
    makeDefault: true,
    label: "RYF.SheetLabels.Actor"
  });

  Items.unregisterSheet("core", ItemSheet);
  Items.registerSheet("ryf", RyfItemSheet, {
    types: ["skill", "weapon", "armor", "shield", "equipment", "spell", "npc-attack", "advantage"],
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

  Handlebars.registerHelper('localizeItem', function(item, field) {
    if (!item?.flags?.ryf?.translationKey) {
      return field === 'name' ? item?.name : item?.system?.description;
    }

    const translationKey = item.flags.ryf.translationKey;
    const key = `RYF.ITEMS.${translationKey}.${field}`;
    const translated = game.i18n.localize(key);

    if (translated !== key) {
      return field === 'description' ? `<p>${translated}</p>` : translated;
    }

    return field === 'name' ? item.name : item.system.description;
  });

  Handlebars.registerHelper('concat', function(...args) {
    args.pop();
    return args.join('');
  });

  Handlebars.registerHelper('capitalize', function(str) {
    if (!str || typeof str !== 'string') return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
  });

  Handlebars.registerHelper('targetToPascalCase', function(str) {
    if (!str || typeof str !== 'string') return '';
    return str.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join('');
  });

  Handlebars.registerHelper('log', function(...args) {
    args.pop();
    console.log('Handlebars log:', ...args);
    return '';
  });

  await preloadHandlebarsTemplates();

});

Hooks.once('ready', async function() {
  
  const enableCarisma = game.settings.get('ryf3', 'enableCarisma');
  const enableMagia = game.settings.get('ryf3', 'enableMagia');
  const healthMult = game.settings.get('ryf3', 'healthMultiplier');
  const characterType = game.settings.get('ryf3', 'defaultCharacterType');
  
});

Hooks.on('renderChatMessage', (message, html) => {
  html.find('.roll-damage').click(async (event) => {
    event.preventDefault();
    const button = $(event.currentTarget);
    const weaponId = button.data('weapon-id');
    const criticalDice = button.data('critical-dice') || 0;
    const range = button.data('range') || null;

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
    await RyfRoll.rollDamage(weapon, criticalDice, 0, actor, range);
  });

  html.find('.apply-damage-button').click(async (event) => {
    event.preventDefault();
    const button = $(event.currentTarget);
    const damage = parseInt(button.data('damage'));
    const damageType = button.data('damage-type') || 'physical';
    // Reference: RyF 3.0 PDF, página 22 - armas que ignoran la absorción
    const ignoreAbsorption = button.data('ignores-armor') === true;

    const targets = Array.from(game.user.targets);

    if (targets.length === 0) {
      ui.notifications.warn(game.i18n.localize('RYF.Warnings.NoTargetSelected'));
      return;
    }

    for (const token of targets) {
      if (token.actor) {
        await token.actor.applyDamage(damage, damageType, null, { ignoreAbsorption: ignoreAbsorption });
      }
    }
  });
});

// Reference: RyF 3.0 PDF, página 20 - mostrar las acciones múltiples por
// iniciativa (20+ → 2, 30+ → 3...) junto a cada combatiente en el tracker.
// DOM nativo: el CombatTracker es ApplicationV2 y no recibe jQuery.
Hooks.on('renderCombatTracker', (app, html) => {
  const root = html instanceof HTMLElement ? html : html[0];
  const combat = app.viewed;
  if (!combat || !root) return;

  for (const li of root.querySelectorAll('.combatant[data-combatant-id]')) {
    const combatant = combat.combatants.get(li.dataset.combatantId);
    const actions = combatant?.flags?.ryf3?.actions;
    if (!actions || actions <= 1) continue;
    if (li.querySelector('.ryf-actions-badge')) continue;

    const name = li.querySelector('.token-name') || li;
    const badge = document.createElement('span');
    badge.classList.add('ryf-actions-badge');
    badge.title = game.i18n.localize('RYF.Actions');
    badge.innerHTML = `<i class="fas fa-bolt"></i>${actions}`;
    name.appendChild(badge);
  }
});

// Reference: RyF 3.0 PDF, página 94 - Coger aire solo recupera el daño del
// combate actual: al empezar un combate nuevo se resetea el acumulador
Hooks.on('combatStart', async (combat) => {
  if (!game.user.isGM) return;

  for (const combatant of combat.combatants) {
    if (combatant.actor?.getFlag('ryf3', 'combatDamage')) {
      await combatant.actor.unsetFlag('ryf3', 'combatDamage');
    }
  }
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

  const activeEffects = actor.effects.filter(e => !e.disabled && e.duration?.turns > 0);

  if (activeEffects.length > 0) {
    const effectsList = activeEffects.map(e => {
      console.log('Active effect: ', e)
      const remaining = e.duration.remaining || e.duration.turns;
      return `${e.name} (${remaining} ${game.i18n.localize('RYF.Magic.Turns')})`;
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

Hooks.on('renderItemSheet', (app, html, data) => {
  const item = app.object;

  if (!item.flags?.ryf?.translationKey) return;

  const translationKey = item.flags.ryf.translationKey;
  const nameKey = `RYF.ITEMS.${translationKey}.name`;
  const descKey = `RYF.ITEMS.${translationKey}.description`;

  const translatedName = game.i18n.localize(nameKey);
  const translatedDesc = game.i18n.localize(descKey);

  if (translatedName !== nameKey && item.name.startsWith('RYF.ITEMS.')) {
    html.find('input[name="name"]').val(translatedName);
  }

  if (translatedDesc !== descKey && item.system.description?.startsWith('RYF.ITEMS.')) {
    const descEditor = html.find('.editor-content .editor');
    if (descEditor.length > 0) {
      descEditor.html(`<p>${translatedDesc}</p>`);
    }
  }
});

Hooks.on('renderActorSheet', (app, html, data) => {
  const actor = app.object;

  html.find('.item .item-name').each(function() {
    const itemId = $(this).closest('.item').data('item-id');
    const item = actor.items.get(itemId);

    if (!item || !item.flags?.ryf?.translationKey) return;

    const translationKey = item.flags.ryf.translationKey;
    const nameKey = `RYF.ITEMS.${translationKey}.name`;
    const translatedName = game.i18n.localize(nameKey);

    if (translatedName !== nameKey && item.name.startsWith('RYF.ITEMS.')) {
      $(this).find('h4').text(translatedName);
    }
  });
});

Hooks.on('renderCompendium', (app, html, data) => {
  html.find('.directory-item').each(function() {
    const itemId = $(this).data('document-id');
    const item = app.collection.get(itemId);

    if (!item || !item.flags?.ryf?.translationKey) return;

    const translationKey = item.flags.ryf.translationKey;
    const nameKey = `RYF.ITEMS.${translationKey}.name`;
    const translatedName = game.i18n.localize(nameKey);

    if (translatedName !== nameKey && item.name.startsWith('RYF.ITEMS.')) {
      $(this).find('.document-name').text(translatedName);
    }
  });
});

// Reference: RyF 3.0 PDF, página 98 - una sola ventaja por personaje (límite
// configurable, 0 = sin límite) y con requisito de atributo. Validación
// advisory: avisa pero no bloquea.
// Reference: RyF 3.0 PDF, página 98 - Razas (módulo opcional): cada personaje
// tiene una sola raza; sin el módulo activo no se pueden crear
Hooks.on('preCreateItem', (item, data, options, userId) => {
  if (item.type !== 'race') return;

  if (!game.settings.get('ryf3', 'enableRaces')) {
    ui.notifications.warn(game.i18n.localize('RYF.Warnings.RacesDisabled'));
    return false;
  }

  const actor = item.parent;
  if (!actor || actor.documentName !== 'Actor' || actor.type !== 'character') return;

  const existing = actor.items.filter(i => i.type === 'race').length;
  if (existing >= 1) {
    ui.notifications.warn(game.i18n.localize('RYF.Warnings.OneRaceOnly'));
  }
});

Hooks.on('preCreateItem', (item, data, options, userId) => {
  if (item.type !== 'advantage') return;
  const actor = item.parent;
  if (!actor || actor.documentName !== 'Actor' || actor.type !== 'character') return;

  const maxAdvantages = game.settings.get('ryf3', 'maxAdvantages');
  const currentCount = actor.items.filter(i => i.type === 'advantage').length;
  if (maxAdvantages > 0 && currentCount >= maxAdvantages) {
    ui.notifications.warn(game.i18n.format('RYF.Warnings.MaxAdvantagesReached', { max: maxAdvantages }));
  }

  const requirement = item.system?.requirement;
  if (requirement?.attribute) {
    const attrValue = actor.system.attributes?.[requirement.attribute]?.value || 0;
    if (attrValue < requirement.value) {
      ui.notifications.warn(game.i18n.format('RYF.Warnings.AdvantageRequirementNotMet', {
        attribute: game.i18n.localize(CONFIG.RYF.attributes[requirement.attribute]),
        value: requirement.value
      }));
    }
  }
});

Hooks.on('preCreateItem', async (item, data, options, userId) => {
  if (!item.flags?.ryf?.translationKey) return;

  if (item.pack) return;

  const translationKey = item.flags.ryf.translationKey;
  const nameKey = `RYF.ITEMS.${translationKey}.name`;
  const descKey = `RYF.ITEMS.${translationKey}.description`;

  const translatedName = game.i18n.localize(nameKey);
  const translatedDesc = game.i18n.localize(descKey);

  if (translatedName !== nameKey && item.name.startsWith('RYF.ITEMS.')) {
    item.updateSource({ name: translatedName });
  }

  if (translatedDesc !== descKey && item.system.description?.startsWith('RYF.ITEMS.')) {
    item.updateSource({ 'system.description': `<p>${translatedDesc}</p>` });
  }
});

Hooks.on('preCreateActor', async (actor, data, options, userId) => {
  if (actor.type !== 'npc') return;

  if (!actor.flags?.ryf?.translationKey) return;

  if (actor.pack) return;

  const translationKey = actor.flags.ryf.translationKey;
  const nameKey = `RYF.ITEMS.${translationKey}.name`;
  const descKey = `RYF.ITEMS.${translationKey}.description`;

  const translatedName = game.i18n.localize(nameKey);
  const translatedDesc = game.i18n.localize(descKey);

  if (translatedName !== nameKey && actor.name.startsWith('RYF.ITEMS.')) {
    actor.updateSource({ name: translatedName });
  }

  if (translatedDesc !== descKey && actor.system.biography?.startsWith('RYF.ITEMS.')) {
    actor.updateSource({ 'system.biography': `<p>${translatedDesc}</p>` });
  }
});

Hooks.on('createActor', async (actor, options, userId) => {
  if (actor.type !== 'npc') return;

  if (!actor.flags?.ryf?.translationKey) return;

  if (actor.pack) return;

  if (actor.items && actor.items.size > 0) {
    const updates = [];
    for (const item of actor.items) {
      if (item.type === 'npc-attack' && item.name.startsWith('RYF.ITEMS.')) {
        const attackKey = item.name;
        const translatedAttackName = game.i18n.localize(attackKey);
        if (translatedAttackName !== attackKey) {
          updates.push({
            _id: item.id,
            name: translatedAttackName
          });
        }
      }
    }

    if (updates.length > 0) {
      await actor.updateEmbeddedDocuments('Item', updates);
    }
  }
});

Hooks.on('updateActor', async (actor, updateData, options, userId) => {
  if (!updateData.system?.health) return;

  await actor._updateStatusEffects();
});

