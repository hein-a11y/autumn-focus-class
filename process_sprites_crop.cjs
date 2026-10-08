const { Jimp } = require('jimp');
const fs = require('fs');

async function processSprite(inPath, outPath) {
    if (!fs.existsSync(inPath)) {
        console.log(`Skipping ${inPath}`);
        return;
    }
    const image = await Jimp.read(inPath);
    
    // Autocrop the image to remove the white/empty borders
    image.autocrop();

    // Scale down to 32x32
    image.resize({w: 32, h: 32});
    
    const w = image.bitmap.width;
    const h = image.bitmap.height;
    
    // Convert to transparent PNG by replacing whiteish background
    for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
            let idx = (w * y + x) << 2;
            let r = image.bitmap.data[idx];
            let g = image.bitmap.data[idx+1];
            let b = image.bitmap.data[idx+2];
            // if it's very white/light gray
            if (r > 200 && g > 200 && b > 200) {
                image.bitmap.data[idx+3] = 0; // set alpha 0
            }
        }
    }
    
    await image.write(outPath);
    console.log(`Saved ${outPath}`);
}

async function main() {
    await processSprite('/home/hein15/.gemini/antigravity/brain/a6867cbc-8c88-45ee-8618-8cfd5178d419/warrior_1791443958187.jpg', 'public/assets/characters/warrior.png');
    await processSprite('/home/hein15/.gemini/antigravity/brain/a6867cbc-8c88-45ee-8618-8cfd5178d419/mage_1791443976096.jpg', 'public/assets/characters/mage.png');
    await processSprite('/home/hein15/.gemini/antigravity/brain/a6867cbc-8c88-45ee-8618-8cfd5178d419/thief_1791443994679.jpg', 'public/assets/characters/thief.png');
    await processSprite('/home/hein15/.gemini/antigravity/brain/a6867cbc-8c88-45ee-8618-8cfd5178d419/paladin_1791444008717.jpg', 'public/assets/characters/paladin.png');
}

main().catch(console.error);
