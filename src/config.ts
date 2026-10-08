import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene';
import { CharacterSelectScene } from './scenes/CharacterSelectScene';
import { VillageScene } from './scenes/VillageScene';
import { ForestScene } from './scenes/ForestScene';
import { DungeonScene } from './scenes/DungeonScene';
import { VolcanoScene } from './scenes/VolcanoScene';
import { HomeScene } from './scenes/HomeScene';
import { TavernScene } from './scenes/TavernScene';
import { IceCavernScene } from './scenes/IceCavernScene';
import { AbyssScene } from './scenes/AbyssScene';
import { SkyScene } from './scenes/SkyScene';

export const gameConfig: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'game-container',
  width: 800,
  height: 600,
  pixelArt: true,
  roundPixels: true,
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: 0 },
      debug: false // Turned off debug as standard
    }
  },
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  scene: [
    BootScene,
    CharacterSelectScene,
    VillageScene,
    HomeScene,
    TavernScene,
    ForestScene,
    DungeonScene,
    VolcanoScene,
    IceCavernScene,
    AbyssScene,
    SkyScene
  ]
};
