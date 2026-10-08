import { EQUIPMENT_DEFINITIONS } from "../data/equipment";
import { ClassType, Gender, calculateStatsForLevel, EXP_TABLE } from '../data/classes';

export interface CompanionData {
  id: string;
  name: string;
  gender: Gender;
  classType: ClassType;
  level: number;
  hp: number;
  maxHp: number;
  mp: number;
  maxMp: number;
  attack: number;
  defense: number;
  speed: number;
}

export interface PlayerData {
  name: string;
  gender: Gender;
  classType: ClassType;
  level: number;
  exp: number;
  maxExp: number;
  hp: number;
  maxHp: number;
  mp: number;
  maxMp: number;
  attack: number;
  defense: number;
  speed: number;
  baseAttack: number;
  baseDefense: number;
  baseSpeed: number;
  gold: number;
  equippedWeapon: string | null;
  equippedArmor: string | null;
}

export interface ActiveQuestProgress {
  questId: string;
  currentCount: number;
}

export class GameState {
  private static instance: GameState;

  public player: PlayerData;
  public inventory: Record<string, number> = {};
  public recruitedCompanions: CompanionData[] = [];
  public activeQuests: ActiveQuestProgress[] = [];
  public completedQuests: string[] = [];

  public unlockedForestArea: number = 1;
  public unlockedDungeonFloor: number = 1;
  public unlockedVolcanoFloor: number = 1;
  public unlockedIceFloor: number = 1;
  public unlockedAbyssFloor: number = 1;
  public unlockedSkyFloor: number = 1;
  public levelCap: number = 50;

  public onStateChanged?: () => void;

  private constructor() {
    this.player = this.createDefaultPlayer();
  }

  public static getInstance(): GameState {
    if (!GameState.instance) {
      GameState.instance = new GameState();
    }
    return GameState.instance;
  }

  private createDefaultPlayer(): PlayerData {
    const defaultClass: ClassType = 'warrior';
    const stats = calculateStatsForLevel(defaultClass, 1);
    return {
      name: '開拓者',
      gender: 'male',
      classType: defaultClass,
      level: 1,
      exp: 0,
      maxExp: EXP_TABLE[1],
      hp: stats.maxHp,
      maxHp: stats.maxHp,
      mp: stats.maxMp,
      maxMp: stats.maxMp,
      attack: stats.attack,
      defense: stats.defense,
      speed: stats.speed,
      baseAttack: stats.attack,
      baseDefense: stats.defense,
      baseSpeed: stats.speed,
      gold: 150,
      equippedWeapon: null,
      equippedArmor: null
    };
  }

  public initCharacter(gender: Gender, classType: ClassType, name?: string): void {
    const stats = calculateStatsForLevel(classType, 1);
    this.player = {
      name: name || (gender === 'male' ? 'レオン' : 'エレナ'),
      gender,
      classType,
      level: 1,
      exp: 0,
      maxExp: EXP_TABLE[1],
      hp: stats.maxHp,
      maxHp: stats.maxHp,
      mp: stats.maxMp,
      maxMp: stats.maxMp,
      attack: stats.attack,
      defense: stats.defense,
      speed: stats.speed,
      baseAttack: stats.attack,
      baseDefense: stats.defense,
      baseSpeed: stats.speed,
      gold: 200,
      equippedWeapon: null,
      equippedArmor: null
    };
    this.inventory = {
      herb_small: 3
    };
    this.recruitedCompanions = [];
    this.activeQuests = [];
    this.completedQuests = [];
    this.unlockedForestArea = 1;
    this.unlockedDungeonFloor = 1;
    this.notifyChange();
  }

