/**
 * API environment. Per docs/10 §1.3 these come from build flavors/schemes (dev/qa/pre/prod);
 * until those are wired, this is the single place to point the app at a backend.
 *
 * **There is no fixture mode.** Every screen reads from the API. The committed sample payloads
 * are gone — they were a way to build screens before the backend existed, and it exists now.
 */

/**
 * `localhost` ON A USB-CONNECTED ANDROID DEVICE MEANS THE DEVICE ITSELF — it is not the Mac
 * running the backend. What makes the line below work is a REVERSE PORT FORWARD, which has to
 * be re-run after every replug, reboot or `adb kill-server`:
 *
 *     npm run dev:reverse          # every attached device, :8001 and :8081
 *     adb reverse tcp:8001 tcp:8001   # or by hand, one device
 *
 * `npm run android` and `npm run start` both run `dev:reverse` first, so the usual way in is
 * already covered; do it by hand only after a replug mid-session.
 *
 * That tells the phone to tunnel its own :8001 back over USB to the host's :8001 — the same
 * mechanism Metro already uses on :8081, which is why the JS bundle loads while API calls fail.
 * A "Network request failed" with Metro working is almost always this forward being absent.
 *
 * Verify the forward is in place (most retail Androids ship no curl or wget, so check the
 * forward table rather than trying to make a request from the phone):
 *     adb reverse --list          # expects a line for tcp:8001
 *     npm run api:smoke           # and that the backend answers on the Mac at all
 *
 * The other cases, for when this file is next changed:
 *   Android emulator  `10.0.2.2` — the AVD's alias for the host loopback
 *   iOS simulator     `localhost` — it shares the host's network stack
 *   iOS real device   the host's LAN IP (e.g. 192.168.1.x). There is no `adb reverse` for iOS,
 *                     so `localhost` cannot work there; the Mac and the phone must share a
 *                     network and the backend must bind 0.0.0.0, not 127.0.0.1.
 */
const DEV_ORIGIN = 'http://localhost:8001';

/** The deployed QA backend. HTTPS, so it works on any device with no `adb reverse`. */
const QA_ORIGIN = 'https://api-qa.humbee.in';

/** Which backend this build talks to. Flip to `DEV_ORIGIN` for a local backend. */
const ORIGIN = QA_ORIGIN;

/**
 * The influencer API and the platform API are the same deployment locally (one container serves
 * both route trees), but they are separate concerns and separate hosts in a real environment —
 * `main_influencer:app` runs as its own gunicorn process. Keeping them as two constants means
 * splitting them later is a one-line change.
 */
export const API_BASE_URL = `${ORIGIN}/influencer/v1`;

/** Account deletion is the platform's own flow, outside /influencer/v1 (V2 §7). */
export const PLATFORM_BASE_URL = ORIGIN;

export const REQUEST_TIMEOUT_MS = 15_000;
