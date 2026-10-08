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

  constructor(scene: Phaser.Scene, x: number, y: number, def: MonsterDefinition) {
    const textureKey = def.id === 'demon_lord' ? 'monster_demon_lord_sprite' : `monster_${def.id}`;
    super(scene, x, y, textureKey);
    this.monsterDef = def;
    this.currentHp = def.maxHp;

    if (def.id === 'giant_spider') {
      this.setFrame(7); // Face south (Row 2, Frame 1)
    }

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setCollideWorldBounds(true);
    let boxSize = Math.max(14, def.size);
    
    if (def.id === 'demon_lord') {
      this.setSize(50, 50);
      this.setOffset((237 - 50) / 2, 231 - 50); // Feet of the 237x231 sprite
      this.setScale(0.8); // Slightly scale down
    } else {
      this.setSize(boxSize, boxSize);
    }
    
    this.setDepth(8);

    this.hpBar = scene.add.graphics();
    this.hpBar.setDepth(15);
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
      const angle = Phaser.Math.Angle.Between(this.x, this.y, target.x, target.y);
      
      if (this.monsterDef.isBoss) {
        const optimalDistance = 140;
        
        // Approach if too far, otherwise stay in place
        if (dist > optimalDistance) {
          this.setVelocity(
            Math.cos(angle) * this.monsterDef.speed,
            Math.sin(angle) * this.monsterDef.speed
          );
        } else {
          this.setVelocity(0, 0); // Don't run away!
        }

        const isClose = dist < 65;
        const targetSprite = target as unknown as Phaser.Physics.Arcade.Sprite;

        // If target is close, boss considers AoE or Melee
        if (isClose) {
          if (time - (this as any).lastBossAoETime > 8000 || !(this as any).lastBossAoETime) {
            (this as any).lastBossAoETime = time;
            
            // Boss AoE Animation (charge up effect)
            this.scene.tweens.add({
              targets: this,
              scale: this.scaleX * 1.15,
              yoyo: true,
              duration: 200,
              ease: 'Sine.easeInOut'
            });

            // Trigger AoE Knockback
            const aoeCircle = this.scene.add.circle(this.x, this.y, 85, 0xff0000, 0.4).setDepth(19);
            this.scene.tweens.add({
              targets: aoeCircle,
              scale: 1.5,
              alpha: 0,
              duration: 400,
              onComplete: () => aoeCircle.destroy()
            });

            // Hit all nearby characters
            const scene = this.scene as any;
            const targetsToHit = [];
            if (scene.player && Phaser.Math.Distance.Between(this.x, this.y, scene.player.x, scene.player.y) <= 90) {
              targetsToHit.push(scene.player);
            }
            if (scene.companions) {
              scene.companions.forEach((comp: any) => {
                if (comp.companionData && comp.companionData.hp > 0 && Phaser.Math.Distance.Between(this.x, this.y, comp.x, comp.y) <= 90) {
                  targetsToHit.push(comp);
                }
              });
            }

            targetsToHit.forEach(t => {
              if (t.takeDamage) t.takeDamage(this.monsterDef.attack * 1.5);
              const angleToT = Phaser.Math.Angle.Between(this.x, this.y, t.x, t.y);
              this.scene.tweens.add({
                targets: t,
                x: t.x + Math.cos(angleToT) * 100,
                y: t.y + Math.sin(angleToT) * 100,
                duration: 200,
                ease: 'Power2'
              });
            });

          } else if (dist < 40 && time - this.lastAttackTime > 1200) {
            // Standard Melee if close
            this.lastAttackTime = time;
            target.takeDamage(this.monsterDef.attack);
            
            // Boss Melee Animation (Lunge)
            this.scene.tweens.add({
              targets: this,
              x: this.x + Math.cos(angle) * 15,
              y: this.y + Math.sin(angle) * 15,
              yoyo: true,
              duration: 100,
              ease: 'Power2'
            });

            // Visual feedback for boss melee
            const slash = this.scene.add.sprite(targetSprite.x, targetSprite.y, 'effect_slash').setDepth(20).setTint(0xff5555);
            this.scene.tweens.add({ targets: slash, alpha: 0, scale: 1.5, duration: 150, onComplete: () => slash.destroy() });
          }
        } else {
          // If not close, use ranged attack
          if (time - this.lastAttackTime > 1500) {
            this.lastAttackTime = time;
            
            // Boss Ranged Animation (Hop)
            this.scene.tweens.add({
              targets: this,
              y: this.y - 15,
              yoyo: true,
              duration: 100,
              ease: 'Power2'
            });

            const orb = this.scene.physics.add.sprite(this.x, this.y, 'effect_magic_orb').setDepth(20).setTint(0xff55ff);
            const orbSpeed = 220;
            orb.setVelocity(Math.cos(angle) * orbSpeed, Math.sin(angle) * orbSpeed);
            
            this.scene.physics.add.overlap(orb, targetSprite, (o, t) => {
              target.takeDamage(this.monsterDef.attack);
              orb.destroy();
            });
            
            this.scene.time.delayedCall(2000, () => {
              if (orb.active) orb.destroy();
            });
          }
        }
      } else {
        // Normal monster behavior: chase and melee
        this.setVelocity(
          Math.cos(angle) * this.monsterDef.speed,
          Math.sin(angle) * this.monsterDef.speed
        );

        // Attack if in contact range
        if (dist < 32 && time - this.lastAttackTime > 800) {
          this.lastAttackTime = time;
          target.takeDamage(this.monsterDef.attack);
          
          // Normal Monster Melee Animation (Lunge)
          this.scene.tweens.add({
            targets: this,
            x: this.x + Math.cos(angle) * 10,
            y: this.y + Math.sin(angle) * 10,
            yoyo: true,
            duration: 100,
            ease: 'Power2'
          });
        }
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

    if (this.currentHp >= this.monsterDef.maxHp) {
      return; // Don't show if full HP
    }

    const barW = Math.max(24, this.monsterDef.size);
    const barH = 4;
    const barX = this.x - barW / 2;
    const barY = this.y - (this.height * this.scaleY) / 2 - 8;

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
    super.destroy(fromScene);
  }
}
