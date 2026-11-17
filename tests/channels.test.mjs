import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { discoverChannels, deploymentIdentity } from '../scripts/channels.mjs';

function fixture(change = value => value, preview='beta') {
  return async url => {
    const beta = url.includes('beta')||url.includes('-'+preview+'.');
    const version = beta ? '0.16.0-'+preview+'.1' : '0.16.0';
    const html = `<script id="studio-build-info" type="application/json">${JSON.stringify({ version, channel: beta ? preview : 'stable', dirty: false, commit: 'a'.repeat(40) })}</script>`;
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


test('RC deployment is an approved preview and still requires matching release bytes',async()=>{
 const channels=await discoverChannels(fixture(value=>value,'rc'));
 assert.equal(channels.beta.version,'0.16.0-rc.1');
 assert.equal(channels.beta.release,'https://github.com/treisland/presentation-studio/releases/tag/v0.16.0-rc.1');
 await assert.rejects(discoverChannels(fixture(value=>({...value,draft:true}),'rc')));
 await assert.rejects(discoverChannels(fixture(value=>({...value,assets:[]}),'rc')));
 await assert.rejects(discoverChannels(fixture(value=>({...value,prerelease:false}),'rc')));
 await assert.rejects(discoverChannels(fixture(value=>value,'alpha')));
});
