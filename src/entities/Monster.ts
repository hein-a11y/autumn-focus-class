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
      this.setSize(180, 180);
      this.setOffset((237 - 180) / 2, 231 - 180); // Bottom center of the 237x231 sprite
      this.setScale(0.8); // Slightly scale down
    } else if (def.id === 'volcano_dragon') {
      this.setScale(1.2); 
      this.setSize(180, 120);
      this.setOffset((209 - 180) / 2, (146 - 120) / 2 + 10);
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

        const isClose = dist < 65 + (this.displayWidth / 2);
        const targetSprite = target as unknown as Phaser.Physics.Arcade.Sprite;
        this.handleBossCombat(time, targetSprite, dist, angle);
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

  private handleBossCombat(time: number, target: Phaser.Physics.Arcade.Sprite, dist: number, angle: number): void {
    const isClose = dist < 65 + (this.displayWidth / 2);
    
    // Default cooldowns
    const aoeCooldown = 8000;
    const meleeCooldown = 1200;
    const rangedCooldown = 1500;

    // Define unique skills based on boss ID
    switch (this.monsterDef.id) {
      case 'king_slime':
        this.handleKingSlimeCombat(time, target, dist, angle, isClose, aoeCooldown, meleeCooldown, rangedCooldown);
        break;
      case 'giant_spider':
        this.handleGiantSpiderCombat(time, target, dist, angle, isClose, aoeCooldown, meleeCooldown, rangedCooldown);
        break;
      case 'volcano_dragon':
        this.handleVolcanoDragonCombat(time, target, dist, angle, isClose, aoeCooldown, meleeCooldown, rangedCooldown);
        break;
      case 'crystal_dragon':
        this.handleCrystalDragonCombat(time, target, dist, angle, isClose, aoeCooldown, meleeCooldown, rangedCooldown);
        break;
      case 'demon_lord':
      default:
        this.handleDemonLordCombat(time, target, dist, angle, isClose, aoeCooldown, meleeCooldown, rangedCooldown);
        break;
    }
  }

  private triggerAoE(radius: number, color: number, damageMult: number, knockbackDist: number): void {
    this.scene.tweens.add({
      targets: this,
      scale: this.scaleX * 1.15,
      yoyo: true,
      duration: 200,
      ease: 'Sine.easeInOut'
    });

    const aoeCircle = this.scene.add.circle(this.x, this.y, radius, color, 0.4).setDepth(19);
    this.scene.tweens.add({
      targets: aoeCircle,
      scale: 1.5,
      alpha: 0,
      duration: 400,
      onComplete: () => aoeCircle.destroy()
    });

    const scene = this.scene as any;
    const targetsToHit = [];
    if (scene.player && Phaser.Math.Distance.Between(this.x, this.y, scene.player.x, scene.player.y) <= radius) {
      targetsToHit.push(scene.player);
    }
    if (scene.companions) {
      scene.companions.forEach((comp: any) => {
        if (comp.companionData && comp.companionData.hp > 0 && Phaser.Math.Distance.Between(this.x, this.y, comp.x, comp.y) <= radius) {
          targetsToHit.push(comp);
        }
      });
    }

    targetsToHit.forEach(t => {
      if (t.takeDamage) t.takeDamage(this.monsterDef.attack * damageMult);
      const angleToT = Phaser.Math.Angle.Between(this.x, this.y, t.x, t.y);
      this.scene.tweens.add({
        targets: t,
        x: t.x + Math.cos(angleToT) * knockbackDist,
        y: t.y + Math.sin(angleToT) * knockbackDist,
        duration: 200,
        ease: 'Power2'
      });
    });
  }

  private performStandardMelee(time: number, target: Phaser.Physics.Arcade.Sprite, angle: number): void {
    this.lastAttackTime = time;
    (target as any).takeDamage(this.monsterDef.attack);
    
    this.scene.tweens.add({
      targets: this,
      x: this.x + Math.cos(angle) * 15,
      y: this.y + Math.sin(angle) * 15,
      yoyo: true,
      duration: 100,
      ease: 'Power2'
    });

    const slash = this.scene.add.sprite(target.x, target.y, 'effect_slash').setDepth(20).setTint(0xff5555);
    this.scene.tweens.add({ targets: slash, alpha: 0, scale: 1.5, duration: 150, onComplete: () => slash.destroy() });
  }

  private performRangedAttack(time: number, target: Phaser.Physics.Arcade.Sprite, angle: number, color: number, speed: number, offsetAngle: number = 0): void {
    this.lastAttackTime = time;
    
    this.scene.tweens.add({
      targets: this,
      y: this.y - 15,
      yoyo: true,
      duration: 100,
      ease: 'Power2'
    });

    const orb = this.scene.physics.add.sprite(this.x, this.y, 'effect_magic_orb').setDepth(20).setTint(color);
    const finalAngle = angle + offsetAngle;
    orb.setVelocity(Math.cos(finalAngle) * speed, Math.sin(finalAngle) * speed);
    
    this.scene.physics.add.overlap(orb, target, (o, t) => {
      (target as any).takeDamage(this.monsterDef.attack);
      orb.destroy();
    });
    
    this.scene.time.delayedCall(2000, () => {
      if (orb.active) orb.destroy();
    });
  }

  private handleKingSlimeCombat(time: number, target: Phaser.Physics.Arcade.Sprite, dist: number, angle: number, isClose: boolean, aoeCooldown: number, meleeCooldown: number, rangedCooldown: number): void {
    // King Slime: Huge jump AoE
    if (isClose) {
      if (time - (this as any).lastBossAoETime > 6000 || !(this as any).lastBossAoETime) {
        (this as any).lastBossAoETime = time;
        // Jump high, then smash
        this.scene.tweens.add({
          targets: this,
          y: this.y - 100,
          scale: 1.2,
          duration: 300,
          yoyo: true,
          ease: 'Sine.easeOut',
          onComplete: () => {
            this.triggerAoE(100 + (this.displayWidth / 2), 0x33cc66, 2.0, 150);
          }
        });
      } else if (dist < 40 + (this.displayWidth / 2) && time - this.lastAttackTime > meleeCooldown) {
        this.performStandardMelee(time, target, angle);
      }
    } else {
      if (time - this.lastAttackTime > rangedCooldown) {
        this.performRangedAttack(time, target, angle, 0x33cc66, 150);
      }
    }
  }

  private handleGiantSpiderCombat(time: number, target: Phaser.Physics.Arcade.Sprite, dist: number, angle: number, isClose: boolean, aoeCooldown: number, meleeCooldown: number, rangedCooldown: number): void {
    // Giant Spider: Web Shot (fast, white, 3 projectiles)
    if (isClose) {
      if (time - (this as any).lastBossAoETime > 7000 || !(this as any).lastBossAoETime) {
        (this as any).lastBossAoETime = time;
        this.triggerAoE(85 + (this.displayWidth / 2), 0xdddddd, 1.2, 50);
      } else if (dist < 40 + (this.displayWidth / 2) && time - this.lastAttackTime > meleeCooldown) {
        this.performStandardMelee(time, target, angle);
      }
    } else {
      if (time - this.lastAttackTime > rangedCooldown + 500) { // slower ranged but 3 shots
        this.performRangedAttack(time, target, angle, 0xffffff, 250, -0.2);
        this.performRangedAttack(time, target, angle, 0xffffff, 250, 0);
        this.performRangedAttack(time, target, angle, 0xffffff, 250, 0.2);
      }
    }
  }

  private handleVolcanoDragonCombat(time: number, target: Phaser.Physics.Arcade.Sprite, dist: number, angle: number, isClose: boolean, aoeCooldown: number, meleeCooldown: number, rangedCooldown: number): void {
    // Volcano Dragon: Fire Breath (cone of 5 projectiles) + Meteor Shower
    
    // Meteor Shower (Every 6 seconds)
    if (time - (this as any).lastMeteorTime > 6000 || !(this as any).lastMeteorTime) {
      (this as any).lastMeteorTime = time;
      
      // Spawn 4 warning circles near the player
      for (let i = 0; i < 4; i++) {
        const mx = target.x + Phaser.Math.Between(-150, 150);
        const my = target.y + Phaser.Math.Between(-150, 150);
        
        const warning = this.scene.add.circle(mx, my, 40, 0xffaa00, 0.3).setDepth(15);
        this.scene.tweens.add({
          targets: warning,
          alpha: 0.8,
          scale: 1.2,
          duration: 1000,
          onComplete: () => {
            warning.destroy();
            // Explosion
            const explosion = this.scene.add.circle(mx, my, 45, 0xff0000, 0.8).setDepth(21);
            this.scene.tweens.add({
              targets: explosion,
              alpha: 0,
              scale: 1.5,
              duration: 300,
              onComplete: () => explosion.destroy()
            });

            // Check damage
            const scene = this.scene as any;
            if (scene.player && Phaser.Math.Distance.Between(mx, my, scene.player.x, scene.player.y) <= 45) {
              scene.player.takeDamage(this.monsterDef.attack * 2);
            }
            if (scene.companions) {
              scene.companions.forEach((comp: any) => {
                if (comp.companionData && comp.companionData.hp > 0 && Phaser.Math.Distance.Between(mx, my, comp.x, comp.y) <= 45) {
                  comp.takeDamage(this.monsterDef.attack * 2);
                }
              });
            }
          }
        });
      }
    }

    if (isClose) {
      if (time - (this as any).lastBossAoETime > 8000 || !(this as any).lastBossAoETime) {
        (this as any).lastBossAoETime = time;
        this.triggerAoE(120 + (this.displayWidth / 2), 0xff3300, 1.8, 120);
      } else if (dist < 40 + (this.displayWidth / 2) && time - this.lastAttackTime > meleeCooldown) {
        this.performStandardMelee(time, target, angle);
      }
    } else {
      if (time - this.lastAttackTime > rangedCooldown) {
        for (let i = -2; i <= 2; i++) {
          this.performRangedAttack(time, target, angle, 0xff5500, 200, i * 0.15);
        }
      }
    }
  }

  private handleCrystalDragonCombat(time: number, target: Phaser.Physics.Arcade.Sprite, dist: number, angle: number, isClose: boolean, aoeCooldown: number, meleeCooldown: number, rangedCooldown: number): void {
    // Crystal Dragon: Fast ice shards
    if (isClose) {
      if (time - (this as any).lastBossAoETime > 9000 || !(this as any).lastBossAoETime) {
        (this as any).lastBossAoETime = time;
        this.triggerAoE(130 + (this.displayWidth / 2), 0x00ffff, 1.5, 80);
      } else if (dist < 40 + (this.displayWidth / 2) && time - this.lastAttackTime > meleeCooldown - 200) {
        this.performStandardMelee(time, target, angle);
      }
    } else {
      if (time - this.lastAttackTime > rangedCooldown - 300) {
        this.performRangedAttack(time, target, angle, 0x88ccff, 350); // very fast
      }
    }
  }

  private handleDemonLordCombat(time: number, target: Phaser.Physics.Arcade.Sprite, dist: number, angle: number, isClose: boolean, aoeCooldown: number, meleeCooldown: number, rangedCooldown: number): void {
    // Demon Lord: Massive AoE, Dark Orb
    if (isClose) {
      if (time - (this as any).lastBossAoETime > 8000 || !(this as any).lastBossAoETime) {
        (this as any).lastBossAoETime = time;
        this.triggerAoE(160 + (this.displayWidth / 2), 0xff0000, 1.5, 100);
      } else if (dist < 40 + (this.displayWidth / 2) && time - this.lastAttackTime > meleeCooldown) {
        this.performStandardMelee(time, target, angle);
      }
    } else {
      if (time - this.lastAttackTime > rangedCooldown) {
        this.performRangedAttack(time, target, angle, 0xff55ff, 220);
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
