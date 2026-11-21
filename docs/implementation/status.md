# Implementation status — AWS AI Atlas V2

This file records what was built from the V2 implementation plan (`aws-ai-atlas-plan.md`), what is partly done, and what has not been started. It is the source of truth for "what does the Atlas do today". Update it with every change.

Last updated: 2026-11-21 (v2.0: navigation redesign, minimalist theme, glossary).

## Summary

Done in this iteration: Phase 0 (foundations) and the Phase 1 management core (portfolio, scoring, registers, dashboard, calculators, export/import). The rest of the plan is **not** implemented.

## What exists

| Plan area | Status | Where |
|---|---|---|
| Extend the site, stay static, GitHub Pages compatible | Done | No backend, no build step for the site. `assets/app.js` is still generated from `scripts/build_app.mjs`; new code lives in separate files |
| Local-first versioned storage, JSON export/import | Done | `assets/lib/store.js`, `assets/ui/workspace.js` |
| Schemas and validation | Done | `assets/lib/schema.js` |
| Portfolio (initiatives) with lifecycle stages and stage history | Done | `assets/ui/portfolio.js`, `assets/lib/rules.js` |
| Weighted scoring, editable weights, sensitivity, rank stability, value/feasibility matrix | Done | `assets/ui/prioritise.js`, `assets/lib/rules.js` |
| Risk register, decision log, action tracker | Done | `assets/ui/registers.js` |
| Dashboard derived only from workspace records, every KPI links to its records | Done | `assets/ui/command.js`, `assets/lib/dashboard.js` |
| Calculators: LLM, RAG, agent, model comparison, budget, capacity, unit economics, optimisation, ROI/payback with scenarios | Done | `assets/ui/calc.js`, `assets/lib/calc.js` |
| Saved scenarios and comparison | Done | `assets/ui/calc.js` |
| Sample data mode, clearly labelled, separate from user data | Done | `data/demo.js`, `assets/ui/common.js` |
| CSV (formula-injection safe) and Markdown exports | Done | `assets/lib/exporters.js` |
| Unit tests (61) and CI gate | Done | `tests/`, `.github/workflows/pages.yml` |
| Honest content status: removed the unsubstantiated "AWS Verified 2026" badges, added a notice on every reference page and a `#/about/content` page; `check.mjs` fails if a "Verified <year>" claim reappears | Done | `assets/ui/content.js`, `scripts/check.mjs` |
| Model registry provenance: sources, "last verified: not recorded", and an "example" mark on columns that describe a hypothetical organisation; `check.mjs` validates the provenance block | Done | `data/models.js`, `scripts/check.mjs` |
| Model registry partial verification (2026-11-20): each model has a `check` result with source and note. 4 models carry AWS lifecycle notices (3 past their end-of-life date in the listed Regions), 2 prices confirmed, 1 price differs, 9 not confirmed or example only | Done, partial | `data/models.js`, `scripts/check.mjs` |
| Site structure: Home, Learn, Lead, Workspace sections; section sidebar; breadcrumbs; on-this-page links | Done | `assets/ui/home.js` (`A.ia`), `scripts/build_app.mjs` (`renderSide`, `crumbs`, `addToc`) |
| Glossary of 49 terms with AWS mapping, searchable, validated | Done | `data/glossary.js`, `assets/ui/home.js`, `scripts/check.mjs` |
| Accessibility basics (labels, keyboard, text+symbol status, live regions) | Done, checked by script and by hand on the main pages | see `docs/testing/testing.md` |

## Not done

These parts of the plan were **not** implemented and should not be assumed to exist:

- Full verification of the model registry. Only the legacy/end-of-life page was readable; the Bedrock pricing page's collapsed tables could not be read by the fetch tool, so 9 of 16 models have no confirmed price. The fetch tool summarises page text, so important dates should be rechecked with `aws bedrock get-foundation-model` (`modelLifecycle`) in your Region. Models newer than those in the registry (for example the current Claude and Nova generations) are not in it.
- Per-claim source and verification metadata (`sources`, `lastVerified`, confidence) on the existing technical content (services, architectures, decisions). Models now have partial checks. Pages now say plainly that figures are unverified, but nothing has been re-verified and no verification dates are recorded.
- Model registry and evaluation tracking as editable records; evaluation run results; production health or SLO data entry.
- Team capacity and skills records; hiring or staffing planning.
- Stakeholder, governance/compliance and audit-evidence records; incident and postmortem records.
- Architecture review records saved into the workspace (the static review page remains reference content).
- Roadmap and release planning views; dependency mapping between initiatives.
- Multi-tab conflict handling beyond last-write-wins in the same browser.
- Automated browser (end-to-end) tests in CI. Browser checks so far were run by hand with a headless browser; see the testing notes.
- A formal accessibility audit with assistive technology. Only scripted checks and keyboard checks were done.

## Known limits and caveats

- Data lives in one browser's `localStorage`. It is not encrypted, not synced and not shared. Clearing site data deletes it; the export file is the backup.
- Older static pages (Delivery, FinOps, Leadership, Toolkit, SRE, Eval, Security) still contain hand-written reference content. Some of it contains illustrative figures. The original static Command Centre is kept at `#/command/sample` behind an "ILLUSTRATIVE STATIC CONTENT" banner. Every other reference page now shows a notice ("Figures not verified" or "Illustrative guidance"), but individual figures have not been audited one by one.
- Calculators use only numbers the user types. Example values prefilled in the forms are labelled as examples and are not AWS prices. Pricing is never fetched.
- Dates use the local clock of the browser and `YYYY-MM-DD` strings; no time-zone handling beyond that.

## Deployment

The site deploys through `.github/workflows/pages.yml` on every push to `main`. A deployment is only considered done once the workflow run succeeded and the live URL was loaded and checked. See the end of the commit history or the pull request for the verification record.
