const { Jimp } = require('jimp');
const path = require('path');
const fs = require('fs');

async function removeWhiteBackground(inputFile, outputFile, fuzziness = 15) {
  try {
    console.log(`Processing ${inputFile}...`);
    // Jimp v1+ uses Jimp.read
    const image = await Jimp.read(inputFile);
    
    image.scan(0, 0, image.bitmap.width, image.bitmap.height, function(x, y, idx) {
      const red = this.bitmap.data[idx + 0];
      const green = this.bitmap.data[idx + 1];
      const blue = this.bitmap.data[idx + 2];
      
      // If color is close to white
      if (red > 255 - fuzziness && green > 255 - fuzziness && blue > 255 - fuzziness) {
        // Set alpha to 0
        this.bitmap.data[idx + 3] = 0;
      }
    });
    
    await image.write(outputFile);
    console.log(`Saved ${outputFile}`);
  } catch (err) {
    console.error(`Error processing ${inputFile}:`, err);
  }
}

async function main() {
  const dir = path.join(__dirname, '..', 'public', 'assets', 'generated');
  const files = ['home', 'tavern', 'forest', 'dungeon'];
  
  for (const file of files) {
    const inputPath = path.join(dir, `${file}.jpg`);
    const outputPath = path.join(dir, `${file}.png`);
    if (fs.existsSync(inputPath)) {
      await removeWhiteBackground(inputPath, outputPath, 25);
    }
  }
}

main();
