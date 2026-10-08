const fs = require('fs');
let code = fs.readFileSync('src/scenes/HomeScene.ts', 'utf8');

code = code.replace(/const width = 400;/g, 'const width = 800;');
code = code.replace(/const height = 400;/g, 'const height = 600;');
code = code.replace(/this.player = new Player\(this, 200, 300\);/g, 'this.player = new Player(this, 400, 450);');
code = code.replace(/x < 400/g, 'x < 800');
code = code.replace(/y < 400/g, 'y < 600');
code = code.replace(/392, 'tile_stone_wall'/g, '592, \'tile_stone_wall\'');
code = code.replace(/392, y \+ 8, 'tile_stone_wall'/g, '792, y + 8, \'tile_stone_wall\'');
code = code.replace(/200, 200, 100, 80/g, '400, 300, 200, 160');
code = code.replace(/this.add.image\(200, 100, 'furniture_pack', 'furniture_14'\)/g, 'this.add.image(400, 150, \'furniture_pack\', \'furniture_14\')');
code = code.replace(/this.add.rectangle\(200, 370, 40, 20, 0x4e342e\)/g, 'this.add.rectangle(400, 570, 80, 40, 0x4e342e)');
code = code.replace(/this.add.text\(200, 370, '外へ', { fontSize: '10px'/g, 'this.add.text(400, 570, \'外へ\', { fontSize: \'14px\'');
code = code.replace(/if \(this.player.y > 380\)/g, 'if (this.player.y > 580)');
code = code.replace(/px, py, 200, 100/g, 'px, py, 400, 150');
code = code.replace(/setPosition\(200, 140\)/g, 'setPosition(400, 190)');
code = code.replace(/this.interactPromptText = this.add.text\(200, 140/g, 'this.interactPromptText = this.add.text(400, 190');

fs.writeFileSync('src/scenes/HomeScene.ts', code);
