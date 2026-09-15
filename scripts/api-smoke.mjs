/**
 * End-to-end smoke test against a running influencer backend.
 *
 * Logs in for real (RSA-encrypted OTP request + verify), then calls every endpoint the UI calls
 * and prints one line each. Use it to answer "is the app broken or is the backend?" without
 * launching the emulator.
 *
 *   npm run api:smoke                      # defaults: localhost:8001, the dev test user
 *   API=http://10.0.2.2:8001 MOBILE=... OTP=... npm run api:smoke
 *
 * It reuses src/api/crypto.ts's key and cipher verbatim, so a green run proves the APP's
 * encryption is what the server accepts — not merely that some encryption works.
 */
import forge from 'node-forge';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ORIGIN = process.env.API ?? 'http://localhost:8001';
const B = `${ORIGIN}/influencer/v1`;
const MOBILE = process.env.MOBILE ?? '7602903791';
const OTP = process.env.OTP ?? '9999';

const PEM = fs.readFileSync(path.join(root, 'src/api/crypto.ts'), 'utf8')
  .match(/-----BEGIN PUBLIC KEY-----[\s\S]*?-----END PUBLIC KEY-----/)?.[0];
if (!PEM) throw new Error('No public key found in src/api/crypto.ts');
const pub = forge.pki.publicKeyFromPem(PEM);
const enc = v => forge.util.encode64(pub.encrypt(v, 'RSA-OAEP', { md: forge.md.sha256.create() }));

const post = (p, body) => fetch(B + p, {
  method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
}).then(r => r.json());
const get = (p, t) => fetch(B + p, { headers: { Authorization: `Bearer ${t}` } }).then(r => r.json());

console.log(`→ ${B}  as ${MOBILE}\n`);

const req = await post('/auth/otp/request', { mobile_number: enc(MOBILE) });
if (req.error) { console.error('otp/request : ✗', req.message); process.exit(1); }
console.log('otp/request : ✓', JSON.stringify(req.data));

const ver = await post('/auth/otp/verify', { mobile_number: enc(MOBILE), otp: enc(OTP) });
if (ver.error) { console.error('otp/verify  : ✗', ver.message); process.exit(1); }
const token = ver.data.token;
console.log('otp/verify  : ✓ token acquired');

const me = await get('/me', token);
if (me.error) { console.error('me          : ✗', me.message); process.exit(1); }
const m = me.data.manufacturers[0];
if (!m) { console.error('me          : ✗ influencer is mapped to no manufacturer'); process.exit(1); }
const q = `manufacturer_id=${m.manufacturer_id}&company_esi_id=${m.company_esi_id}`;
console.log(`me          : ✓ ${me.data.influencer.name} · ${me.data.influencer.district} · ${m.manufacturer_name} (${m.trade})`);

const calls = [
  ['config          ', '/config'],
  ['home            ', '/home'],
  ['leaderboard     ', `/leaderboard?${q}`],
  ['allocations/sum ', `/allocations/summary?${q}&period=1y`],
  ['allocations     ', `/allocations?${q}&period=1y&page=1&page_size=20`],
  ['rewards/summary ', `/rewards/summary?${q}&period=1y`],
  ['rewards         ', `/rewards?${q}&period=1y&page=1&page_size=20`],
  ['industries      ', '/demand-capture/industries'],
  ['products        ', `/demand-capture/manufacturers/${m.manufacturer_id}/products`],
  ['demands         ', `/demand-capture/demands?manufacturer_id=${m.manufacturer_id}&page=1&page_size=20`],
];

let failed = 0;
for (const [label, p] of calls) {
  const r = await get(p, token);
  if (r.error) { failed++; console.log(`${label}: ✗ ${r.message}`); continue; }
  const d = r.data ?? {};
  const summary =
    Array.isArray(d.items) ? `${d.items.length} items` :
    Array.isArray(d.industries) ? `${d.industries.length} industries` :
    Array.isArray(d.top) ? `top ${d.top.length}, my rank ${d.me?.rank ?? '—'}` :
    Array.isArray(d.banners) ? `${d.banners.length} banners, ${d.stats?.points_this_year_label} pts` :
    d.totals ? `${d.totals.quantity_label} · ${d.totals.points_label} pts` :
    d.counts ? `${d.counts.length} chips, utsav=${!!d.utsav}` :
    d.periods ? `${d.periods.length} periods, ${d.gift_statuses?.length} gift statuses` : 'ok';
  console.log(`${label}: ✓ ${summary}`);
}
console.log(failed ? `\n${failed} call(s) failed` : '\nAll calls succeeded');
process.exit(failed ? 1 : 0);
