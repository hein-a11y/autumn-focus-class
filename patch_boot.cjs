const fs = require('fs');
let file = fs.readFileSync('src/scenes/BootScene.ts', 'utf8');

const target = `this.load.image('monster_volcano_dragon', 'assets/BOSS/reddragonfly.png');`;

const replace = target + `
    
    // Load Class Sprites
    this.load.image('char_warrior_male', 'assets/characters/warrior.png');
    this.load.image('char_warrior_female', 'assets/characters/warrior.png');
    this.load.image('char_mage_male', 'assets/characters/mage.png');
    this.load.image('char_mage_female', 'assets/characters/mage.png');
    this.load.image('char_thief_male', 'assets/characters/thief.png');
    this.load.image('char_thief_female', 'assets/characters/thief.png');
    this.load.image('char_paladin_male', 'assets/characters/paladin.png');
    this.load.image('char_paladin_female', 'assets/characters/paladin.png');
`;

file = file.replace(target, replace);
fs.writeFileSync('src/scenes/BootScene.ts', file);
