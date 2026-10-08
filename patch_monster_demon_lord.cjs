const fs = require('fs');
let file = fs.readFileSync('src/entities/Monster.ts', 'utf8');

const target1 = `    if (def.id === 'demon_lord') {
      this.setSize(180, 180);
      this.setOffset((237 - 180) / 2, 231 - 180); // Bottom center of the 237x231 sprite
      this.setScale(0.8); // Slightly scale down
    }`;

const replace1 = `    if (def.id === 'demon_lord') {
      this.setSize(120, 120);
      this.setOffset((150 - 120) / 2, 150 - 120);
      this.setScale(1.5);
      
      // Create and play animation if not exists
      if (!scene.anims.exists('anim_demon_lord')) {
        scene.anims.create({
          key: 'anim_demon_lord',
          frames: scene.anims.generateFrameNumbers('monster_demon_lord_sprite', { start: 0, end: 4 }),
          frameRate: 10,
          repeat: -1
        });
      }
      this.play('anim_demon_lord');
    }`;

file = file.replace(target1, replace1);
fs.writeFileSync('src/entities/Monster.ts', file);
