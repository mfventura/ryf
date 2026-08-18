import { roll1o3d10, resolveMode } from '../helpers/dice.mjs';
import { getRule } from '../helpers/rules.mjs';

export class RyfCombat extends Combat {

  // Reference: RyF 3.0 PDF, página 20 - Iniciativa = Percepción + Reflejos + 1o3d10,
  // con explosión del dado objetivo; malherido guarda el dado menor.
  // Reference: RyF 3.0 PDF, página 21 - el estorbo se resta a la iniciativa.
  async rollInitiative(ids, { updateTurn = true } = {}) {
    ids = typeof ids === 'string' ? [ids] : ids;
    const currentId = this.combatant?.id;
    const updates = [];
    const messages = [];

    for (const id of ids) {
      const combatant = this.combatants.get(id);
      if (!combatant?.isOwner || !combatant.actor) continue;

      const actor = combatant.actor;
      const wounded = actor.system.states?.wounded || actor.statuses?.has('wounded') || false;
      const mode = resolveMode('normal', { downs: wounded ? ['wounded'] : [] });
      const initiativeBase = actor.system.initiative?.base || 0;
      const hindrance = actor.system.combat?.hindrance || 0;

      const diceRoll = await roll1o3d10(mode);
      const total = diceRoll.result + initiativeBase - hindrance;

      // Reference: RyF 3.0 PDF, página 20 - una acción por turno, a menos que
      // se saque 20 o más (2 acciones), 30 o más (3), 40 o más (4), etc.
      const step = getRule('actionsStep');
      const actions = 1 + Math.floor(Math.max(total - step, 0) / step);

      updates.push({ _id: id, initiative: total, 'flags.ryf3.actions': actions });

      const html = await renderTemplate('systems/ryf3/templates/chat/initiative-roll.hbs', {
        actor: actor,
        initiativeBase: initiativeBase,
        hindrance: hindrance,
        diceRoll: diceRoll,
        total: total,
        actions: actions,
        wounded: wounded
      });

      messages.push({
        speaker: ChatMessage.getSpeaker({ actor: actor, token: combatant.token, alias: combatant.name }),
        content: html,
        sound: CONFIG.sounds.dice
      });
    }

    if (!updates.length) return this;

    await this.updateEmbeddedDocuments('Combatant', updates);

    if (updateTurn && currentId) {
      await this.update({ turn: this.turns.findIndex(t => t.id === currentId) });
    }

    await ChatMessage.create(messages);
    return this;
  }
}
