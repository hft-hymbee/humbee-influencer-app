/**
 * API environment. Per docs/10 §1.3 these come from build flavors/schemes (dev/qa/pre/prod);
 * until those are wired, this is the single place to point the app at a backend.
 *
 * **There is no fixture mode.** Every screen reads from the API. The committed sample payloads
 * are gone — they were a way to build screens before the backend existed, and it exists now.
 */

import { Platform } from 'react-native';

/**
 * THE ANDROID EMULATOR CANNOT SEE `localhost` — that resolves to the emulator itself, not to the
 * machine running Docker. `10.0.2.2` is the AVD's alias for the host loopback. iOS simulators
 * share the host's network stack, so `localhost` is correct there, and a physical device needs
 * the host's LAN IP instead (set DEV_HOST below).
 */
const DEV_HOST = Platform.OS === 'android' ? '10.0.2.2' : 'localhost';
const DEV_ORIGIN = `http://${DEV_HOST}:8001`;

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
