# Testing

## Run

```sh
node scripts/check.mjs                 # content data validation and index.html script wiring
node scripts/build_app.mjs             # regenerate assets/app.js (CI fails if it is out of date)
node --test tests/*.test.mjs           # unit tests (use the glob; "node --test tests/" does not work)
```

## Unit tests (61, `tests/`)

Pure logic only, run in Node with no browser:

- `calc.test.mjs`: every calculator, edge cases (blank vs invalid input, zero and extreme values, NaN), ROI cash vs capacity benefits, payback.
- `rules.test.mjs`: lifecycle transitions and required notes, weighted scoring, incomplete scores, sensitivity, rank stability, quadrants, risk severity, derived health hints.
- `store.test.mjs`: add/update/remove/archive, migration, corrupt and newer-version storage, quota errors, import preview and strategies, rollback on failure, sample-store isolation, prototype-key rejection, secret guard.
- `exporters.test.mjs`: CSV formula-injection guard, quoting, Markdown output.
- `dashboard.test.mjs`: KPI numbers, record ids behind each KPI, date windows, empty workspace.

Key assertions were checked by mutation (breaking the code to confirm a test fails).

## Browser checks done by hand (headless Chromium, 2026-11-20)

Not part of CI. Scripts were run once against a local static server, including a sub-path (`/aws-ai-atlas/`) to mimic GitHub Pages:

- Every new route and every existing route loads with no console or page errors; unknown routes show "Not found".
- Create, edit, score, and view an initiative; validation errors shown; HTML in names is escaped; a credential-looking value is refused.
- Calculators: all nine render results; invalid input shows an error instead of a result; scenarios save, list and compare.
- Export, delete, import (preview then apply), rejection of invalid JSON and files from other apps, persistence after reload, recovery from corrupt storage.
- Sample mode shows a banner, is separate from personal data, and KPI links open the matching lists.
- No horizontal overflow at 375 px on the new pages; every form control has a label; one `h1` per page; search finds the new pages.

## Not covered

- No automated browser tests in CI; no cross-browser testing (Chromium only); no screen-reader testing; no visual regression tests.
