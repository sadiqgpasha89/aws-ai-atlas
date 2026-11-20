# Changelog

User-visible changes. Newest first.

## 1.1.0 — 2026-11-20

Brings the Azure AI Atlas Milestone A changes (stabilise, search, security headers, tests and CI) to this atlas. A route-by-route browser crawl (180 routes at 1280 px and 375 px) found the defects below; the same crawl now runs as a test.

### Added
- **Search rewrite**: `assets/search.js` indexes about 340 entries (services, architectures, decisions, playbooks, models, templates, workspace and calculator pages, and the items inside Evaluation, Operations, Governance, Leadership, Delivery and Labs). It understands acronyms and error codes (RAG, MCP, IAM, SLO, ARB, SCP, 429), has type filters, highlights matches, matches short terms as whole words, and shows guidance when nothing matches.
- **Content-Security-Policy** (meta tag). The theme script moved to `assets/theme.js`, and the two inline `onsubmit` handlers were removed.
- **Browser smoke test** (`npm run smoke`): opens every route reachable from the home page at two widths and fails on console or CSP errors, horizontal overflow, empty pages, `undefined`/`NaN` text and links that lead to "Not found"; then exercises search, a calculator and the theme toggle.
- `npm run check`, `npm test` (77 tests: the existing 61 plus search and site tests), `npm run verify`, a local server (`npm run serve`), a CI workflow (`ci.yml`) and a content-revalidation issue template.

### Fixed
- **Playbook pages "RAG engineering" and "GenAIOps" crashed** (`A.workloadGates[...].map is not a function`): the gate table read the wrong data shape. Both pages now show their workload release gates.
- **Architecture Review**: the Likelihood and Impact drop-downs showed `undefined` in every option (8 cells). Every option carried the value "undefined", so the score came out as NaN. They now use the data's `score` field.
- **Sideways scrolling on every page at desktop width** (top navigation 177 px too wide). The nav now scrolls inside its own row.
- Grid columns with fixed minimum widths no longer force overflow on narrow screens.

### Changed
- Deployment to GitHub Pages also syntax-checks `assets/search.js` and `assets/theme.js`.

### Known limitations
- No accessibility scan, external link check or Lighthouse run has been performed.
- Content verification is unchanged: reference pages are labelled unverified, and the model registry is only partly verified (see `#/about/content`).
- Architecture Review's risk bands in the page (low up to 4, medium up to 8, high up to 12) differ from the `getScore` helper in `data/archreview.js` (3, 7, 11). The page wording is unchanged here; one of them should be chosen.

## 1.0.0

Earlier releases (V2 workspace, content labelling, model registry checks) are described in the git history and `docs/implementation/status.md`.
