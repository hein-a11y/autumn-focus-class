const fs = require('fs');

let content = fs.readFileSync('src/scenes/VillageScene.ts', 'utf8');

// Fix Volcano text
content = content.replace(/'溶岩洞窟\n\(高難度\) ▶'/g, "'溶岩洞窟\\n(高難度) ▶'");

// Fix equip shop text
content = content.replace(/【武具屋】\\n\(話す\)/g, "【武具屋】\\\\n(話す)"); // wait, maybe I can just do regex

// Actually let's just use string templates correctly.
// The easiest way is to use backticks.
content = content.replace(/'溶岩洞窟\n\(高難度\) ▶'/g, "\`溶岩洞窟\\n(高難度) ▶\`");

fs.writeFileSync('src/scenes/VillageScene.ts', content, 'utf8');