  public addExp(amount: number): boolean {
    this.player.exp += amount;
    let leveledUp = false;

    while (this.player.level < this.levelCap) {
      const neededExp = EXP_TABLE[this.player.level];
      if (this.player.exp >= neededExp) {
        this.player.level++;
        this.player.maxExp = this.player.level < this.levelCap ? EXP_TABLE[this.player.level] : neededExp;
        const newStats = calculateStatsForLevel(this.player.classType, this.player.level);
        this.player.maxHp = newStats.maxHp;
        this.player.maxMp = newStats.maxMp;
        this.player.baseAttack = newStats.attack;
        this.player.baseDefense = newStats.defense;
        this.player.baseSpeed = newStats.speed;
        this.recalculatePlayerStats();
        this.player.hp = newStats.maxHp;
        this.player.mp = newStats.maxMp;
        leveledUp = true;

        // Also level up companions with player
        for (const companion of this.recruitedCompanions) {
          companion.level = this.player.level;
          const cStats = calculateStatsForLevel(companion.classType, companion.level);
          companion.maxHp = cStats.maxHp;
          companion.maxMp = cStats.maxMp;
          companion.attack = cStats.attack;
          companion.defense = cStats.defense;
          companion.speed = cStats.speed;
          companion.hp = cStats.maxHp;
          companion.mp = cStats.maxMp;
        }
      } else {
        break;
      }
    }

    this.notifyChange();
    return leveledUp;
  }

  public addGold(amount: number): void {
    this.player.gold += amount;
    this.notifyChange();
  }

  public spendGold(amount: number): boolean {
    if (this.player.gold >= amount) {
      this.player.gold -= amount;
      this.notifyChange();
      return true;
    }
    return false;
  }

  public addItem(itemId: string, count: number = 1): void {
    this.inventory[itemId] = (this.inventory[itemId] || 0) + count;
    this.notifyChange();
  }

  public removeItem(itemId: string, count: number = 1): boolean {
    const current = this.inventory[itemId] || 0;
    if (current >= count) {
      this.inventory[itemId] -= count;
      if (this.inventory[itemId] <= 0) {
        delete this.inventory[itemId];
      }
      this.notifyChange();
      return true;
    }
    return false;
  }

  public getItemCount(itemId: string): number {
    return this.inventory[itemId] || 0;
  }

  public healAll(): void {
    this.player.hp = this.player.maxHp;
    this.player.mp = this.player.maxMp;
    for (const companion of this.recruitedCompanions) {
      companion.hp = companion.maxHp;
      companion.mp = companion.maxMp;
    }
    this.notifyChange();
  }

