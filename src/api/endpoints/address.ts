/**
 * `GET /address/reverse-geocode` — the one call behind the construction-site step of demand
 * capture (V2 §4).
 *
 * It is an influencer-authenticated wrapper over the SAME resolver the VCP address screen uses,
 * not a second implementation, so one pin resolves to one answer whichever app asked.
 *
 * WHAT IT IS FOR: coordinates in, the platform's address components AND THEIR IDS out. The ids
 * are the point — a site is stored against the platform's own geography, never against a string
 * a geocoding provider returned. The names come back so the user can confirm what they picked.
 */
import { useQuery } from '@tanstack/react-query';
import { api, query } from '../client';
import { qk } from '../keys';
import type { GeoCoordinates, ReverseGeocode } from '../types';

/**
 * Resolves a pin. `enabled` follows the coordinates, so the caller drops a pin by setting them
 * and clears the lookup by setting them to null.
 *
 * CACHED PER PIN, FOREVER (`staleTime: Infinity`). A pin is a fixed point on earth and the
 * geography under it does not move, so re-resolving one the user has already seen — which
 * happens constantly when they nudge the map back to where it was — would be a request spent to
 * receive the identical answer. This is the opposite call from the SKU list, and for the
 * opposite reason: SKUs change under a stable key, whereas here the key IS the answer.
 *
 * `retry: false`: two of the three failure codes are the user's to fix by moving the pin, and
 * retrying a COORDINATES_INVALID cannot make it valid. The screen offers an explicit Retry for
 * the one code that is worth one (`isGeocodeRetryable`).
 */
export function useReverseGeocodeQuery(coords: GeoCoordinates | null) {
  return useQuery({
    queryKey: qk.reverseGeocode(coords?.latitude ?? '', coords?.longitude ?? ''),
    queryFn: () =>
      api.get<ReverseGeocode>(
        `/address/reverse-geocode${query({ latitude: coords!.latitude, longitude: coords!.longitude })}`,
      ),
    enabled: coords != null,
    staleTime: Infinity,
    retry: false,
  });
}
