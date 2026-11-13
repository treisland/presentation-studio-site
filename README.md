# Presentation Studio website

Deploys the existing documentation and marketing companion from treisland/presentation-studio to https://docs.pres-studio.com/. Canonical guides, layout, styles and builder remain in the application repository.

## Build and publication

site-source.json pins the approved source commit. The workflow checks out that immutable revision, installs its locked dependencies, runs the existing builder and desktop/tablet/mobile keyboard/image/search checks, then prepares a public artifact with the stacked-player logo. It does not change source application files or release assets. captures/ preserves the original stable 0.11.0 screenshot inputs and their manifest; the upstream builder verifies their hashes and app identity. Public screenshots retain their actual stable version labels.

scripts/publish.mjs is the deployment adapter: it removes local-preview labels, adds branding, validates public local links/assets, and writes deployment/provenance receipts. Launch was authorized by the maintainer on 2026-11-13. Manual fresh-user and screen-reader observations are not claimed completed and remain recorded in provenance.

Pull requests build and validate without deploying. Main pushes and manual dispatches publish after successful validation. Hourly checks at minute 23 compare the approved configuration identity with the public receipt and skip unchanged builds. They recover missed approved deployments; discovering arbitrary upstream changes does not authorize publication. Update sourceCommit and screenshot inputs through reviewed codex/ PRs. No cross-repository token or app-release artifact contract is needed.

## Automatic release listings

Each run reads the stable and beta app's embedded build identity and verifies the complete served HTML digest against its published GitHub release asset. Missing identity, dirty builds, channel mismatch, draft releases or digest mismatch stop publication. The deployment identity includes both verified channels, so hourly checks rebuild when a deployed release changes even if the approved content commit stays pinned. Release cards and release-note links update; screenshot provenance remains labeled with its original 0.11.0 version. This does not approve arbitrary upstream content changes or promote application releases.

## Operations

GitHub Pages uses GitHub Actions with custom domain docs.pres-studio.com and enforced HTTPS. DNS CNAME docs points to treisland.github.io. The github-pages environment should be restricted to main. Only the deploy job receives pages:write and id-token:write.

Rollback: restore a previously validated sourceCommit and matching captures through a PR, then manually dispatch the workflow. Failed builds leave the previous deployment intact. Keep the app's protected main checks and release policies unchanged.

## Branding

assets/logo-symbol.svg is the stacked-player mark. logo-dark.svg has dark lettering for light backgrounds; logo-light.svg has light lettering for dark backgrounds. Violet #7057E8, mint #5AD8BE, ink #182235, paper #F7F8FC. Wordmarks use live Arial text; outlined typography is a future refinement.

## Local validation

With Node 22 and the pinned source checked out as upstream/, run npm ci in upstream. From upstream run node scripts/build-companion.mjs --captures ../captures/manifest.json --out test-results/companion-preview/publish and npm run test:companion -- test-results/companion-preview/publish. From this repository run node scripts/prepare.mjs and node scripts/publish.mjs. Output public/ and the source checkout are ignored.
