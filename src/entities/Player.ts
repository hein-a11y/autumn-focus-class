import Phaser from 'phaser';
import { GameState } from '../managers/GameState';

export class Player extends Phaser.Physics.Arcade.Sprite {
  public facing: 'up' | 'down' | 'left' | 'right' = 'down';
  public isAttacking: boolean = false;
  private lastAttackTime: number = 0;
  private gameState: GameState;
  private isInvulnerable: boolean = false;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasdKeys!: {
    W: Phaser.Input.Keyboard.Key;
    A: Phaser.Input.Keyboard.Key;
    S: Phaser.Input.Keyboard.Key;
    D: Phaser.Input.Keyboard.Key;
    SPACE: Phaser.Input.Keyboard.Key;
    J: Phaser.Input.Keyboard.Key;
  };

  // Set of physically pressed keys (immune to Japanese IME 229 keyCode issue)
  private activeKeys: Set<string> = new Set();
  private pointerIsDragging: boolean = false;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    const gs = GameState.getInstance();
    super(scene, x, y, `char_${gs.player.classType}_${gs.player.gender}`);
    this.gameState = gs;

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setCollideWorldBounds(true);
    this.setSize(20, 24);
    this.setOffset(6, 8);
    this.setDepth(10);

    // Standard Phaser keyboard keys
    if (scene.input.keyboard) {
      this.cursors = scene.input.keyboard.createCursorKeys();
      this.wasdKeys = {
        W: scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
        A: scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
        S: scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
        D: scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D),
        SPACE: scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE),
        J: scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.J)
      };
    }

    // Direct DOM key tracking by physical code (e.code is always 'KeyW', 'KeyA', etc. even with IME active)
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code) this.activeKeys.add(e.code);
      if (e.key) this.activeKeys.add(e.key.toLowerCase());
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.code) this.activeKeys.delete(e.code);
      if (e.key) this.activeKeys.delete(e.key.toLowerCase());
    };
    const onBlur = () => {
      this.activeKeys.clear();
      this.pointerIsDragging = false;
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', onBlur);

    scene.events.once('shutdown', () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', onBlur);
    });

    // Mouse / Touch pointer support
    scene.input.on('pointerdown', () => {
      this.pointerIsDragging = true;
    });
    scene.input.on('pointerup', () => {
      this.pointerIsDragging = false;
    });
  }

  public update(time: number): void {
    if (!this.body) return;

    if (this.gameState.player.hp <= 0) {
      this.setVelocity(0, 0);
      return;
    }

    let vx = 0;
    let vy = 0;
    const speed = this.gameState.player.speed || 120;

    // Check keyboard movement (both Phaser and direct DOM codes for IME compatibility)
    const left =
      this.activeKeys.has('KeyA') ||
      this.activeKeys.has('ArrowLeft') ||
      this.activeKeys.has('a') ||
      this.cursors?.left?.isDown ||
      this.wasdKeys?.A?.isDown;

    const right =
      this.activeKeys.has('KeyD') ||
      this.activeKeys.has('ArrowRight') ||
      this.activeKeys.has('d') ||
      this.cursors?.right?.isDown ||
      this.wasdKeys?.D?.isDown;

    const up =
      this.activeKeys.has('KeyW') ||
      this.activeKeys.has('ArrowUp') ||
      this.activeKeys.has('w') ||
      this.cursors?.up?.isDown ||
      this.wasdKeys?.W?.isDown;

    const down =
      this.activeKeys.has('KeyS') ||
      this.activeKeys.has('ArrowDown') ||
      this.activeKeys.has('s') ||
      this.cursors?.down?.isDown ||
      this.wasdKeys?.S?.isDown;

    if (left) {
      vx -= speed;
      this.facing = 'left';
    } else if (right) {
      vx += speed;
      this.facing = 'right';
    }

    if (up) {
      vy -= speed;
      this.facing = 'up';
    } else if (down) {
      vy += speed;
      this.facing = 'down';
    }

    // Pointer (Mouse / Touch) drag-to-move fallback
    const pointer = this.scene.input.activePointer;
    if (vx === 0 && vy === 0 && (this.pointerIsDragging || pointer.isDown)) {
      const worldPoint = this.scene.cameras.main.getWorldPoint(pointer.x, pointer.y);
      const dist = Phaser.Math.Distance.Between(this.x, this.y, worldPoint.x, worldPoint.y);
      if (dist > 18) {
        const angle = Phaser.Math.Angle.Between(this.x, this.y, worldPoint.x, worldPoint.y);
        vx = Math.cos(angle) * speed;
        vy = Math.sin(angle) * speed;

        if (Math.abs(vx) > Math.abs(vy)) {
          this.facing = vx > 0 ? 'right' : 'left';
        } else {
          this.facing = vy > 0 ? 'down' : 'up';
        }
      }
    }

    // Normalize diagonal movement
    if (vx !== 0 && vy !== 0 && (!pointer.isDown || !this.pointerIsDragging)) {
      vx *= 0.7071;
      vy *= 0.7071;
    }

    this.setVelocity(vx, vy);

    // Attack input
    const attackPressed =
      this.activeKeys.has('Space') ||
      this.activeKeys.has('KeyJ') ||
      this.activeKeys.has('j') ||
      Phaser.Input.Keyboard.JustDown(this.wasdKeys?.SPACE) ||
      Phaser.Input.Keyboard.JustDown(this.wasdKeys?.J);

    if (attackPressed) {
      this.tryAttack(time);
    }
  }

  public tryAttack(time: number): void {
    const cooldown = this.getAttackCooldown();
    if (time - this.lastAttackTime < cooldown) {
      return;
    }
    this.lastAttackTime = time;
    this.performClassAttack();
  }

  private getAttackCooldown(): number {
    switch (this.gameState.player.classType) {
      case 'thief':
        return 220;
      case 'warrior':
        return 380;
      case 'paladin':
        return 460;
      case 'mage':
        return 550;
      default:
        return 400;
    }
  }

  private performClassAttack(): void {
    const attackType = this.gameState.player.classType;

    let offsetX = 0;
    let offsetY = 0;
    let angle = 0;

    switch (this.facing) {
      case 'right':
        offsetX = 28;
        angle = 0;
        break;
      case 'left':
        offsetX = -28;
        angle = 180;
        break;
      case 'up':
        offsetY = -28;
        angle = -90;
        break;
      case 'down':
        offsetY = 28;
        angle = 90;
        break;
    }

    const attackX = this.x + offsetX;
    const attackY = this.y + offsetY;

    if (attackType === 'mage') {
      this.scene.events.emit('player-fire-projectile', {
        x: this.x,
        y: this.y,
        facing: this.facing,
        damage: this.gameState.player.attack,
        source: 'player'
      });
    } else {
      this.scene.events.emit('player-melee-attack', {
        x: attackX,
        y: attackY,
        angle,
        facing: this.facing,
        damage: this.gameState.player.attack,
        range: attackType === 'paladin' ? 44 : (attackType === 'thief' ? 32 : 40),
        classType: attackType
      });
    }

    this.scene.cameras.main.shake(60, 0.002);
  }

  public takeDamage(amount: number): void {
    if (this.isInvulnerable || this.gameState.player.hp <= 0) return;

    const effectiveDamage = Math.max(1, Math.round(amount - this.gameState.player.defense / 2));
    this.gameState.player.hp = Math.max(0, this.gameState.player.hp - effectiveDamage);

    this.setTint(0xff3333);
    this.isInvulnerable = true;

    this.scene.time.delayedCall(160, () => {
      this.clearTint();
    });

    this.scene.time.delayedCall(450, () => {
      this.isInvulnerable = false;
    });

    this.scene.cameras.main.shake(120, 0.006);

    if (this.gameState.player.hp <= 0) {
      this.scene.events.emit('player-died');
    }
  }
}
