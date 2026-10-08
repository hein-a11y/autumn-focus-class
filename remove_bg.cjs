const fs = require('fs');
const PNG = require('pngjs').PNG;

fs.createReadStream('public/assets/characters/shadow_boss_orange.png')
  .pipe(new PNG({ filterType: 4 }))
  .on('parsed', function() {
    // The top-left pixel color is the background color
    const bgR = this.data[0];
    const bgG = this.data[1];
    const bgB = this.data[2];
    
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        const idx = (this.width * y + x) << 2;
        const r = this.data[idx];
        const g = this.data[idx+1];
        const b = this.data[idx+2];
        
        // If color is close to background, make it transparent
        if (Math.abs(r - bgR) < 15 && Math.abs(g - bgG) < 15 && Math.abs(b - bgB) < 15) {
          this.data[idx+3] = 0; // alpha = 0
        }
      }
    }
    
    this.pack().pipe(fs.createWriteStream('public/assets/characters/demon_lord.png'))
      .on('finish', () => console.log('Background removed!'));
  });
