# Implementation status — AWS AI Atlas V2

This file records what was built from the V2 implementation plan (`aws-ai-atlas-plan.md`), what is partly done, and what has not been started. It is the source of truth for "what does the Atlas do today". Update it with every change.

Last updated: 2026-11-20.

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
| Accessibility basics (labels, keyboard, text+symbol status, live regions) | Done, checked by script and by hand on the main pages | see `docs/testing/testing.md` |

## Not done

These parts of the plan were **not** implemented and should not be assumed to exist:

- Source and verification metadata (`sources`, `lastVerified`, confidence) on the existing technical content (services, architectures, decisions, models). The existing content and its numbers have **not** been re-verified in this iteration.
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
- Older static pages (Delivery, FinOps, Leadership, Toolkit, SRE, Eval, Security) still contain hand-written reference content. Some of it contains illustrative figures. The original static Command Centre is kept at `#/command/sample` behind an "ILLUSTRATIVE STATIC CONTENT" banner. The other static pages have not yet been relabelled or audited for illustrative numbers.
- Calculators use only numbers the user types. Example values prefilled in the forms are labelled as examples and are not AWS prices. Pricing is never fetched.
- Dates use the local clock of the browser and `YYYY-MM-DD` strings; no time-zone handling beyond that.

## Deployment

The site deploys through `.github/workflows/pages.yml` on every push to `main`. A deployment is only considered done once the workflow run succeeded and the live URL was loaded and checked. See the end of the commit history or the pull request for the verification record.
