export type EquipmentType = 'weapon' | 'armor';

export interface EquipmentDefinition {
  id: string;
  name: string;
  type: EquipmentType;
  description: string;
  price: number;
  bonusAttack?: number;
  bonusDefense?: number;
  bonusSpeed?: number;
}

export const EQUIPMENT_DEFINITIONS: Record<string, EquipmentDefinition> = {
  // Weapons
  wep_iron_sword: { id: 'wep_iron_sword', name: '鉄の剣', type: 'weapon', description: '一般的な鉄製の剣。', price: 300, bonusAttack: 15 },
  wep_steel_sword: { id: 'wep_steel_sword', name: '鋼の剣', type: 'weapon', description: '鋼を鍛え上げた鋭い剣。', price: 800, bonusAttack: 35 },
  wep_mithril_sword: { id: 'wep_mithril_sword', name: 'ミスリルソード', type: 'weapon', description: '魔法の金属で作られた名剣。', price: 2000, bonusAttack: 80 },
  wep_adamantite_sword: { id: 'wep_adamantite_sword', name: 'アダマンソード', type: 'weapon', description: '超硬金属で鍛えられた業物。', price: 5000, bonusAttack: 150 },
  wep_demon_slayer: { id: 'wep_demon_slayer', name: '魔剣デモンスレイヤー', type: 'weapon', description: '深淵の力に抗う究極の魔剣。', price: 15000, bonusAttack: 300 },
  
  // Armors
  arm_leather: { id: 'arm_leather', name: 'レザーアーマー', type: 'armor', description: '動物の革で作られた軽装鎧。', price: 250, bonusDefense: 10 },
  arm_iron: { id: 'arm_iron', name: 'アイアンアーマー', type: 'armor', description: '鉄板を繋ぎ合わせた重装備。', price: 700, bonusDefense: 30, bonusSpeed: -5 },
  arm_mithril: { id: 'arm_mithril', name: 'ミスリルメイル', type: 'armor', description: '軽くて極めて硬い魔法の鎧。', price: 1800, bonusDefense: 70, bonusSpeed: 10 },
  arm_adamantite: { id: 'arm_adamantite', name: 'アダマンアーマー', type: 'armor', description: '物理攻撃をほぼ無効化する超重装鎧。', price: 4500, bonusDefense: 130, bonusSpeed: -10 },
  arm_dragon_scale: { id: 'arm_dragon_scale', name: '竜神の鎧', type: 'armor', description: '伝説の竜の鱗から作られた最強の鎧。', price: 12000, bonusDefense: 250, bonusSpeed: 20 },
};
