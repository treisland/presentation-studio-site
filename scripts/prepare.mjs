import { readFile, appendFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
const config = JSON.parse(await readFile('site-source.json', 'utf8'));
if (config.domain !== 'docs.pres-studio.com' || !/^[a-f0-9]{40}$/.test(config.sourceCommit)) throw Error('Invalid source configuration');
const identity = createHash('sha256').update(await readFile('site-source.json')).update(await readFile('captures/manifest.json')).digest('hex');
let build = true;
if (process.env.GITHUB_EVENT_NAME === 'schedule') {
  const response = await fetch(`https://${config.domain}/deployment.json`, { cache: 'no-store' });
  if (!response.ok) throw Error('Cannot inspect deployed identity; use manual dispatch for initial launch');
  build = (await response.json()).identity !== identity;
}
if (process.env.GITHUB_OUTPUT) await appendFile(process.env.GITHUB_OUTPUT, `build=${build}\nsource=${config.sourceCommit}\n`);
console.log(JSON.stringify({ build, identity, source: config.sourceCommit }));
