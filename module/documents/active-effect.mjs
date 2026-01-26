export class RyfActiveEffect {
  
  static async create(actor, effectData) {
    if (!actor || !effectData) {
      console.error('RyfActiveEffect.create: Missing actor or effectData');
      return null;
    }

    const itemData = {
      name: effectData.name || game.i18n.localize('RYF.ActiveEffect'),
      type: 'active-effect',
      img: effectData.img || 'icons/svg/aura.svg',
      system: {
        sourceType: effectData.sourceType || 'spell',
        sourceName: effectData.sourceName || '',
        sourceId: effectData.sourceId || '',
        effectType: effectData.effectType || 'skill-bonus',
        targetType: effectData.targetType || 'skill',
        targetName: effectData.targetName || '',
        modifier: effectData.modifier || 0,
        duration: {
          remaining: effectData.duration?.remaining || 3,
          total: effectData.duration?.total || 3
        },
        appliedAt: Date.now(),
        appliedBy: effectData.appliedBy || game.user.name
      }
    };

    const createdItems = await actor.createEmbeddedDocuments('Item', [itemData]);
    
    if (createdItems && createdItems.length > 0) {
      ui.notifications.info(game.i18n.format('RYF.Notifications.EffectApplied', {
        effect: itemData.name,
        actor: actor.name
      }));
      return createdItems[0];
    }
    
    return null;
  }

  static async decrementDuration(effect) {
    if (!effect || effect.type !== 'active-effect') {
      return false;
    }

    const remaining = effect.system.duration.remaining - 1;
    
    if (remaining <= 0) {
      await this.remove(effect);
      return true;
    }

    await effect.update({
      'system.duration.remaining': remaining
    });

    return false;
  }

  static isExpired(effect) {
    if (!effect || effect.type !== 'active-effect') {
      return false;
    }
    return effect.system.duration.remaining <= 0;
  }

  static async remove(effect) {
    if (!effect || effect.type !== 'active-effect') {
      return false;
    }

    const actor = effect.actor;
    
    ui.notifications.info(game.i18n.format('RYF.Notifications.EffectExpired', {
      effect: effect.name,
      actor: actor.name
    }));

    await effect.delete();
    return true;
  }

  static getModifier(effect) {
    if (!effect || effect.type !== 'active-effect') {
      return 0;
    }
    return effect.system.modifier || 0;
  }

  static getEffectsByType(actor, effectType) {
    if (!actor) return [];
    
    return actor.items.filter(i => 
      i.type === 'active-effect' && 
      i.system.effectType === effectType
    );
  }

  static getEffectsForTarget(actor, targetType, targetName) {
    if (!actor) return [];
    
    return actor.items.filter(i => 
      i.type === 'active-effect' && 
      i.system.targetType === targetType &&
      i.system.targetName.toLowerCase() === targetName.toLowerCase()
    );
  }

  static async decrementAllEffects(actor) {
    if (!actor) return;

    const activeEffects = actor.items.filter(i => i.type === 'active-effect');
    
    for (const effect of activeEffects) {
      await this.decrementDuration(effect);
    }
  }

  static getTotalModifier(effects) {
    if (!effects || effects.length === 0) return 0;
    
    return effects.reduce((total, effect) => {
      return total + (effect.system.modifier || 0);
    }, 0);
  }

  static async removeAllEffects(actor) {
    if (!actor) return;

    const activeEffects = actor.items.filter(i => i.type === 'active-effect');
    
    const ids = activeEffects.map(e => e.id);
    if (ids.length > 0) {
      await actor.deleteEmbeddedDocuments('Item', ids);
    }
  }

  static async removeEffectsBySource(actor, sourceId) {
    if (!actor || !sourceId) return;

    const effects = actor.items.filter(i => 
      i.type === 'active-effect' && 
      i.system.sourceId === sourceId
    );
    
    const ids = effects.map(e => e.id);
    if (ids.length > 0) {
      await actor.deleteEmbeddedDocuments('Item', ids);
    }
  }
}

