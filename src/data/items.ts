export type ItemCategory = 'herb' | 'ore' | 'consumable';

export interface ItemDefinition {
  id: string;
  name: string;
  category: ItemCategory;
  description: string;
  sellPrice: number;
  color: number;
  healHp?: number;
  healMp?: number;
}

export const ITEM_DEFINITIONS: Record<string, ItemDefinition> = {
  // Herbs
  herb_small: {
    id: 'herb_small',
    name: '薬草（小）',
    category: 'herb',
    description: 'どこにでも生えている小ぶりな薬草。HPを30回復。',
    sellPrice: 10,
    color: 0x58d68d,
    healHp: 30
  },
  herb_antidote: {
    id: 'herb_antidote',
    name: '解毒草',
    category: 'herb',
    description: '毒素を中和する苦味のある草。HPを50回復。',
    sellPrice: 25,
    color: 0x27ae60,
    healHp: 50
  },
  herb_high: {
    id: 'herb_high',
    name: '上薬草',
    category: 'herb',
    description: '良質な薬効を持つ貴重な薬草。HPを100回復。',
    sellPrice: 60,
    color: 0x2ecc71,
    healHp: 100
  },
  herb_elixir: {
    id: 'herb_elixir',
    name: '万能薬の葉',
    category: 'herb',
    description: 'あらゆる傷を癒す奇跡の葉。HPを200回復、MPを50回復。',
    sellPrice: 150,
    color: 0x1abc9c,
    healHp: 200,
    healMp: 50
  },
  herb_world_tree: {
    id: 'herb_world_tree',
    name: '世界樹の葉',
    category: 'herb',
    description: '神話に謳われる霊木の葉。HP・MPを完全回復する。',
    sellPrice: 500,
    color: 0x16a085,
    healHp: 9999,
    healMp: 9999
  },

  // Ores
  ore_copper: {
    id: 'ore_copper',
    name: '銅鉱石',
    category: 'ore',
    description: '上層でよく採れる一般的な鉱石。武具の素材になる。',
    sellPrice: 15,
    color: 0xd35400
  },
  ore_iron: {
    id: 'ore_iron',
    name: '鉄鉱石',
    category: 'ore',
    description: '硬質で頑丈な鉄の鉱石。鍛冶需要が高い。',
    sellPrice: 35,
    color: 0x7f8c8d
  },
  ore_silver: {
    id: 'ore_silver',
    name: '銀鉱石',
    category: 'ore',
    description: '魔力を帯びた美しい銀の塊。高値で取引される。',
    sellPrice: 80,
    color: 0xbdc3c7
  },
  ore_gold: {
    id: 'ore_gold',
    name: '金鉱石',
    category: 'ore',
    description: 'まばゆく輝く金の鉱石。非常に価値が高い。',
    sellPrice: 180,
    color: 0xf1c40f
  },
  ore_mithril: {
    id: 'ore_mithril',
    name: 'ミスリル',
    category: 'ore',
    description: '軽さと鋼以上の強度を併せ持つ幻の霊銀。',
    sellPrice: 400,
    color: 0x85c1e9
  },
  ore_adamantite: {
    id: 'ore_adamantite',
    name: 'アダマンタイト',
    category: 'ore',
    description: '奈落の最深部で採れる究極の硬度を誇る神話の鉱石。',
    sellPrice: 1000,
    color: 0xbb8fce
  }
};
