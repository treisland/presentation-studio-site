import { readFile, writeFile, cp, stat } from 'node:fs/promises';
import { resolve, dirname, join, sep } from 'node:path';
import { deploymentIdentity } from './channels.mjs';
import assert from 'node:assert/strict';
const config = JSON.parse(await readFile('site-source.json', 'utf8'));
const channels = JSON.parse(await readFile('.channels.json', 'utf8'));
const content = JSON.parse(await readFile('upstream/website/content.json', 'utf8'));
const output = 'upstream/test-results/companion-preview/publish';
const provenance = JSON.parse(await readFile(`${output}/provenance.json`, 'utf8'));
assert.equal(provenance.contentSha, config.sourceCommit);
assert.equal(provenance.contentDirty, false);
await cp(output, 'public', { recursive: true, errorOnExist: true, force: false });
await cp('assets', 'public/assets/branding', { recursive: true });
for (const page of provenance.pages) {
  const path = join('public', page);
  const prefix = page.startsWith('docs/') ? '../' : '';
  let html = await readFile(path, 'utf8');
  assert(html.includes('Local development review · not published · screenshot acceptance pending'));
  html = html.replace('<meta name="robots" content="noindex,nofollow">', '')
    .replace('class="wordmark"', 'class="wordmark" style="display:inline-flex;align-items:center"')
    .replace('<div class="review">Local development review · not published · screenshot acceptance pending</div>', '')
    .replace('<span class="logo" aria-hidden="true"></span>', `<img src="${prefix}assets/branding/logo-symbol.svg" width="36" height="32" alt="" style="vertical-align:middle;margin-right:10px">`)
    .replace(' · local image review pending.', '.')
    .replace(' Image acceptance pending.', '')
    .replace('The v0.16.0 milestone remains development work. This local companion does not promote an app release or publish a new version.', 'Choose the stable app for regular use. Beta releases are opt-in previews; consult their release notes before switching.');
  assert(!/not published|acceptance pending|noindex,nofollow/.test(html));
  html = html.replace('<meta charset="utf-8">', `<meta charset="utf-8"><script src="${prefix}assets/branding/theme.js"></script>`)
    .replace('</head>', `<link rel="icon" href="${prefix}assets/branding/logo-symbol.svg" type="image/svg+xml"><link rel="stylesheet" href="${prefix}assets/branding/gallery-theme.css"></head>`)
    .replace('>Presentation Studio</a><nav', '>Presentation Studio<span class="brand-label">Docs</span></a><nav')
    .replace('<a class="button" href="https://pres-studio.com/">Open Studio</a></nav>', '<a href="https://gallery.pres-studio.com/">Gallery ↗</a><select id="theme-preference" class="theme-select" aria-label="Color theme"><option value="system">System</option><option value="light">Light</option><option value="dark">Dark</option></select><a class="button" href="https://pres-studio.com/">Open Studio</a></nav>')
    .replace('Create in your browser.<br>Present anywhere.</h1>', 'Create in your browser.<br><em>Present anywhere.</em></h1>');
  assert(html.includes('id="theme-preference"'), 'Theme control missing');
  assert(html.includes('class="brand-label"'), 'Docs brand label missing');
  if (page === 'releases.html') {
    for (const channel of ['stable', 'beta']) {
      const old = content[channel];
      assert(html.includes(`<h2>${old.version}</h2>`));
      html = html.replace(`<h2>${old.version}</h2>`, `<h2>${channels[channel].version}</h2>`)
        .replaceAll(old.release, channels[channel].release);
    }
    html = html.replace('The default app and imagery on this companion.', 'The current stable app. Screenshot versions are labeled separately.');
  }
  await writeFile(path, html);
  assert.equal((html.match(/<main\b/g) || []).length, 1);
  for (const match of html.matchAll(/(?:href|src)="([^"]+)"/g)) {
    const url = match[1].replaceAll('&amp;', '&');
    if (/^https:\/\//.test(url) || url.startsWith('#')) continue;
    const [file, anchor] = url.split('#');
    const target = resolve(dirname(path), decodeURIComponent(file));
    assert(target.startsWith(resolve('public') + sep));
    await stat(target);
    if (anchor && target.endsWith('.html')) assert((await readFile(target, 'utf8')).includes(`id="${anchor}"`));
  }
}
const identity = deploymentIdentity(await readFile('site-source.json'), await readFile('captures/manifest.json'), channels);
await writeFile('public/deployment.json', JSON.stringify({ identity, channels, sourceCommit: config.sourceCommit, publisherCommit: process.env.GITHUB_SHA || 'local-validation' }, null, 2));
provenance.publication = 'public';
provenance.launchAuthorization = 'Maintainer requested publication and direct-source integration in this chat, 2026-11-13.';
provenance.pending = ['Manual fresh-user observation and screen-reader review are not recorded as completed.'];
await writeFile('public/provenance.json', JSON.stringify(provenance, null, 2));
console.log(`Validated ${provenance.pages.length} public pages and their local links/assets.`);
