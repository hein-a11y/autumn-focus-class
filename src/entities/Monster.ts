import Phaser from 'phaser';
import { MonsterDefinition } from '../data/monsters';

export class Monster extends Phaser.Physics.Arcade.Sprite {
  public monsterDef: MonsterDefinition;
  public currentHp: number;
  private lastAttackTime: number = 0;
  private nextPatrolTime: number = 0;
  private patrolDirection: { x: number; y: number } = { x: 0, y: 0 };
  private isDead: boolean = false;
  private hpBar?: Phaser.GameObjects.Graphics;
  private walkTween: Phaser.Tweens.Tween | null = null;
  private isAggroed: boolean = false;
  private bossHpBarBg?: Phaser.GameObjects.Graphics;
  private bossHpBarFg?: Phaser.GameObjects.Graphics;
  private bossHpBarText?: Phaser.GameObjects.Text;

  constructor(scene: Phaser.Scene, x: number, y: number, def: MonsterDefinition) {
    super(scene, x, y, `monster_${def.id}`);
    this.monsterDef = def;
    this.currentHp = def.maxHp;

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setCollideWorldBounds(true);
    const boxSize = Math.max(14, def.size);
    this.setSize(boxSize, boxSize);
    this.setDepth(8);

    this.hpBar = scene.add.graphics();
    this.hpBar.setDepth(15);

    if (this.monsterDef.isBoss) {
      this.bossHpBarBg = scene.add.graphics();
      this.bossHpBarBg.setScrollFactor(0);
      this.bossHpBarBg.setDepth(200);

      this.bossHpBarFg = scene.add.graphics();
      this.bossHpBarFg.setScrollFactor(0);
      this.bossHpBarFg.setDepth(201);

      this.bossHpBarText = scene.add.text(scene.cameras.main.width / 2, 30, def.name || 'BOSS', {
        fontSize: '20px',
        color: '#ffffff',
        stroke: '#000000',
        strokeThickness: 4,
        fontFamily: 'sans-serif'
      }).setOrigin(0.5).setScrollFactor(0).setDepth(202);
    }

    this.updateHpBar();
  }

  public isAlive(): boolean {
    return !this.isDead && this.currentHp > 0;
  }

  public update(time: number, target: { x: number; y: number; takeDamage: (dmg: number) => void } | null): void {
    if (!this.body || this.isDead) return;

    this.updateHpBar();

    if (!target) {
      this.handlePatrol(time);
      return;
    }

    const dist = Phaser.Math.Distance.Between(this.x, this.y, target.x, target.y);
    const aggroRange = this.monsterDef.isBoss ? 260 : 140;

    if (this.isAggroed || dist <= aggroRange) {
      // Chase target
      const angle = Phaser.Math.Angle.Between(this.x, this.y, target.x, target.y);
      this.setVelocity(
        Math.cos(angle) * this.monsterDef.speed,
        Math.sin(angle) * this.monsterDef.speed
      );

      // Attack if in contact range
      if (dist < 32 && time - this.lastAttackTime > 800) {
        this.lastAttackTime = time;
        target.takeDamage(this.monsterDef.attack);
      }
    } else {
      this.handlePatrol(time);
    }

    // Handle walk tween
    const isMoving = this.body.velocity.x !== 0 || this.body.velocity.y !== 0;

    if (isMoving) {
      if (!this.walkTween || !this.walkTween.isPlaying()) {
        this.walkTween = this.scene.tweens.add({
          targets: this,
          angle: { from: -8, to: 8 },
          duration: 180,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut'
        });
      }
    } else {
      if (this.walkTween && this.walkTween.isPlaying()) {
        this.walkTween.stop();
        this.angle = 0;
      }
    }
  }

  private handlePatrol(time: number): void {
    if (time > this.nextPatrolTime) {
      this.nextPatrolTime = time + Phaser.Math.Between(1500, 3500);
      const isMoving = Phaser.Math.Between(0, 1) === 1;
      if (isMoving) {
        const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
        const patrolSpeed = this.monsterDef.speed * 0.45;
        this.patrolDirection = {
          x: Math.cos(angle) * patrolSpeed,
          y: Math.sin(angle) * patrolSpeed
        };
      } else {
        this.patrolDirection = { x: 0, y: 0 };
      }
    }
    this.setVelocity(this.patrolDirection.x, this.patrolDirection.y);
  }

