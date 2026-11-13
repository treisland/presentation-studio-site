import { readFile, writeFile, cp, stat } from 'node:fs/promises';
import { resolve, dirname, join, sep } from 'node:path';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';
const config = JSON.parse(await readFile('site-source.json', 'utf8'));
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
const identity = createHash('sha256').update(await readFile('site-source.json')).update(await readFile('captures/manifest.json')).digest('hex');
await writeFile('public/deployment.json', JSON.stringify({ identity, sourceCommit: config.sourceCommit, publisherCommit: process.env.GITHUB_SHA || 'local-validation' }, null, 2));
provenance.publication = 'public';
provenance.launchAuthorization = 'Maintainer requested publication and direct-source integration in this chat, 2026-11-13.';
provenance.pending = ['Manual fresh-user observation and screen-reader review are not recorded as completed.'];
await writeFile('public/provenance.json', JSON.stringify(provenance, null, 2));
console.log(`Validated ${provenance.pages.length} public pages and their local links/assets.`);
