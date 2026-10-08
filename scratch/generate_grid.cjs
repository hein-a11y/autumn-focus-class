const { Jimp } = require('jimp');
const fs = require('fs');
const path = require('path');
const { registerFont, createCanvas, loadImage } = require('canvas');

async function createGrid() {
    const jsonPath = 'public/assets/furniture/furniture.json';
    const imgPath = 'public/assets/furniture/furniture.png';
    
    const atlas = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
    
    const frames = atlas.frames;
    const numFrames = Object.keys(frames).length;
    
    const cols = 8;
    const rows = Math.ceil(numFrames / cols);
    const cellSize = 100;
    
    const canvas = createCanvas(cols * cellSize, rows * cellSize);
    const ctx = canvas.getContext('2d');
    
    ctx.fillStyle = '#333333';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    const img = await loadImage(imgPath);
    
    ctx.fillStyle = 'white';
    ctx.font = '16px sans-serif';
    
    for (let i = 0; i < 43; i++) {
        const frameName = `furniture_${i}`;
        if (frames[frameName]) {
            const frame = frames[frameName].frame;
            
            const col = i % cols;
            const row = Math.floor(i / cols);
            
            const pasteX = col * cellSize + Math.floor((cellSize - frame.w) / 2);
            const pasteY = row * cellSize + Math.floor((cellSize - frame.h) / 2) - 10;
            
            ctx.drawImage(img, frame.x, frame.y, frame.w, frame.h, pasteX, pasteY, frame.w, frame.h);
            ctx.fillText(`${i}`, col * cellSize + 5, row * cellSize + cellSize - 20);
        }
    }
    
    const out = fs.createWriteStream('/home/hein15/.gemini/antigravity/brain/a6867cbc-8c88-45ee-8618-8cfd5178d419/furniture_grid.png');
    const stream = canvas.createPNGStream();
    stream.pipe(out);
    out.on('finish', () =>  console.log('Grid generated!'));
}

createGrid().catch(console.error);
