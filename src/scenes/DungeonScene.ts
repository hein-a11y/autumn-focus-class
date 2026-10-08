import Phaser from 'phaser';
import { Player } from '../entities/Player';
import { Companion } from '../entities/Companion';
import { Monster } from '../entities/Monster';
import { GameState } from '../managers/GameState';
import { QuestManager } from '../managers/QuestManager';
import { MONSTER_DEFINITIONS, MonsterDefinition } from '../data/monsters';
import { ITEM_DEFINITIONS } from '../data/items';

interface OreNode {
  sprite: Phaser.GameObjects.Sprite;
  itemId: string;
  itemName: string;
  isMined: boolean;
}

export class DungeonScene extends Phaser.Scene {
  private player!: Player;
  private companions: Companion[] = [];
  private monsters: Monster[] = [];
  private oreNodes: OreNode[] = [];
  private currentFloor: number = 1;

  private gameState: GameState;
  private questManager: QuestManager;

  private hudText!: Phaser.GameObjects.Text;
  private floorText!: Phaser.GameObjects.Text;
  private promptText!: Phaser.GameObjects.Text;

  private projectiles!: Phaser.Physics.Arcade.Group;

  constructor() {
    super({ key: 'DungeonScene' });
    this.gameState = GameState.getInstance();
    this.questManager = QuestManager.getInstance();
  }

  public create(): void {
    const width = 1000;
    const height = 800;

    this.currentFloor = Math.min(this.gameState.unlockedDungeonFloor, 1);

    this.projectiles = this.physics.add.group();

    this.player = new Player(this, 100, height / 2);

    this.createDungeonMap(width, height);
    this.spawnCompanions();

    this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
    this.cameras.main.setBounds(0, 0, width, height);
    this.physics.world.setBounds(0, 0, width, height);

    this.setupCombatEvents();
    this.createHUD();

    this.spawnFloorContents();

    this.input.keyboard?.on('keydown-E', () => {
      this.checkMining();
    });
  }

  public update(time: number): void {
    this.player.update(time);

    for (const comp of this.companions) {
      comp.update(time, this.monsters, this.oreNodes);
    }

    for (let i = this.monsters.length - 1; i >= 0; i--) {
      const monster = this.monsters[i];
      if (!monster.isAlive()) {
        this.monsters.splice(i, 1);
        continue;
      }

      let target: { x: number; y: number; takeDamage: (d: number) => void } = this.player;
      let minDist = Phaser.Math.Distance.Between(monster.x, monster.y, this.player.x, this.player.y);

      for (const comp of this.companions) {
        if (comp.companionData.hp > 0) {
          const d = Phaser.Math.Distance.Between(monster.x, monster.y, comp.x, comp.y);
          if (d < minDist) {
            minDist = d;
            target = comp;
          }
        }
      }

      monster.update(time, target);
    }

    this.updateHUD();
    this.checkMiningPrompt();
  }

