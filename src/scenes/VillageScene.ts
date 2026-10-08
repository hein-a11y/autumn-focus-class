import { EQUIPMENT_DEFINITIONS } from "../data/equipment";
import Phaser from 'phaser';
import { Player } from '../entities/Player';
import { Companion } from '../entities/Companion';
import { GameState } from '../managers/GameState';
import { QuestManager } from '../managers/QuestManager';
import { QUEST_DEFINITIONS } from '../data/quests';
import { ClassType, Gender } from '../data/classes';

export class VillageScene extends Phaser.Scene {
  private player!: Player;
  private companions: Companion[] = [];
  private gameState: GameState;
  private questManager: QuestManager;

  private hudText!: Phaser.GameObjects.Text;
  private questHudText!: Phaser.GameObjects.Text;
  private activeModal: Phaser.GameObjects.Container | null = null;
  private interactPromptText!: Phaser.GameObjects.Text;
  private shopNpc!: Phaser.GameObjects.Rectangle;
  private equipShopNpc!: Phaser.GameObjects.Rectangle;

  constructor() {
    super({ key: 'VillageScene' });
    this.gameState = GameState.getInstance();
    this.questManager = QuestManager.getInstance();
  }

  public create(): void {
    this.gameState.saveToStorage();
    const width = 800;
    const height = 600;

    // Spawn Player in central village square first so physics overlaps can reference it
    this.player = new Player(this, 400, 320);

    // Create Village Tilemap / Grounds
    this.createVillageLayout();

    // Spawn recruited companions
    this.spawnCompanions();

    // Camera follow player
    this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
    this.cameras.main.setBounds(0, 0, width, height);
    this.physics.world.setBounds(0, 0, width, height);

    // Create HUD
    this.createHUD();

    // Setup input listeners for modal close / interact
    this.input.keyboard?.on('keydown-E', () => {
      if (this.activeModal) {
        this.closeModal();
      } else {
        this.checkInteractions();
      }
    });

    this.input.keyboard?.on('keydown-ESC', () => {
      if (this.activeModal) {
        this.closeModal();
      }
    });
  }

  public update(time: number): void {
    if (this.activeModal) {
      this.player.setVelocity(0, 0);
      return;
    }

    this.player.update(time);

    // Update companions to follow player
    for (const companion of this.companions) {
      companion.update(time, []); // No enemies in village safe zone
    }

    this.updateHUD();
    this.checkNearbyInteractables();
  }

