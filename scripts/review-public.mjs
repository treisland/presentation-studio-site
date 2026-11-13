import { chromium } from '../upstream/node_modules/playwright/index.mjs';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
import assert from 'node:assert/strict';
const browser = await chromium.launch();
try {
  const page = await browser.newPage();
  for (const width of [1440, 768, 390]) {
    await page.setViewportSize({ width, height: 960 });
    for (const file of ['index.html', 'examples.html', 'releases.html', 'docs/first-presentation.html']) {
      await page.goto(pathToFileURL(resolve('public', file)).href);
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `${width}: ${file} overflow`);
      for (const image of await page.locator('img').all()) {
        await image.evaluate(async node => { node.loading = 'eager'; await node.decode(); });
        assert(await image.evaluate(node => node.complete && node.naturalWidth > 0));
      }
    }
  }
  await page.goto(pathToFileURL(resolve('public/index.html')).href);
  await page.screenshot({ path: 'upstream/test-results/public-mobile.png', fullPage: true });
  await page.setViewportSize({ width: 1440, height: 1100 });
  await page.screenshot({ path: 'upstream/test-results/public-desktop.png', fullPage: true });
  console.log('Public desktop/tablet/mobile pages and branded images passed.');
} finally {
  await browser.close();
}
