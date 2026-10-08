const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox'] });
  const page = await browser.newPage();
  
  const gifData = fs.readFileSync('public/assets/BOSS/001.gif').toString('base64');
  
  await page.setContent(`
    <html>
      <body style="margin: 0; padding: 0;">
        <canvas id="c"></canvas>
        <script>
          // We can't easily extract gif frames in browser natively.
          // Actually, we can use a library in the browser.
        </script>
      </body>
    </html>
  `);
  await browser.close();
})();
