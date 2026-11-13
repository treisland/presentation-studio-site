import { chromium } from '../upstream/node_modules/playwright/index.mjs';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
import assert from 'node:assert/strict';
const browser = await chromium.launch();
try {
  const page = await browser.newPage();
  for (const theme of ['light', 'dark']) {
  for (const width of [1440, 768, 390]) {
    await page.setViewportSize({ width, height: 960 });
    for (const file of ['index.html', 'examples.html', 'releases.html', 'docs/first-presentation.html']) {
      await page.goto(pathToFileURL(resolve('public', file)).href);
      await page.getByLabel('Color theme').selectOption(theme);
      assert.equal(await page.locator('html').getAttribute('data-theme'), theme);
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `${width}: ${file} overflow`);
      for (const image of await page.locator('img').all()) {
        await image.evaluate(async node => { node.loading = 'eager'; await node.decode(); });
        assert(await image.evaluate(node => node.complete && node.naturalWidth > 0));
      }
    }
  }
  await page.goto(pathToFileURL(resolve('public/index.html')).href);
  await page.getByLabel('Color theme').selectOption(theme);
  await page.screenshot({ path: `upstream/test-results/theme-${theme}-mobile.png`, fullPage: true });
  await page.setViewportSize({ width: 1440, height: 1100 });
  await page.screenshot({ path: `upstream/test-results/theme-${theme}-desktop.png`, fullPage: true });
  await page.goto(pathToFileURL(resolve('public/docs/first-presentation.html')).href);
  await page.getByLabel('Color theme').selectOption(theme);
  await page.screenshot({ path: `upstream/test-results/theme-${theme}-guide.png`, fullPage: true });
  }
  await page.getByLabel('Color theme').selectOption('dark');
  await page.reload();
  assert.equal(await page.getByLabel('Color theme').inputValue(), 'dark');
  assert.equal(await page.locator('html').getAttribute('data-theme'), 'dark');
  await page.getByLabel('Color theme').selectOption('system');
  await page.emulateMedia({ colorScheme: 'light' });
  assert.equal(await page.locator('html').getAttribute('data-theme'), 'light');
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.waitForFunction(() => document.documentElement.dataset.theme === 'dark');
  await page.reload();
  await page.keyboard.press('Tab');
  assert(await page.locator('.skip').evaluate(node => node === document.activeElement));
  await page.goto(pathToFileURL(resolve('public/index.html')).href);
  await page.screenshot({ path: 'upstream/test-results/public-mobile.png', fullPage: true });
  await page.setViewportSize({ width: 1440, height: 1100 });
  await page.screenshot({ path: 'upstream/test-results/public-desktop.png', fullPage: true });
  console.log('Public light/dark desktop/tablet/mobile pages, images, theme persistence, OS changes and keyboard skip passed.');
} finally {
  await browser.close();
}
