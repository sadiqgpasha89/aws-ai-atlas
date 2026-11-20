---
name: Revalidate time-sensitive content
about: A service, model, price, limit or lifecycle fact is due for review or has changed
title: "Revalidate: <service or topic>"
labels: content-freshness
---

**What needs checking**
<!-- Service/page, route (for example #/models or #/s/bedrock) and the claim in question. -->

**Why now**
- [ ] Shown as "not verified" on `#/about/content`
- [ ] AWS announced a change, such as a model end-of-life date (link below)
- [ ] A reader reported it
- [ ] Other:

**First-party source(s) read** (exact URL, title and the "last updated" date shown on the page)
1.

**Result**
- [ ] Claims still match. Updated the check record (source, date, note) in `data/models.js`.
- [ ] Claims changed. Updated the page text and the record, and added a CHANGELOG line.
- [ ] Could not verify. Left the record as unverified and noted why here.

Follow `docs/content/README.md`. Never copy a date forward without reading the source again. For model lifecycle, confirm in your Region with `aws bedrock get-foundation-model`.
