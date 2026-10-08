const fs = require('fs');
let player = fs.readFileSync('src/entities/Player.ts', 'utf8');
let comp = fs.readFileSync('src/entities/Companion.ts', 'utf8');

player = player.replace(/this\.setCollideWorldBounds\(true\);/g, "this.setCollideWorldBounds(true);\n    this.setScale(1.5);");
comp = comp.replace(/this\.setCollideWorldBounds\(true\);/g, "this.setCollideWorldBounds(true);\n    this.setScale(1.5);");

fs.writeFileSync('src/entities/Player.ts', player);
fs.writeFileSync('src/entities/Companion.ts', comp);
