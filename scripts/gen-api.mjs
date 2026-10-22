// Regenerates src/shared/api/schema.d.ts from core-api's OpenAPI spec. VITE_API_URL picks the API (see below); API_SPEC_URL overrides with a URL or a spec file path.
// The spec lists `authorization` as a required header on every route; the client adds it in middleware, so drop it here.
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

// The spec comes from the same API the app talks to: VITE_API_URL (shell or .env.local, default production).
// API_SPEC_URL overrides it with a URL or a spec file path. It is not a VITE_ variable: this script never ships in the bundle.
try {
  process.loadEnvFile('.env.local');
} catch {
  /* no .env.local */
}
const url = process.env.API_SPEC_URL ?? `${process.env.VITE_API_URL ?? 'https://api.drills.pro'}/openapi.json`;
// A path (not http) reads a spec file, e.g. one dumped from a local core-api checkout.
let spec;
if (/^https?:/.test(url)) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${url}: ${res.status}`);
  spec = await res.json();
} else spec = JSON.parse(readFileSync(url, 'utf8'));

const isAuth = (p) => p.in === 'header' && p.name.toLowerCase() === 'authorization';
for (const item of Object.values(spec.paths))
  for (const op of Object.values(item)) if (Array.isArray(op?.parameters)) op.parameters = op.parameters.filter((p) => !isAuth(p));

const file = join(mkdtempSync(join(tmpdir(), 'drills-api-')), 'openapi.json');
writeFileSync(file, JSON.stringify(spec));
execFileSync('pnpm', ['exec', 'openapi-typescript', file, '-o', 'src/shared/api/schema.d.ts'], { stdio: 'inherit' });
// The spec's prose may hold em dashes; this repo writes a hyphen instead.
const out = 'src/shared/api/schema.d.ts';
writeFileSync(out, readFileSync(out, 'utf8').replaceAll('\u2014', '-'));
