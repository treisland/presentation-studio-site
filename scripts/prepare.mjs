import { readFile, writeFile, mkdir, appendFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';

const config = JSON.parse(await readFile('site-source.json', 'utf8'));
if (config.domain !== 'docs.pres-studio.com') throw Error('Unexpected publication domain');
if (!config.publicationEnabled) {
  console.log('Launch pending: configuration validated; no publication.');
  process.exit(0);
}
if (!/^[a-f0-9]{40}$/.test(config.sourceCommit) || !/^[a-f0-9]{64}$/.test(config.sha256)) throw Error('Immutable source commit and SHA256 required');
const url = new URL(config.artifactUrl);
if (url.origin !== 'https://github.com' || !url.pathname.startsWith('/treisland/presentation-studio/releases/download/')) throw Error('Use an approved source-repository release artifact');
const response = await fetch(url);
if (!response.ok) throw Error(`Artifact download failed: ${response.status}`);
const bytes = Buffer.from(await response.arrayBuffer());
if (createHash('sha256').update(bytes).digest('hex') !== config.sha256) throw Error('Artifact digest mismatch');
await writeFile('approved-site.zip', bytes);
const entries = execFileSync('unzip', ['-Z1', 'approved-site.zip'], { encoding: 'utf8' }).trim().split('\n');
if (entries.some(entry => entry.startsWith('/') || entry.includes('\\') || entry.split('/').includes('..'))) throw Error('Unsafe archive path');
await mkdir('public', { recursive: true });
execFileSync('unzip', ['-q', 'approved-site.zip', '-d', 'public']);
const provenance = JSON.parse(await readFile('public/provenance.json', 'utf8'));
if (provenance.contentSha !== config.sourceCommit || provenance.contentDirty !== false || provenance.publication !== 'approved-public' || !Array.isArray(provenance.pending) || provenance.pending.length) throw Error('Public launch evidence incomplete');
await readFile('public/index.html');
await writeFile('public/deployment.json', JSON.stringify({ sourceCommit: config.sourceCommit, sha256: config.sha256 }) + '\n');
if (process.env.GITHUB_EVENT_NAME === 'schedule') {
  const deployed = await fetch(`https://${config.domain}/deployment.json`, { cache: 'no-store' });
  if (!deployed.ok) throw Error('Cannot inspect current deployment; use manual dispatch for first launch');
  if ((await deployed.json()).sha256 === config.sha256) {
    console.log('Approved artifact already deployed.');
    process.exit(0);
  }
}
if (process.env.GITHUB_OUTPUT) await appendFile(process.env.GITHUB_OUTPUT, 'publish=true\n');
