import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { discoverChannels, deploymentIdentity } from '../scripts/channels.mjs';

function fixture(change = value => value) {
  return async url => {
    const beta = url.includes('beta');
    const version = beta ? '0.16.0-beta.1' : '0.16.0';
    const html = `<script id="studio-build-info" type="application/json">${JSON.stringify({ version, channel: beta ? 'beta' : 'stable', dirty: false, commit: 'a'.repeat(40) })}</script>`;
    if (!url.includes('api.github.com')) return new Response(html);
    return Response.json(change({ tag_name: `v${version}`, draft: false, prerelease: beta, published_at: '2026-11-13', assets: [{ name: 'presentation-studio.html', digest: `sha256:${createHash('sha256').update(html).digest('hex')}` }] }));
  };
}
test('discovers deployed channels from matching published release bytes', async () => {
  const result = await discoverChannels(fixture());
  assert.equal(result.stable.version, '0.16.0');
  assert.equal(result.beta.version, '0.16.0-beta.1');
});
test('rejects draft releases and mismatched app bytes', async () => {
  await assert.rejects(discoverChannels(fixture(value => ({ ...value, draft: true }))));
  await assert.rejects(discoverChannels(fixture(value => ({ ...value, assets: [] }))));
});
test('a channel update changes deployment identity without changing screenshot identity', () => {
  assert.notEqual(deploymentIdentity('source', 'captures', { stable: '0.11.0' }), deploymentIdentity('source', 'captures', { stable: '0.16.0' }));
});