  private createDungeonMap(width: number, height: number): void {
    // Floor tiles
    for (let x = 0; x < width; x += 16) {
      for (let y = 0; y < height; y += 16) {
        this.add.image(x + 8, y + 8, 'tile_dungeon_floor').setDepth(0);
      }
    }

    // Border walls
    for (let x = 0; x < width; x += 16) {
      this.add.image(x + 8, 8, 'tile_dungeon_wall').setDepth(1);
      this.add.image(x + 8, height - 8, 'tile_dungeon_wall').setDepth(1);
    }

    // Portal back to Village (West)
    const returnPortal = this.add.rectangle(30, height / 2, 40, 80, 0x37474f, 0.8)
      .setStrokeStyle(2, 0xb0bec5).setDepth(2);
    this.physics.add.existing(returnPortal, true);

    this.add.text(30, height / 2, '◀ 村へ\n脱出', {
      fontSize: '11px',
      color: '#ffffff',
      align: 'center',
      fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(3);

    this.physics.add.overlap(this.player, returnPortal, () => {
      this.scene.start('VillageScene');
    });

    // Stairs down to Next Floor (East)
    const stairsDown = this.add.rectangle(width - 30, height / 2, 40, 80, 0x4527a0, 0.8)
      .setStrokeStyle(2, 0xd1c4e9).setDepth(2);
    this.physics.add.existing(stairsDown, true);

    this.add.text(width - 30, height / 2, '深層階\n階段 ▼', {
      fontSize: '11px',
      color: '#ffffff',
      align: 'center',
      fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(3);

    this.physics.add.overlap(this.player, stairsDown, () => {
      if (this.currentFloor < 10) {
        this.currentFloor++;
        if (this.currentFloor > this.gameState.unlockedDungeonFloor) {
          this.gameState.unlockedDungeonFloor = this.currentFloor;
        }
        this.player.setPosition(100, height / 2);
        this.spawnFloorContents();
      } else {
        // Abyss completed
        this.showFloatingMessage(this.player.x, this.player.y - 20, '★ 最深部を踏破！ ★', '#ffcc00');
        this.currentFloor = 1;
        this.player.setPosition(100, height / 2);
        this.spawnFloorContents();
      }
    });

    // Elevator shortcut station (North center) - unlocked at floor 3, 6, 9
    const elevator = this.add.rectangle(500, 30, 90, 40, 0x795548, 0.9)
      .setStrokeStyle(2, 0xd7ccc8).setDepth(2);
    this.physics.add.existing(elevator, true);

    this.add.text(500, 30, '昇降機 (3F/6F/9F)', {
      fontSize: '10px',
      color: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(3);

    this.physics.add.overlap(this.player, elevator, () => {
      if (this.gameState.unlockedDungeonFloor >= 9) {
        this.currentFloor = 9;
      } else if (this.gameState.unlockedDungeonFloor >= 6) {
        this.currentFloor = 6;
      } else if (this.gameState.unlockedDungeonFloor >= 3) {
        this.currentFloor = 3;
      } else {
        this.showFloatingMessage(500, 60, '昇降機は3F到達後に利用可能です');
        return;
      }
      this.player.setPosition(100, height / 2);
      this.spawnFloorContents();
    });
  }

  private spawnCompanions(): void {
    this.companions.forEach(c => c.destroy());
    this.companions = [];
    const offsets = [
      { x: -28, y: 0 },
      { x: 28, y: 0 },
      { x: 0, y: -28 },
      { x: 0, y: 28 },
      { x: -28, y: -28 },
      { x: 28, y: -28 }
    ];
    this.gameState.recruitedCompanions.forEach((data, index) => {
      const off = offsets[index % offsets.length];
      const comp = new Companion(this, this.player.x + off.x, this.player.y + off.y, data, this.player);
      this.companions.push(comp);
    });
  }

  private spawnFloorContents(): void {
    this.monsters.forEach(m => m.destroy());
    this.monsters = [];
    this.oreNodes.forEach(n => n.sprite.destroy());
    this.oreNodes = [];

    let monsterTypes: string[] = [];
    let oreType = 'ore_copper';
    let themeName = '';

    if (this.currentFloor <= 2) {
      themeName = '上層洞窟 (B1-B2)';
      monsterTypes = ['bat', 'green_slime'];
      oreType = 'ore_copper';
    } else if (this.currentFloor <= 4) {
      themeName = '廃鉱山 (B3-B4)';
      monsterTypes = ['skeleton', 'cave_spider'];
      oreType = 'ore_iron';
    } else if (this.currentFloor === 5) {
      themeName = 'クモの巣 (B5 BOSS)';
      monsterTypes = ['giant_spider'];
      oreType = 'ore_silver';
    } else if (this.currentFloor === 6) {
      themeName = '深層大洞窟 (B6)';
      monsterTypes = ['stone_golem', 'dark_bat'];
      oreType = 'ore_silver';
    } else if (this.currentFloor <= 8) {
      themeName = '溶岩洞 (B7-B8)';
      monsterTypes = ['fire_elemental', 'hellhound'];
      oreType = 'ore_gold';
    } else if (this.currentFloor === 9) {
      themeName = '奈落の深部 (B9)';
      monsterTypes = ['shadow_knight', 'hellhound'];
      oreType = 'ore_mithril';
    } else {
      themeName = '奈落のコア (B10 BOSS)';
      monsterTypes = ['demon_lord'];
      oreType = 'ore_adamantite';
    }

    if (this.floorText) {
      this.floorText.setText(`【ダンジョン】 B${this.currentFloor}F: ${themeName}`);
    }

    // Spawn Ore Nodes
    const oreCount = (this.currentFloor === 5 || this.currentFloor === 10) ? 2 : 6;
    for (let i = 0; i < oreCount; i++) {
      const ox = Phaser.Math.Between(180, 850);
      const oy = Phaser.Math.Between(100, 700);
      const sprite = this.add.sprite(ox, oy, `node_${oreType}`).setScale(1.5).setDepth(4);
      const itemDef = ITEM_DEFINITIONS[oreType];
      this.oreNodes.push({
        sprite,
        itemId: oreType,
        itemName: itemDef ? itemDef.name : '鉱石',
        isMined: false
      });
    }

    // Spawn Monsters
    const monsterCount = (this.currentFloor === 5 || this.currentFloor === 10) ? 1 : 8;
    for (let i = 0; i < monsterCount; i++) {
      const type = monsterTypes[i % monsterTypes.length];
      const mDef = MONSTER_DEFINITIONS[type];
      if (mDef) {
        const mx = Phaser.Math.Between(260, 900);
        const my = Phaser.Math.Between(120, 680);
        const monster = new Monster(this, mx, my, mDef);
        this.monsters.push(monster);
      }
    }
  }

  private setupCombatEvents(): void {
    // Player melee
    this.events.on('player-melee-attack', (data: { x: number; y: number; damage: number; range: number }) => {
      const slash = this.add.sprite(data.x, data.y, 'effect_slash').setScale(1.5).setDepth(20);
      this.tweens.add({
        targets: slash,
        alpha: 0,
        scale: 2.2,
        duration: 180,
        onComplete: () => slash.destroy()
      });

      for (const m of this.monsters) {
        if (m.isAlive() && Phaser.Math.Distance.Between(data.x, data.y, m.x, m.y) <= data.range) {
          const angle = Phaser.Math.Angle.Between(this.player.x, this.player.y, m.x, m.y);
          m.takeDamage(data.damage, angle);
        }
      }
    });

    // Player magic
    this.events.on('player-fire-projectile', (data: { x: number; y: number; facing: string; damage: number }) => {
      const orb = this.physics.add.sprite(data.x, data.y, 'effect_magic_orb').setDepth(20);
      const speed = 280;
      let vx = 0;
      let vy = 0;
      if (data.facing === 'left') vx = -speed;
      else if (data.facing === 'right') vx = speed;
      else if (data.facing === 'up') vy = -speed;
      else if (data.facing === 'down') vy = speed;

      orb.setVelocity(vx, vy);

      this.physics.add.overlap(orb, this.monsters, (o, m) => {
        const monster = m as Monster;
        if (monster.isAlive()) {
          monster.takeDamage(data.damage);
          orb.destroy();
        }
      });

      this.time.delayedCall(1200, () => {
        if (orb.active) orb.destroy();
      });
    });

    // Companion melee
    this.events.on('companion-melee-attack', (data: { x: number; y: number; damage: number; target: Monster }) => {
      if (data.target && data.target.isAlive()) {
        const angle = Phaser.Math.Angle.Between(this.player.x, this.player.y, data.target.x, data.target.y);
        data.target.takeDamage(data.damage, angle);
      }
    });

    // Companion magic
    this.events.on('companion-fire-projectile', (data: { x: number; y: number; targetX: number; targetY: number; damage: number }) => {
      const orb = this.physics.add.sprite(data.x, data.y, 'effect_magic_orb').setDepth(20);
      const angle = Phaser.Math.Angle.Between(data.x, data.y, data.targetX, data.targetY);
      const speed = 260;
      orb.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed);

      this.physics.add.overlap(orb, this.monsters, (o, m) => {
        const monster = m as Monster;
        if (monster.isAlive()) {
          monster.takeDamage(data.damage);
          orb.destroy();
        }
      });

      this.time.delayedCall(1000, () => {
        if (orb.active) orb.destroy();
      });
    });

    // Monster killed
    this.events.on('monster-killed', (data: { def: MonsterDefinition; x: number; y: number }) => {
      this.gameState.addGold(data.def.gold);
      const leveledUp = this.gameState.addExp(data.def.exp);

      this.questManager.recordKill(data.def.id);

      if (data.def.dropItemId && Math.random() <= data.def.dropRate) {
        this.gameState.addItem(data.def.dropItemId, 1);
        this.questManager.recordGather(data.def.dropItemId, 1);
        this.showFloatingMessage(data.x, data.y - 10, `+1 ${ITEM_DEFINITIONS[data.def.dropItemId]?.name || '素材'}`);
      }

      if (leveledUp) {
        this.showFloatingMessage(this.player.x, this.player.y - 30, '★ レベルアップ！ ★', '#ffff00');
      }

      if (data.def.id === 'giant_spider') {
        this.showFloatingMessage(this.player.x, this.player.y - 50, '★ ダンジョンボス討伐達成！ ★', '#00ffcc');
      }
    });

    // Companion gather
    this.events.on('companion-gather', (data: { companion: Companion; node: any }) => {
      const node = data.node;
      if (!node.isMined) {
        node.isMined = true;
        node.sprite.setAlpha(0.25);
        this.gameState.addItem(node.itemId, 1);
        this.questManager.recordGather(node.itemId, 1);
        this.showFloatingMessage(data.companion.x, data.companion.y - 10, `+1 ${node.itemName}`);
      }
    });

    // Player died
    this.events.on('player-died', () => {
      this.showFloatingMessage(this.player.x, this.player.y, 'ダンジョンで力尽きた... 村へ送還', '#ff4444');
      this.time.delayedCall(1500, () => {
        this.gameState.healAll();
        this.scene.start('VillageScene');
      });
    });
  }

  private checkMiningPrompt(): void {
    const px = this.player.x;
    const py = this.player.y;
    let nearbyNode: OreNode | null = null;

    for (const node of this.oreNodes) {
      if (!node.isMined && Phaser.Math.Distance.Between(px, py, node.sprite.x, node.sprite.y) < 36) {
        nearbyNode = node;
        break;
      }
    }

    if (nearbyNode) {
      this.promptText.setText(`[E] ${nearbyNode.itemName} を採掘する`);
      this.promptText.setPosition(nearbyNode.sprite.x, nearbyNode.sprite.y - 20);
      this.promptText.setVisible(true);
    } else {
      this.promptText.setVisible(false);
    }
  }

  private checkMining(): void {
    const px = this.player.x;
    const py = this.player.y;

    for (const node of this.oreNodes) {
      if (!node.isMined && Phaser.Math.Distance.Between(px, py, node.sprite.x, node.sprite.y) < 36) {
        node.isMined = true;
        node.sprite.setAlpha(0.25);
        this.gameState.addItem(node.itemId, 1);
        this.questManager.recordGather(node.itemId, 1);
        this.showFloatingMessage(node.sprite.x, node.sprite.y - 15, `+1 ${node.itemName}`, '#f1c40f');
        break;
      }
    }
  }

  private showFloatingMessage(x: number, y: number, text: string, color: string = '#ffffff'): void {
    const txt = this.add.text(x, y, text, {
      fontSize: '13px',
      color,
      stroke: '#000000',
      strokeThickness: 3,
      fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(150);

    this.tweens.add({
      targets: txt,
      y: y - 28,
      alpha: 0,
      duration: 1000,
      onComplete: () => txt.destroy()
    });
  }

  private createHUD(): void {
    this.add.rectangle(12, 12, 280, 80, 0x111625, 0.85)
      .setOrigin(0, 0).setScrollFactor(0).setStrokeStyle(1, 0x3d4461).setDepth(100);

    this.hudText = this.add.text(20, 18, '', {
      fontSize: '12px',
      color: '#ffffff',
      fontFamily: 'monospace',
      lineSpacing: 3
    }).setScrollFactor(0).setDepth(101);

    this.floorText = this.add.text(400, 24, '', {
      fontSize: '14px',
      color: '#ffd54f',
      backgroundColor: '#000000aa',
      padding: { x: 8, y: 4 },
      fontStyle: 'bold'
    }).setOrigin(0.5).setScrollFactor(0).setDepth(100);

    this.promptText = this.add.text(0, 0, '', {
      fontSize: '12px',
      color: '#ffff00',
      backgroundColor: '#000000cc',
      padding: { x: 6, y: 3 },
      fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(90).setVisible(false);
  }

  private updateHUD(): void {
    const p = this.gameState.player;
    this.hudText.setText(
      `Lv.${p.level} ${p.name} | HP: ${p.hp}/${p.maxHp} | MP: ${p.mp}/${p.maxMp}\n` +
      `EXP: ${p.exp}/${p.maxExp} | 所持金: ${p.gold} G\n` +
      `所持鉱石数: ${this.gameState.getItemCount('ore_copper') + this.gameState.getItemCount('ore_iron') + this.gameState.getItemCount('ore_silver')}個\n` +
      `操作: [SPACE/J] 攻撃 | [F] スキル | [E] 採掘`
    );
  }
}
