const gifFrames = require('gif-frames');
const Jimp = require('jimp');

async function main() {
    const frames = await gifFrames({ url: 'public/assets/BOSS/001.gif', frames: 'all', outputType: 'canvas', cumulative: true });
    
    // Convert canvas to jimp instances
    const jimpFrames = await Promise.all(frames.map(frame => {
        return new Promise((resolve) => {
            const canvas = frame.getImage();
            const width = canvas.width;
            const height = canvas.height;
            const data = canvas.getContext('2d').getImageData(0, 0, width, height).data;
            
            new Jimp(width, height, (err, image) => {
                image.bitmap.data = Buffer.from(data);
                resolve(image);
            });
        });
    }));

    const width = jimpFrames[0].bitmap.width;
    const height = jimpFrames[0].bitmap.height;
    const totalWidth = width * jimpFrames.length;

    // Create spritesheet
    const spriteSheet = new Jimp(totalWidth, height);
    for (let i = 0; i < jimpFrames.length; i++) {
        spriteSheet.blit(jimpFrames[i], i * width, 0);
    }

    spriteSheet.write('public/assets/BOSS/demon_lord_animated.png', () => {
        console.log(`Saved spritesheet. Width: ${width}, Height: ${height}, Frames: ${jimpFrames.length}`);
    });
}
main().catch(console.error);
