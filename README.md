# AWS for AI/ML Systems — an interactive atlas

A static, no-build website that explains the AWS services you use to build AI and ML systems: what each one is, how it works step by step (with an animated stepper), the gotchas and edge cases, and how to use it in larger systems.

- **69 services** in **11 categories**: Compute & Accelerators, Storage, Databases & Vector Stores, Data & Analytics, Streaming & Orchestration, Generative AI, ML Platform (SageMaker), Pre-built AI Services, Networking & Delivery, Security & Identity, Observability & Operations.
- **6 reference architectures** (RAG assistant, self-hosted LLM serving, MLOps, agent platform, document intelligence, real-time features), each a step-through diagram whose boxes link to the service pages.
- **4 decision tables** (where to run a model, which vector store, how to orchestrate, how to improve a model).
- Search (`/` or `Ctrl/Cmd+K`), light and dark themes, keyboard-friendly steppers, responsive layout.

Pure HTML, CSS and JavaScript. No framework, no bundler, no dependencies.

## Run it locally

```bash
python3 -m http.server 8000
# open http://localhost:8000
```

## Publish on GitHub Pages

1. Create a new GitHub repository (for example `aws-ai-atlas`) and push this folder to its `main` branch.
2. In the repository go to **Settings → Pages** and set **Source** to **GitHub Actions**.
3. Push to `main`. The workflow in `.github/workflows/pages.yml` validates the data and deploys. Your site appears at `https://<your-user>.github.io/<repo>/`.

All asset paths are relative and routing uses the URL hash (`#/s/bedrock`), so it works under a project sub-path with no configuration.

## Project layout

```
index.html              page shell, loads the data files then app.js
assets/style.css        design tokens, layout, components, dark theme
assets/app.js           router, pages, isometric diagrams, stepper, search
data/core.js            category definitions + the S() helper
data/<category>.js      one file of services per category
data/architectures.js   reference architectures + decision tables
scripts/check.mjs       data validator (runs in CI)
```

## Add or edit a service

Add an `S({...})` call to the relevant file in `data/`:

```js
S({
  id: 'my-service',            // url slug, [a-z0-9-]
  cat: 'compute',              // a category id from data/core.js
  name: 'Display Name',
  doc: 'service/',             // path under docs.aws.amazon.com
  tag: 'One-line summary.',
  what: 'Paragraph one.\n\nParagraph two.',
  flow: ['Node A', 'Node B', 'Node C'],              // 3–7 labels for the diagram
  steps: [[0, 'What happens at A.'], [1, '...'], [2, '...']],  // [nodeIndex, text]
  gotchas: ['...'], edges: ['...'], ml: ['...'],
  pairs: ['other-service-id'],
  cost: 'How it is billed.'
});
```

Text supports `` `code` ``, `**bold**`, and links to other services with `[[service-id]]` or `[[service-id|custom label]]`.

Then run the validator:

```bash
node scripts/check.mjs
```

It checks for unknown references, step indexes outside the diagram, nodes no step ever visits, unbalanced markup, and missing fields.

## A note on accuracy

AWS limits, quotas, prices, and service names change often. Numbers in this atlas are for orientation. Before designing around a specific limit, check the linked AWS documentation and your account's Service Quotas. Corrections are welcome.

This is an independent educational project and is not affiliated with or endorsed by Amazon Web Services.
