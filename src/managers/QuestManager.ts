import { QUEST_DEFINITIONS, QuestDefinition } from '../data/quests';
import { GameState } from './GameState';

export class QuestManager {
  private static instance: QuestManager;
  private gameState: GameState;

  private constructor() {
    this.gameState = GameState.getInstance();
  }

  public static getInstance(): QuestManager {
    if (!QuestManager.instance) {
      QuestManager.instance = new QuestManager();
    }
    return QuestManager.instance;
  }

  public getAvailableQuests(): QuestDefinition[] {
    const list: QuestDefinition[] = [];
    for (const id in QUEST_DEFINITIONS) {
      const q = QUEST_DEFINITIONS[id];
      const isCompleted = this.gameState.completedQuests.includes(id);
      const isActive = this.gameState.activeQuests.some(aq => aq.questId === id);
      if (!isCompleted && !isActive) {
        list.push(q);
      }
    }
    return list;
  }

  public acceptQuest(questId: string): boolean {
    const quest = QUEST_DEFINITIONS[questId];
    if (!quest) return false;

    // Check if already active or completed
    if (this.isQuestActive(questId) || this.isQuestCompleted(questId)) {
      return false;
    }

    let initialCount = 0;
    // If it's a gather quest, check if player already has some in inventory
    if (quest.objective.type === 'gather') {
      initialCount = this.gameState.getItemCount(quest.objective.targetId);
    }

    this.gameState.activeQuests.push({
      questId,
      currentCount: Math.min(initialCount, quest.objective.requiredCount)
    });

    return true;
  }

  public recordKill(monsterId: string): void {
    for (const aq of this.gameState.activeQuests) {
      const quest = QUEST_DEFINITIONS[aq.questId];
      if (quest && quest.objective.type === 'kill') {
        if (quest.objective.targetId === monsterId || 
           (quest.objective.targetId === 'slime' && (monsterId === 'slime' || monsterId === 'green_slime'))) {
          if (aq.currentCount < quest.objective.requiredCount) {
            aq.currentCount++;
          }
        }
      }
    }
  }

  public recordGather(itemId: string, count: number = 1): void {
    for (const aq of this.gameState.activeQuests) {
      const quest = QUEST_DEFINITIONS[aq.questId];
      if (quest && quest.objective.type === 'gather' && quest.objective.targetId === itemId) {
        const total = this.gameState.getItemCount(itemId);
        aq.currentCount = Math.min(total, quest.objective.requiredCount);
      }
    }
  }

  public isQuestActive(questId: string): boolean {
    return this.gameState.activeQuests.some(aq => aq.questId === questId);
  }

  public isQuestCompleted(questId: string): boolean {
    return this.gameState.completedQuests.includes(questId);
  }

  public canTurnIn(questId: string): boolean {
    const quest = QUEST_DEFINITIONS[questId];
    if (!quest) return false;

    const aq = this.gameState.activeQuests.find(q => q.questId === questId);
    if (!aq) return false;

    if (quest.objective.type === 'gather') {
      return this.gameState.getItemCount(quest.objective.targetId) >= quest.objective.requiredCount;
    } else {
      return aq.currentCount >= quest.objective.requiredCount;
    }
  }

  public turnInQuest(questId: string): { success: boolean; gold: number; exp: number; leveledUp: boolean } {
    const quest = QUEST_DEFINITIONS[questId];
    if (!quest || !this.canTurnIn(questId)) {
      return { success: false, gold: 0, exp: 0, leveledUp: false };
    }

    // Deduct items if gather quest
    if (quest.objective.type === 'gather') {
      this.gameState.removeItem(quest.objective.targetId, quest.objective.requiredCount);
    }

    // Remove from active
    this.gameState.activeQuests = this.gameState.activeQuests.filter(q => q.questId !== questId);
    // Add to completed
    this.gameState.completedQuests.push(questId);

    // Give rewards
    this.gameState.addGold(quest.reward.gold);
    const leveledUp = this.gameState.addExp(quest.reward.exp);

    // Unlock next areas if certain quests completed
    if (quest.rank === 'E' && this.gameState.unlockedForestArea < 2) {
      this.gameState.unlockedForestArea = 2;
      this.gameState.unlockedDungeonFloor = 3;
    } else if (quest.rank === 'D' && this.gameState.unlockedForestArea < 3) {
      this.gameState.unlockedForestArea = 3;
      this.gameState.unlockedDungeonFloor = 5;
    } else if (quest.rank === 'C' && this.gameState.unlockedForestArea < 4) {
      this.gameState.unlockedForestArea = 4;
      this.gameState.unlockedDungeonFloor = 7;
    } else if (quest.rank === 'B' && this.gameState.unlockedForestArea < 5) {
      this.gameState.unlockedForestArea = 5;
      this.gameState.unlockedDungeonFloor = 9;
    } else if (quest.rank === 'A') {
      this.gameState.unlockedDungeonFloor = 10;
    }

    return {
      success: true,
      gold: quest.reward.gold,
      exp: quest.reward.exp,
      leveledUp
    };
  }

  public getQuestProgress(questId: string): { current: number; required: number; isReady: boolean } {
    const quest = QUEST_DEFINITIONS[questId];
    if (!quest) return { current: 0, required: 0, isReady: false };

    const aq = this.gameState.activeQuests.find(q => q.questId === questId);
    if (!aq) return { current: 0, required: quest.objective.requiredCount, isReady: false };

    let current = aq.currentCount;
    if (quest.objective.type === 'gather') {
      current = this.gameState.getItemCount(quest.objective.targetId);
    }

    return {
      current,
      required: quest.objective.requiredCount,
      isReady: current >= quest.objective.requiredCount
    };
  }
}
