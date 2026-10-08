export type ClassType = 'warrior' | 'mage' | 'thief' | 'paladin';
export type Gender = 'male' | 'female';

export interface ClassStats {
  maxHp: number;
  maxMp: number;
  attack: number;
  defense: number;
  speed: number; // movement speed in pixels/sec
  attackRange: number; // melee range or projectile range
  attackCooldown: number; // in milliseconds
  attackType: 'melee' | 'projectile' | 'multi_hit' | 'shield_bash';
}

export interface ClassDefinition {
  id: ClassType;
  name: string;
  englishName: string;
  combatType: string;
  weapon: string;
  description: string;
  baseStats: ClassStats;
  statGrowth: {
    hp: number;
    mp: number;
    attack: number;
    defense: number;
    speed: number;
  };
}

export const CLASS_DEFINITIONS: Record<ClassType, ClassDefinition> = {
  warrior: {
    id: 'warrior',
    name: '戦士',
    englishName: 'Warrior',
    combatType: '近接バランス',
    weapon: '片手剣',
    description: 'HPが高くバランスの取れた初心者向けアタッカー。安定した近接攻撃を繰り出す。',
    baseStats: {
      maxHp: 120,
      maxMp: 30,
      attack: 18,
      defense: 12,
      speed: 130,
      attackRange: 42,
      attackCooldown: 400,
      attackType: 'melee'
    },
    statGrowth: {
      hp: 20,
      mp: 5,
      attack: 4,
      defense: 3,
      speed: 3
    }
  },
  mage: {
    id: 'mage',
    name: '魔法使い',
    englishName: 'Mage',
    combatType: '遠距離範囲',
    weapon: '杖',
    description: 'HPは低いが、敵を貫通・爆発する強力な長距離魔法弾を放つ。',
    baseStats: {
      maxHp: 75,
      maxMp: 100,
      attack: 26,
      defense: 6,
      speed: 115,
      attackRange: 180,
      attackCooldown: 600,
      attackType: 'projectile'
    },
    statGrowth: {
      hp: 10,
      mp: 18,
      attack: 6,
      defense: 2,
      speed: 2
    }
  },
  thief: {
    id: 'thief',
    name: '盗賊',
    englishName: 'Thief',
    combatType: '高速クリティカル',
    weapon: '双剣',
    description: '移動・攻撃速度が非常に高く、素早い双剣の連撃で敵を圧倒する。',
    baseStats: {
      maxHp: 90,
      maxMp: 45,
      attack: 15,
      defense: 8,
      speed: 165,
      attackRange: 36,
      attackCooldown: 220,
      attackType: 'multi_hit'
    },
    statGrowth: {
      hp: 13,
      mp: 7,
      attack: 3,
      defense: 2,
      speed: 5
    }
  },
  paladin: {
    id: 'paladin',
    name: 'パラディン',
    englishName: 'Paladin',
    combatType: 'タンク / 耐久',
    weapon: '剣と盾',
    description: '圧倒的なHPと防御力を誇り、周囲の味方の被ダメージを軽減する聖騎士。',
    baseStats: {
      maxHp: 155,
      maxMp: 50,
      attack: 14,
      defense: 18,
      speed: 105,
      attackRange: 38,
      attackCooldown: 480,
      attackType: 'shield_bash'
    },
    statGrowth: {
      hp: 25,
      mp: 8,
      attack: 3,
      defense: 5,
      speed: 2
    }
  }
};

/**
 * Calculates stats for a given class at a specified level (1-10)
 */
export function calculateStatsForLevel(classType: ClassType, level: number): ClassStats {
  const def = CLASS_DEFINITIONS[classType];
  const levelOffset = Math.max(0, level - 1);

  return {
    maxHp: def.baseStats.maxHp + def.statGrowth.hp * levelOffset,
    maxMp: def.baseStats.maxMp + def.statGrowth.mp * levelOffset,
    attack: def.baseStats.attack + def.statGrowth.attack * levelOffset,
    defense: def.baseStats.defense + def.statGrowth.defense * levelOffset,
    speed: def.baseStats.speed + def.statGrowth.speed * levelOffset,
    attackRange: def.baseStats.attackRange,
    attackCooldown: def.baseStats.attackCooldown,
    attackType: def.baseStats.attackType
  };
}

/**
 * EXP needed to reach the next level
 */
export const EXP_TABLE: number[] = [
  0,     // Lv 1
  100,   // Lv 2
  250,   // Lv 3
  500,   // Lv 4
  900,   // Lv 5
  1500,  // Lv 6
  2400,  // Lv 7
  3600,  // Lv 8
  5200,  // Lv 9
  7500   // Lv 10
];

// Generate EXP for levels 11 to 50
for (let i = 10; i <= 50; i++) {
  const prev = EXP_TABLE[i - 1];
  const diff = Math.floor((prev - EXP_TABLE[i - 2]) * 1.15); // Increase diff by 15% each level
  EXP_TABLE.push(prev + diff);
}
