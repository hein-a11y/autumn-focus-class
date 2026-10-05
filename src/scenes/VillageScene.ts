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

  constructor() {
    super({ key: 'VillageScene' });
    this.gameState = GameState.getInstance();
    this.questManager = QuestManager.getInstance();
  }

  public create(): void {
    const width = 800;
    const height = 600;

    // Create Village Tilemap / Grounds
    this.createVillageLayout();

    // Spawn Player in central village square
    this.player = new Player(this, 400, 320);

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
    const homeHouse = this.add.rectangle(408, 120, 160, 100, 0x5d4037)
      .setStrokeStyle(3, 0x3e2723).setDepth(2);
    this.physics.add.existing(homeHouse, true);

    this.add.text(408, 90, '【主人公の自宅】', {
      fontSize: '14px',
      color: '#ffeb3b',
      fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(3);

    // Bed in home area
    const bed = this.add.image(408, 140, 'furniture_bed').setDepth(3);
    this.add.text(408, 162, '[E] 休む (全回復&セーブ)', {
      fontSize: '11px',
      color: '#81c784',
      fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(3);

    // --- Tavern (South) ---
    const tavern = this.add.rectangle(408, 490, 220, 110, 0x4e342e)
      .setStrokeStyle(3, 0x3e2723).setDepth(2);
    this.physics.add.existing(tavern, true);

    this.add.text(408, 450, '【村の酒場】', {
      fontSize: '14px',
      color: '#ffcc00',
      fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(3);

    // Quest Board in Tavern
    this.add.image(350, 500, 'furniture_board').setDepth(3);
    this.add.text(350, 525, '[E] 掲示板', {
      fontSize: '11px',
      color: '#64b5f6',
      fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(3);

    // BOT Recruitment Counter in Tavern
    const botCounter = this.add.rectangle(470, 500, 48, 28, 0x8d6e63)
      .setStrokeStyle(2, 0xd7ccc8).setDepth(3);
    this.add.text(470, 500, '仲間\n雇入', {
      fontSize: '10px',
      color: '#ffffff',
      align: 'center'
    }).setOrigin(0.5).setDepth(4);
    this.add.text(470, 525, '[E] BOT雇用', {
      fontSize: '11px',
      color: '#ffb74d',
      fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(3);

    // --- Forest Entrance (West) ---
    const forestPortal = this.add.rectangle(40, 328, 60, 90, 0x2e7d32, 0.8)
      .setStrokeStyle(2, 0x81c784).setDepth(2);
    this.physics.add.existing(forestPortal, true);
    this.add.text(40, 328, '始まりの森\n◀ 出発', {
      fontSize: '12px',
      color: '#ffffff',
      align: 'center',
      fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(3);

    // --- Dungeon Entrance (East) ---
    const dungeonPortal = this.add.rectangle(760, 328, 60, 90, 0x37474f, 0.8)
      .setStrokeStyle(2, 0x90a4ae).setDepth(2);
    this.physics.add.existing(dungeonPortal, true);
    this.add.text(760, 328, '最前線\nダンジョン\n出発 ▶', {
      fontSize: '11px',
      color: '#ffffff',
      align: 'center',
      fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(3);

    // Entrance collision triggers
    this.physics.add.overlap(this.player, forestPortal, () => {
      this.scene.start('ForestScene');
    });

    this.physics.add.overlap(this.player, dungeonPortal, () => {
      this.scene.start('DungeonScene');
    });

    // Village Center Monument / Welcome
    this.add.text(408, 280, '最前線の村 (安全地帯)', {
      fontSize: '13px',
      color: '#ffffff',
      backgroundColor: '#00000088',
      padding: { x: 8, y: 4 }
    }).setOrigin(0.5).setDepth(2);
  }

  private spawnCompanions(): void {
    // Clear existing companion sprites
    this.companions.forEach(c => c.destroy());
    this.companions = [];

    // Spawn each recruited companion
    this.gameState.recruitedCompanions.forEach((data, index) => {
      const offsetX = index === 0 ? -28 : 28;
      const comp = new Companion(this, this.player.x + offsetX, this.player.y + 20, data, this.player);
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
    const questBg = this.add.rectangle(550, 12, 240, 80, 0x111625, 0.85)
      .setOrigin(0, 0)
      .setScrollFactor(0)
      .setStrokeStyle(1, 0x3d4461)
      .setDepth(100);

    this.questHudText = this.add.text(560, 18, '', {
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
      `パーティ人数: ${1 + compCount}/3人`
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
    const px = this.player.x;
    const py = this.player.y;

    // Bed interaction range
    if (Phaser.Math.Distance.Between(px, py, 408, 140) < 50) {
      this.interactPromptText.setText('[E] ベッドで休む (全回復&セーブ)');
      this.interactPromptText.setPosition(408, 185);
      this.interactPromptText.setVisible(true);
      return;
    }

    // Quest Board interaction range
    if (Phaser.Math.Distance.Between(px, py, 350, 500) < 50) {
      this.interactPromptText.setText('[E] クエスト掲示板を見る');
      this.interactPromptText.setPosition(350, 545);
      this.interactPromptText.setVisible(true);
      return;
    }

    // Bot Recruitment interaction range
    if (Phaser.Math.Distance.Between(px, py, 470, 500) < 50) {
      this.interactPromptText.setText('[E] 仲間(BOT)雇用カウンター');
      this.interactPromptText.setPosition(470, 545);
      this.interactPromptText.setVisible(true);
      return;
    }

    this.interactPromptText.setVisible(false);
  }

  private checkInteractions(): void {
    const px = this.player.x;
    const py = this.player.y;

    if (Phaser.Math.Distance.Between(px, py, 408, 140) < 50) {
      this.openBedRestModal();
    } else if (Phaser.Math.Distance.Between(px, py, 350, 500) < 50) {
      this.openQuestBoardModal();
    } else if (Phaser.Math.Distance.Between(px, py, 470, 500) < 50) {
      this.openBotRecruitmentModal();
    }
  }

  private openBedRestModal(): void {
    this.closeModal();

    this.gameState.healAll();
    this.gameState.saveToStorage();

    const container = this.add.container(400, 300).setScrollFactor(0).setDepth(200);
    const bg = this.add.rectangle(0, 0, 360, 160, 0x1a2332, 0.95)
      .setStrokeStyle(2, 0x4caf50);

    const title = this.add.text(0, -45, 'ベッドで休んで全回復しました！', {
      fontSize: '16px',
      color: '#81c784',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    const desc = this.add.text(0, -10, 'HPとMPが最大まで回復し、\nゲームの進行状況がセーブされました。', {
      fontSize: '13px',
      color: '#ffffff',
      align: 'center',
      lineSpacing: 4
    }).setOrigin(0.5);

    const closeBtn = this.add.rectangle(0, 45, 120, 32, 0x388e3c)
      .setInteractive({ useHandCursor: true });
    const closeBtnText = this.add.text(0, 45, '閉じる [E]', {
      fontSize: '13px',
      color: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    closeBtn.on('pointerdown', () => this.closeModal());
    container.add([bg, title, desc, closeBtn, closeBtnText]);
    this.activeModal = container;
  }

  private openQuestBoardModal(): void {
    this.closeModal();

    const container = this.add.container(400, 300).setScrollFactor(0).setDepth(200);
    const bg = this.add.rectangle(0, 0, 620, 440, 0x161a29, 0.95)
      .setStrokeStyle(2, 0x5c6bc0);

    const title = this.add.text(0, -190, '村の酒場 クエスト掲示板', {
      fontSize: '18px',
      color: '#ffcc00',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    container.add([bg, title]);

    // Available & Active Quests List
    let yPos = -140;
    const quests = Object.values(QUEST_DEFINITIONS);

    quests.forEach(q => {
      const isActive = this.questManager.isQuestActive(q.id);
      const isCompleted = this.questManager.isQuestCompleted(q.id);
      const canTurnIn = this.questManager.canTurnIn(q.id);

      const qRowBg = this.add.rectangle(0, yPos, 580, 48, 0x22293d)
        .setStrokeStyle(1, 0x3d4766);

      const qInfo = this.add.text(-270, yPos - 12, `[${q.rank}ランク] ${q.title} (${q.recommendedLevel})`, {
        fontSize: '13px',
        color: '#ffffff',
        fontStyle: 'bold'
      });

      const qDesc = this.add.text(-270, yPos + 6, `${q.description} 報酬: ${q.reward.gold}G, ${q.reward.exp}EXP`, {
        fontSize: '11px',
        color: '#b0bec5'
      });

      container.add([qRowBg, qInfo, qDesc]);

      if (isCompleted) {
        const doneText = this.add.text(230, yPos, '完了済 ✓', {
          fontSize: '13px',
          color: '#81c784',
          fontStyle: 'bold'
        }).setOrigin(0.5);
        container.add(doneText);
      } else if (canTurnIn) {
        const turnInBtn = this.add.rectangle(230, yPos, 80, 28, 0xff9800)
          .setInteractive({ useHandCursor: true });
        const btnText = this.add.text(230, yPos, '報告納品', {
          fontSize: '12px',
          color: '#ffffff',
          fontStyle: 'bold'
        }).setOrigin(0.5);

        turnInBtn.on('pointerdown', () => {
          this.questManager.turnInQuest(q.id);
          this.openQuestBoardModal(); // Refresh modal
        });
        container.add([turnInBtn, btnText]);
      } else if (isActive) {
        const prog = this.questManager.getQuestProgress(q.id);
        const progText = this.add.text(230, yPos, `進行中 (${prog.current}/${prog.required})`, {
          fontSize: '12px',
          color: '#ffd54f'
        }).setOrigin(0.5);
        container.add(progText);
      } else {
        const acceptBtn = this.add.rectangle(230, yPos, 70, 28, 0x388e3c)
          .setInteractive({ useHandCursor: true });
        const btnText = this.add.text(230, yPos, '受注', {
          fontSize: '12px',
          color: '#ffffff',
          fontStyle: 'bold'
        }).setOrigin(0.5);

        acceptBtn.on('pointerdown', () => {
          this.questManager.acceptQuest(q.id);
          this.openQuestBoardModal(); // Refresh modal
        });
        container.add([acceptBtn, btnText]);
      }

      yPos += 54;
    });

    const closeBtn = this.add.rectangle(0, 195, 120, 32, 0x455a64)
      .setInteractive({ useHandCursor: true });
    const closeBtnText = this.add.text(0, 195, '閉じる [ESC]', {
      fontSize: '13px',
      color: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    closeBtn.on('pointerdown', () => this.closeModal());
    container.add([closeBtn, closeBtnText]);

    this.activeModal = container;
  }

  private openBotRecruitmentModal(): void {
    this.closeModal();

    const container = this.add.container(400, 300).setScrollFactor(0).setDepth(200);
    const bg = this.add.rectangle(0, 0, 560, 380, 0x1b2030, 0.95)
      .setStrokeStyle(2, 0xffa726);

    const title = this.add.text(0, -160, '酒場のBOT仲間 雇入所 (最大2名まで編成可能)', {
      fontSize: '16px',
      color: '#ffa726',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    container.add([bg, title]);

    // Current recruited companions
    const currentBots = this.gameState.recruitedCompanions;
    const statusText = this.add.text(0, -125, `現在のパーティ仲間: ${currentBots.length}/2名`, {
      fontSize: '13px',
      color: '#ffffff'
    }).setOrigin(0.5);
    container.add(statusText);

    // List of candidates to hire
    const candidates: { name: string; gender: Gender; classType: ClassType; role: string; cost: number }[] = [
      { name: 'アルス', gender: 'male', classType: 'warrior', role: '近接アタッカー (剣)', cost: 100 },
      { name: 'ソフィア', gender: 'female', classType: 'mage', role: '遠距離火力 (魔法)', cost: 100 },
      { name: 'ロビン', gender: 'male', classType: 'thief', role: '高速手数アタッカー (双剣)', cost: 100 },
      { name: 'セシリア', gender: 'female', classType: 'paladin', role: 'タンク・防御力 (剣と盾)', cost: 100 }
    ];

    let yPos = -85;
    candidates.forEach(cand => {
      const rowBg = this.add.rectangle(0, yPos, 500, 44, 0x272e42)
        .setStrokeStyle(1, 0x3d4766);

      const info = this.add.text(-230, yPos, `${cand.name}【${cand.role}】 Lv.${this.gameState.player.level}`, {
        fontSize: '13px',
        color: '#ffffff'
      }).setOrigin(0, 0.5);

      const hireBtn = this.add.rectangle(190, yPos, 90, 28, 0x2e7d32)
        .setInteractive({ useHandCursor: true });
      const hireBtnText = this.add.text(190, yPos, `雇う (${cand.cost}G)`, {
        fontSize: '12px',
        color: '#ffffff',
        fontStyle: 'bold'
      }).setOrigin(0.5);

      hireBtn.on('pointerdown', () => {
        if (this.gameState.recruitedCompanions.length >= 2) {
          alert('仲間は最大2名までです！');
          return;
        }
        if (!this.gameState.spendGold(cand.cost)) {
          alert('所持金が足りません！');
          return;
        }
        this.gameState.recruitCompanion(cand.name, cand.gender, cand.classType);
        this.spawnCompanions();
        this.openBotRecruitmentModal(); // Refresh modal
      });

      container.add([rowBg, info, hireBtn, hireBtnText]);
      yPos += 50;
    });

    // Dismiss button if have companions
    if (currentBots.length > 0) {
      const dismissBtn = this.add.rectangle(-80, 140, 130, 32, 0xc62828)
        .setInteractive({ useHandCursor: true });
      const dismissText = this.add.text(-80, 140, '仲間を解散する', {
        fontSize: '12px',
        color: '#ffffff',
        fontStyle: 'bold'
      }).setOrigin(0.5);

      dismissBtn.on('pointerdown', () => {
        this.gameState.recruitedCompanions = [];
        this.spawnCompanions();
        this.openBotRecruitmentModal();
      });
      container.add([dismissBtn, dismissText]);
    }

    const closeBtn = this.add.rectangle(120, 140, 100, 32, 0x455a64)
      .setInteractive({ useHandCursor: true });
    const closeBtnText = this.add.text(120, 140, '閉じる [ESC]', {
      fontSize: '13px',
      color: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    closeBtn.on('pointerdown', () => this.closeModal());
    container.add([closeBtn, closeBtnText]);

    this.activeModal = container;
  }

  private closeModal(): void {
    if (this.activeModal) {
      this.activeModal.destroy();
      this.activeModal = null;
    }
  }
}
