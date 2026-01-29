export class RyfActiveEffect extends ActiveEffect {

  static async createFromSpell(actor, spell, effectData) {
    if (!actor || !spell || !effectData) {
      console.error('RyfActiveEffect.createFromSpell: Missing required parameters');
      return null;
    }

    const duration = effectData.duration?.total || 3;

    const attributeKey = this.getAttributeKey(
      effectData.effectType,
      effectData.targetType,
      effectData.targetName
    );

    const durationConfig = {
      turns: duration
    };

    if (game.combat && game.combat.started && game.combat.round >= 1) {
      durationConfig.startRound = game.combat.round;
      durationConfig.startTurn = game.combat.turn;
    }

    const effectConfig = {
      name: effectData.name || spell.name,
      icon: effectData.img || spell.img || 'icons/svg/aura.svg',
      origin: spell.uuid,
      disabled: false,
      transfer: false,

      duration: durationConfig,
      
      changes: [
        {
          key: attributeKey,
          mode: CONST.ACTIVE_EFFECT_MODES.ADD,
          value: String(effectData.modifier || 0),
          priority: 20
        }
      ],
      
      flags: {
        ryf3: {
          sourceType: effectData.sourceType || 'spell',
          sourceName: effectData.sourceName || spell.name,
          sourceId: effectData.sourceId || spell.id,
          appliedBy: effectData.appliedBy || game.user.name,
          appliedAt: Date.now(),
          effectType: effectData.effectType || 'skill-bonus',
          targetType: effectData.targetType || 'skill',
          targetName: effectData.targetName || ''
        }
      }
    };

    const created = await actor.createEmbeddedDocuments('ActiveEffect', [effectConfig]);
    
    if (created && created.length > 0) {
      ui.notifications.info(game.i18n.format('RYF.Notifications.EffectApplied', {
        effect: effectConfig.name,
        actor: actor.name
      }));
      return created[0];
    }
    
    return null;
  }

  static getAttributeKey(effectType, targetType, targetName) {
    switch (effectType) {
      case 'attribute-bonus':
        if (targetType === 'attribute' && targetName) {
          return `system.attributes.${targetName}.value`;
        }
        return 'system.attributes.fisico.value';

      case 'skill-bonus':
        if (targetType === 'skill' && targetName) {
          return `system.activeEffectBonuses.skills.${targetName}`;
        }
        return 'system.activeEffectBonuses.skills.unknown';

      case 'defense-bonus':
        return 'system.activeEffectBonuses.defense';

      case 'defense-melee-bonus':
        return 'system.activeEffectBonuses.defenseMelee';

      case 'defense-ranged-bonus':
        return 'system.activeEffectBonuses.defenseRanged';

      case 'attack-melee-bonus':
        return 'system.activeEffectBonuses.attackMelee';

      case 'attack-ranged-bonus':
        return 'system.activeEffectBonuses.attackRanged';

      case 'max-health-bonus':
        return 'system.activeEffectBonuses.maxHealth';

      case 'weapon-damage-bonus':
        if (targetType === 'weapon-damage' && targetName) {
          return `system.activeEffectBonuses.weaponsDamage.${targetName}`;
        }
        return 'system.activeEffectBonuses.weaponsDamage.unknown';

      case 'weapon-attack-bonus':
        if (targetType === 'weapon-attack' && targetName) {
          return `system.activeEffectBonuses.weaponsAttack.${targetName}`;
        }
        return 'system.activeEffectBonuses.weaponsAttack.unknown';

      case 'armor-bonus':
        return 'system.activeEffectBonuses.armor';

      case 'hindrance-reduction':
        return 'system.activeEffectBonuses.hindranceReduction';

      case 'initiative-bonus':
        return 'system.activeEffectBonuses.initiative';

      case 'absorption-bonus':
        return 'system.activeEffectBonuses.absorption';

      default:
        console.warn(`Unknown effect type: ${effectType}`);
        return 'system.activeEffectBonuses.defense';
    }
  }

  static getEffectsByType(actor, effectType) {
    if (!actor) return [];
    
    return actor.effects.filter(e => 
      !e.disabled && 
      e.flags?.ryf3?.effectType === effectType
    );
  }

  static getEffectsForTarget(actor, targetType, targetName) {
    if (!actor) return [];
    
    return actor.effects.filter(e => 
      !e.disabled &&
      e.flags?.ryf3?.targetType === targetType &&
      e.flags?.ryf3?.targetName?.toLowerCase() === targetName?.toLowerCase()
    );
  }

  static async removeAllEffects(actor) {
    if (!actor) return;

    const effectIds = actor.effects.map(e => e.id);
    if (effectIds.length > 0) {
      await actor.deleteEmbeddedDocuments('ActiveEffect', effectIds);
    }
  }

  static async removeEffectsBySource(actor, sourceId) {
    if (!actor || !sourceId) return;

    const effects = actor.effects.filter(e => 
      e.flags?.ryf3?.sourceId === sourceId
    );
    
    const ids = effects.map(e => e.id);
    if (ids.length > 0) {
      await actor.deleteEmbeddedDocuments('ActiveEffect', ids);
    }
  }

  static getTotalModifier(effects) {
    if (!effects || effects.length === 0) return 0;

    return effects.reduce((total, effect) => {
      const change = effect.changes?.[0];
      if (change) {
        return total + (parseInt(change.value) || 0);
      }
      return total;
    }, 0);
  }

  static async createFromItem(actor, item, effectData) {
    if (!actor || !item || !effectData) {
      console.error('RyfActiveEffect.createFromItem: Missing required parameters');
      return null;
    }

    const attributeKey = this.getAttributeKey(
      effectData.effectType,
      effectData.targetType,
      effectData.targetName
    );

    const effectConfig = {
      name: effectData.name || item.name,
      icon: effectData.img || item.img || 'icons/svg/item-bag.svg',
      origin: item.uuid,
      disabled: false,
      transfer: false,

      changes: [
        {
          key: attributeKey,
          mode: CONST.ACTIVE_EFFECT_MODES.ADD,
          value: String(effectData.modifier || 0),
          priority: 20
        }
      ],

      flags: {
        ryf3: {
          sourceType: 'item',
          sourceName: effectData.sourceName || item.name,
          sourceId: effectData.sourceId || item.id,
          appliedBy: effectData.appliedBy || game.user.name,
          appliedAt: Date.now(),
          effectType: effectData.effectType || 'skill-bonus',
          targetType: effectData.targetType || 'skill',
          targetName: effectData.targetName || ''
        }
      }
    };

    const created = await actor.createEmbeddedDocuments('ActiveEffect', [effectConfig]);

    if (created && created.length > 0) {
      ui.notifications.info(game.i18n.format('RYF.Notifications.EffectApplied', {
        effect: effectConfig.name,
        actor: actor.name
      }));
      return created[0];
    }

    return null;
  }
}

