const puppeteer = require('puppeteer');

(async () => {
    const browser = await puppeteer.launch({ headless: 'new' });
    const page = await browser.newPage();

    // High res viewport
    await page.setViewport({ width: 1400, height: 900 });

    // Go to the live Vercel deployment
    await page.goto('https://project-nine-iota-87.vercel.app', { waitUntil: 'networkidle0' });

    // Take screenshot
    await page.screenshot({ path: 'public/screenshot.png' });

    console.log('Screenshot saved to public/screenshot.png');
    await browser.close();
})();
