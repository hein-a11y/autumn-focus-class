const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', error => console.log('PAGE ERROR:', error.message));
  await page.goto('http://localhost:5173');
  await new Promise(r => setTimeout(r, 3000));
  console.log('Clicking start...');
  await page.keyboard.press('Enter');
  await new Promise(r => setTimeout(r, 2000));
  console.log('Testing movement...');
  await page.keyboard.press('KeyD');
  await new Promise(r => setTimeout(r, 1000));
  await browser.close();
})();
