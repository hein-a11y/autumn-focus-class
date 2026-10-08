  private openLimitBreakModal(): void {
    this.closeModal();

    const container = this.add.container(400, 300).setScrollFactor(0).setDepth(200);
    const bg = this.add.rectangle(0, 0, 400, 250, 0x1b2030, 0.95)
      .setStrokeStyle(2, 0xe91e63);

    const title = this.add.text(0, -90, 'ギルドマスター - レベル上限解放', {
      fontSize: '16px',
      color: '#e91e63',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    const currentCap = this.gameState.levelCap;
    
    let cost = 0;
    if (currentCap === 10) cost = 1000;
    else if (currentCap === 20) cost = 5000;
    else if (currentCap === 30) cost = 15000;
    else if (currentCap === 40) cost = 30000;

    let desc = '';
    if (currentCap >= 50) {
      desc = '現在のレベル上限: 50 (最大)\nこれ以上の上限解放はできません。';
    } else {
      desc = `現在のレベル上限: ${currentCap}\n次の上限: ${currentCap + 10}\n\n必要ゴールド: ${cost} G`;
    }

    const infoText = this.add.text(0, -20, desc, {
      fontSize: '14px',
      color: '#ffffff',
      align: 'center',
      lineSpacing: 10
    }).setOrigin(0.5);

    container.add([bg, title, infoText]);

    if (currentCap < 50) {
      const upgradeBtn = this.add.rectangle(0, 50, 160, 40, 0xe91e63)
        .setInteractive({ useHandCursor: true })
        .setStrokeStyle(2, 0xff6090);
      const upgradeText = this.add.text(0, 50, '上限解放を実行', {
        fontSize: '14px',
        color: '#ffffff',
        fontStyle: 'bold'
      }).setOrigin(0.5);

      upgradeBtn.on('pointerdown', () => {
        if (this.gameState.spendGold(cost)) {
          this.gameState.levelCap += 10;
          this.openLimitBreakModal();
        } else {
          alert('ゴールドが足りません！');
        }
      });
      
      container.add([upgradeBtn, upgradeText]);
    }

    const closeBtn = this.add.rectangle(0, 100, 100, 32, 0x455a64)
      .setInteractive({ useHandCursor: true })
      .setStrokeStyle(2, 0x78909c);
    const closeText = this.add.text(0, 100, '閉じる', {
      fontSize: '12px',
      color: '#ffffff'
    }).setOrigin(0.5);

    closeBtn.on('pointerdown', () => this.closeModal());
    container.add([closeBtn, closeText]);

    this.activeModal = container;
  }