  private createVillageLayout(): void {
    // Fill background with grass
    for (let x = 0; x < 800; x += 16) {
      for (let y = 0; y < 600; y += 16) {
        this.add.image(x + 8, y + 8, 'tile_grass').setDepth(0);
      }
    }

    // Dirt paths connecting Home (North), Tavern (South), Forest (West), Dungeon (East)
    // Central path
    for (let x = 60; x < 740; x += 16) {
      this.add.image(x + 8, 320, 'tile_path').setDepth(1);
      this.add.image(x + 8, 336, 'tile_path').setDepth(1);
    }
    // North-South path
    for (let y = 80; y < 540; y += 16) {
      this.add.image(400, y + 8, 'tile_path').setDepth(1);
      this.add.image(416, y + 8, 'tile_path').setDepth(1);
    }

    // --- Home (North) ---
    const homeHouse = this.add.image(408, 120, 'home_building')
      .setScale(0.15).setDepth(2);
    this.physics.add.existing(homeHouse, true);
    (homeHouse.body as Phaser.Physics.Arcade.StaticBody).setSize(150, 150);
    
    // Make house a portal instead of a solid wall
    this.physics.add.overlap(this.player, homeHouse, () => {
      this.scene.start('HomeScene');
    });

    this.add.text(408, 30, '【主人公の自宅】\n(入る)', {
      fontSize: '12px',
      color: '#ffeb3b',
      align: 'center',
      fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(3);

    // --- Tavern (South) ---
    const tavern = this.add.image(408, 490, 'tavern_building')
      .setScale(0.15).setDepth(2);
    this.physics.add.existing(tavern, true);
    (tavern.body as Phaser.Physics.Arcade.StaticBody).setSize(150, 150);
    this.physics.add.overlap(this.player, tavern, () => {
      this.scene.start('TavernScene');
    });

    this.add.text(408, 390, '【冒険者ギルド/酒場】\n(入る)', {
      fontSize: '12px',
      color: '#ffcc00',
      align: 'center',
      fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(3);

    // --- Forest Entrance (West) ---
    const forestPortal = this.add.image(50, 328, 'forest_portal')
      .setScale(0.12).setDepth(2);
    this.physics.add.existing(forestPortal, true);
    (forestPortal.body as Phaser.Physics.Arcade.StaticBody).setSize(120, 120);
    this.add.text(50, 250, '始まりの森\n◀ 出発', {
      fontSize: '12px',
      color: '#ffffff',
      align: 'center',
      fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(3);

    // --- Dungeon Entrance (East) ---
    const dungeonPortal = this.add.image(750, 328, 'dungeon_portal')
      .setScale(0.12).setDepth(2);
    this.physics.add.existing(dungeonPortal, true);
    (dungeonPortal.body as Phaser.Physics.Arcade.StaticBody).setSize(120, 120);
    this.add.text(750, 250, '最前線\nダンジョン\n出発 ▶', {
      fontSize: '11px',
      color: '#ffffff',
      align: 'center',
      fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(3);

    // Entrance collision triggers
    this.physics.add.overlap(this.player, forestPortal, () => {
      this.scene.start('ForestScene');
    });

    this.physics.add.overlap(this.player, dungeonPortal, () => { this.scene.start('DungeonScene'); });

    // --- Volcano Entrance (South-East) ---
    const volcanoPortal = this.add.image(750, 480, 'dungeon_portal').setScale(0.12).setTint(0xff5555).setDepth(2);
    this.physics.add.existing(volcanoPortal, true);
    (volcanoPortal.body as Phaser.Physics.Arcade.StaticBody).setSize(120, 120);
    this.add.text(750, 430, '溶岩洞窟\n(Lv11~) ▶', {
      fontSize: '11px',
      color: '#ff6666',
      align: 'center',
      fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(3);
    
    this.physics.add.overlap(this.player, volcanoPortal, () => {
      this.scene.start('VolcanoScene');
    });

    // --- Ice Cavern Entrance (North-East) ---
    const icePortal = this.add.image(750, 150, 'dungeon_portal').setScale(0.12).setTint(0x88ccff).setDepth(2);
    this.physics.add.existing(icePortal, true);
    (icePortal.body as Phaser.Physics.Arcade.StaticBody).setSize(120, 120);
    this.add.text(750, 100, '氷結洞窟\n(Lv16~) ▶', {
      fontSize: '11px',
      color: '#88ccff',
      align: 'center',
      fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(3);
    
    this.physics.add.overlap(this.player, icePortal, () => {
      this.scene.start('IceCavernScene');
    });

    // --- Abyss Entrance (Far North-East) ---
    const abyssPortal = this.add.image(750, 40, 'dungeon_portal').setScale(0.12).setTint(0xa020f0).setDepth(2);
    this.physics.add.existing(abyssPortal, true);
    (abyssPortal.body as Phaser.Physics.Arcade.StaticBody).setSize(120, 120);
    this.add.text(750, 80, '深淵への扉\n(Lv22~) ▶', {
      fontSize: '11px',
      color: '#d2b4de',
      align: 'center',
      fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(3);
    
    this.physics.add.overlap(this.player, abyssPortal, () => {
      this.scene.start('AbyssScene');
    });


    // --- Sky Entrance (Center) ---
    const skyPortal = this.add.image(80, 150, 'dungeon_portal').setScale(0.12).setTint(0xe0f7fa).setDepth(2);
    this.physics.add.existing(skyPortal, true);
    (skyPortal.body as Phaser.Physics.Arcade.StaticBody).setSize(120, 120);
    this.add.text(80, 100, '天空の塔\n(無限) ◀', {
      fontSize: '11px',
      color: '#00bcd4',
      align: 'center',
      fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(3);
    
    this.physics.add.overlap(this.player, skyPortal, () => {
      this.scene.start('SkyScene');
    });

    // Village Center Monument / Welcome
    this.add.text(408, 280, '最前線の村 (安全地帯)', {
      fontSize: '13px',
      color: '#ffffff',
      backgroundColor: '#00000088',
      padding: { x: 8, y: 4 }
    }).setOrigin(0.5).setDepth(2);

    // --- Item Shop ---
    
    // --- Equip Shop ---
    this.equipShopNpc = this.add.rectangle(200, 150, 24, 24, 0xe74c3c).setDepth(2);
    this.physics.add.existing(this.equipShopNpc, true);
    this.add.text(200, 120, '【武具屋】\n(話す)', {
      fontSize: '11px',
      color: '#e74c3c',
      align: 'center',
      fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(3);

    this.shopNpc = this.add.rectangle(600, 150, 24, 24, 0xff9800).setDepth(2);
    this.physics.add.existing(this.shopNpc, true);
    this.add.text(600, 120, '【道具屋】\n(話す)', {
      fontSize: '11px',
      color: '#ff9800',
      align: 'center',
      fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(3);
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

  private createHUD(): void {
    // HUD overlay box (fixed to camera)
    const hudBg = this.add.rectangle(12, 12, 260, 80, 0x111625, 0.85)
      .setOrigin(0, 0)
      .setScrollFactor(0)
      .setStrokeStyle(1, 0x3d4461)
      .setDepth(100);

    this.hudText = this.add.text(20, 18, '', {
      fontSize: '12px',
      color: '#ffffff',
      fontFamily: 'monospace',
      lineSpacing: 3
    }).setScrollFactor(0).setDepth(101);

    // Quest tracker HUD
    const questBg = this.add.rectangle(12, 500, 260, 80, 0x111625, 0.85)
      .setOrigin(0, 0)
      .setScrollFactor(0)
      .setStrokeStyle(1, 0x3d4461)
      .setDepth(100);

    this.questHudText = this.add.text(22, 508, '', {
      fontSize: '11px',
      color: '#ffeb3b',
      lineSpacing: 3
    }).setScrollFactor(0).setDepth(101);

    // Interaction prompt
    this.interactPromptText = this.add.text(400, 380, '', {
      fontSize: '13px',
      color: '#ffff00',
      backgroundColor: '#000000bb',
      padding: { x: 6, y: 3 },
      fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(90);
  }

  private updateHUD(): void {
    const p = this.gameState.player;
    const compCount = this.gameState.recruitedCompanions.length;

    this.hudText.setText(
      `Lv.${p.level} ${p.name} (${p.classType.toUpperCase()})\n` +
      `HP: ${p.hp}/${p.maxHp}  | MP: ${p.mp}/${p.maxMp}\n` +
      `EXP: ${p.exp}/${p.maxExp} | 所持金: ${p.gold} G\n` +
      `パーティ人数: ${1 + compCount}/6人`
    );

    // Update Quests HUD
    if (this.gameState.activeQuests.length === 0) {
      this.questHudText.setText('【受注中のクエスト】\nなし (酒場の掲示板で受注可能)');
    } else {
      let qText = '【受注中のクエスト】\n';
      for (const aq of this.gameState.activeQuests) {
        const qDef = QUEST_DEFINITIONS[aq.questId];
        if (qDef) {
          const prog = this.questManager.getQuestProgress(aq.questId);
          const status = prog.isReady ? '★達成! 報告可能' : `${prog.current}/${prog.required}`;
          qText += `・${qDef.title}: ${status}\n`;
        }
      }
      this.questHudText.setText(qText);
    }
  }

  private checkNearbyInteractables(): void {
    this.interactPromptText.setVisible(false);
    
    const distEquip = Phaser.Math.Distance.Between(this.player.x, this.player.y, this.equipShopNpc.x, this.equipShopNpc.y);
    if (distEquip < 50) {
      this.interactPromptText.setText('[E] 武具屋で買い物をする');
      this.interactPromptText.setPosition(this.player.x, this.player.y - 30);
      this.interactPromptText.setVisible(true);
    }

    const distShop = Phaser.Math.Distance.Between(this.player.x, this.player.y, this.shopNpc.x, this.shopNpc.y);
    if (distShop < 50) {
      this.interactPromptText.setText('[E] 道具屋で買い物をする');
      this.interactPromptText.setPosition(this.player.x, this.player.y - 30);
      this.interactPromptText.setVisible(true);
    }
  }

  private checkInteractions(): void {
    const distEquip = Phaser.Math.Distance.Between(this.player.x, this.player.y, this.equipShopNpc.x, this.equipShopNpc.y);
    if (distEquip < 50) {
      this.openEquipShop();
      return;
    }

    const distShop = Phaser.Math.Distance.Between(this.player.x, this.player.y, this.shopNpc.x, this.shopNpc.y);
    if (distShop < 50) {
      this.openItemShop();
    }
  }

  
  private openEquipShop(): void {
    if (this.activeModal) return;

    this.activeModal = this.add.container(400, 300).setScrollFactor(0).setDepth(200);

    const bg = this.add.rectangle(0, 0, 540, 500, 0x111625, 0.95)
      .setStrokeStyle(2, 0xe74c3c);
    this.activeModal.add(bg);

    const title = this.add.text(0, -230, '【武具屋】', {
      fontSize: '18px',
      color: '#e74c3c',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    this.activeModal.add(title);

    const getStatusText = () => {
      const p = this.gameState.player;
      const wName = p.equippedWeapon ? EQUIPMENT_DEFINITIONS[p.equippedWeapon]?.name : 'なし';
      const aName = p.equippedArmor ? EQUIPMENT_DEFINITIONS[p.equippedArmor]?.name : 'なし';
      return `所持金: ${p.gold} G\n攻撃力: ${p.attack} | 防御力: ${p.defense}\n装備武器: ${wName}\n装備防具: ${aName}`;
    };

    const desc = this.add.text(0, -180, getStatusText(), {
      fontSize: '12px',
      color: '#ffffff',
      align: 'center',
      lineSpacing: 4
    }).setOrigin(0.5);
    this.activeModal.add(desc);

    const resultMsg = this.add.text(0, -120, '装備品を購入すると自動で装備されます', {
      fontSize: '12px',
      color: '#ffff00',
      align: 'center'
    }).setOrigin(0.5);
    this.activeModal.add(resultMsg);

    const equips = Object.values(EQUIPMENT_DEFINITIONS);
    let yPos = -70;
    
    // Split into two columns
    equips.forEach((eq, idx) => {
      const col = idx % 2;
      const row = Math.floor(idx / 2);
      const xPos = col === 0 ? -130 : 130;
      const curY = yPos + row * 55;

      const btn = this.add.rectangle(xPos, curY, 240, 50, 0x3d4461).setInteractive({ useHandCursor: true });
      const txt = this.add.text(xPos, curY, `${eq.name} (${eq.price}G)\n${eq.type === 'weapon' ? '攻+'+eq.bonusAttack : '防+'+eq.bonusDefense}`, { fontSize: '11px', color: '#fff', align: 'center' }).setOrigin(0.5);
      
      btn.on('pointerdown', () => {
        if (this.gameState.spendGold(eq.price)) {
          this.gameState.addItem(eq.id, 1);
          this.gameState.equipItem(eq.id);
          desc.setText(getStatusText());
          resultMsg.setText(`${eq.name} を購入し装備しました！`);
        } else {
          resultMsg.setText('ゴールドが足りません！');
        }
      });
      this.activeModal?.add([btn, txt]);
    });

    const closeBtn = this.add.rectangle(0, 220, 120, 30, 0x555555).setInteractive({ useHandCursor: true });
    const closeTxt = this.add.text(0, 220, '閉じる (ESC)', { fontSize: '12px', color: '#fff' }).setOrigin(0.5);
    closeBtn.on('pointerdown', () => {
      this.time.delayedCall(10, () => this.closeModal());
    });
    this.activeModal.add([closeBtn, closeTxt]);
  }

  private openItemShop(): void {
    if (this.activeModal) return;

    this.activeModal = this.add.container(400, 300).setScrollFactor(0).setDepth(200);

    const bg = this.add.rectangle(0, 0, 400, 250, 0x111625, 0.95)
      .setStrokeStyle(2, 0xff9800);
    this.activeModal.add(bg);

    const title = this.add.text(0, -100, '【道具屋】', {
      fontSize: '18px',
      color: '#ff9800',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    this.activeModal.add(title);

    const getInvText = () => `所持金: ${this.gameState.player.gold} G\n[所持] 小型: ${this.gameState.getItemCount('herb_small')}個 / 大型: ${this.gameState.getItemCount('herb_large')}個\n※ポーションは戦闘時にHPが40%以下になると自動で使用されます`;

    const desc = this.add.text(0, -50, getInvText(), {
      fontSize: '12px',
      color: '#ffffff',
      align: 'center',
      lineSpacing: 4
    }).setOrigin(0.5);
    this.activeModal.add(desc);

    const resultMsg = this.add.text(0, 20, '', {
      fontSize: '12px',
      color: '#ffff00',
      align: 'center'
    }).setOrigin(0.5);
    this.activeModal.add(resultMsg);

    const buySmall = this.add.rectangle(-100, 70, 150, 40, 0x3d4461).setInteractive();
    const buySmallText = this.add.text(-100, 70, '小型ポーション (10G)\n(HP 30回復)', { fontSize: '11px', color: '#fff', align: 'center' }).setOrigin(0.5);
    buySmall.on('pointerdown', () => {
      if (this.gameState.spendGold(10)) {
        this.gameState.addItem('herb_small', 1);
        desc.setText(getInvText());
        resultMsg.setText('小型ポーションを購入しました！');
      } else {
        resultMsg.setText('ゴールドが足りません！');
      }
    });
    this.activeModal.add([buySmall, buySmallText]);

    const buyLarge = this.add.rectangle(100, 70, 150, 40, 0x3d4461).setInteractive();
    const buyLargeText = this.add.text(100, 70, '大型ポーション (30G)\n(HP 100回復)', { fontSize: '11px', color: '#fff', align: 'center' }).setOrigin(0.5);
    buyLarge.on('pointerdown', () => {
      if (this.gameState.spendGold(30)) {
        this.gameState.addItem('herb_large', 1);
        desc.setText(getInvText());
        resultMsg.setText('大型ポーションを購入しました！');
      } else {
        resultMsg.setText('ゴールドが足りません！');
      }
    });
    this.activeModal.add([buyLarge, buyLargeText]);

    const closeBtn = this.add.rectangle(0, 150, 120, 30, 0x555555).setInteractive();
    const closeTxt = this.add.text(0, 150, '閉じる (ESC)', { fontSize: '12px', color: '#fff' }).setOrigin(0.5);
    closeBtn.on('pointerdown', () => {
      this.time.delayedCall(10, () => this.closeModal());
    });
    this.activeModal.add([closeBtn, closeTxt]);
  }


  private closeModal(): void {
    if (this.activeModal) {
      this.activeModal.destroy();
      this.activeModal = null;
    }
  }
}
