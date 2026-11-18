// Validates the data files: node scripts/check.mjs
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const scripts = [...html.matchAll(/<script src="(data\/[^"]+)"/g)].map(m => m[1]);

const ctx = { window: {} };
ctx.window = ctx; // window === global
vm.createContext(ctx);
for (const s of scripts) vm.runInContext(fs.readFileSync(path.join(root, s), 'utf8'), ctx, { filename: s });
const A = ctx.ATLAS;

const errs = [];
const err = (m) => errs.push(m);
const ids = new Set();
const cats = new Set(A.categories.map(c => c.id));
const archIds = new Set();

for (const s of A.services) {
  const p = `service ${s.id}`;
  if (ids.has(s.id)) err(`${p}: duplicate id`);
  ids.add(s.id);
  if (!/^[a-z0-9-]+$/.test(s.id)) err(`${p}: id must match [a-z0-9-]+`);
}
const refRe = /\[\[([a-z0-9-]+)(?:\|[^\]]+)?\]\]/g;
const checkText = (where, t) => {
  if (typeof t !== 'string' || !t.trim()) return err(`${where}: empty text`);
  for (const m of t.matchAll(refRe)) if (!ids.has(m[1])) err(`${where}: unknown [[${m[1]}]]`);
  if ((t.match(/`/g) || []).length % 2) err(`${where}: unbalanced backtick`);
  if ((t.match(/\*\*/g) || []).length % 2) err(`${where}: unbalanced **`);
};

for (const s of A.services) {
  const p = `service ${s.id}`;
  for (const k of ['cat', 'name', 'tag', 'what', 'cost', 'doc']) if (!s[k]) err(`${p}: missing ${k}`);
  if (!cats.has(s.cat)) err(`${p}: unknown category ${s.cat}`);
  for (const k of ['flow', 'steps', 'gotchas', 'edges', 'ml', 'pairs']) if (!Array.isArray(s[k]) || !s[k].length) err(`${p}: ${k} must be a non-empty array`);
  if (s.flow && (s.flow.length < 3 || s.flow.length > 7)) err(`${p}: flow length ${s.flow.length} outside 3..7`);
  checkText(`${p}.what`, s.what); checkText(`${p}.cost`, s.cost);
  (s.steps || []).forEach(([n, t], i) => {
    if (!Number.isInteger(n) || n < 0 || n >= s.flow.length) err(`${p}: step ${i + 1} node index ${n} out of range`);
    checkText(`${p}.steps[${i}]`, t);
  });
  const nodesUsed = new Set((s.steps || []).map(x => x[0]));
  (s.flow || []).forEach((f, i) => { if (!nodesUsed.has(i)) err(`${p}: flow node ${i} ("${f}") never highlighted by a step`); });
  for (const k of ['gotchas', 'edges', 'ml']) (s[k] || []).forEach((t, i) => checkText(`${p}.${k}[${i}]`, t));
  (s.pairs || []).forEach(x => { if (!ids.has(x)) err(`${p}: pairs references unknown ${x}`); if (x === s.id) err(`${p}: pairs references itself`); });
}

for (const a of A.architectures) {
  const p = `architecture ${a.id}`;
  if (archIds.has(a.id)) err(`${p}: duplicate id`); archIds.add(a.id);
  for (const k of ['name', 'short', 'when']) if (!a[k]) err(`${p}: missing ${k}`);
  a.flow.forEach((f, i) => { if (f.s && !ids.has(f.s)) err(`${p}: flow[${i}] unknown service ${f.s}`); });
  a.steps.forEach(([n, t], i) => {
    if (n < 0 || n >= a.flow.length) err(`${p}: step ${i + 1} node index out of range`);
    checkText(`${p}.steps[${i}]`, t);
  });
  const used = new Set(a.steps.map(x => x[0]));
  a.flow.forEach((f, i) => { if (!used.has(i)) err(`${p}: flow node ${i} never highlighted`); });
  for (const k of ['why', 'fails']) a[k].forEach((t, i) => checkText(`${p}.${k}[${i}]`, t));
  checkText(`${p}.when`, a.when);
}
A.decisions.forEach((d, di) => {
  d.rows.forEach((r, ri) => {
    if (r.length !== d.cols.length) err(`decision ${di}: row ${ri} has ${r.length} cells, expected ${d.cols.length}`);
    r.forEach((c, ci) => checkText(`decision ${di}[${ri}][${ci}]`, c));
  });
  checkText(`decision ${di}.intro`, d.intro); if (d.rule) checkText(`decision ${di}.rule`, d.rule);
});
for (const c of A.categories) {
  if (!A.services.some(s => s.cat === c.id)) err(`category ${c.id}: has no services`);
  checkText(`category ${c.id}.lens`, c.lens);
}

const words = A.services.reduce((n, s) => n + JSON.stringify(s).split(/\s+/).length, 0);
console.log(`${A.categories.length} categories, ${A.services.length} services, ${A.architectures.length} architectures, ${A.decisions.length} decision tables, ~${words} words in services`);
if (errs.length) { console.error(`\n${errs.length} problem(s):`); errs.forEach(e => console.error(' - ' + e)); process.exit(1); }
console.log('data OK');
