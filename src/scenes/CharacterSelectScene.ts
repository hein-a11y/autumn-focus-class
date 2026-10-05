import Phaser from 'phaser';
import { ClassType, Gender, CLASS_DEFINITIONS } from '../data/classes';
import { GameState } from '../managers/GameState';

export class CharacterSelectScene extends Phaser.Scene {
  private selectedGender: Gender = 'male';
  private selectedClass: ClassType = 'warrior';
  private previewSprite!: Phaser.GameObjects.Sprite;
  private classNameText!: Phaser.GameObjects.Text;
  private classRoleText!: Phaser.GameObjects.Text;
  private classWeaponText!: Phaser.GameObjects.Text;
  private classDescText!: Phaser.GameObjects.Text;
  private statsText!: Phaser.GameObjects.Text;

  private classButtons: Map<ClassType, Phaser.GameObjects.Rectangle> = new Map();
  private genderButtons: Map<Gender, Phaser.GameObjects.Rectangle> = new Map();

  constructor() {
    super({ key: 'CharacterSelectScene' });
  }

  public create(): void {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    // Background gradient box
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x1a1c29, 0x1a1c29, 0x0f1016, 0x0f1016, 1);
    bg.fillRect(0, 0, width, height);

    // Title
    this.add.text(width / 2, 40, 'フロントライン・リインカーネーション', {
      fontSize: '24px',
      color: '#ffcc00',
      fontStyle: 'bold',
      fontFamily: 'sans-serif'
    }).setOrigin(0.5);

    this.add.text(width / 2, 70, '～最前線開拓日記～ キャラクター作成', {
      fontSize: '15px',
      color: '#a0aab8',
      fontFamily: 'sans-serif'
    }).setOrigin(0.5);

    // --- Gender Selection ---
    this.add.text(120, 115, '■ 性別選択', {
      fontSize: '15px',
      color: '#ffffff',
      fontStyle: 'bold'
    });

    const genders: { id: Gender; label: string; x: number }[] = [
      { id: 'male', label: '男性 (Male)', x: 170 },
      { id: 'female', label: '女性 (Female)', x: 280 }
    ];

    genders.forEach(g => {
      const btnBg = this.add.rectangle(g.x, 150, 95, 34, 0x2c3e50)
        .setInteractive({ useHandCursor: true })
        .setStrokeStyle(2, g.id === this.selectedGender ? 0xffcc00 : 0x4a5568);

      const btnText = this.add.text(g.x, 150, g.label, {
        fontSize: '13px',
        color: '#ffffff'
      }).setOrigin(0.5);

      btnBg.on('pointerdown', () => {
        this.selectedGender = g.id;
        this.updateSelections();
      });

      this.genderButtons.set(g.id, btnBg);
    });

    // --- Class Selection ---
    this.add.text(120, 200, '■ クラス選択', {
      fontSize: '15px',
      color: '#ffffff',
      fontStyle: 'bold'
    });

    const classes: ClassType[] = ['warrior', 'mage', 'thief', 'paladin'];
    const startY = 240;

    classes.forEach((c, idx) => {
      const y = startY + idx * 46;
      const def = CLASS_DEFINITIONS[c];

      const btnBg = this.add.rectangle(230, y, 220, 38, 0x2c3e50)
        .setInteractive({ useHandCursor: true })
        .setStrokeStyle(2, c === this.selectedClass ? 0xffcc00 : 0x4a5568);

      this.add.text(150, y, `${def.name} (${def.englishName})`, {
        fontSize: '14px',
        color: '#ffffff',
        fontStyle: 'bold'
      }).setOrigin(0, 0.5);

      btnBg.on('pointerdown', () => {
        this.selectedClass = c;
        this.updateSelections();
      });

      this.classButtons.set(c, btnBg);
    });

    // --- Details & Preview Panel (Right Side) ---
    const panelBg = this.add.rectangle(570, 290, 380, 380, 0x161a29)
      .setStrokeStyle(2, 0x3d4461);

    // Sprite Preview (scaled x3)
    this.previewSprite = this.add.sprite(460, 180, 'char_warrior_male')
      .setScale(3);

    this.classNameText = this.add.text(530, 150, '', {
      fontSize: '20px',
      color: '#ffcc00',
      fontStyle: 'bold'
    });

    this.classRoleText = this.add.text(530, 180, '', {
      fontSize: '13px',
      color: '#64b5f6'
    });

    this.classWeaponText = this.add.text(530, 202, '', {
      fontSize: '13px',
      color: '#81c784'
    });

    this.classDescText = this.add.text(420, 240, '', {
      fontSize: '13px',
      color: '#e0e0e0',
      wordWrap: { width: 300 },
      lineSpacing: 4
    });

    this.statsText = this.add.text(420, 320, '', {
      fontSize: '13px',
      color: '#ffb74d',
      fontFamily: 'monospace',
      lineSpacing: 5
    });

    // --- Start Button ---
    const startBtn = this.add.rectangle(width / 2, 530, 240, 48, 0x27ae60)
      .setInteractive({ useHandCursor: true })
      .setStrokeStyle(2, 0x2ecc71);

    const startText = this.add.text(width / 2, 530, '最前線の村へ出発！ ▶ (Enter)', {
      fontSize: '16px',
      color: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    const startGame = () => {
      const gameState = GameState.getInstance();
      gameState.initCharacter(this.selectedGender, this.selectedClass);
      this.scene.start('VillageScene');
    };

    startBtn.on('pointerover', () => startBtn.setFillStyle(0x2ecc71));
    startBtn.on('pointerout', () => startBtn.setFillStyle(0x27ae60));
    startBtn.on('pointerdown', startGame);
    startText.on('pointerdown', startGame);

    this.input.keyboard?.on('keydown-ENTER', startGame);
    this.input.keyboard?.on('keydown-SPACE', startGame);

    this.updateSelections();
  }

  private updateSelections(): void {
    // Update Gender buttons border
    this.genderButtons.forEach((btn, g) => {
      btn.setStrokeStyle(2, g === this.selectedGender ? 0xffcc00 : 0x4a5568);
    });

    // Update Class buttons border
    this.classButtons.forEach((btn, c) => {
      btn.setStrokeStyle(2, c === this.selectedClass ? 0xffcc00 : 0x4a5568);
    });

    // Update preview sprite
    const textureKey = `char_${this.selectedClass}_${this.selectedGender}`;
    this.previewSprite.setTexture(textureKey);

    // Update class details
    const def = CLASS_DEFINITIONS[this.selectedClass];
    this.classNameText.setText(`${def.name} (${def.englishName})`);
    this.classRoleText.setText(`タイプ: ${def.combatType}`);
    this.classWeaponText.setText(`使用武器: ${def.weapon}`);
    this.classDescText.setText(def.description);

    const s = def.baseStats;
    this.statsText.setText(
      `HP : ${s.maxHp}   | MP : ${s.maxMp}\n` +
      `ATK: ${s.attack}   | DEF: ${s.defense}\n` +
      `SPD: ${s.speed}  | 射程: ${s.attackRange}px`
    );
  }
}
