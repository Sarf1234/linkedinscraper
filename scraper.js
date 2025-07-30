const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const fs = require('fs');
const readline = require('readline');

// Enable stealth
puppeteer.use(StealthPlugin());

// Create terminal prompt function
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const askQuestion = (query) => new Promise(resolve => rl.question(query, resolve));

(async () => {
  // Get user inputs
  const USERNAME = await askQuestion('Enter LinkedIn Email: ');
  const PASSWORD = await askQuestion('Enter LinkedIn Password: ');
  const TARGET_URL = await askQuestion('Enter LinkedIn Job/Search URL: ');
  rl.close();

  const browser = await puppeteer.launch({ headless: false, defaultViewport: null });
  const page = await browser.newPage();

  await page.goto('https://www.linkedin.com/login', { waitUntil: 'domcontentloaded' });

  await page.type('#username', USERNAME.trim(), { delay: 100 });
  await page.type('#password', PASSWORD.trim(), { delay: 100 });
  await page.click('[type="submit"]');
  await page.waitForSelector('input[placeholder="Search"]', { timeout: 60000 });
  console.log('✅ Logged in');

  // Navigate to provided URL
  await page.goto(TARGET_URL.trim(), { waitUntil: 'networkidle2' });
  await page.waitForSelector('.artdeco-card', { timeout: 60000 });

  // Scroll + Extract Logic
  let jobDetails = [];

  const scrollAndExtract = async () => {
    let previousHeight = 0;
    let sameHeightCount = 0;

    while (true) {
      const newJobs = await page.evaluate(() => {
        const cards = document.querySelectorAll('.artdeco-card');
        return Array.from(cards).map(card => {
          const span = card.querySelector('span.break-words');
          return span ? span.innerText.trim() : 'No data';
        });
      });

      jobDetails = [...new Set([...jobDetails, ...newJobs])];
      console.log(`📄 Jobs Collected: ${jobDetails.length}`);

      const newHeight = await page.evaluate(() => {
        window.scrollTo(0, document.body.scrollHeight);
        return document.body.scrollHeight;
      });

      if (newHeight === previousHeight) {
        sameHeightCount++;
        console.log(`⏳ Same height detected (${sameHeightCount} times)`);
      } else {
        sameHeightCount = 0; // reset if height changes
      }

      if (sameHeightCount >= 3) {
        console.log('🛑 No more content to load after 3 attempts.');
        break;
      }

      previousHeight = newHeight;
      await new Promise(resolve => setTimeout(resolve, 8000));
    }
  };

  await scrollAndExtract();

  console.log('✅ Final Job Count:', jobDetails.length);
  fs.writeFileSync('jobs.json', JSON.stringify(jobDetails, null, 2));
  console.log('💾 Saved to jobs.json');

  // await browser.close();
})();
