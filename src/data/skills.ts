export interface SkillDef {
  name: string;
  costMp: number;
  cooldown: number; // ms
  description: string;
}

export const CLASS_SKILLS: Record<string, SkillDef> = {
  warrior: {
    name: 'Berserker',
    costMp: 15,
    cooldown: 15000,
    description: 'Boosts attack and defense for 8 seconds.'
  },
  mage: {
    name: 'Explosion',
    costMp: 25,
    cooldown: 8000,
    description: 'Creates an explosion in front, dealing massive area damage.'
  },
  thief: {
    name: 'Assassinate',
    costMp: 10,
    cooldown: 6000,
    description: 'Next attack deals 2x damage.'
  },
  paladin: {
    name: 'Heal',
    costMp: 20,
    cooldown: 12000,
    description: 'Heals self and allies.'
  }
};