  private updateHpBar(): void {
    if (!this.hpBar) return;
    this.hpBar.clear();

    if (this.monsterDef.isBoss && this.bossHpBarBg && this.bossHpBarFg) {
      this.bossHpBarBg.clear();
      this.bossHpBarFg.clear();
      
      const camW = this.scene.cameras.main.width;
      const barW = 400;
      const barH = 20;
      const barX = (camW - barW) / 2;
      const barY = 50;

      // Background
      this.bossHpBarBg.fillStyle(0x000000, 0.8);
      this.bossHpBarBg.fillRect(barX, barY, barW, barH);
      this.bossHpBarBg.lineStyle(2, 0xffd700, 1);
      this.bossHpBarBg.strokeRect(barX, barY, barW, barH);

      // Foreground
      const hpRatio = Math.max(0, this.currentHp / this.monsterDef.maxHp);
      this.bossHpBarFg.fillStyle(0xe74c3c, 1);
      this.bossHpBarFg.fillRect(barX + 2, barY + 2, (barW - 4) * hpRatio, barH - 4);
      
      return; // Skip drawing small HP bar for bosses
    }

    if (this.currentHp >= this.monsterDef.maxHp) {
      return; // Don't show if full HP
    }

    const barW = Math.max(24, this.monsterDef.size);
    const barH = 4;
    const barX = this.x - barW / 2;
    const barY = this.y - this.height / 2 - 8;

    // Background
    this.hpBar.fillStyle(0x000000, 0.7);
    this.hpBar.fillRect(barX, barY, barW, barH);

    // Foreground
    const hpRatio = Math.max(0, this.currentHp / this.monsterDef.maxHp);
    const color = hpRatio > 0.5 ? 0x2ecc71 : hpRatio > 0.25 ? 0xf39c12 : 0xe74c3c;
    this.hpBar.fillStyle(color, 1);
    this.hpBar.fillRect(barX, barY, barW * hpRatio, barH);
  }

  public takeDamage(amount: number, knockbackAngle?: number): void {
    if (this.isDead) return;

    this.isAggroed = true;

    const damage = Math.max(1, Math.round(amount - this.monsterDef.defense / 2));
    this.currentHp = Math.max(0, this.currentHp - damage);

    // Floating combat text
    this.showDamageText(damage);

    // Knockback
    if (knockbackAngle !== undefined && this.body) {
      const kbForce = this.monsterDef.isBoss ? 40 : 120;
      this.setVelocity(Math.cos(knockbackAngle) * kbForce, Math.sin(knockbackAngle) * kbForce);
    }

    // Flash white/red
    this.setTint(0xff2222);
    this.scene.time.delayedCall(120, () => {
      if (this.active) {
        this.clearTint();
      }
    });

    if (this.currentHp <= 0) {
      this.die();
    }
  }

  private showDamageText(dmg: number): void {
    const text = this.scene.add.text(
      this.x + Phaser.Math.Between(-8, 8),
      this.y - 12,
      `-${dmg}`,
      {
        fontSize: '13px',
        color: '#ff3344',
        stroke: '#000000',
        strokeThickness: 3,
        fontFamily: 'monospace',
        fontStyle: 'bold'
      }
    );
    text.setDepth(25);

    this.scene.tweens.add({
      targets: text,
      y: text.y - 24,
      alpha: 0,
      duration: 600,
      ease: 'Power1',
      onComplete: () => {
        text.destroy();
      }
    });
  }

  private die(): void {
    this.isDead = true;
    this.setVelocity(0, 0);

    if (this.hpBar) {
      this.hpBar.destroy();
    }
    if (this.bossHpBarBg) this.bossHpBarBg.destroy();
    if (this.bossHpBarFg) this.bossHpBarFg.destroy();
    if (this.bossHpBarText) this.bossHpBarText.destroy();

    // Emit event for quest & exp rewards
    this.scene.events.emit('monster-killed', {
      monster: this,
      def: this.monsterDef,
      x: this.x,
      y: this.y
    });

    // Death fade-out tween
    this.scene.tweens.add({
      targets: this,
      alpha: 0,
      scaleX: 0.5,
      scaleY: 0.5,
      duration: 250,
      onComplete: () => {
        this.destroy();
      }
    });
  }

  public destroy(fromScene?: boolean): void {
    if (this.hpBar) {
      this.hpBar.destroy();
    }
    if (this.bossHpBarBg) this.bossHpBarBg.destroy();
    if (this.bossHpBarFg) this.bossHpBarFg.destroy();
    if (this.bossHpBarText) this.bossHpBarText.destroy();
    super.destroy(fromScene);
  }
}
