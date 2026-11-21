# Changelog

User-visible changes. Newest first.

## 2.0.0 — 2026-11-21

A redesign for simplicity and easier navigation, a minimalist theme, and new content.

### Changed
- **Navigation rebuilt around three sections** — Learn, Lead and Workspace — plus a real Home page. The top bar went from 14 overflowing links to four. The sidebar now shows only the current section, and expands the services, architectures, decisions or playbooks tree only when you are in it. On phones, the menu opens with a section switcher.
- **Home page** (`#/`): the site used to open on an empty workspace dashboard. It now explains the three sections, has a search box, and offers six goal-based reading paths. The workspace dashboard moved to `#/command` (the Workspace tab).
- **Section overview pages** `#/learn` and `#/lead`, with a card for every page and a "which page for which moment" guide for managers.
- **Breadcrumbs** on every page, and an **On this page** jump list on pages with four or more sections.
- **Minimalist theme**: white/near-black neutral palette, a single sans-serif typeface (no serif headings or italic ledes), hairline borders, one corner radius, no offset "brutalist" shadows, quieter content notices. Dark mode follows the same system.
- Footer links: portfolio, content status, glossary, source code.

### Added
- **Glossary** (`#/glossary`, `#/glossary/<term>`): 49 plain-language definitions in six groups (models and inference, retrieval and RAG, agents and tools, adapting models, quality and safety, cost and operations). Each term says where it shows up on AWS and links to the relevant services, architectures and decision guides. It has a filter box and group filters, appears in search under a new **Glossary** filter, and is validated by `scripts/check.mjs`.
- Tests for the formatting regexes, the four-section top bar and glossary search (80 tests).

### Fixed
- **Formatting never rendered on reference pages.** The generated `fmt()`/`paras()` regexes were double-escaped, so `**bold**` showed literally, `[[service]]` cross-links never became links, whole paragraphs rendered in bold, and blank-line paragraph breaks were ignored. This affected every service, architecture, decision and playbook page. Cross-links between services now work.
- **Phone menu covered the top bar** (the drawer started at the top of the page instead of under the header, hiding the menu button).
- A stray `}` in `style.css` silently discarded the role-tab styles on decision pages.

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
