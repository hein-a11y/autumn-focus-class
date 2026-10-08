import Phaser from 'phaser';
import { CompanionData, GameState } from '../managers/GameState';
import { Player } from './Player';
import { Monster } from './Monster';
import { CLASS_SKILLS } from '../data/skills';

export class Companion extends Phaser.Physics.Arcade.Sprite {
  public companionData: CompanionData;
  private player: Player;
  private targetMonster: Monster | null = null;
  private lastAttackTime: number = 0;
  private lastSkillTime: number = 0;
  private skillCooldownText!: Phaser.GameObjects.Text;
  
  public activeAttackMultiplier: number = 1;
  public bonusAttack: number = 0;
  public bonusDefense: number = 0;
  
  private aiState: 'idle' | 'follow' | 'attack' = 'idle';

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

    this.skillCooldownText = scene.add.text(x, y - 20, 'Skill: Ready', {
      fontSize: '8px',
      color: '#00ff00',
      backgroundColor: '#000000aa',
      padding: { x: 2, y: 1 }
    }).setOrigin(0.5).setDepth(20);
  }

  public destroy(fromScene?: boolean): void {
    if (this.skillCooldownText) {
      this.skillCooldownText.destroy();
    }
    super.destroy(fromScene);
  }

  private walkTween: Phaser.Tweens.Tween | null = null;
  private attackTween: Phaser.Tweens.Tween | null = null;

  public update(time: number, nearbyMonsters: Monster[]): void {
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

    // State machine logic from GDD Section 6:
    // 1. Attack State: enemy within 120px
    // 2. Follow State: distance to player > 60px
    // 3. Idle State: close to player, no enemies
    if (this.targetMonster && distToPlayer < 200) {
      this.aiState = 'attack';
      this.handleAttackState(time, this.targetMonster);
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

    // Update skill text UI
    if (this.skillCooldownText) {
      this.skillCooldownText.setPosition(this.x, this.y - 20);
      const skillDef = CLASS_SKILLS[this.companionData.classType];
      if (skillDef) {
        const timeSinceSkill = time - this.lastSkillTime;
        if (timeSinceSkill < skillDef.cooldown) {
          const remaining = ((skillDef.cooldown - timeSinceSkill) / 1000).toFixed(1);
          this.skillCooldownText.setText(`CD: ${remaining}s`);
          this.skillCooldownText.setColor('#ffaaaa');
        } else {
          this.skillCooldownText.setText(skillDef.name);
          this.skillCooldownText.setColor('#aaffaa');
        }
      } else {
        this.skillCooldownText.setVisible(false);
      }
    }
  }

  private trySkill(time: number): void {
    const c = this.companionData;
    const skillDef = CLASS_SKILLS[c.classType];
    if (!skillDef) return;

    if (time - this.lastSkillTime < skillDef.cooldown) return;
    if (c.mp < skillDef.costMp) return; // not enough mp

    c.mp -= skillDef.costMp;
    this.lastSkillTime = time;

    if (c.classType === 'warrior') {
      this.bonusAttack = 10;
      this.bonusDefense = 10;
      this.scene.time.delayedCall(8000, () => {
        this.bonusAttack = 0;
        this.bonusDefense = 0;
      });
    } else if (c.classType === 'thief') {
      this.activeAttackMultiplier = 2;
    } else if (c.classType === 'paladin') {
      const healAmount = Math.floor(c.maxHp * 0.3);
      c.hp = Math.min(c.maxHp, c.hp + healAmount);
      // Heal player and others
      const gs = GameState.getInstance();
      gs.player.hp = Math.min(gs.player.maxHp, gs.player.hp + healAmount);
      gs.recruitedCompanions.forEach(comp => {
        comp.hp = Math.min(comp.maxHp, comp.hp + healAmount);
      });
    } else if (c.classType === 'mage') {
      if (this.targetMonster) {
        const angle = Phaser.Math.Angle.Between(this.x, this.y, this.targetMonster.x, this.targetMonster.y);
        const expX = this.x + Math.cos(angle) * 50;
        const expY = this.y + Math.sin(angle) * 50;
        
        const circle = this.scene.add.circle(expX, expY, 40, 0xffaa00, 0.6).setDepth(20);
        this.scene.tweens.add({
          targets: circle,
          scale: { from: 0.5, to: 1.5 },
          alpha: { from: 0.6, to: 0 },
          duration: 300,
          onComplete: () => circle.destroy()
        });

        this.scene.events.emit('player-melee-attack', {
          x: expX,
          y: expY,
          range: 50,
          damage: (c.attack + this.bonusAttack) * this.activeAttackMultiplier * 2,
          source: 'companion'
        });
        this.activeAttackMultiplier = 1;
      }
    }
  }

  private handleFollowState(): void {
    const angle = Phaser.Math.Angle.Between(this.x, this.y, this.player.x, this.player.y);
    const speed = this.companionData.speed;
    this.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed);
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
      
      this.trySkill(time);

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
    
    const damage = (this.companionData.attack + this.bonusAttack) * this.activeAttackMultiplier;

    if (this.companionData.classType === 'mage') {
      this.scene.events.emit('companion-fire-projectile', {
        x: this.x,
        y: this.y,
        targetX: monster.x,
        targetY: monster.y,
        damage,
        source: 'companion'
      });
    } else {
      // Melee attack
      this.scene.events.emit('companion-melee-attack', {
        x: this.x + Math.cos(angle) * 24,
        y: this.y + Math.sin(angle) * 24,
        damage,
        classType: this.companionData.classType,
        target: monster
      });
    }
    
    this.activeAttackMultiplier = 1;
  }

  public takeDamage(amount: number): void {
    const effectiveDefense = this.companionData.defense + this.bonusDefense;
    const damage = Math.max(1, Math.round(amount - effectiveDefense / 2));
    this.companionData.hp = Math.max(0, this.companionData.hp - damage);

    this.setTint(0xff5555);
    this.scene.time.delayedCall(150, () => {
      this.clearTint();
    });
  }
}
