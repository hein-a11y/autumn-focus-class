import Phaser from 'phaser';
import { CompanionData } from '../managers/GameState';
import { Player } from './Player';
import { Monster } from './Monster';

export class Companion extends Phaser.Physics.Arcade.Sprite {
  public companionData: CompanionData;
  private player: Player;
  private targetMonster: Monster | null = null;
  private lastAttackTime: number = 0;
  private aiState: 'idle' | 'follow' | 'attack' | 'gather' = 'idle';
  private targetNode: any | null = null;
  private lastGatherTime: number = 0;

  constructor(scene: Phaser.Scene, x: number, y: number, data: CompanionData, player: Player) {
    super(scene, x, y, `char_${data.classType}_${data.gender}`);
    this.companionData = data;
    this.player = player;

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setCollideWorldBounds(true);
    this.setSize(18, 22);
    this.setOffset(7, 9);
    this.setDepth(9);
  }

  private walkTween: Phaser.Tweens.Tween | null = null;
  private attackTween: Phaser.Tweens.Tween | null = null;

  public update(time: number, nearbyMonsters: Monster[], nodes: any[] = []): void {
    if (!this.body || this.companionData.hp <= 0) {
      this.setVelocity(0, 0);
      return;
    }

    const distToPlayer = Phaser.Math.Distance.Between(this.x, this.y, this.player.x, this.player.y);

    // If player is very far (> 350px), teleport close to player (prevents getting stuck)
    if (distToPlayer > 350) {
      this.setPosition(
        this.player.x + Phaser.Math.Between(-30, 30),
        this.player.y + Phaser.Math.Between(-30, 30)
      );
      this.setVelocity(0, 0);
      return;
    }

    // Search for closest monster within 120px aggro range
    let closestDist = 120;
    let closestMonster: Monster | null = null;

    for (const monster of nearbyMonsters) {
      if (monster.isAlive()) {
        const d = Phaser.Math.Distance.Between(this.x, this.y, monster.x, monster.y);
        if (d < closestDist) {
          closestDist = d;
          closestMonster = monster;
        }
      }
    }

    this.targetMonster = closestMonster;

    // Search for closest node if idle
    let closestNodeDist = 150;
    this.targetNode = null;
    if (!this.targetMonster) {
      for (const node of nodes) {
        if (!node.isMined && !node.isHarvested) {
          const d = Phaser.Math.Distance.Between(this.x, this.y, node.sprite.x, node.sprite.y);
          if (d < closestNodeDist) {
            closestNodeDist = d;
            this.targetNode = node;
          }
        }
      }
    }

    // State machine logic
    if (this.targetMonster && distToPlayer < 200) {
      this.aiState = 'attack';
      this.handleAttackState(time, this.targetMonster);
    } else if (this.targetNode && distToPlayer < 200) {
      this.aiState = 'gather';
      this.handleGatherState(time, this.targetNode);
    } else if (distToPlayer > 60) {
      this.aiState = 'follow';
      this.handleFollowState();
    } else {
      this.aiState = 'idle';
      this.setVelocity(0, 0);
    }

    // Handle walk tween
    const isMoving = this.body.velocity.x !== 0 || this.body.velocity.y !== 0;
    const isAttacking = this.attackTween && this.attackTween.isPlaying();

    if (isMoving && !isAttacking) {
      if (!this.walkTween || !this.walkTween.isPlaying()) {
        this.walkTween = this.scene.tweens.add({
          targets: this,
          angle: { from: -10, to: 10 },
          duration: 150,
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

  private handleFollowState(): void {
    const angle = Phaser.Math.Angle.Between(this.x, this.y, this.player.x, this.player.y);
    const speed = this.companionData.speed;
    this.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed);
  }

  private handleGatherState(time: number, node: any): void {
    const dist = Phaser.Math.Distance.Between(this.x, this.y, node.sprite.x, node.sprite.y);
    if (dist > 36) {
      const angle = Phaser.Math.Angle.Between(this.x, this.y, node.sprite.x, node.sprite.y);
      this.setVelocity(Math.cos(angle) * this.companionData.speed, Math.sin(angle) * this.companionData.speed);
    } else {
      this.setVelocity(0, 0);
      if (time - this.lastGatherTime > 1500) { // 1.5s gather time
        this.lastGatherTime = time;
        this.scene.events.emit('companion-gather', { companion: this, node });
        if (this.walkTween && this.walkTween.isPlaying()) this.walkTween.stop();
        this.scene.tweens.add({
          targets: this,
          y: this.y - 10,
          duration: 100,
          yoyo: true
        });
      }
    }
  }

  private handleAttackState(time: number, monster: Monster): void {
    const dist = Phaser.Math.Distance.Between(this.x, this.y, monster.x, monster.y);
    const isMage = this.companionData.classType === 'mage';
    const preferredRange = isMage ? 100 : 36;

    if (dist > preferredRange) {
      // Approach target
      const angle = Phaser.Math.Angle.Between(this.x, this.y, monster.x, monster.y);
      this.setVelocity(Math.cos(angle) * this.companionData.speed, Math.sin(angle) * this.companionData.speed);
    } else {
      // Within attack range, stop and attack
      this.setVelocity(0, 0);

      const cooldown = isMage ? 650 : (this.companionData.classType === 'thief' ? 260 : 450);
      if (time - this.lastAttackTime > cooldown) {
        this.lastAttackTime = time;
        this.executeAttack(monster);
      }
    }
  }

  private executeAttack(monster: Monster): void {
    const angle = Phaser.Math.Angle.Between(this.x, this.y, monster.x, monster.y);
    
    // Stop walk tween if any
    if (this.walkTween && this.walkTween.isPlaying()) {
      this.walkTween.stop();
      this.angle = 0;
    }

    // Lunge tween
    this.attackTween = this.scene.tweens.add({
      targets: this,
      x: this.x + Math.cos(angle) * 15,
      y: this.y + Math.sin(angle) * 15,
      duration: 100,
      yoyo: true,
      ease: 'Power2'
    });
    
    if (this.companionData.classType === 'mage') {
      this.scene.events.emit('companion-fire-projectile', {
        x: this.x,
        y: this.y,
        targetX: monster.x,
        targetY: monster.y,
        damage: this.companionData.attack,
        source: 'companion'
      });
    } else {
      // Melee attack
      this.scene.events.emit('companion-melee-attack', {
        x: this.x + Math.cos(angle) * 24,
        y: this.y + Math.sin(angle) * 24,
        damage: this.companionData.attack,
        classType: this.companionData.classType,
        target: monster
      });
    }
  }

  public takeDamage(amount: number): void {
    const damage = Math.max(1, Math.round(amount - this.companionData.defense / 2));
    this.companionData.hp = Math.max(0, this.companionData.hp - damage);

    this.setTint(0xff5555);
    this.scene.time.delayedCall(150, () => {
      this.clearTint();
    });
  }
}
