import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
export const schema = require('../assets/lib/schema.js');
export const rules = require('../assets/lib/rules.js');
export const calc = require('../assets/lib/calc.js');
export const store = require('../assets/lib/store.js');
export const dashboard = require('../assets/lib/dashboard.js');
export const exporters = require('../assets/lib/exporters.js');
export const close = (a, b, eps = 1e-9) => Math.abs(a - b) <= eps * Math.max(1, Math.abs(b));
export function seqIds() { let n = 0; return (p) => `${p}-t${++n}`; }
export const FIXED = '2026-03-10T09:00:00.000Z';
export function projectFields(over = {}) {
  return { name: 'Support copilot', stage: 'Discovery', status: 'Healthy', priority: 'High', currency: 'USD', ...over };
}
