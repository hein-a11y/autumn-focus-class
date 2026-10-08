const fs = require('fs');
let file = fs.readFileSync('src/data/monsters.ts', 'utf8');

file = file.replace(/id: 'king_slime',[\s\S]*?defense: \d+,/g, (match) => {
    return match.replace(/maxHp: \d+/, 'maxHp: 3500').replace(/defense: \d+/, 'defense: 80');
});

file = file.replace(/id: 'giant_spider',[\s\S]*?defense: \d+,/g, (match) => {
    return match.replace(/maxHp: \d+/, 'maxHp: 3500').replace(/defense: \d+/, 'defense: 80');
});

file = file.replace(/id: 'volcano_dragon',[\s\S]*?defense: \d+,/g, (match) => {
    return match.replace(/maxHp: \d+/, 'maxHp: 9000').replace(/defense: \d+/, 'defense: 150');
});

file = file.replace(/id: 'crystal_dragon',[\s\S]*?defense: \d+,/g, (match) => {
    return match.replace(/maxHp: \d+/, 'maxHp: 12000').replace(/defense: \d+/, 'defense: 200');
});

file = file.replace(/id: 'demon_lord',[\s\S]*?defense: \d+,/g, (match) => {
    return match.replace(/maxHp: \d+/, 'maxHp: 25000').replace(/defense: \d+/, 'defense: 300');
});

fs.writeFileSync('src/data/monsters.ts', file);
