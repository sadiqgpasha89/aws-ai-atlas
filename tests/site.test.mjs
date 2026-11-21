import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { html, root, read } from './load-atlas.mjs';

test('index.html carries a Content-Security-Policy that forbids inline scripts', () => {
  const m = html.match(/<meta http-equiv="Content-Security-Policy" content="([^"]+)"/);
  assert.ok(m, 'missing CSP meta tag');
  assert.match(m[1], /script-src 'self'(;|$)/);
  assert.doesNotMatch(m[1], /script-src[^;]*unsafe-inline/);
  assert.match(m[1], /object-src 'none'/);
  assert.match(m[1], /connect-src 'self'/);
});

test('there are no inline scripts and no inline event handlers', () => {
  for (const m of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/g)) {
    assert.match(m[1], /\bsrc="/, 'inline <script> found in index.html');
  }
  assert.doesNotMatch(html, /\son[a-z]+="/i, 'inline event handler in index.html');
  const app = read('assets/app.js');
  assert.doesNotMatch(app, /\son(click|submit|change|input)="/, 'inline event handler in generated markup');
});

test('every script and stylesheet referenced by index.html exists', () => {
  for (const m of html.matchAll(/(?:src|href)="((?:assets|data)\/[^"]+)"/g)) {
    assert.ok(fs.existsSync(path.join(root, m[1])), `${m[1]} is referenced but missing`);
  }
});

test('script order: theme first, search before the app', () => {
  const order = [...html.matchAll(/<script src="([^"]+)"/g)].map(m => m[1]);
  assert.equal(order[0], 'assets/theme.js');
  assert.ok(order.indexOf('assets/search.js') > -1, 'search.js is not loaded');
  assert.ok(order.indexOf('assets/search.js') < order.indexOf('assets/app.js'), 'search.js must load before app.js');
  assert.equal(order.at(-1), 'assets/app.js');
});

test('the search dialog has filter and status regions', () => {
  assert.match(html, /id="searchFilters"/);
  assert.match(html, /id="searchStatus"[^>]*aria-live="polite"/);
});

test('generated app.js renders **bold**, [[links]] and paragraphs (regexes are not double-escaped)', async () => {
  const app = read('assets/app.js');
  const body = app.match(/function fmt\(s\) \{[\s\S]*?\n  \}/)[0];
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const fmt = new Function('esc', 'byId', body + '; return fmt;')(esc, { s3: { name: 'Amazon S3' } });
  assert.equal(fmt('a **b** [[s3]] [[s3|bucket]] `c`'), 'a <strong>b</strong> <a href="#/s/s3">Amazon S3</a> <a href="#/s/s3">bucket</a> <code>c</code>');
  assert.match(app, /split\(\/\\n\\n\+\/\)/, 'paras() must split on blank lines');
});

test('top navigation has exactly the four sections', () => {
  const nav = html.match(/<nav class="top-links"[\s\S]*?<\/nav>/)[0];
  assert.deepEqual([...nav.matchAll(/data-sec="([a-z]+)"/g)].map(m => m[1]), ['home', 'learn', 'lead', 'workspace']);
});
