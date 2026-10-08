const fs = require('fs');
let file = fs.readFileSync('src/scenes/VillageScene.ts', 'utf8');

const targetNpc = `this.equipShopNpc = this.add.rectangle(200, 150, 24, 24, 0xe74c3c).setDepth(2);`;

const replaceNpc = `this.upgradeNpc = this.add.rectangle(300, 150, 24, 24, 0x3498db).setDepth(2);
    this.physics.add.existing(this.upgradeNpc, true);
    this.add.text(300, 120, '【訓練所】\\n(ステータス強化)', {
      fontSize: '11px',
      color: '#3498db',
      align: 'center',
      fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(3);

    this.equipShopNpc = this.add.rectangle(180, 150, 24, 24, 0xe74c3c).setDepth(2);`;

file = file.replace(targetNpc, replaceNpc);
file = file.replace(/200, 120, '【武具屋】/g, "180, 120, '【武具屋】"); // Move the text too

const targetPrompt = `else if (this.physics.overlap(this.player, this.shopNpc)) {
      this.interactPromptText.setText('[E] 道具屋を見る');
      this.interactPromptText.setVisible(true);
      
      if (Phaser.Input.Keyboard.JustDown(this.cursors.space) || Phaser.Input.Keyboard.JustDown(this.keys.E)) {
        this.openItemShop();
      }
    }`;

const replacePrompt = targetPrompt + ` else if (this.physics.overlap(this.player, this.upgradeNpc)) {
      this.interactPromptText.setText('[E] 訓練所でステータス強化');
      this.interactPromptText.setVisible(true);
      
      if (Phaser.Input.Keyboard.JustDown(this.cursors.space) || Phaser.Input.Keyboard.JustDown(this.keys.E)) {
        this.openUpgradeShop();
      }
    }`;

file = file.replace(targetPrompt, replacePrompt);

// Add the openUpgradeShop method at the end of the class (before the last bracket)
const newMethod = `
  private upgradeNpc!: Phaser.GameObjects.Rectangle;

  private openUpgradeShop(): void {
    if (this.activeModal) return;

    this.activeModal = this.add.container(400, 300).setScrollFactor(0).setDepth(200);

    const bg = this.add.rectangle(0, 0, 450, 300, 0x111625, 0.95)
      .setStrokeStyle(2, 0x3498db);
    this.activeModal.add(bg);

    const title = this.add.text(0, -120, '【訓練所】', {
      fontSize: '18px',
      color: '#3498db',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    this.activeModal.add(title);

    const getStatsText = () => {
      return \`所持金: \${this.gameState.player.gold} G\\n\\n\` +
             \`■ 基礎ステータス強化\\n\` +
             \`攻撃力強化 (現在: +\${this.gameState.purchasedUpgrades.attack * 5})\\n\` +
             \`防御力強化 (現在: +\${this.gameState.purchasedUpgrades.defense * 3})\\n\` +
             \`最大HP強化 (現在: +\${this.gameState.purchasedUpgrades.hp * 20})\`;
    };

    const desc = this.add.text(0, -50, getStatsText(), {
      fontSize: '13px',
      color: '#ffffff',
      align: 'center',
      lineSpacing: 4
    }).setOrigin(0.5);
    this.activeModal.add(desc);

    const resultMsg = this.add.text(0, 10, '', {
      fontSize: '12px',
      color: '#ffff00',
      align: 'center'
    }).setOrigin(0.5);
    this.activeModal.add(resultMsg);

    const costAtk = 5000;
    const costDef = 5000;
    const costHp = 4000;

    const buyAtk = this.add.rectangle(-140, 70, 120, 40, 0x223355).setInteractive();
    const buyAtkText = this.add.text(-140, 70, \`攻撃力 UP\\n(\${costAtk}G)\`, { fontSize: '12px', color: '#fff', align: 'center' }).setOrigin(0.5);
    buyAtk.on('pointerdown', () => {
      if (this.gameState.spendGold(costAtk)) {
        this.gameState.purchasedUpgrades.attack++;
        this.gameState.recalculatePlayerStats();
        desc.setText(getStatsText());
        resultMsg.setText('攻撃力が 5 上がった！');
      } else {
        resultMsg.setText('ゴールドが足りません！');
      }
    });

    const buyDef = this.add.rectangle(0, 70, 120, 40, 0x223355).setInteractive();
    const buyDefText = this.add.text(0, 70, \`防御力 UP\\n(\${costDef}G)\`, { fontSize: '12px', color: '#fff', align: 'center' }).setOrigin(0.5);
    buyDef.on('pointerdown', () => {
      if (this.gameState.spendGold(costDef)) {
        this.gameState.purchasedUpgrades.defense++;
        this.gameState.recalculatePlayerStats();
        desc.setText(getStatsText());
        resultMsg.setText('防御力が 3 上がった！');
      } else {
        resultMsg.setText('ゴールドが足りません！');
      }
    });

    const buyHp = this.add.rectangle(140, 70, 120, 40, 0x223355).setInteractive();
    const buyHpText = this.add.text(140, 70, \`最大HP UP\\n(\${costHp}G)\`, { fontSize: '12px', color: '#fff', align: 'center' }).setOrigin(0.5);
    buyHp.on('pointerdown', () => {
      if (this.gameState.spendGold(costHp)) {
        this.gameState.purchasedUpgrades.hp++;
        this.gameState.recalculatePlayerStats();
        desc.setText(getStatsText());
        resultMsg.setText('最大HPが 20 上がった！');
      } else {
        resultMsg.setText('ゴールドが足りません！');
      }
    });

    this.activeModal.add([buyAtk, buyAtkText, buyDef, buyDefText, buyHp, buyHpText]);

    const closeBtn = this.add.rectangle(0, 130, 120, 30, 0x555555).setInteractive();
    const closeTxt = this.add.text(0, 130, '閉じる (ESC)', { fontSize: '12px', color: '#fff' }).setOrigin(0.5);
    closeBtn.on('pointerdown', () => {
      this.time.delayedCall(10, () => this.closeModal());
    });
    this.activeModal.add([closeBtn, closeTxt]);
  }
}
`;

file = file.replace(/}\s*$/g, newMethod);
fs.writeFileSync('src/scenes/VillageScene.ts', file);
