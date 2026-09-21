/**
 * ViewModel for the construction-site flow (S2–S6 of
 * docs/construction-site-address-capture.md).
 *
 * It owns the pin and nothing else draws from GPS. The map screen moves a camera; this decides
 * what a pin MEANS — which coordinates are live, what the geocode said about them, whether the
 * result is usable, and what finally lands on the draft.
 *
 * THE PIN IS THE SOURCE OF TRUTH (spec R3). Pincode, district and state are always the
 * geocode's; the user corrects the free text, and changes the geography by moving the pin.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { useReverseGeocodeQuery } from '../../../api';
import type { GeoCoordinates } from '../../../api/types';
import { useDemandDraftStore } from '../../../store/demandDraftStore';
import { isPinServiceable, siteFromGeocode, type DraftSite, type SiteSource } from '../../../domain/site';
import {
  getCurrentFix, locationPermissionStatus, openAppSettings, requestLocationPermission,
  type PermissionOutcome,
} from '../../../platform/location';

/** Debounced against camera idle (spec S2): the map never blocks, the lookup just trails it. */
const GEOCODE_DEBOUNCE_MS = 400;

/**
 * The FALLBACK test for "is this camera rest our own animation coming to a stop" — how close
 * the centre has to land to the point we drove to. 3e-5° ≈ 3.3 m, well inside any fix this
 * flow will see and far under a deliberate drag.
 *
 * It is a fallback because `onRegionChangeComplete` carries `isGesture`, which answers the
 * question outright; Apple Maps does not always send it, hence the geometry. Either way the
 * point is the same: the camera move that FOLLOWS "Use Current Location" must not read as a
 * user drag, or the fresh GPS fix is demoted to `manual_pin` the instant it lands and the
 * accuracy circle goes with it.
 */
const CAMERA_EPSILON_DEG = 3e-5;

export type PinState = {
  coords: GeoCoordinates | null;
  source: SiteSource;
  accuracyM: number | null;
};

