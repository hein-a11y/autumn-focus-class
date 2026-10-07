const fs = require('fs');
const { PNG } = require('pngjs');
const path = require('path');

const src = path.join(__dirname, '../public/assets/town_rpg_pack/graphics/transparent-bg-tiles.png');
const outDir = path.join(__dirname, '../public/assets/town_rpg_pack/buildings');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir);

fs.createReadStream(src).pipe(new PNG()).on('parsed', function() {
  const width = this.width;
  const height = this.height;
  const visited = new Uint8Array(width * height);

  function getAlpha(x, y) {
    if (x < 0 || x >= width || y < 0 || y >= height) return 0;
    const idx = (width * y + x) << 2;
    return this.data[idx + 3];
  }

  let objectCount = 0;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (visited[y * width + x]) continue;
      const alpha = this.data[((width * y + x) << 2) + 3];
      if (alpha === 0) {
        visited[y * width + x] = 1;
        continue;
      }

      // found a new object
      objectCount++;
      const queue = [[x, y]];
      visited[y * width + x] = 1;
      let minX = x, maxX = x, minY = y, maxY = y;

      while (queue.length > 0) {
        const [cx, cy] = queue.shift();
        if (cx < minX) minX = cx;
        if (cx > maxX) maxX = cx;
        if (cy < minY) minY = cy;
        if (cy > maxY) maxY = cy;

        // check 8 neighbors
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            if (dx === 0 && dy === 0) continue;
            const nx = cx + dx;
            const ny = cy + dy;
            if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
              if (!visited[ny * width + nx]) {
                const a = this.data[((width * ny + nx) << 2) + 3];
                if (a > 0) {
                  visited[ny * width + nx] = 1;
                  queue.push([nx, ny]);
                }
              }
            }
          }
        }
      }

      console.log(`Object ${objectCount}: minX=${minX} maxX=${maxX} minY=${minY} maxY=${maxY} w=${maxX-minX+1} h=${maxY-minY+1}`);
      
      // create new png for this object
      const w = maxX - minX + 1;
      const h = maxY - minY + 1;
      if (w > 16 && h > 16) { // ignore tiny artifacts
        const outPng = new PNG({ width: w, height: h });
        for (let oy = 0; oy < h; oy++) {
          for (let ox = 0; ox < w; ox++) {
            const srcIdx = (width * (minY + oy) + (minX + ox)) << 2;
            const dstIdx = (w * oy + ox) << 2;
            outPng.data[dstIdx] = this.data[srcIdx];
            outPng.data[dstIdx+1] = this.data[srcIdx+1];
            outPng.data[dstIdx+2] = this.data[srcIdx+2];
            outPng.data[dstIdx+3] = this.data[srcIdx+3];
          }
        }
        outPng.pack().pipe(fs.createWriteStream(path.join(outDir, `building_${objectCount}.png`)));
      }
    }
  }
});
