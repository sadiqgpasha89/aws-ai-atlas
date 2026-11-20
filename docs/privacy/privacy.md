# Privacy and data handling

- The Atlas is a static site. There is no backend, account, analytics script or network call that sends workspace data anywhere.
- Records you create are stored in your browser under the key `aws-ai-atlas:workspace` (`localStorage`). A corrupt or newer-format entry is copied to `aws-ai-atlas:workspace:backup` before being replaced.
- The only other key is `aws-ai-atlas:mode` in `sessionStorage`, which remembers whether you are looking at sample data in the current tab.
- **Sample data** is generated in memory, labelled on every page, never written to `localStorage`, and cannot be exported or imported as your own data.
- **Export** creates a JSON file on your device. It contains everything you typed. Treat it as sensitive if you entered sensitive text.
- **Import** reads the file in the browser, validates it, shows what would change, and writes nothing until you confirm. Files over 5 MB, files from other apps and sample-data exports are rejected.
- **Do not enter** passwords, API keys, tokens, customer personal data or other secrets. Free-text fields are scanned for common credential patterns (for example AWS access key ids and private-key headers) and the save is refused. This is a safety net, not a guarantee.
- Browser storage is not encrypted. Anyone with access to your browser profile can read it.
- All user text is HTML-escaped before display; CSV exports neutralise cells that start with `=`, `+`, `-` or `@`.
