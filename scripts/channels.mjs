import { createHash } from 'node:crypto';

export async function discoverChannels(request = fetch) {
  const channels = {};
  for (const [channel, origin] of [['stable', 'https://pres-studio.com/'], ['beta', 'https://beta.pres-studio.com/']]) {
    const response = await request(origin, { cache: 'no-store' });
    if (!response.ok) throw Error(`Cannot inspect ${channel} app: ${response.status}`);
    const bytes = Buffer.from(await response.arrayBuffer());
    const match = bytes.toString('utf8').match(/<script id="studio-build-info" type="application\/json">([^<]+)<\/script>/);
    if (!match) throw Error(`Missing ${channel} build identity`);
    const info = JSON.parse(match[1]);
    if (info.channel !== channel || info.dirty !== false || !/^[a-f0-9]{40}$/.test(info.commit) || !/^\d+\.\d+\.\d+(?:-beta\.\d+)?$/.test(info.version)) throw Error(`Invalid ${channel} build identity`);
    if ((channel === 'beta') !== info.version.includes('-beta.')) throw Error('Channel/version mismatch');
    const tag = `v${info.version}`;
    const releaseResponse = await request(`https://api.github.com/repos/treisland/presentation-studio/releases/tags/${tag}`, { headers: { Accept: 'application/vnd.github+json' }, cache: 'no-store' });
    if (!releaseResponse.ok) throw Error(`Cannot verify published ${tag}`);
    const release = await releaseResponse.json();
    const digest = `sha256:${createHash('sha256').update(bytes).digest('hex')}`;
    const asset = release.assets?.find(entry => entry.name === 'presentation-studio.html');
    if (release.draft || !release.published_at || release.tag_name !== tag || release.prerelease !== (channel === 'beta') || asset?.digest !== digest) throw Error(`Live ${channel} app does not match a published release asset`);
    channels[channel] = { version: info.version, commit: info.commit, digest, app: origin, release: `https://github.com/treisland/presentation-studio/releases/tag/${tag}` };
  }
  return channels;
}

export function deploymentIdentity(config, captures, channels) {
  return createHash('sha256').update(config).update(captures).update(JSON.stringify(channels)).digest('hex');
}
