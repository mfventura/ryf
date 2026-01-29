export const SPELL_EFFECT_TYPES = {
  'immediate-damage': {
    label: 'RYF.Magic.EffectTypes.ImmediateDamage',
    icon: 'fa-burst',
    fields: ['formula', 'damageType', 'requiresAttack', 'attackType', 'savingThrow']
  },
  'immediate-healing': {
    label: 'RYF.Magic.EffectTypes.ImmediateHealing',
    icon: 'fa-heart',
    fields: ['formula']
  },
  'buff': {
    label: 'RYF.Magic.EffectTypes.Buff',
    icon: 'fa-arrow-up',
    fields: ['target', 'targetName', 'modifier', 'duration']
  },
  'debuff': {
    label: 'RYF.Magic.EffectTypes.Debuff',
    icon: 'fa-arrow-down',
    fields: ['target', 'targetName', 'modifier', 'duration', 'savingThrow']
  },
  'condition': {
    label: 'RYF.Magic.EffectTypes.Condition',
    icon: 'fa-dizzy',
    fields: ['condition', 'duration', 'savingThrow']
  }
};

export const DAMAGE_TYPES = {
  'physical': 'RYF.Magic.DamageTypes.Physical',
  'fire': 'RYF.Magic.DamageTypes.Fire',
  'cold': 'RYF.Magic.DamageTypes.Cold',
  'lightning': 'RYF.Magic.DamageTypes.Lightning',
  'force': 'RYF.Magic.DamageTypes.Force',
  'necrotic': 'RYF.Magic.DamageTypes.Necrotic',
  'psychic': 'RYF.Magic.DamageTypes.Psychic'
};

export const EFFECT_TARGETS = {
  'attribute': 'RYF.Magic.EffectTargets.Attribute',
  'skill': 'RYF.Magic.EffectTargets.Skill',
  'weapon-damage': 'RYF.Magic.EffectTargets.WeaponDamage',
  'weapon-attack': 'RYF.Magic.EffectTargets.WeaponAttack',
  'armor': 'RYF.Magic.EffectTargets.Armor',
  'defense': 'RYF.Magic.EffectTargets.Defense',
  'defense-melee': 'RYF.Magic.EffectTargets.DefenseMelee',
  'defense-ranged': 'RYF.Magic.EffectTargets.DefenseRanged',
  'attack-melee': 'RYF.Magic.EffectTargets.AttackMelee',
  'attack-ranged': 'RYF.Magic.EffectTargets.AttackRanged',
  'max-health': 'RYF.Magic.EffectTargets.MaxHealth',
  'initiative': 'RYF.Magic.EffectTargets.Initiative',
  'absorption': 'RYF.Magic.EffectTargets.Absorption',
  'hindrance-reduction': 'RYF.Magic.EffectTargets.HindranceReduction'
};

export const CONDITIONS = {
  'paralyzed': 'RYF.Magic.Conditions.Paralyzed',
  'blinded': 'RYF.Magic.Conditions.Blinded',
  'stunned': 'RYF.Magic.Conditions.Stunned',
  'prone': 'RYF.Magic.Conditions.Prone',
  'frightened': 'RYF.Magic.Conditions.Frightened',
  'charmed': 'RYF.Magic.Conditions.Charmed'
};

export const DURATION_TYPES = {
  'fixed': 'RYF.Magic.DurationTypes.Fixed',
  'perLevel': 'RYF.Magic.DurationTypes.PerLevel'
};

export const ATTACK_TYPES = {
  'melee': 'RYF.Magic.AttackTypes.Melee',
  'ranged': 'RYF.Magic.AttackTypes.Ranged'
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

