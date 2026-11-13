import { readFile, writeFile, appendFile } from 'node:fs/promises';
import { discoverChannels, deploymentIdentity } from './channels.mjs';
const config = JSON.parse(await readFile('site-source.json', 'utf8'));
if (config.domain !== 'docs.pres-studio.com' || !/^[a-f0-9]{40}$/.test(config.sourceCommit)) throw Error('Invalid source configuration');
const channels = await discoverChannels();
await writeFile('.channels.json', JSON.stringify(channels));
const identity = deploymentIdentity(await readFile('site-source.json'), await readFile('captures/manifest.json'), channels);
let build = true;
if (process.env.GITHUB_EVENT_NAME === 'schedule') {
  const response = await fetch(`https://${config.domain}/deployment.json`, { cache: 'no-store' });
  if (!response.ok) throw Error('Cannot inspect deployed identity; use manual dispatch for initial launch');
  build = (await response.json()).identity !== identity;
}
if (process.env.GITHUB_OUTPUT) await appendFile(process.env.GITHUB_OUTPUT, `build=${build}\nsource=${config.sourceCommit}\n`);
console.log(JSON.stringify({ build, identity, source: config.sourceCommit }));
