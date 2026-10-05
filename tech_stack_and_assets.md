# Tech Stack & Asset Specifications

**Project Name:** Frontline Reincarnation (~最前線開拓日記~)  
**Target Platform:** Web Browser (Desktop / Mobile Friendly)  
**Development Window:** 3-Day Hackathon  
**Development Environment:** GitHub Codespaces  

---

## 1. Core Technology Stack

| Layer | Selected Technology | Purpose & Rationale |
| :--- | :--- | :--- |
| **Development IDE** | **GitHub Codespaces** | Cloud-based VS Code environment. Allows team members to start developing instantly in-browser without local engine installation. |
| **Language** | **TypeScript / JavaScript (ES6+)** | Strong typing for party/quest data, native browser execution, and seamless integration with Vite and Phaser 3. |
| **Game Framework** | **Phaser 3 (v3.80+)** | Lightweight, production-ready 2D web game engine. Native support for Arcade Physics, Tilemaps, Sprite Animations, and Scene Management. |
| **Build Tool & Server** | **Vite** | Blazing-fast dev server with instant Hot Module Replacement (HMR). Codespaces automatically forwards port `5173` for live preview. |
| **Version Control** | **Git & GitHub** | Source control host with direct Codespaces launching and GitHub Actions for continuous integration. |
| **Deployment Host** | **GitHub Pages** | Free 1-click web deployment straight from the main repository branch for final project presentation. |

---

## 2. Visual Assets & Character Designs (Free / CC0)

To achieve the Stardew Valley retro style within 3 days without custom art creation, all visual elements will use free, high-quality public domain (CC0) and open commercial license pixel art packs.

### A. Environment & Tilemaps
* **Kenney.nl — *Tiny Dungeon* (16x16):**
  * Floors, stone walls, doors, cages, mining ore deposits (Copper, Iron, Silver, Gold, Mithril), traps, and staircases.
* **Kenney.nl — *Tiny Town* (16x16):**
  * Village houses, tavern interior, bed (resting point), quest board, and forest paths.
* **Map Design Tool:**
  * **Tiled (mapeditor.org):** Used to layout the Village, Forest (5 regions), and Dungeon (10 floors) maps, exporting direct `.json` files into Phaser 3.

### B. Characters & Companion Bots
Spritesheets with 4-directional walking and attack animations:
* **Playable Classes & Bot Companions (16x16 / 32x32):**
  * **Warrior:** Knight sprite with sword slash animation.
  * **Mage:** Robed wizard sprite with staff projectile animation.
  * **Thief:** Rogue sprite with dual dagger multi-hit animation.
  * **Paladin:** Armored guardian sprite with shield and aura effect.
* **Pixel Pack Reference:** *Pixel Frog (Pixel Adventure / Ninja Frog)* & *Kenney RPG Urban/Fantasy Character Pack*.

### C. Monsters & Enemies
* **Forest Enemies:** Slime, Horned Rabbit, Wild Boar, Goblin Scout, Treant, Forest Chimera (Boss).
* **Dungeon Enemies:** Bat, Green Slime, Skeleton Warrior, Cave Spider, Stone Golem, Shadow Knight, Dungeon Abyss Boss.

### D. UI & Items
* **Kenney UI Pack (RPG Edition):**
  * Frame boxes for Quest Board and Recruitment Counter.
  * Status bars (HP / MP / EXP progress).
* **Item Icons:**
  * **Herbs:** Minor Herb, Antidote Herb, Potent Herb, Rare Elixir Leaf, World Tree Leaf.
  * **Ores:** Copper, Iron, Silver, Gold, Mithril, Adamantite.
  * **Currency:** Gold Coin icon.

---

## 3. Project Directory Structure

```text
frontline-reincarnation/
├── .devcontainer/         # GitHub Codespaces configuration
├── public/
│   ├── assets/
│   │   ├── tilemaps/     # Tiled JSON files (village.json, forest.json, dungeon.json)
│   │   ├── tilesets/     # Kenney 16x16 PNG tileset images
│   │   ├── sprites/      # Player, Bot, Monster, and NPC spritesheets
│   │   └── ui/           # Health bars, dialog boxes, item icons
├── src/
│   ├── config.ts         # Phaser 3 Game Configuration (Scale, Arcade Physics)
│   ├── main.ts           # Game entry point
│   ├── data/
│   │   ├── classes.ts    # Stats and skill formulas for Warrior, Mage, Thief, Paladin
│   │   ├── quests.ts     # E-Rank to A-Rank quest definitions and rewards
│   │   └── monsters.ts   # Enemy stats, loot tables, and EXP values
│   ├── entities/
│   │   ├── Player.ts     # WASD/Arrow Key movement and class attacks
│   │   ├── Companion.ts  # Bot follow & auto-attack Finite State Machine (FSM)
│   │   └── Monster.ts    # Aggro behavior, patrol, and hurtboxes
│   ├── managers/
│   │   ├── GameState.ts  # Global singleton (Player Lv, Gold, Inventory, Recruited Bots)
│   │   └── QuestManager.ts # Quest tracking, objective counting, and turn-ins
│   └── scenes/
│       ├── BootScene.ts     # Preloads all PNGs and JSON tilemaps
│       ├── CharacterSelectScene.ts # Gender & Class picker screen
│       ├── VillageScene.ts  # Home, Tavern, and transition doors
│       ├── ForestScene.ts   # Foraging and beast combat (Regions 1-5)
│       └── DungeonScene.ts  # Mining and dungeon combat (Floors 1-10)
├── index.html
├── package.json
├── tsconfig.json
└── vite.config.ts
```

---

## 4. Codespaces Setup & Commands

To start development on GitHub Codespaces, execute the following commands in the terminal:

```bash
# 1. Install dependencies (Phaser 3, Vite, TypeScript)
npm install

# 2. Start local development server with HMR
npm run dev

# 3. Build production distribution for GitHub Pages deployment
npm run build
```
