const fs = require('fs');
let code = fs.readFileSync('src/scenes/TavernScene.ts', 'utf8');

code = code.replace(/const width = 400;/g, 'const width = 800;');
code = code.replace(/const height = 400;/g, 'const height = 600;');
code = code.replace(/this.player = new Player\(this, 200, 350\);/g, 'this.player = new Player(this, 400, 500);');
code = code.replace(/x < 400/g, 'x < 800');
code = code.replace(/y < 400/g, 'y < 600');
code = code.replace(/100, 50, 'furniture_board'/g, '200, 100, \'furniture_board\'');
code = code.replace(/100, 80/g, '200, 130');
code = code.replace(/200, 50, 48, 28/g, '400, 100, 48, 28');
code = code.replace(/200, 50/g, '400, 100');
code = code.replace(/200, 80/g, '400, 130');
code = code.replace(/300, 50, 48, 28/g, '600, 100, 48, 28');
code = code.replace(/300, 50/g, '600, 100');
code = code.replace(/300, 80/g, '600, 130');

// Exit label
code = code.replace(/this.add.text\(200, 370, '▼ 村へ戻る', { fontSize: '12px'/g, 'this.add.text(400, 570, \'▼ 村へ戻る\', { fontSize: \'14px\'');

// Player Y check
code = code.replace(/if \(this.player.y > 380\)/g, 'if (this.player.y > 580)');

// Interacts
code = code.replace(/px, py, 100, 50/g, 'px, py, 200, 100');
code = code.replace(/px, py, 200, 50/g, 'px, py, 400, 100');
code = code.replace(/px, py, 300, 50/g, 'px, py, 600, 100');

fs.writeFileSync('src/scenes/TavernScene.ts', code);
