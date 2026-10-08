import Phaser from 'phaser';
import { Player } from '../entities/Player';
import { Companion } from '../entities/Companion';
import { Monster } from '../entities/Monster';
import { GameState } from '../managers/GameState';
import { QuestManager } from '../managers/QuestManager';
import { MONSTER_DEFINITIONS, MonsterDefinition } from '../data/monsters';
import { ITEM_DEFINITIONS } from '../data/items';

interface ResourceNode {
  sprite: Phaser.GameObjects.Sprite;
  itemId: string;
  itemName: string;
  isHarvested: boolean;
}

export class ForestScene extends Phaser.Scene {
  private player!: Player;
  private companions: Companion[] = [];
  private monsters: Monster[] = [];
  private resourceNodes: ResourceNode[] = [];
  private currentArea: number = 1;

  private gameState: GameState;
  private questManager: QuestManager;

  private hudText!: Phaser.GameObjects.Text;
  private areaText!: Phaser.GameObjects.Text;
  private promptText!: Phaser.GameObjects.Text;

  private projectiles!: Phaser.Physics.Arcade.Group;

  constructor() {
    super({ key: 'ForestScene' });
    this.gameState = GameState.getInstance();
    this.questManager = QuestManager.getInstance();
  }

  public create(): void {
    const width = 1000;
    const height = 800;

    this.currentArea = this.gameState.unlockedForestArea;

    // Projectile physics group
    this.projectiles = this.physics.add.group();

    // Spawn Player
    this.player = new Player(this, 100, height / 2);

    // Create Forest Environment
    this.createForestMap(width, height);

    // Spawn Companions
    this.spawnCompanions();

    // Camera follow
    this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
    this.cameras.main.setBounds(0, 0, width, height);
    this.physics.world.setBounds(0, 0, width, height);

    // Setup Combat Event Listeners
    this.setupCombatEvents();

    // Create HUD
    this.createHUD();

    // Spawn Monsters & Resource Nodes for current area
    this.spawnAreaContents();

    // Key input for harvesting
    this.input.keyboard?.on('keydown-E', () => {
      this.checkHarvest();
    });
  }

