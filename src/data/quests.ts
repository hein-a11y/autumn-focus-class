export type QuestRank = 'E' | 'D' | 'C' | 'B' | 'A';
export type QuestType = 'gather' | 'kill';

export interface QuestReward {
  gold: number;
  exp: number;
}

export interface QuestObjective {
  type: QuestType;
  targetId: string;
  targetName: string;
  requiredCount: number;
}

export interface QuestDefinition {
  id: string;
  title: string;
  rank: QuestRank;
  recommendedLevel: string;
  area: string;
  description: string;
  objective: QuestObjective;
  reward: QuestReward;
}

export const QUEST_DEFINITIONS: Record<string, QuestDefinition> = {
  quest_e1: {
    id: 'quest_e1',
    title: '駆け出し薬草摘み',
    rank: 'E',
    recommendedLevel: 'Lv 1-2',
    area: '始まりの森 (エリア1)',
    description: '村の薬師のために薬草（小）を5株集めて届ける。',
    objective: {
      type: 'gather',
      targetId: 'herb_small',
      targetName: '薬草（小）',
      requiredCount: 5
    },
    reward: {
      gold: 100,
      exp: 50
    }
  },
  quest_e2: {
    id: 'quest_e2',
    title: 'スライム駆除依頼',
    rank: 'E',
    recommendedLevel: 'Lv 1-2',
    area: '森の入り口 / ダンジョン上層',
    description: '村周辺で繁殖しているスライムを8体討伐する。',
    objective: {
      type: 'kill',
      targetId: 'slime',
      targetName: 'スライム',
      requiredCount: 8
    },
    reward: {
      gold: 100,
      exp: 50
    }
  },
  quest_d1: {
    id: 'quest_d1',
    title: '鍛冶屋の素材調達',
    rank: 'D',
    recommendedLevel: 'Lv 3-4',
    area: '最前線ダンジョン (B3-4)',
    description: '廃鉱山エリアから鉄鉱石を5個採掘して納品する。',
    objective: {
      type: 'gather',
      targetId: 'ore_iron',
      targetName: '鉄鉱石',
      requiredCount: 5
    },
    reward: {
      gold: 250,
      exp: 150
    }
  },
  quest_d2: {
    id: 'quest_d2',
    title: '廃鉱山の不穏な骸骨',
    rank: 'D',
    recommendedLevel: 'Lv 3-4',
    area: '最前線ダンジョン (B3-4)',
    description: '廃鉱山をうろつくスケルトンを6体掃討する。',
    objective: {
      type: 'kill',
      targetId: 'skeleton',
      targetName: 'スケルトン',
      requiredCount: 6
    },
    reward: {
      gold: 250,
      exp: 150
    }
  },
  quest_c1: {
    id: 'quest_c1',
    title: '高品質な傷薬のために',
    rank: 'C',
    recommendedLevel: 'Lv 5-6',
    area: '始まりの森 (エリア3 ささやきの森)',
    description: 'ささやきの森に自生する上薬草を8株採取する。',
    objective: {
      type: 'gather',
      targetId: 'herb_high',
      targetName: '上薬草',
      requiredCount: 8
    },
    reward: {
      gold: 500,
      exp: 350
    }
  },
  quest_c2: {
    id: 'quest_c2',
    title: '深層ゴーレム撃滅',
    rank: 'C',
    recommendedLevel: 'Lv 5-6',
    area: '最前線ダンジョン (B5-6 深層大洞窟)',
    description: 'ダンジョン深層を闊歩するストーンゴーレムを5体撃破する。',
    objective: {
      type: 'kill',
      targetId: 'stone_golem',
      targetName: 'ストーンゴーレム',
      requiredCount: 5
    },
    reward: {
      gold: 500,
      exp: 350
    }
  },
  quest_b1: {
    id: 'quest_b1',
    title: '輝く黄金の鉱脈',
    rank: 'B',
    recommendedLevel: 'Lv 7-8',
    area: '最前線ダンジョン (B7-8 溶岩洞)',
    description: '危険な溶岩洞から貴重な金鉱石を6個採掘する。',
    objective: {
      type: 'gather',
      targetId: 'ore_gold',
      targetName: '金鉱石',
      requiredCount: 6
    },
    reward: {
      gold: 1000,
      exp: 700
    }
  },
  quest_b2: {
    id: 'quest_b2',
    title: '漆黒の騎士を断て',
    rank: 'B',
    recommendedLevel: 'Lv 7-8',
    area: '最前線ダンジョン (B7-8)',
    description: '深層で目撃されたシャドウナイトを4体討伐する。',
    objective: {
      type: 'kill',
      targetId: 'shadow_knight',
      targetName: 'シャドウナイト',
      requiredCount: 4
    },
    reward: {
      gold: 1000,
      exp: 700
    }
  },
  quest_a1: {
    id: 'quest_a1',
    title: '霊峰の災厄キマイラ討伐',
    rank: 'A',
    recommendedLevel: 'Lv 9-10',
    area: '始まりの森 (エリア5 原初の霊峰)',
    description: '森の最深部に君臨する伝説の猛獣キマイラを討伐する。',
    objective: {
      type: 'kill',
      targetId: 'chimera',
      targetName: 'キマイラ',
      requiredCount: 1
    },
    reward: {
      gold: 2500,
      exp: 1500
    }
  },
  quest_a2: {
    id: 'quest_a2',
    title: '奈落の支配者討伐',
    rank: 'A',
    recommendedLevel: 'Lv 9-10',
    area: '最前線ダンジョン (B10 奈落のコア)',
    description: '最前線ダンジョン最奥部に眠る奈落のボスを討伐し、村に平和をもたらす。',
    objective: {
      type: 'kill',
      targetId: 'dungeon_boss',
      targetName: 'ダンジョンボス',
      requiredCount: 1
    },
    reward: {
      gold: 2500,
      exp: 1500
    }
  }
};
