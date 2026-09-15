/**
 * Formatting — docs/03-api-integration-and-data.md §6. Pure, no React, unit-tested in isolation.
 *
 * RULE: prefer the server's `*Label` fields wherever they exist. These helpers exist for the
 * cases the contract does not pre-format (and for offline-queued rows the server has not seen).
 * A `toLocaleString()` call inside a screen is a defect.
 */

/** en-IN grouping: 21,400 · 1,404 · 4,52,000 */
export function formatNumber(n: number): string {
  return new Intl.NumberFormat('en-IN').format(n);
}

/** Always signed or qualified. Never a bare number. */
export function formatPoints(n: number): string {
  return `${n > 0 ? '+' : ''}${formatNumber(n)} pts`;
}

/**
 * NOTE: there is no `pointsLabelForStatus` any more. It composed "900 pts expected" /
 * "240 pts on allocation" for a demand — and V2 demands carry no status AND no points, because
 * points are calculated only when a VCP allocates stock. Putting any figure on a claim would be
 * inventing one. Where points DO exist (allocations, leaderboard) the server sends the composed
 * label; use it.
 */

/** One decimal for Ton, zero for Bags/Buckets/Cases/Kg/Litre/Units/Nos. */
export function formatQuantity(value: number, uom: string): string {
  const decimals = uom === 'Ton' ? 1 : 0;
  return `${value.toFixed(decimals)} ${uom}`;
}

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'] as const;

/** `12 Aug 2026`. API carries ISO; IST is the display timezone, stated rather than inherited. */
export function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

/** `₹4,52,000` — Indian digit grouping. */
export function formatCurrency(n: number): string {
  return `₹${formatNumber(n)}`;
}

/** `00:24` for the OTP resend timer. */
export function formatCountdown(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
}

/** Profile avatar: first letters of the first two words. */
export function initialsOf(name: string): string {
  return name.trim().split(/\s+/).slice(0, 2).map(w => w[0]?.toUpperCase() ?? '').join('');
}

/** Podium cards show the first name only — full names do not fit a third of the panel. */
export function firstNameOf(name: string): string {
  return name.trim().split(/\s+/)[0] ?? '';
}

/**
 * Digits only, exactly 10. India-only: NEVER prepend +91 to a payload — the backend owns
 * country context (docs/design-spec/04-screens/01-login-mobile.md).
 *
 * A pasted number may arrive carrying a country code ("+91 98220-14576") or a trunk prefix
 * ("098220 14576"). Taking the FIRST ten digits of those is wrong — it yields "9198220145".
 * But blindly stripping a leading "91" is also wrong, because a valid Indian mobile can begin
 * with 91 (they start 6-9). So strip a prefix ONLY when doing so leaves exactly ten digits.
 */
export function normaliseMobile(input: string): string {
  let digits = input.replace(/\D/g, '');
  if (digits.length === 12 && digits.startsWith('91')) digits = digits.slice(2);
  else if (digits.length === 11 && digits.startsWith('0')) digits = digits.slice(1);
  return digits.slice(0, 10);
}

/** Digits and at most one dot — the quantity field. */
export function normaliseDecimal(input: string): string {
  const cleaned = input.replace(/[^\d.]/g, '');
  const [head, ...rest] = cleaned.split('.');
  return rest.length ? `${head}.${rest.join('')}` : head ?? '';
}