  public update(time: number): void {
    this.player.update(time);

    // Update companions with nearby monsters
    for (const comp of this.companions) {
      comp.update(time, this.monsters, this.resourceNodes);
    }

    // Update monsters with closest target (player or companion)
    for (let i = this.monsters.length - 1; i >= 0; i--) {
      const monster = this.monsters[i];
      if (!monster.isAlive()) {
        this.monsters.splice(i, 1);
        continue;
      }

      // Pick target
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
    this.checkHarvestPrompt();
  }

  private createForestMap(width: number, height: number): void {
    // Fill with grass tiles
    for (let x = 0; x < width; x += 16) {
      for (let y = 0; y < height; y += 16) {
        this.add.image(x + 8, y + 8, 'tile_grass').setDepth(0);
      }
    }

    // Dirt trail winding through forest
    for (let x = 0; x < width; x += 16) {
      const yOffset = Math.sin(x * 0.01) * 60 + height / 2;
      this.add.image(x + 8, yOffset, 'tile_dirt').setDepth(1);
      this.add.image(x + 8, yOffset + 16, 'tile_dirt').setDepth(1);
    }

    // Return to Village portal on West
    const returnPortal = this.add.rectangle(30, height / 2, 40, 80, 0x1565c0, 0.7)
      .setStrokeStyle(2, 0x90caf9).setDepth(2);
    this.physics.add.existing(returnPortal, true);

    this.add.text(30, height / 2, '◀ 村へ\n帰還', {
      fontSize: '11px',
      color: '#ffffff',
      align: 'center',
      fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(3);

    this.physics.add.overlap(this.player, returnPortal, () => {
      this.scene.start('VillageScene');
    });

    // Area Selector Teleporters on East
    const nextPortal = this.add.rectangle(width - 30, height / 2, 40, 80, 0x2e7d32, 0.7)
      .setStrokeStyle(2, 0xa5d6a7).setDepth(2);
    this.physics.add.existing(nextPortal, true);

    this.add.text(width - 30, height / 2, '次エリア\n進む ▶', {
      fontSize: '11px',
      color: '#ffffff',
      align: 'center',
      fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(3);

    this.physics.add.overlap(this.player, nextPortal, () => {
      if (this.currentArea < 5) {
        this.currentArea++;
        if (this.currentArea > this.gameState.unlockedForestArea) {
          this.gameState.unlockedForestArea = this.currentArea;
        }
        this.player.setPosition(100, height / 2);
        this.spawnAreaContents();
      } else {
        // Return to area 1
        this.currentArea = 1;
        this.player.setPosition(100, height / 2);
        this.spawnAreaContents();
      }
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

  private spawnAreaContents(): void {
    // Clear old monsters & nodes
    this.monsters.forEach(m => m.destroy());
    this.monsters = [];
    this.resourceNodes.forEach(n => n.sprite.destroy());
    this.resourceNodes = [];

    // Area configuration from Game Design Doc
    let monsterTypes: string[] = [];
    let herbType = 'herb_small';
    let areaName = '';

    switch (this.currentArea) {
      case 1:
        areaName = 'エリア1: 森の入り口';
        monsterTypes = ['slime', 'horned_rabbit'];
        herbType = 'herb_small';
        break;
      case 2:
        areaName = 'エリア2: 霧の茂み';
        monsterTypes = ['wild_boar', 'giant_bee'];
        herbType = 'herb_antidote';
        break;
      case 3:
        areaName = 'エリア3: ささやきの森';
        monsterTypes = ['goblin', 'deer_battle'];
        herbType = 'herb_high';
        break;
      case 4:
        areaName = 'エリア4: 影の樹海';
        monsterTypes = ['treant', 'poison_gladius'];
        herbType = 'herb_elixir';
        break;
      case 5:
        areaName = 'エリア5: 原初の霊峰 (BOSS)';
        monsterTypes = ['forest_golem', 'king_slime'];
        herbType = 'herb_world_tree';
        break;
    }

    if (this.areaText) {
      this.areaText.setText(`【始まりの森】 ${areaName}`);
    }

    // Spawn 6-8 resource nodes
    const nodeCount = 7;
    for (let i = 0; i < nodeCount; i++) {
      const rx = Phaser.Math.Between(180, 850);
      const ry = Phaser.Math.Between(100, 700);
      const sprite = this.add.sprite(rx, ry, `node_${herbType}`).setScale(1.4).setDepth(4);
      const itemDef = ITEM_DEFINITIONS[herbType];
      this.resourceNodes.push({
        sprite,
        itemId: herbType,
        itemName: itemDef ? itemDef.name : '薬草',
        isHarvested: false
      });
    }

    // Spawn 8-10 monsters
    const monsterCount = this.currentArea === 5 ? 5 : 8;
    for (let i = 0; i < monsterCount; i++) {
      const type = monsterTypes[i % monsterTypes.length];
      const mDef = MONSTER_DEFINITIONS[type];
      if (mDef) {
        const mx = Phaser.Math.Between(250, 900);
        const my = Phaser.Math.Between(120, 680);
        const monster = new Monster(this, mx, my, mDef);
        this.monsters.push(monster);
      }
    }
  }

  private setupCombatEvents(): void {
    // Player melee attack
    this.events.on('player-melee-attack', (data: { x: number; y: number; damage: number; range: number }) => {
      // Visual slash
      const slash = this.add.sprite(data.x, data.y, 'effect_slash').setScale(1.5).setDepth(20);
      this.tweens.add({
        targets: slash,
        alpha: 0,
        scale: 2.2,
        duration: 180,
        onComplete: () => slash.destroy()
      });

      // Hit check monsters within range
      for (const m of this.monsters) {
        if (m.isAlive() && Phaser.Math.Distance.Between(data.x, data.y, m.x, m.y) <= data.range) {
          const angle = Phaser.Math.Angle.Between(this.player.x, this.player.y, m.x, m.y);
          m.takeDamage(data.damage, angle);
        }
      }
    });

    // Player magic projectile
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

      // Overlap with monsters
      const collider = this.physics.add.overlap(orb, this.monsters, (o, m) => {
        const monster = m as Monster;
        if (monster.isAlive()) {
          monster.takeDamage(data.damage);
          orb.destroy();
        }
      });

      // Auto-destroy after 1.2s
      this.time.delayedCall(1200, () => {
        if (orb.active) orb.destroy();
      });
    });

    // Companion melee attack
    this.events.on('companion-melee-attack', (data: { x: number; y: number; damage: number; target: Monster }) => {
      if (data.target && data.target.isAlive()) {
        const angle = Phaser.Math.Angle.Between(this.player.x, this.player.y, data.target.x, data.target.y);
        data.target.takeDamage(data.damage, angle);
      }
    });

    // Companion magic projectile
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

    // Monster killed event
    this.events.on('monster-killed', (data: { def: MonsterDefinition; x: number; y: number }) => {
      // Rewards
      this.gameState.addGold(data.def.gold);
      const leveledUp = this.gameState.addExp(data.def.exp);

      // Quest kill tracking
      this.questManager.recordKill(data.def.id);

      // Drop item check
      if (data.def.dropItemId && Math.random() <= data.def.dropRate) {
        this.gameState.addItem(data.def.dropItemId, 1);
        this.questManager.recordGather(data.def.dropItemId, 1);
        this.showFloatingMessage(data.x, data.y - 10, `+1 ${ITEM_DEFINITIONS[data.def.dropItemId]?.name || '素材'}`);
      }

      if (leveledUp) {
        this.showFloatingMessage(this.player.x, this.player.y - 30, '★ レベルアップ！ ★', '#ffff00');
      }
    });

    // Companion gather
    this.events.on('companion-gather', (data: { companion: Companion; node: any }) => {
      const node = data.node;
      if (!node.isHarvested) {
        node.isHarvested = true;
        node.sprite.setAlpha(0.25);
        this.gameState.addItem(node.itemId, 1);
        this.questManager.recordGather(node.itemId, 1);
        this.showFloatingMessage(data.companion.x, data.companion.y - 10, `+1 ${node.itemName}`);
      }
    });

    // Player died event
    this.events.on('player-died', () => {
      this.showFloatingMessage(this.player.x, this.player.y, '力尽きた... 村へ戻ります', '#ff4444');
      this.time.delayedCall(1500, () => {
        this.gameState.healAll();
        this.scene.start('VillageScene');
      });
    });
  }

  private checkHarvestPrompt(): void {
    const px = this.player.x;
    const py = this.player.y;
    let nearbyNode: ResourceNode | null = null;

    for (const node of this.resourceNodes) {
      if (!node.isHarvested && Phaser.Math.Distance.Between(px, py, node.sprite.x, node.sprite.y) < 36) {
        nearbyNode = node;
        break;
      }
    }

    if (nearbyNode) {
      this.promptText.setText(`[E] ${nearbyNode.itemName} を採取する`);
      this.promptText.setPosition(nearbyNode.sprite.x, nearbyNode.sprite.y - 20);
      this.promptText.setVisible(true);
    } else {
      this.promptText.setVisible(false);
    }
  }

  private checkHarvest(): void {
    const px = this.player.x;
    const py = this.player.y;

    for (const node of this.resourceNodes) {
      if (!node.isHarvested && Phaser.Math.Distance.Between(px, py, node.sprite.x, node.sprite.y) < 36) {
        node.isHarvested = true;
        node.sprite.setAlpha(0.25);
        this.gameState.addItem(node.itemId, 1);
        this.questManager.recordGather(node.itemId, 1);
        this.showFloatingMessage(node.sprite.x, node.sprite.y - 15, `+1 ${node.itemName}`, '#81c784');
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
    // Player HUD
    this.add.rectangle(12, 12, 280, 80, 0x111625, 0.85)
      .setOrigin(0, 0).setScrollFactor(0).setStrokeStyle(1, 0x3d4461).setDepth(100);

    this.hudText = this.add.text(20, 18, '', {
      fontSize: '12px',
      color: '#ffffff',
      fontFamily: 'monospace',
      lineSpacing: 3
    }).setScrollFactor(0).setDepth(101);

    // Area Title HUD
    this.areaText = this.add.text(400, 24, '', {
      fontSize: '14px',
      color: '#81c784',
      backgroundColor: '#000000aa',
      padding: { x: 8, y: 4 },
      fontStyle: 'bold'
    }).setOrigin(0.5).setScrollFactor(0).setDepth(100);

    // Harvest prompt
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
      `所持薬草数: ${this.gameState.getItemCount('herb_small') + this.gameState.getItemCount('herb_antidote') + this.gameState.getItemCount('herb_high')}株\n` +
      `操作: [左クリック] 攻撃 | [E] 採取`
    );
  }
}
