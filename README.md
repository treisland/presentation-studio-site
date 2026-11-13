# Presentation Studio website

Publishing repository for the documentation and marketing companion at the proposed https://docs.pres-studio.com/. Content and builder remain in treisland/presentation-studio.

## Branding

assets/logo-symbol.svg is the stacked-player mark. logo-dark.svg has dark lettering for light surfaces; logo-light.svg has light lettering for dark surfaces. Violet #7057E8, mint #5AD8BE, ink #182235, paper #F7F8FC. Wordmarks use live text with Arial fallback; final outlined typography and small-size visual acceptance remain pending.

## Publishing policy

Publication starts disabled. Review changes to site-source.json through a codex/ branch and PR. Configure an immutable, separately approved website ZIP URL, its SHA256 and source commit. This is a future website artifact contract: the app release's existing four assets are unchanged. Do not substitute a local-review-only build or remove pending provenance gates to enable launch.

The ZIP must contain index.html and provenance.json at its root. Provenance must include contentSha matching sourceCommit, contentDirty:false, publication:"approved-public", and pending:[]. Record actual human image/content/launch acceptance in the source repository before producing this artifact. The current companion builder emits local-review-only artifacts and needs a separate approved source PR to implement this export contract and validation.

Pushes and manual runs validate the approved artifact and deploy from main. Pull requests validate without deploying. Hourly checks at minute 23 compare the approved artifact to the public deployment receipt and skip unchanged deployments. They recover missed deployments of an approved configuration; they do not discover or approve arbitrary new source commits. Automatic discovery should propose configuration PRs once the upstream artifact contract exists.

## First launch

1. Complete the source export contract, site/link/image review and initial publication approval.
2. Configure this repository's Pages source as GitHub Actions and restrict the github-pages deployment environment to main. Set PR/check protections before enabling publication.
3. Verify domain ownership in GitHub. Set the Pages custom domain to docs.pres-studio.com. At Namecheap add CNAME host docs pointing to treisland.github.io. Enable HTTPS after verification.
4. Merge the approved artifact configuration with publicationEnabled:true and run the workflow manually. Check homepage, guides, images, mobile navigation and deployment.json.

No DNS, Pages configuration or public launch is performed by the initial repository setup. Rollback uses a reviewed PR restoring a previously approved artifact configuration, followed by a manual run. Keep its original digest and source commit. Failure before deployment leaves the current website intact.

## Local validation

Node 22: node --check scripts/prepare.mjs; node scripts/prepare.mjs. The disabled configuration validates without downloading or publishing. Enabled preparation requires unzip, as provided on the Ubuntu runner.
