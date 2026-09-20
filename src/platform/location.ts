/**
 * Device location — the only place the app touches GPS or a permission prompt.
 *
 * No watcher anywhere in here: a site is a point the user confirms, not a track, and a running
 * watch on a 2 GB phone outdoors costs battery for nothing.
 *
 * Confined to one file for the same reason the icon set is: the moment a second screen calls
 * `Geolocation` directly, the rules below stop being rules. They are not incidental —
 *
 *   R4  THE OS PROMPT FIRES ONLY ON AN EXPLICIT TAP of "Use Current Location". Never on screen
 *       entry. A pre-prompt denial is unrecoverable for the life of that install, and both
 *       stores treat an unprompted ask as a policy violation.
 *   R5  A DENIAL IS NEVER A DEAD END. Every function here reports refusal as a value, not an
 *       exception to swallow, so the caller can fall back to placing the pin by hand.
 *
 * WHEN-IN-USE ONLY. The app reads a position when the user asks for one and at no other time,
 * so it never requests background/always — `ACCESS_BACKGROUND_LOCATION` is absent from the
 * manifest by design.
 */
import { Linking, PermissionsAndroid, Platform } from 'react-native';
import Geolocation from '@react-native-community/geolocation';

/**
 * Configured ONCE, at module load, before any call can reach the native side.
 *
 * `skipPermissionRequests: true` is the load-bearing one: without it the library fires its OWN
 * permission request the first time a position is asked for, on top of the one this file just
 * made — which is how a single tap produces two system dialogs. Permissions are requested here
 * explicitly and nowhere else.
 *
 * `authorizationLevel: 'whenInUse'` matches the plist string and the manifest; the app has no
 * business asking for 'always'.
 */
Geolocation.setRNConfiguration({
  skipPermissionRequests: true,
  authorizationLevel: 'whenInUse',
  // 'auto' prefers Google Play Services' fused provider where it exists and falls back to the
  // platform LocationManager where it does not — which is the right order on Indian Android.
  locationProvider: 'auto',
});

export type PermissionOutcome =
  | 'granted'
  /** Refused this time. The rationale may be shown again on a later explicit tap. */
  | 'denied'
  /** Android's "don't ask again", or iOS after a first refusal — only Settings can undo it. */
  | 'blocked';

export type Fix = {
  latitude: string;
  longitude: string;
  /** Metres. The spec treats anything over 100 m as too loose to trust a site to. */
  accuracyM: number | null;
};

export type FixFailure = 'permission' | 'unavailable' | 'timeout';

/**
 * Coordinates are kept as STRINGS from the moment they leave the device.
 *
 * The contract echoes `geo_coordinates` back and asks for the same digits to be sent on, so the
 * number is converted once, here, and never parsed again. Six decimals is ~11 cm — far past what
 * any consumer GPS resolves, and enough that two reads of the same spot produce the same string.
 */
const toCoordString = (n: number) => n.toFixed(6);

/**
 * Where the OS stands RIGHT NOW, asking nothing. Safe on screen entry — this is a read, not a
 * prompt, which is what lets the map screen show its "location is off" banner (S8) without
 * tripping R4.
 *
 * iOS has no equivalent read without touching the manager, so it reports 'denied': the flow
 * treats that as "we do not know yet", which is true, and the user's tap resolves it.
 */
export async function locationPermissionStatus(): Promise<PermissionOutcome> {
  if (Platform.OS !== 'android') return 'denied';
  const fine = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION);
  if (fine) return 'granted';
  const coarse = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION);
  return coarse ? 'granted' : 'denied';
}

/**
 * The OS prompt. CALL THIS ONLY FROM AN EXPLICIT USER TAP (R4), and only after the in-app
 * rationale dialog has been shown and accepted.
 *
 * Android: FINE and COARSE are requested together, and a grant of either is a grant — a device
 * that offers only approximate location still completes the flow, just with a looser pin the
 * user can correct. `never_ask_again` surfaces as 'blocked' so the caller can route to Settings
 * instead of prompting into a void.
 */
export async function requestLocationPermission(): Promise<PermissionOutcome> {
  if (Platform.OS !== 'android') {
    // iOS prompts on first use of the manager; the plist string carries the rationale copy.
    return new Promise<PermissionOutcome>(resolve => {
      Geolocation.requestAuthorization(
        () => resolve('granted'),
        () => resolve('blocked'),
      );
    });
  }

  const result = await PermissionsAndroid.requestMultiple([
    PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
    PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION,
  ]);
  const values = Object.values(result);
  if (values.includes(PermissionsAndroid.RESULTS.GRANTED)) return 'granted';
  if (values.includes(PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN)) return 'blocked';
  return 'denied';
}

/**
 * One position, once — but in TWO ATTEMPTS, because one is not reliable on this hardware.
 *
 * `enableHighAccuracy: true` asks Android for a GPS-grade fix and nothing else. Inside a shed,
 * under a slab, or on a cold receiver that has not seen the sky in an hour, that simply never
 * arrives and the call dies at the timeout — which is the "Could not get a fix" the field sees
 * while the status bar cheerfully shows a location icon. The icon means the OS has *a*
 * position, from wifi and cell, which high-accuracy mode declines to hand over.
 *
 * So: ask for the good fix briefly, and if it does not come, take the coarse one. A coarse fix
 * is not a failure here — it puts the map within a block or two of the site, and the user was
 * always going to nudge the pin onto the actual gate. A pin they adjust beats a red error.
 *
 * `maximumAge` on the second pass is deliberately generous: a fix from two minutes ago is the
 * same building, and reusing it is instant where a fresh acquisition is not.
 */
function positionOnce(options: {
  enableHighAccuracy: boolean; timeout: number; maximumAge: number;
}): Promise<{ ok: true; fix: Fix } | { ok: false; reason: FixFailure }> {
  return new Promise(resolve => {
    Geolocation.getCurrentPosition(
      pos => resolve({
        ok: true,
        fix: {
          latitude: toCoordString(pos.coords.latitude),
          longitude: toCoordString(pos.coords.longitude),
          accuracyM: typeof pos.coords.accuracy === 'number' ? pos.coords.accuracy : null,
        },
      }),
      error => {
        // 1 PERMISSION_DENIED · 2 POSITION_UNAVAILABLE · 3 TIMEOUT (W3C codes, both platforms)
        const reason: FixFailure =
          error?.code === 1 ? 'permission' : error?.code === 3 ? 'timeout' : 'unavailable';
        resolve({ ok: false, reason });
      },
      options,
    );
  });
}

export async function getCurrentFix(): Promise<
  { ok: true; fix: Fix } | { ok: false; reason: FixFailure }
> {
  // Pass 1: a real GPS fix, given 8 seconds. Long enough for a warm receiver outdoors, short
  // enough that a cold one indoors does not hold the user at a spinner.
  const precise = await positionOnce({
    enableHighAccuracy: true, timeout: 8_000, maximumAge: 60_000,
  });
  if (precise.ok) return precise;

  // A refused permission is not going to be fixed by asking again with looser options.
  if (precise.reason === 'permission') return precise;

  // Pass 2: whatever the OS already has — wifi, cell, a recent cached fix.
  return positionOnce({ enableHighAccuracy: false, timeout: 12_000, maximumAge: 120_000 });
}

/** The only repair for a 'blocked' permission — the prompt will not come back on its own. */
export function openAppSettings() {
  return Linking.openSettings();
}
