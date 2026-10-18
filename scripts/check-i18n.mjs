// Fails when en.json and th.json drift: missing keys, empty values, or different {{placeholders}}.
// Usage: node scripts/check-i18n.mjs [localesDir]
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const dir = process.argv[2] ?? new URL('../src/locales', import.meta.url).pathname;

const flat = (o, p = '') => Object.entries(o).flatMap(([k, v]) => (v && typeof v === 'object' ? flat(v, `${p}${k}.`) : [[`${p}${k}`, v]]));
const load = (l) => new Map(flat(JSON.parse(readFileSync(join(dir, `${l}.json`), 'utf8'))));
const vars = (s) =>
  [...new Set(String(s).match(/{{\s*[\w.]+\s*}}/g) ?? [])]
    .map((x) => x.replace(/\s/g, ''))
    .sort()
    .join(',');

const en = load('en');
const th = load('th');
const errors = [];
for (const [name, m, other] of [
  ['en', en, th],
  ['th', th, en],
]) {
  for (const [k, v] of m) {
    if (!other.has(k)) errors.push(`${k}: missing in ${name === 'en' ? 'th' : 'en'}.json`);
    if (typeof v !== 'string' || v.trim() === '') errors.push(`${k}: empty value in ${name}.json`);
  }
}
for (const [k, v] of en)
  if (th.has(k) && vars(v) !== vars(th.get(k)))
    errors.push(`${k}: placeholders differ (en: ${vars(v) || 'none'}, th: ${vars(th.get(k)) || 'none'})`);

if (errors.length) {
  console.error(`i18n check failed:\n  ${errors.join('\n  ')}`);
  process.exit(1);
}
console.log(`i18n ok: ${en.size} keys`);
