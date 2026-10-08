const fs = require('fs');
let file = fs.readFileSync('src/managers/GameState.ts', 'utf8');

// Add purchasedUpgrades to class GameState
file = file.replace(/public levelCap: number = 50;/g, "public levelCap: number = 50;\n  public purchasedUpgrades = { attack: 0, defense: 0, hp: 0 };");

// Save logic
file = file.replace(/unlockedSkyFloor: this\.unlockedSkyFloor,/g, "unlockedSkyFloor: this.unlockedSkyFloor,\n        purchasedUpgrades: this.purchasedUpgrades,");

// Load logic
file = file.replace(/this\.unlockedSkyFloor = data\.unlockedSkyFloor \|\| 1;/g, "this.unlockedSkyFloor = data.unlockedSkyFloor || 1;\n        this.purchasedUpgrades = data.purchasedUpgrades || { attack: 0, defense: 0, hp: 0 };");

// Recalculate base stats logic
const targetRecalc = `  public recalculatePlayerStats(): void {
    let bonusAttack = 0;
    let bonusDefense = 0;
    let bonusSpeed = 0;`;

const replaceRecalc = `  public recalculatePlayerStats(): void {
    let bonusAttack = this.purchasedUpgrades.attack * 5; // +5 per upgrade
    let bonusDefense = this.purchasedUpgrades.defense * 3; // +3 per upgrade
    let bonusHp = this.purchasedUpgrades.hp * 20; // +20 per upgrade
    let bonusSpeed = 0;`;

file = file.replace(targetRecalc, replaceRecalc);

const targetRecalcEnd = `    this.player.attack = this.player.baseAttack + bonusAttack;
    this.player.defense = this.player.baseDefense + bonusDefense;
    this.player.speed = this.player.baseSpeed + bonusSpeed;`;

const replaceRecalcEnd = `    this.player.attack = this.player.baseAttack + bonusAttack;
    this.player.defense = this.player.baseDefense + bonusDefense;
    this.player.speed = this.player.baseSpeed + bonusSpeed;
    this.player.maxHp = calculateStatsForLevel(this.player.classType, this.player.level).maxHp + bonusHp;
    if (this.player.hp > this.player.maxHp) this.player.hp = this.player.maxHp;`;

file = file.replace(targetRecalcEnd, replaceRecalcEnd);

fs.writeFileSync('src/managers/GameState.ts', file);
