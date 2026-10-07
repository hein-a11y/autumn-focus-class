const { Jimp } = require('jimp');
const fs = require('fs');
const path = require('path');

async function generateAtlas(inputPath, outImgPath, outJsonPath) {
  console.log('Loading image...');
  const image = await Jimp.read(inputPath);
  const width = image.bitmap.width;
  const height = image.bitmap.height;
  
  const visited = new Uint8Array(width * height);
  
  function getAlpha(x, y) {
    if (x < 0 || x >= width || y < 0 || y >= height) return 0;
    const idx = (y * width + x) * 4;
    return image.bitmap.data[idx + 3];
  }

  const components = [];

  console.log('Scanning for objects...');
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (getAlpha(x, y) > 10 && !visited[y * width + x]) {
        // Start BFS
        const queue = [{x, y}];
        visited[y * width + x] = 1;
        let minX = x, maxX = x, minY = y, maxY = y;
        
        let qIdx = 0;
        while (qIdx < queue.length) {
          const curr = queue[qIdx++];
          
          minX = Math.min(minX, curr.x);
          maxX = Math.max(maxX, curr.x);
          minY = Math.min(minY, curr.y);
          maxY = Math.max(maxY, curr.y);
          
          // Check neighbors within 3 pixels to group disconnected parts (like chair legs)
          for (let dy = -3; dy <= 3; dy++) {
            for (let dx = -3; dx <= 3; dx++) {
              const nx = curr.x + dx;
              const ny = curr.y + dy;
              
              if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
                if (!visited[ny * width + nx] && getAlpha(nx, ny) > 10) {
                  visited[ny * width + nx] = 1;
                  queue.push({x: nx, y: ny});
                }
              }
            }
          }
        }
        
        // Component found
        const w = maxX - minX + 1;
        const h = maxY - minY + 1;
        if (w >= 4 && h >= 4) {
          components.push({ x: minX, y: minY, w, h });
        }
      }
    }
  }

  // Generate Phaser Hash JSON
  const frames = {};
  
  // We can try to name some obvious ones based on size/position, but generic is safer
  // Actually, we'll sort them roughly left-to-right, top-to-bottom
  components.sort((a, b) => (a.y - b.y) || (a.x - b.x));
  
  components.forEach((comp, idx) => {
    const name = `furniture_${idx}`;
    frames[name] = {
      frame: { x: comp.x, y: comp.y, w: comp.w, h: comp.h },
      rotated: false,
      trimmed: false,
      spriteSourceSize: { x: 0, y: 0, w: comp.w, h: comp.h },
      sourceSize: { w: comp.w, h: comp.h }
    };
  });

  const phaserAtlas = {
    frames: frames,
    meta: {
      app: "antigravity-auto-atlas",
      version: "1.0",
      image: "furniture.png",
      format: "RGBA8888",
      size: { w: width, h: height },
      scale: "1"
    }
  };

  console.log(`Found ${components.length} items. Saving atlas...`);
  fs.writeFileSync(outJsonPath, JSON.stringify(phaserAtlas, null, 2));
  
  // Just copy the original image to preserve pixel perfect quality
  fs.copyFileSync(inputPath, outImgPath);
  console.log('Done!');
}

const input = "/home/hein15/.gemini/antigravity/brain/a6867cbc-8c88-45ee-8618-8cfd5178d419/.user_uploaded/media_1791349170838_71f0604d.png";
const outDir = path.join(__dirname, '..', 'public', 'assets', 'furniture');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

generateAtlas(input, path.join(outDir, 'furniture.png'), path.join(outDir, 'furniture.json'))
  .catch(console.error);

