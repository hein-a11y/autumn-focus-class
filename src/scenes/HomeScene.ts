import Phaser from 'phaser';
import { Player } from '../entities/Player';
import { Companion } from '../entities/Companion';
import { GameState } from '../managers/GameState';

export class HomeScene extends Phaser.Scene {
  private player!: Player;
  private companions: Companion[] = [];
  private gameState: GameState;

  private activeModal: Phaser.GameObjects.Container | null = null;
  private interactPromptText!: Phaser.GameObjects.Text;

  constructor() {
    super({ key: 'HomeScene' });
    this.gameState = GameState.getInstance();
  }

  public create(): void {
    const width = 400;
    const height = 400;

    // Spawn Player
    this.player = new Player(this, 200, 300);

    this.createHomeLayout();
    this.spawnCompanions();

    this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
    this.cameras.main.setBounds(0, 0, width, height);
    this.cameras.main.setZoom(1.5); // Zoom in a bit for indoor feel
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

    this.checkNearbyInteractables();
  }

  private createHomeLayout(): void {
    // Floor
    for (let x = 0; x < 400; x += 16) {
      for (let y = 0; y < 400; y += 16) {
        this.add.image(x + 8, y + 8, 'tile_wood_floor').setDepth(0);
      }
    }

    // Walls (Border)
    for (let x = 0; x < 400; x += 16) {
      this.add.image(x + 8, 8, 'tile_stone_wall').setDepth(1);
      this.add.image(x + 8, 392, 'tile_stone_wall').setDepth(1);
    }
    for (let y = 0; y < 400; y += 16) {
      this.add.image(8, y + 8, 'tile_stone_wall').setDepth(1);
      this.add.image(392, y + 8, 'tile_stone_wall').setDepth(1);
    }

    // Rug in the middle
    this.add.rectangle(200, 200, 100, 80, 0x8d6e63).setDepth(1);

    // The Bed
    const bed = this.add.image(200, 100, 'furniture_bed').setScale(1.5).setDepth(2);
    this.physics.add.existing(bed, true);
    this.physics.add.collider(this.player, bed);

    // Exit Door / Mat
    const door = this.add.rectangle(200, 370, 40, 20, 0x4e342e).setDepth(1);
    this.physics.add.existing(door, true);
    this.add.text(200, 370, '外へ', { fontSize: '10px', color: '#ffffff' }).setOrigin(0.5).setDepth(2);
    
    this.physics.add.overlap(this.player, door, () => {
      this.scene.start('VillageScene');
    });
  }

  private spawnCompanions(): void {
    this.companions.forEach(c => c.destroy());
    this.companions = [];
    this.gameState.recruitedCompanions.forEach((data, index) => {
      const offsetX = index === 0 ? -24 : 24;
      const comp = new Companion(this, this.player.x + offsetX, this.player.y + 16, data, this.player);
      this.companions.push(comp);
    });
  }

  private createHUD(): void {
    this.interactPromptText = this.add.text(200, 250, '', {
      fontSize: '11px',
      color: '#ffff00',
      backgroundColor: '#000000bb',
      padding: { x: 4, y: 2 },
      fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(90);
  }

  private checkNearbyInteractables(): void {
    const px = this.player.x;
    const py = this.player.y;

    // Bed interaction range
    if (Phaser.Math.Distance.Between(px, py, 200, 100) < 50) {
      this.interactPromptText.setText('[E] ベッドで休む (全回復&セーブ)');
      this.interactPromptText.setPosition(200, 150);
      this.interactPromptText.setVisible(true);
      return;
    }

    this.interactPromptText.setVisible(false);
  }

  private checkInteractions(): void {
    const px = this.player.x;
    const py = this.player.y;

    if (Phaser.Math.Distance.Between(px, py, 200, 100) < 50) {
      this.openBedRestModal();
    }
  }

  private openBedRestModal(): void {
    this.closeModal();

    this.gameState.healAll();
    this.gameState.saveToStorage();

    const container = this.add.container(200, 200).setScrollFactor(0).setDepth(200);
    const bg = this.add.rectangle(0, 0, 260, 120, 0x1a2332, 0.95)
      .setStrokeStyle(2, 0x4caf50);

    const title = this.add.text(0, -35, '休んで全回復しました！', {
      fontSize: '12px',
      color: '#81c784',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    const desc = this.add.text(0, -5, 'HPとMPが回復し、セーブされました。', {
      fontSize: '10px',
      color: '#ffffff',
      align: 'center'
    }).setOrigin(0.5);

    const closeBtn = this.add.rectangle(0, 30, 80, 24, 0x388e3c)
      .setInteractive({ useHandCursor: true });
    const closeBtnText = this.add.text(0, 30, '閉じる [E]', {
      fontSize: '10px',
      color: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    closeBtn.on('pointerdown', () => this.closeModal());
    container.add([bg, title, desc, closeBtn, closeBtnText]);
    this.activeModal = container;
  }

  private closeModal(): void {
    if (this.activeModal) {
      this.activeModal.destroy();
      this.activeModal = null;
    }
  }
}

