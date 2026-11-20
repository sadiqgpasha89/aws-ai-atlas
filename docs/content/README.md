# Content notes

The reference content (services, architectures, decision guides, models, templates) was written before the V2 plan and has **not** been re-verified or given source metadata in this iteration.

Rules for new content, taken from the plan:

- Do not state live metrics, prices, quotas or availability as fact. Link to the official AWS page and say when it was checked.
- Add a source URL and a "last verified" date to any technical claim that can go stale.
- Mark illustrative figures as illustrative at the point they are shown.
- Never put secrets, real customer data or real personal data in fixtures.
- Sample records live only in `data/demo.js` and are always fictional and labelled.

See `docs/implementation/status.md` for what is outstanding.

## Current labelling

Reference pages show a notice from `assets/ui/content.js` (`A.contentNotice`), and `#/about/content` explains the status by area. The old "AWS Verified 2026" badges were removed because no record supported them; `scripts/check.mjs` rejects a "Verified <year>" string in the generator and data files.
