import Phaser from 'phaser';
import { Player } from '../entities/Player';
import { Companion } from '../entities/Companion';
import { GameState } from '../managers/GameState';
import { QuestManager } from '../managers/QuestManager';
import { QUEST_DEFINITIONS } from '../data/quests';
import { ClassType, Gender } from '../data/classes';

export class TavernScene extends Phaser.Scene {
  private player!: Player;
  private companions: Companion[] = [];
  private gameState: GameState;
  private questManager: QuestManager;

  private activeModal: Phaser.GameObjects.Container | null = null;
  private interactPromptText!: Phaser.GameObjects.Text;

  constructor() {
    super({ key: 'TavernScene' });
    this.gameState = GameState.getInstance();
    this.questManager = QuestManager.getInstance();
  }

  public create(): void {
    const width = 800;
    const height = 600;

    // Spawn Player
    this.player = new Player(this, 400, 500);

    this.createTavernLayout();
    this.spawnCompanions();

    this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
    this.cameras.main.setBounds(0, 0, width, height);
    this.physics.world.setBounds(0, 0, width, height);

    this.createHUD();

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

    for (const companion of this.companions) {
      companion.update(time, []);
    }

    // Exit portal at bottom
    if (this.player.y > 580) {
      this.scene.start('VillageScene');
    }

    this.checkNearbyInteractables();
  }