export function useSiteCapture() {
  const draftSite = useDemandDraftStore(s => s.draft.site);
  const setSite = useDemandDraftStore(s => s.setSite);

  /**
   * Seeded from a site already on the draft, so re-opening the picker to change an address
   * starts where the user left it rather than back at a district centroid.
   */
  const [pin, setPin] = useState<PinState>(() => ({
    coords: draftSite?.coords ?? null,
    source: draftSite?.source ?? 'manual_pin',
    accuracyM: draftSite?.accuracyM ?? null,
  }));

  /** What the lookup actually runs against — `pin.coords` after the debounce has settled. */
  const [settled, setSettled] = useState<GeoCoordinates | null>(pin.coords);

  /**
   * Where the CAMERA has been asked to go, when the pin was placed by something other than a
   * drag — a GPS fix or a search result.
   *
   * The pin is painted at the centre of the SCREEN, so moving `pin.coords` without moving the
   * camera moves nothing the user can see: the mark stays over whatever was already under it
   * and quietly stops describing the coordinates in the sheet. The screen owns the MapView, so
   * it has to be told; `nonce` is what makes a second tap on the same spot re-centre.
   */
  const [cameraTarget, setCameraTarget] = useState<{ coords: GeoCoordinates; nonce: number } | null>(null);

  const [permission, setPermission] = useState<PermissionOutcome>('denied');
  const [locating, setLocating] = useState(false);
  const [fixError, setFixError] = useState<string | null>(null);

  /** The last coordinates we drove the camera to, for the epsilon test in `movePin`. */
  const placed = useRef<GeoCoordinates | null>(null);
  const sendCamera = useCallback((coords: GeoCoordinates) => {
    placed.current = coords;
    setCameraTarget(t => ({ coords, nonce: (t?.nonce ?? 0) + 1 }));
  }, []);

  /**
   * A READ, not a prompt — this is what R4 turns on. It tells the map whether to show the
   * "location is off" banner (S8) without the OS prompt ever having fired on screen entry.
   */
  useEffect(() => { void locationPermissionStatus().then(setPermission); }, []);

  // Debounce the camera. A drag across a city would otherwise spend a request per frame.
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (!pin.coords) return;
    if (timer.current) clearTimeout(timer.current);
    const coords = pin.coords;
    timer.current = setTimeout(() => setSettled(coords), GEOCODE_DEBOUNCE_MS);
    return () => { if (timer.current) clearTimeout(timer.current); };
  }, [pin.coords]);

  const geocode = useReverseGeocodeQuery(settled);

  /**
   * The pin as a site, or null. Recomputed from whatever the geocode last returned rather than
   * stored, so the two can never disagree — the bug this shape prevents is a confirmed address
   * belonging to a pin the user has since moved.
   */
  const resolved: DraftSite | null = geocode.data
    ? siteFromGeocode(geocode.data, { source: pin.source, accuracyM: pin.accuracyM })
    : null;

  /** Moving the map moves the pin. Dragging after a fix makes it a placed pin, not a measured
   * one — the accuracy circle and its claim belong to the fix, not to wherever it was dragged. */
  const movePin = useCallback((coords: GeoCoordinates, opts?: { isGesture?: boolean }) => {
    setFixError(null);
    // The camera arriving where WE sent it is not the user moving the pin — it is the pin the
    // user asked for, finally under the mark. Leave the source and the accuracy alone, and
    // keep waiting: the rest that ends the wait is the first one a thumb causes.
    const sent = placed.current;
    if (sent) {
      if (opts?.isGesture === false) return;
      if (opts?.isGesture == null && nearlySame(sent, coords)) return;
      placed.current = null;
    }
    setPin(p => (
      p.source === 'gps' && p.coords && sameCoords(p.coords, coords)
        ? p
        : { coords, source: p.source === 'gps' ? 'manual_pin' : p.source, accuracyM: null }
    ));
  }, []);

  /** A search result drops the pin somewhere, and it stays draggable from there (spec S5). */
  const dropPinFromSearch = useCallback((coords: GeoCoordinates) => {
    setFixError(null);
    setPin({ coords, source: 'search', accuracyM: null });
    sendCamera(coords);
  }, [sendCamera]);

  const locate = useCallback(async () => {
    setLocating(true);
    const result = await getCurrentFix();
    setLocating(false);
    if (result.ok) {
      const coords = { latitude: result.fix.latitude, longitude: result.fix.longitude };
      setPin({ coords, source: 'gps', accuracyM: result.fix.accuracyM });
      // Without this the fix only ever reaches the sheet. The mark is the centre of the
      // screen, so the map is what has to move for the pin to land on the user.
      sendCamera(coords);
      return;
    }
    /**
     * R5: a failure is never a dead end. By the time this is reached BOTH a GPS attempt and a
     * coarse one have failed, so the copy says what to do rather than restating the obvious —
     * the map is already usable and the pin is already on screen.
     */
    setFixError(
      result.reason === 'permission' ? 'Location access is off. Move the map to place the pin.'
      : result.reason === 'timeout' ? 'No signal for a location yet. Move the map to place the pin.'
      : 'Location is unavailable. Move the map to place the pin.',
    );
  }, [sendCamera]);

  /**
   * R4 lives here: the OS prompt is reachable ONLY through this path, which only an explicit
   * "Use Current Location" tap opens.
   *
   * Straight to the system dialog — no in-app preface. Already granted, we just locate; already
   * blocked, the prompt will never reappear and Settings is the only repair, so we go there
   * instead of opening a dialog that cannot do anything.
   */
  const askForLocation = useCallback(async () => {
    setFixError(null);
    if (permission === 'granted') { void locate(); return; }
    if (permission === 'blocked') { void openAppSettings(); return; }

    const outcome = await requestLocationPermission();
    setPermission(outcome);
    if (outcome === 'granted') void locate();
    // A refusal leaves the user on S8 with the banner, and the manual pin still finishes the
    // job (R5). The prompt is never re-fired on its own — only from another explicit tap.
  }, [permission, locate]);

  return {
    pin,
    /** The screen animates its MapView here whenever `nonce` changes. See `sendCamera`. */
    cameraTarget,
    /** Null until a pin resolves; the S6 form edits a COPY of this, not this. */
    resolved,
    isGeocoding: geocode.isFetching,
    geocodeError: geocode.error,
    /** A geocode can succeed and still be unusable — no pincode, no site (V2 §4). */
    isUnserviceable: geocode.data != null && !isPinServiceable(resolved),
    retryGeocode: geocode.refetch,

    permission,
    permissionBlocked: permission === 'blocked',
    locating,
    fixError,

    movePin,
    dropPinFromSearch,
    askForLocation,
    openAppSettings,

    /** What the address form saves. The draft is the only place a site is ever kept. */
    attachSite: setSite,
    draftSite,
  };
}

const sameCoords = (a: GeoCoordinates, b: GeoCoordinates) =>
  a.latitude === b.latitude && a.longitude === b.longitude;

/** Same point to within CAMERA_EPSILON_DEG. Coordinates arrive as strings off the wire. */
const nearlySame = (a: GeoCoordinates, b: GeoCoordinates) =>
  Math.abs(Number(a.latitude) - Number(b.latitude)) < CAMERA_EPSILON_DEG &&
  Math.abs(Number(a.longitude) - Number(b.longitude)) < CAMERA_EPSILON_DEG;
