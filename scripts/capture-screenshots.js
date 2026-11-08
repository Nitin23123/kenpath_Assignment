const puppeteer = require('../server/node_modules/puppeteer-core');
const path = require('path');
const fs = require('fs');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const OUTPUT_DIR = path.join(__dirname, '..', 'docs', 'screenshots');

async function capture() {
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  console.log('Launching Chrome for screenshot capture...');
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    defaultViewport: { width: 1440, height: 900, deviceScaleFactor: 2 },
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();

  try {
    // 1. Login Page
    console.log('Capturing 01-login.png...');
    await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle0' });
    await page.screenshot({ path: path.join(OUTPUT_DIR, '01-login.png') });

    // 2. Log in as Patient
    console.log('Logging in as Patient...');
    await page.type('input[type="email"]', 'demo@sweety.com');
    await page.type('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');

    await page.waitForNavigation({ waitUntil: 'networkidle0' });
    await new Promise((r) => setTimeout(r, 1000));

    // 2. Dashboard
    console.log('Capturing 02-dashboard.png...');
    await page.screenshot({ path: path.join(OUTPUT_DIR, '02-dashboard.png') });

    // 3. Open Modal
    console.log('Capturing 03-add-reading-modal.png...');
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const logBtn = btns.find(b => b.textContent.includes('Log Glucose Reading') || b.textContent.includes('Log Reading'));
      if (logBtn) logBtn.click();
    });
    await new Promise((r) => setTimeout(r, 500));
    await page.screenshot({ path: path.join(OUTPUT_DIR, '03-add-reading-modal.png') });

    // 4. Trigger Validation Error
    console.log('Capturing 04-validation-error.png...');
    await page.evaluate(() => {
      const valInput = document.querySelector('#glucose-value');
      if (valInput) {
        valInput.value = '35';
        valInput.dispatchEvent(new Event('input', { bubbles: true }));
      }
    });
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const saveBtn = btns.find(b => b.textContent.includes('Save Reading'));
      if (saveBtn) saveBtn.click();
    });
    await new Promise((r) => setTimeout(r, 500));
    await page.screenshot({ path: path.join(OUTPUT_DIR, '04-validation-error.png') });

    // Close modal
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const cancelBtn = btns.find(b => b.textContent.includes('Cancel'));
      if (cancelBtn) cancelBtn.click();
    });
    await new Promise((r) => setTimeout(r, 400));

    // 5. Reports Page
    console.log('Capturing 05-reports.png...');
    await page.goto('http://localhost:5173/reports', { waitUntil: 'networkidle0' });
    await new Promise((r) => setTimeout(r, 1200));
    await page.screenshot({ path: path.join(OUTPUT_DIR, '05-reports.png') });

    // 6. Doctor Portal
    console.log('Capturing 06-doctor-portal.png...');
    await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle0' });
    await page.evaluate(() => {
      localStorage.clear();
    });
    await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle0' });
    await page.type('input[type="email"]', 'doctor@sweety.com');
    await page.type('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');

    await page.waitForNavigation({ waitUntil: 'networkidle0' });
    await new Promise((r) => setTimeout(r, 1200));
    await page.screenshot({ path: path.join(OUTPUT_DIR, '06-doctor-portal.png') });

    console.log('All screenshots captured successfully in docs/screenshots!');
  } catch (err) {
    console.error('Error capturing screenshots:', err);
  } finally {
    await browser.close();
  }
}

capture();
