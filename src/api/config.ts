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
 *     adb reverse tcp:8001 tcp:8001
 *
 * That tells the phone to tunnel its own :8001 back over USB to the host's :8001 — the same
 * mechanism Metro already uses on :8081, which is why the JS bundle loads while API calls fail.
 * A "Network request failed" with Metro working is almost always this forward being absent.
 *
 * Verify from the phone's own side, not the Mac's:
 *     adb shell curl -s -o /dev/null -w '%{http_code}' http://localhost:8001/influencer/v1/config
 *
 * The other cases, for when this file is next changed:
 *   Android emulator  `10.0.2.2` — the AVD's alias for the host loopback
 *   iOS simulator     `localhost` — it shares the host's network stack
 *   iOS real device   the host's LAN IP (e.g. 192.168.1.x). There is no `adb reverse` for iOS,
 *                     so `localhost` cannot work there; the Mac and the phone must share a
 *                     network and the backend must bind 0.0.0.0, not 127.0.0.1.
 */
const DEV_ORIGIN = 'http://localhost:8001';

/**
 * The influencer API and the platform API are the same deployment locally (one container serves
 * both route trees), but they are separate concerns and separate hosts in a real environment —
 * `main_influencer:app` runs as its own gunicorn process. Keeping them as two constants means
 * splitting them later is a one-line change.
 */
export const API_BASE_URL = `${DEV_ORIGIN}/influencer/v1`;

/** Account deletion is the platform's own flow, outside /influencer/v1 (V2 §7). */
export const PLATFORM_BASE_URL = DEV_ORIGIN;

export const REQUEST_TIMEOUT_MS = 15_000;
