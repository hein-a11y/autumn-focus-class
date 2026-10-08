const sharp = require('sharp');

async function main() {
  // Extract from the original spritesheet: 400x1120
  // Left shadow boss is approx at x=0, y=880, w=133, h=240
  // Middle shadow boss is at x=133, y=880, w=133, h=240
  // Let's extract the middle one (blue). Or the right one (orange). 
  // Let's extract the middle one.
  await sharp('public/assets/characters/oga_2ndsheet_10_monsters_cp.png')
    .extract({ left: 133, top: 880, width: 133, height: 240 })
    .toFile('public/assets/characters/shadow_boss.png');
    
  console.log("Cropped successfully!");
}

main().catch(console.error);
