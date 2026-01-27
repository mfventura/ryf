export const SPELL_EFFECT_TYPES = {
  'immediate-damage': {
    label: 'RYF.EffectTypes.ImmediateDamage',
    icon: 'fa-burst',
    fields: ['formula', 'damageType', 'requiresAttack', 'attackType', 'savingThrow']
  },
  'immediate-healing': {
    label: 'RYF.EffectTypes.ImmediateHealing',
    icon: 'fa-heart',
    fields: ['formula']
  },
  'buff': {
    label: 'RYF.EffectTypes.Buff',
    icon: 'fa-arrow-up',
    fields: ['target', 'targetName', 'modifier', 'duration']
  },
  'debuff': {
    label: 'RYF.EffectTypes.Debuff',
    icon: 'fa-arrow-down',
    fields: ['target', 'targetName', 'modifier', 'duration', 'savingThrow']
  },
  'condition': {
    label: 'RYF.EffectTypes.Condition',
    icon: 'fa-dizzy',
    fields: ['condition', 'duration', 'savingThrow']
  }
};

export const DAMAGE_TYPES = {
  'physical': 'RYF.DamageTypes.Physical',
  'fire': 'RYF.DamageTypes.Fire',
  'cold': 'RYF.DamageTypes.Cold',
  'lightning': 'RYF.DamageTypes.Lightning',
  'force': 'RYF.DamageTypes.Force',
  'necrotic': 'RYF.DamageTypes.Necrotic',
  'psychic': 'RYF.DamageTypes.Psychic'
};

export const EFFECT_TARGETS = {
  'attribute': 'RYF.EffectTargets.Attribute',
  'skill': 'RYF.EffectTargets.Skill',
  'weapon': 'RYF.EffectTargets.Weapon',
  'armor': 'RYF.EffectTargets.Armor',
  'defense': 'RYF.EffectTargets.Defense',
  'initiative': 'RYF.EffectTargets.Initiative',
  'absorption': 'RYF.EffectTargets.Absorption',
  'hindrance-reduction': 'RYF.EffectTargets.HindranceReduction'
};

export const CONDITIONS = {
  'paralyzed': 'RYF.Conditions.Paralyzed',
  'blinded': 'RYF.Conditions.Blinded',
  'stunned': 'RYF.Conditions.Stunned',
  'prone': 'RYF.Conditions.Prone',
  'frightened': 'RYF.Conditions.Frightened',
  'charmed': 'RYF.Conditions.Charmed'
};

export const DURATION_TYPES = {
  'fixed': 'RYF.DurationTypes.Fixed',
  'perLevel': 'RYF.DurationTypes.PerLevel',
  'concentration': 'RYF.DurationTypes.Concentration'
};

export const ATTACK_TYPES = {
  'melee': 'RYF.AttackTypes.Melee',
  'ranged': 'RYF.AttackTypes.Ranged'
};

export function createDefaultEffect(type) {
  const baseEffect = {
    id: foundry.utils.randomID(),
    type: type
  };

  switch (type) {
    case 'immediate-damage':
      return {
        ...baseEffect,
        formula: '1d6',
        damageType: 'physical',
        requiresAttack: false,
        attackType: 'melee',
        savingThrow: {
          enabled: false,
          attribute: 'destreza',
          difficulty: 15,
          halfDamageOnSave: false
        }
      };

    case 'immediate-healing':
      return {
        ...baseEffect,
        formula: '1d6'
      };

    case 'buff':
      return {
        ...baseEffect,
        target: 'skill',
        targetName: '',
        modifier: 1,
        duration: {
          type: 'fixed',
          value: 3
        }
      };

    case 'debuff':
      return {
        ...baseEffect,
        target: 'skill',
        targetName: '',
        modifier: -1,
        duration: {
          type: 'fixed',
          value: 3
        },
        savingThrow: {
          enabled: false,
          attribute: 'destreza',
          difficulty: 15
        }
      };

    case 'condition':
      return {
        ...baseEffect,
        condition: 'stunned',
        duration: {
          type: 'fixed',
          value: 1
        },
        savingThrow: {
          enabled: true,
          attribute: 'fisico',
          difficulty: 15
        }
      };

    default:
      return baseEffect;
  }
}