  private createTavernLayout(): void {
    // Floor
    for (let x = 0; x < 800; x += 16) {
      for (let y = 0; y < 600; y += 16) {
        this.add.image(x + 8, y + 8, 'tile_wood_floor').setDepth(0);
      }
    }

    // Walls
    for (let x = 0; x < 800; x += 16) {
      this.add.image(x + 8, 8, 'tile_stone_wall').setDepth(1);
    }

    // Tavern tables
    this.add.image(200, 300, 'furniture_pack', 'furniture_10').setDepth(1);
    this.add.image(200, 450, 'furniture_pack', 'furniture_10').setDepth(1);
    this.add.image(600, 300, 'furniture_pack', 'furniture_10').setDepth(1);
    this.add.image(600, 450, 'furniture_pack', 'furniture_10').setDepth(1);
    this.add.image(400, 350, 'furniture_pack', 'furniture_11').setDepth(1);

    // Decor
    this.add.image(100, 100, 'furniture_pack', 'furniture_6').setDepth(2);
    this.add.image(700, 100, 'furniture_pack', 'furniture_7').setDepth(2);

    // Quest Board
    this.add.image(200, 100, 'furniture_board').setDepth(3);
    this.add.text(200, 130, '[E] 掲示板', {
      fontSize: '11px',
      color: '#64b5f6',
      fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(3);

    // Limit Break Counter
    const lbCounter = this.add.rectangle(400, 100, 48, 28, 0x8d6e63).setStrokeStyle(2, 0xd7ccc8).setDepth(3);
    this.add.text(400, 100, '限界\n突破', { fontSize: '10px', color: '#ffffff', align: 'center' }).setOrigin(0.5).setDepth(4);
    this.add.text(400, 130, '[E] 上限解放', { fontSize: '11px', color: '#e91e63', fontStyle: 'bold' }).setOrigin(0.5).setDepth(3);

    // BOT Recruitment Counter
    const botCounter = this.add.rectangle(600, 100, 48, 28, 0x8d6e63).setStrokeStyle(2, 0xd7ccc8).setDepth(3);
    this.add.text(600, 100, '仲間\n雇入', { fontSize: '10px', color: '#ffffff', align: 'center' }).setOrigin(0.5).setDepth(4);
    this.add.text(600, 130, '[E] BOT雇用', { fontSize: '11px', color: '#ffb74d', fontStyle: 'bold' }).setOrigin(0.5).setDepth(3);
    
    // Exit label
    this.add.text(400, 570, '▼ 村へ戻る', { fontSize: '14px', color: '#ffffff' }).setOrigin(0.5).setDepth(3);
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
    this.interactPromptText = this.add.text(200, 200, '', {
      fontSize: '13px',
      color: '#ffffff',
      backgroundColor: '#00000088',
      padding: { x: 8, y: 4 }
    }).setOrigin(0.5).setDepth(200).setScrollFactor(0).setVisible(false);
  }

  private checkNearbyInteractables(): void {
    const px = this.player.x;
    const py = this.player.y;

    if (Phaser.Math.Distance.Between(px, py, 200, 100) < 40) {
      this.interactPromptText.setText('[E] 掲示板').setVisible(true);
    } else if (Phaser.Math.Distance.Between(px, py, 400, 100) < 40) {
      this.interactPromptText.setText('[E] 上限解放').setVisible(true);
    } else if (Phaser.Math.Distance.Between(px, py, 600, 100) < 40) {
      this.interactPromptText.setText('[E] BOT雇用').setVisible(true);
    } else {
      this.interactPromptText.setVisible(false);
    }
  }

  private checkInteractions(): void {
    const px = this.player.x;
    const py = this.player.y;

    if (Phaser.Math.Distance.Between(px, py, 200, 100) < 40) {
      this.time.delayedCall(10, () => this.openQuestBoardModal());
    } else if (Phaser.Math.Distance.Between(px, py, 400, 100) < 40) {
      this.time.delayedCall(10, () => this.openLimitBreakModal());
    } else if (Phaser.Math.Distance.Between(px, py, 600, 100) < 40) {
      this.time.delayedCall(10, () => this.openBotRecruitmentModal());
    }
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
          this.time.delayedCall(10, () => this.openQuestBoardModal()); // Refresh modal
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
          this.time.delayedCall(10, () => this.openQuestBoardModal()); // Refresh modal
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

  private openLimitBreakModal(): void {
    this.closeModal();

    const container = this.add.container(400, 300).setScrollFactor(0).setDepth(200);
    const bg = this.add.rectangle(0, 0, 400, 250, 0x1b2030, 0.95)
      .setStrokeStyle(2, 0xe91e63);

    const title = this.add.text(0, -90, 'ギルドマスター - レベル上限解放', {
      fontSize: '16px',
      color: '#e91e63',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    const currentCap = this.gameState.levelCap;
    
    let cost = 0;
    if (currentCap === 10) cost = 1000;
    else if (currentCap === 20) cost = 5000;
    else if (currentCap === 30) cost = 15000;
    else if (currentCap === 40) cost = 30000;

    let desc = '';
    if (currentCap >= 50) {
      desc = '現在のレベル上限: 50 (最大)\nこれ以上の上限解放はできません。';
    } else {
      desc = `現在のレベル上限: ${currentCap}\n次の上限: ${currentCap + 10}\n\n必要ゴールド: ${cost} G`;
    }

    const infoText = this.add.text(0, -20, desc, {
      fontSize: '14px',
      color: '#ffffff',
      align: 'center',
      lineSpacing: 10
    }).setOrigin(0.5);

    container.add([bg, title, infoText]);

    if (currentCap < 50) {
      const upgradeBtn = this.add.rectangle(0, 50, 160, 40, 0xe91e63)
        .setInteractive({ useHandCursor: true })
        .setStrokeStyle(2, 0xff6090);
      const upgradeText = this.add.text(0, 50, '上限解放を実行', {
        fontSize: '14px',
        color: '#ffffff',
        fontStyle: 'bold'
      }).setOrigin(0.5);

      upgradeBtn.on('pointerdown', () => {
        if (this.gameState.spendGold(cost)) {
          this.gameState.levelCap += 10;
          this.gameState.addExp(0);
          this.time.delayedCall(10, () => this.openLimitBreakModal());
        } else {
          upgradeText.setText('ゴールド不足！');
          upgradeText.setColor('#ff3333');
          this.time.delayedCall(1000, () => {
            if (upgradeText.active) {
              upgradeText.setText('上限解放を実行');
              upgradeText.setColor('#ffffff');
            }
          });
        }
      });
      
      container.add([upgradeBtn, upgradeText]);
    }

    const closeBtn = this.add.rectangle(0, 100, 100, 32, 0x455a64)
      .setInteractive({ useHandCursor: true })
      .setStrokeStyle(2, 0x78909c);
    const closeText = this.add.text(0, 100, '閉じる', {
      fontSize: '12px',
      color: '#ffffff'
    }).setOrigin(0.5);

    closeBtn.on('pointerdown', () => this.closeModal());
    container.add([closeBtn, closeText]);

    this.activeModal = container;
  }
  private openBotRecruitmentModal(): void {
    this.closeModal();

    const container = this.add.container(400, 300).setScrollFactor(0).setDepth(200);
    const bg = this.add.rectangle(0, 0, 560, 480, 0x1b2030, 0.95)
      .setStrokeStyle(2, 0xffa726);

    const title = this.add.text(0, -210, '酒場のBOT仲間 雇入所 (最大5名まで編成可能)', {
      fontSize: '16px',
      color: '#ffa726',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    container.add([bg, title]);

    // Current recruited companions
    const currentBots = this.gameState.recruitedCompanions;
    const statusText = this.add.text(0, -180, `現在のパーティ仲間: ${currentBots.length}/5名`, {
      fontSize: '13px',
      color: '#ffffff'
    }).setOrigin(0.5);
    container.add(statusText);

    // List of candidates to hire
    const candidates: { name: string; gender: Gender; classType: ClassType; role: string; cost: number }[] = [
      { name: 'アルス', gender: 'male', classType: 'warrior', role: '近接アタッカー (剣)', cost: 100 },
      { name: 'ソフィア', gender: 'female', classType: 'mage', role: '遠距離火力 (魔法)', cost: 100 },
      { name: 'ロビン', gender: 'male', classType: 'thief', role: '高速手数アタッカー (双剣)', cost: 100 },
      { name: 'セシリア', gender: 'female', classType: 'paladin', role: 'タンク・防御力 (剣と盾)', cost: 100 },
      { name: 'カイト', gender: 'male', classType: 'thief', role: '遊撃手 (双剣)', cost: 150 },
      { name: 'ルナ', gender: 'female', classType: 'mage', role: '強力な魔法使い (魔法)', cost: 150 },
    ];

    let yPos = -135;
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
        if (this.gameState.recruitedCompanions.length >= 5) {
          hireBtnText.setText('満員です');
          hireBtnText.setColor('#ff3333');
          this.time.delayedCall(1000, () => { if (hireBtnText.active) { hireBtnText.setText(`雇う (${cand.cost}G)`); hireBtnText.setColor('#ffffff'); } });
          return;
        }
        if (!this.gameState.spendGold(cand.cost)) {
          hireBtnText.setText('ゴールド不足');
          hireBtnText.setColor('#ff3333');
          this.time.delayedCall(1000, () => { if (hireBtnText.active) { hireBtnText.setText(`雇う (${cand.cost}G)`); hireBtnText.setColor('#ffffff'); } });
          return;
        }
        this.gameState.recruitCompanion(cand.name, cand.gender, cand.classType);
        this.spawnCompanions();
        this.time.delayedCall(10, () => this.openBotRecruitmentModal()); // Refresh modal
      });

      container.add([rowBg, info, hireBtn, hireBtnText]);
      yPos += 50;
    });

    // Dismiss button if have companions
    if (currentBots.length > 0) {
      const dismissBtn = this.add.rectangle(-80, 200, 130, 32, 0xc62828)
        .setInteractive({ useHandCursor: true });
      const dismissText = this.add.text(-80, 200, '仲間を解散する', {
        fontSize: '12px',
        color: '#ffffff',
        fontStyle: 'bold'
      }).setOrigin(0.5);

      dismissBtn.on('pointerdown', () => {
        this.gameState.recruitedCompanions = [];
        this.spawnCompanions();
        this.time.delayedCall(10, () => this.openBotRecruitmentModal());
      });
      container.add([dismissBtn, dismissText]);
    }

    const closeBtn = this.add.rectangle(120, 200, 100, 32, 0x455a64)
      .setInteractive({ useHandCursor: true });
    const closeBtnText = this.add.text(120, 200, '閉じる [ESC]', {
      fontSize: '12px',
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