  public recruitCompanion(name: string, gender: Gender, classType: ClassType): boolean {
    if (this.recruitedCompanions.length >= 5) {
      return false; // Max 5 bots
    }
    const stats = calculateStatsForLevel(classType, this.player.level);
    this.recruitedCompanions.push({
      id: `bot_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name,
      gender,
      classType,
      level: this.player.level,
      hp: stats.maxHp,
      maxHp: stats.maxHp,
      mp: stats.maxMp,
      maxMp: stats.maxMp,
      attack: stats.attack,
      defense: stats.defense,
      speed: stats.speed
    });
    this.notifyChange();
    return true;
  }

  public dismissCompanion(index: number): boolean {
    if (index >= 0 && index < this.recruitedCompanions.length) {
      this.recruitedCompanions.splice(index, 1);
      this.notifyChange();
      return true;
    }
    return false;
  }

  public saveToStorage(): void {
    try {
      const data = {
        player: this.player,
        inventory: this.inventory,
        recruitedCompanions: this.recruitedCompanions,
        activeQuests: this.activeQuests,
        completedQuests: this.completedQuests,
        unlockedForestArea: this.unlockedForestArea,
        unlockedDungeonFloor: this.unlockedDungeonFloor,
        unlockedVolcanoFloor: this.unlockedVolcanoFloor,
        unlockedIceFloor: this.unlockedIceFloor,
        unlockedAbyssFloor: this.unlockedAbyssFloor,
        unlockedSkyFloor: this.unlockedSkyFloor,
        levelCap: this.levelCap
      };
      localStorage.setItem('frontline_save_data', JSON.stringify(data));
    } catch (e) {
      console.warn('Failed to save to localStorage', e);
    }
  }

  public hasSaveData(): boolean {
    return !!localStorage.getItem('frontline_save_data');
  }

  public loadFromStorage(): boolean {
    try {
      const raw = localStorage.getItem('frontline_save_data');
      if (!raw) return false;
      const data = JSON.parse(raw);
      if (data && data.player) {
        this.player = data.player;
        this.inventory = data.inventory || {};
        this.recruitedCompanions = data.recruitedCompanions || [];
        this.activeQuests = data.activeQuests || [];
        this.completedQuests = data.completedQuests || [];
        this.unlockedForestArea = data.unlockedForestArea || 1;
        this.unlockedDungeonFloor = data.unlockedDungeonFloor || 1;
        this.unlockedVolcanoFloor = data.unlockedVolcanoFloor || 1;
        this.unlockedIceFloor = data.unlockedIceFloor || 1;
        this.unlockedAbyssFloor = data.unlockedAbyssFloor || 1;
        this.unlockedSkyFloor = data.unlockedSkyFloor || 1;
        this.levelCap = data.levelCap || 50;
        
        // Backwards compatibility for old saves
        if (this.player.baseAttack === undefined) {
          this.player.baseAttack = this.player.attack;
          this.player.baseDefense = this.player.defense;
          this.player.baseSpeed = this.player.speed;
          this.player.equippedWeapon = null;
          this.player.equippedArmor = null;
        }
        
        this.recalculatePlayerStats();
        this.notifyChange();
        return true;
      }
    } catch (e) {
      console.warn('Failed to load from localStorage', e);
    }
    return false;
  }

  
  public recalculatePlayerStats(): void {
    let bonusAttack = 0;
    let bonusDefense = 0;
    let bonusSpeed = 0;

    if (this.player.equippedWeapon) {
      const wep = EQUIPMENT_DEFINITIONS[this.player.equippedWeapon];
      if (wep) {
        bonusAttack += wep.bonusAttack || 0;
        bonusDefense += wep.bonusDefense || 0;
        bonusSpeed += wep.bonusSpeed || 0;
      }
    }
    if (this.player.equippedArmor) {
      const arm = EQUIPMENT_DEFINITIONS[this.player.equippedArmor];
      if (arm) {
        bonusAttack += arm.bonusAttack || 0;
        bonusDefense += arm.bonusDefense || 0;
        bonusSpeed += arm.bonusSpeed || 0;
      }
    }

    this.player.attack = this.player.baseAttack + bonusAttack;
    this.player.defense = this.player.baseDefense + bonusDefense;
    this.player.speed = this.player.baseSpeed + bonusSpeed;
  }

  public equipItem(itemId: string): void {
    const def = EQUIPMENT_DEFINITIONS[itemId];
    if (!def) return;
    
    // Unequip current
    if (def.type === 'weapon' && this.player.equippedWeapon) {
      this.addItem(this.player.equippedWeapon, 1);
    }
    if (def.type === 'armor' && this.player.equippedArmor) {
      this.addItem(this.player.equippedArmor, 1);
    }

    // Equip new
    this.removeItem(itemId, 1);
    if (def.type === 'weapon') this.player.equippedWeapon = itemId;
    if (def.type === 'armor') this.player.equippedArmor = itemId;

    this.recalculatePlayerStats();
    this.notifyChange();
  }

  public unequipItem(type: 'weapon' | 'armor'): void {
    if (type === 'weapon' && this.player.equippedWeapon) {
      this.addItem(this.player.equippedWeapon, 1);
      this.player.equippedWeapon = null;
    }
    if (type === 'armor' && this.player.equippedArmor) {
      this.addItem(this.player.equippedArmor, 1);
      this.player.equippedArmor = null;
    }
    this.recalculatePlayerStats();
    this.notifyChange();
  }

  private notifyChange(): void {
    if (this.onStateChanged) {
      this.onStateChanged();
    }
  }
}
