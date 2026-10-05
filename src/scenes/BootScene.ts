import Phaser from 'phaser';
import { MONSTER_DEFINITIONS } from '../data/monsters';

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  public preload(): void {
    // Show loading text
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;
    const loadingText = this.add.text(width / 2, height / 2, '読み込み中...', {
      fontSize: '20px',
      color: '#ffffff',
      fontFamily: 'monospace'
    }).setOrigin(0.5);

    this.load.on('progress', (value: number) => {
      loadingText.setText(`読み込み中... ${Math.round(value * 100)}%`);
    });
  }

  public create(): void {
    // Generate all procedural pixel textures so game runs out of the box with zero external asset dependencies
    this.generateCharacterTextures();
    this.generateMonsterTextures();
    this.generateEnvironmentTextures();
    this.generateItemAndNodeTextures();
    this.generateCombatEffectTextures();

    // Start Character Selection Scene
    this.scene.start('CharacterSelectScene');
  }

  private generateCharacterTextures(): void {
    const classes = ['warrior', 'mage', 'thief', 'paladin'] as const;
    const genders = ['male', 'female'] as const;

    classes.forEach(c => {
      genders.forEach(g => {
        const key = `char_${c}_${g}`;
        if (!this.textures.exists(key)) {
          const canvas = this.textures.createCanvas(key, 32, 32);
          if (!canvas) return;
          const ctx = canvas.getContext();

          // Base colors by class
          let mainColor = '#3498db'; // warrior blue
          let hatColor = '#95a5a6';
          let weaponColor = '#bdc3c7';

          if (c === 'mage') {
            mainColor = '#9b59b6'; // purple robe
            hatColor = '#8e44ad';
            weaponColor = '#f39c12';
          } else if (c === 'thief') {
            mainColor = '#27ae60'; // rogue green
            hatColor = '#2c3e50';
            weaponColor = '#95a5a6';
          } else if (c === 'paladin') {
            mainColor = '#f39c12'; // gold armor
            hatColor = '#f1c40f';
            weaponColor = '#ecf0f1';
          }

          const hairColor = g === 'male' ? '#5d4037' : '#d35400';
          const skinColor = '#ffdfba';

          // Draw retro pixel character
          ctx.fillStyle = 'rgba(0,0,0,0.25)';
          ctx.beginPath();
          ctx.ellipse(16, 28, 9, 4, 0, 0, Math.PI * 2);
          ctx.fill();

          // Body / Armor
          ctx.fillStyle = mainColor;
          ctx.fillRect(10, 14, 12, 11);

          // Head / Face
          ctx.fillStyle = skinColor;
          ctx.fillRect(11, 7, 10, 8);

          // Eyes
          ctx.fillStyle = '#222222';
          ctx.fillRect(13, 10, 2, 2);
          ctx.fillRect(17, 10, 2, 2);

          // Hair / Helmet
          ctx.fillStyle = hairColor;
          ctx.fillRect(10, 5, 12, 4);
          if (g === 'female') {
            ctx.fillRect(9, 8, 2, 8);
            ctx.fillRect(21, 8, 2, 8);
          }

          // Hat/Armor trim
          ctx.fillStyle = hatColor;
          ctx.fillRect(10, 4, 12, 2);

          // Class weapon indicator
          ctx.fillStyle = weaponColor;
          if (c === 'warrior') {
            // Sword
            ctx.fillRect(22, 12, 3, 10);
            ctx.fillRect(20, 19, 7, 2);
          } else if (c === 'mage') {
            // Staff
            ctx.fillStyle = '#795548';
            ctx.fillRect(22, 9, 3, 16);
            ctx.fillStyle = '#00e5ff';
            ctx.fillRect(21, 7, 5, 5);
          } else if (c === 'thief') {
            // Dual daggers
            ctx.fillRect(7, 15, 3, 8);
            ctx.fillRect(22, 15, 3, 8);
          } else if (c === 'paladin') {
            // Shield & Sword
            ctx.fillStyle = '#f1c40f';
            ctx.fillRect(6, 13, 5, 10);
            ctx.fillStyle = weaponColor;
            ctx.fillRect(22, 13, 3, 9);
          }

          // Legs / Boots
          ctx.fillStyle = '#2c3e50';
          ctx.fillRect(11, 25, 4, 4);
          ctx.fillRect(17, 25, 4, 4);

          canvas.refresh();
        }
      });
    });
  }

  private generateMonsterTextures(): void {
    for (const id in MONSTER_DEFINITIONS) {
      const def = MONSTER_DEFINITIONS[id];
      const key = `monster_${id}`;
      if (!this.textures.exists(key)) {
        const size = def.isBoss ? 48 : 32;
        const canvas = this.textures.createCanvas(key, size, size);
        if (!canvas) continue;
        const ctx = canvas.getContext();

        const hexStr = `#${def.color.toString(16).padStart(6, '0')}`;
        const center = size / 2;
        const radius = def.size / 2;

        // Shadow
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.beginPath();
        ctx.ellipse(center, size - 4, radius, radius * 0.4, 0, 0, Math.PI * 2);
        ctx.fill();

        // Monster Body
        ctx.fillStyle = hexStr;
        if (id.includes('slime')) {
          // Slime dome shape
          ctx.beginPath();
          ctx.arc(center, center + 2, radius, Math.PI, 0);
          ctx.lineTo(center + radius, center + radius);
          ctx.lineTo(center - radius, center + radius);
          ctx.closePath();
          ctx.fill();
        } else if (id.includes('bat')) {
          // Bat with wings
          ctx.beginPath();
          ctx.arc(center, center, radius * 0.6, 0, Math.PI * 2);
          ctx.fill();
          // Wings
          ctx.beginPath();
          ctx.moveTo(center - radius * 1.5, center - 4);
          ctx.lineTo(center, center);
          ctx.lineTo(center + radius * 1.5, center - 4);
          ctx.lineWidth = 3;
          ctx.strokeStyle = hexStr;
          ctx.stroke();
        } else if (id.includes('golem') || def.isBoss) {
          // Heavy stone / Boss silhouette
          ctx.fillRect(center - radius, center - radius, radius * 2, radius * 2);
          ctx.strokeStyle = '#222';
          ctx.lineWidth = 2;
          ctx.strokeRect(center - radius, center - radius, radius * 2, radius * 2);
        } else {
          // Standard beast / humanoid silhouette
          ctx.beginPath();
          ctx.arc(center, center, radius, 0, Math.PI * 2);
          ctx.fill();
        }

        // Eyes
        ctx.fillStyle = def.isBoss ? '#ffff00' : '#ffffff';
        ctx.fillRect(center - radius * 0.4, center - 2, 3, 3);
        ctx.fillRect(center + radius * 0.4 - 3, center - 2, 3, 3);
        ctx.fillStyle = '#000000';
        ctx.fillRect(center - radius * 0.4 + 1, center - 1, 2, 2);
        ctx.fillRect(center + radius * 0.4 - 2, center - 1, 2, 2);

        canvas.refresh();
      }
    }
  }

  private generateEnvironmentTextures(): void {
    const tiles: { key: string; bg: string; decor?: (ctx: CanvasRenderingContext2D) => void }[] = [
      {
        key: 'tile_grass',
        bg: '#4caf50',
        decor: ctx => {
          ctx.fillStyle = '#388e3c';
          ctx.fillRect(3, 3, 2, 2);
          ctx.fillRect(11, 7, 2, 3);
          ctx.fillRect(7, 12, 3, 2);
        }
      },
      {
        key: 'tile_dirt',
        bg: '#8d6e63',
        decor: ctx => {
          ctx.fillStyle = '#6d4c41';
          ctx.fillRect(4, 5, 3, 2);
          ctx.fillRect(10, 11, 2, 2);
        }
      },
      {
        key: 'tile_path',
        bg: '#d7ccc8',
        decor: ctx => {
          ctx.fillStyle = '#bcaaa4';
          ctx.fillRect(2, 2, 12, 12);
        }
      },
      {
        key: 'tile_wood_floor',
        bg: '#a1887f',
        decor: ctx => {
          ctx.fillStyle = '#8d6e63';
          ctx.fillRect(0, 7, 16, 1);
          ctx.fillRect(0, 15, 16, 1);
        }
      },
      {
        key: 'tile_stone_wall',
        bg: '#455a64',
        decor: ctx => {
          ctx.fillStyle = '#37474f';
          ctx.fillRect(1, 1, 14, 6);
          ctx.fillRect(1, 8, 14, 7);
        }
      },
      {
        key: 'tile_dungeon_floor',
        bg: '#263238',
        decor: ctx => {
          ctx.fillStyle = '#1e272c';
          ctx.fillRect(2, 2, 6, 6);
          ctx.fillRect(9, 9, 6, 6);
        }
      },
      {
        key: 'tile_dungeon_wall',
        bg: '#1a1f24',
        decor: ctx => {
          ctx.fillStyle = '#0f1316';
          ctx.fillRect(1, 1, 14, 14);
        }
      },
      {
        key: 'tile_water',
        bg: '#1976d2',
        decor: ctx => {
          ctx.fillStyle = '#42a5f5';
          ctx.fillRect(3, 4, 8, 2);
          ctx.fillRect(7, 10, 6, 2);
        }
      }
    ];

    tiles.forEach(t => {
      if (!this.textures.exists(t.key)) {
        const canvas = this.textures.createCanvas(t.key, 16, 16);
        if (!canvas) return;
        const ctx = canvas.getContext();
        ctx.fillStyle = t.bg;
        ctx.fillRect(0, 0, 16, 16);
        if (t.decor) t.decor(ctx);
        canvas.refresh();
      }
    });

    // Bed furniture (32x32)
    if (!this.textures.exists('furniture_bed')) {
      const canvas = this.textures.createCanvas('furniture_bed', 32, 32);
      if (canvas) {
        const ctx = canvas.getContext();
        ctx.fillStyle = '#5d4037';
        ctx.fillRect(4, 4, 24, 26);
        ctx.fillStyle = '#e0e0e0';
        ctx.fillRect(6, 6, 20, 8); // Pillow
        ctx.fillStyle = '#1976d2';
        ctx.fillRect(6, 14, 20, 14); // Blanket
        canvas.refresh();
      }
    }

    // Quest Board (32x32)
    if (!this.textures.exists('furniture_board')) {
      const canvas = this.textures.createCanvas('furniture_board', 32, 32);
      if (canvas) {
        const ctx = canvas.getContext();
        ctx.fillStyle = '#795548';
        ctx.fillRect(4, 4, 24, 20);
        ctx.fillStyle = '#fff8e1';
        ctx.fillRect(7, 7, 7, 7);
        ctx.fillRect(17, 8, 8, 8);
        ctx.fillRect(10, 16, 8, 6);
        ctx.fillStyle = '#4e342e';
        ctx.fillRect(6, 24, 4, 8);
        ctx.fillRect(22, 24, 4, 8);
        canvas.refresh();
      }
    }
  }

  private generateItemAndNodeTextures(): void {
    // Herbs (16x16)
    const herbColors = [
      { key: 'node_herb_small', color: '#58d68d' },
      { key: 'node_herb_antidote', color: '#27ae60' },
      { key: 'node_herb_high', color: '#2ecc71' },
      { key: 'node_herb_elixir', color: '#1abc9c' },
      { key: 'node_herb_world_tree', color: '#16a085' }
    ];

    herbColors.forEach(h => {
      if (!this.textures.exists(h.key)) {
        const canvas = this.textures.createCanvas(h.key, 16, 16);
        if (!canvas) return;
        const ctx = canvas.getContext();
        ctx.fillStyle = '#795548';
        ctx.fillRect(7, 10, 2, 5);
        ctx.fillStyle = h.color;
        ctx.beginPath();
        ctx.arc(8, 7, 5, 0, Math.PI * 2);
        ctx.fill();
        canvas.refresh();
      }
    });

    // Ores (16x16)
    const oreColors = [
      { key: 'node_ore_copper', color: '#d35400' },
      { key: 'node_ore_iron', color: '#7f8c8d' },
      { key: 'node_ore_silver', color: '#bdc3c7' },
      { key: 'node_ore_gold', color: '#f1c40f' },
      { key: 'node_ore_mithril', color: '#85c1e9' },
      { key: 'node_ore_adamantite', color: '#bb8fce' }
    ];

    oreColors.forEach(o => {
      if (!this.textures.exists(o.key)) {
        const canvas = this.textures.createCanvas(o.key, 16, 16);
        if (!canvas) return;
        const ctx = canvas.getContext();
        // Rock base
        ctx.fillStyle = '#424242';
        ctx.beginPath();
        ctx.arc(8, 9, 6, 0, Math.PI * 2);
        ctx.fill();
        // Ore sparkles
        ctx.fillStyle = o.color;
        ctx.fillRect(6, 6, 3, 3);
        ctx.fillRect(9, 8, 3, 3);
        ctx.fillRect(6, 10, 2, 2);
        canvas.refresh();
      }
    });
  }

  private generateCombatEffectTextures(): void {
    // Slash effect (32x32)
    if (!this.textures.exists('effect_slash')) {
      const canvas = this.textures.createCanvas('effect_slash', 32, 32);
      if (canvas) {
        const ctx = canvas.getContext();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(16, 16, 12, -Math.PI / 3, Math.PI / 3);
        ctx.stroke();
        ctx.strokeStyle = '#ffcc00';
        ctx.lineWidth = 2;
        ctx.stroke();
        canvas.refresh();
      }
    }

    // Magic projectile (16x16)
    if (!this.textures.exists('effect_magic_orb')) {
      const canvas = this.textures.createCanvas('effect_magic_orb', 16, 16);
      if (canvas) {
        const ctx = canvas.getContext();
        ctx.fillStyle = '#00ffff';
        ctx.beginPath();
        ctx.arc(8, 8, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(8, 8, 3, 0, Math.PI * 2);
        ctx.fill();
        canvas.refresh();
      }
    }
  }
}
