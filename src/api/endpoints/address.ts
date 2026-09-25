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
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import forge from 'node-forge';
import { api, query as httpQuery } from '../client';
import { qk } from '../keys';
import type {
  AddressSearchResult, GeoCoordinates, PlaceDetails, ReverseGeocode,
} from '../types';

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
        `/address/reverse-geocode${httpQuery({ latitude: coords!.latitude, longitude: coords!.longitude })}`,
      ),
    enabled: coords != null,
    staleTime: Infinity,
    retry: false,
  });
}

/**
 * A Google autocomplete SESSION TOKEN.
 *
 * Google bills a whole session — every keystroke plus the one Place Details call that resolves
 * the pick — far more cheaply than the same requests untokenised. Only the CLIENT knows when a
 * session starts and ends, which is why the app generates this and the server merely forwards
 * it. One token per search session: it is minted when the search screen opens and retired the
 * moment a place is opened, because reusing it after that is what turns one session into a
 * per-request bill.
 *
 * `forge.random` rather than `Math.random`: it is already a dependency (api/crypto.ts) and a
 * token that collides across two users in the same second would merge their sessions.
 */
export function newSessionToken(): string {
  const hex = forge.util.bytesToHex(forge.random.getBytesSync(16));
  // UUID v4 shape. Google documents the token as opaque, but the API is fussier in practice
  // about anything that does not look like one.
  return [
    hex.slice(0, 8), hex.slice(8, 12),
    `4${hex.slice(13, 16)}`,
    ((parseInt(hex.slice(16, 17), 16) & 0x3) | 0x8).toString(16) + hex.slice(17, 20),
    hex.slice(20, 32),
  ].join('-');
}

/**
 * `GET /address/search` — the dropdown under the site search box.
 *
 * DEBOUNCED BY THE CALLER, at 300 ms, and gated at three characters. Both are the server's
 * rules, enforced here so they cost nothing: every call is a billable Google request, and two
 * characters match half of India. Under three the server answers `SEARCH_QUERY_TOO_SHORT`
 * rather than an empty list, because "you have not typed enough" and "nothing matched" are
 * different screens — so the query simply does not run.
 *
 * `latitude`/`longitude` are the MAP CENTRE and they only rank, never filter — the server adds
 * `strictbounds` around them. Without them the first search of a session is national, which is
 * why the map's pin is passed in as soon as there is one.
 *
 * STALE ANSWERS: autocomplete replies arrive out of order. React Query's key includes the
 * query, so a late response for "adi" lands under its own key and cannot repaint the list
 * showing "adina" — which is what the response's echoed `query` field exists to let a
 * hand-rolled client do.
 */
export const MIN_SEARCH_QUERY = 3;

export function useAddressSearchQuery(
  q: string,
  { near, sessionToken }: { near: GeoCoordinates | null; sessionToken: string },
) {
  const query = q.trim();
  const enabled = query.length >= MIN_SEARCH_QUERY;
  return useQuery({
    queryKey: qk.addressSearch(query, near ? `${near.latitude},${near.longitude}` : ''),
    queryFn: () =>
      api.get<AddressSearchResult>(
        `/address/search${httpQuery({
          query,
          session_token: sessionToken,
          latitude: near?.latitude,
          longitude: near?.longitude,
        })}`,
      ),
    enabled,
    /**
     * Five minutes: the same keystrokes typed again inside one session — which is what
     * backspacing a character and retyping it is — should not be a second billable request.
     */
    staleTime: 5 * 60_000,
    retry: false,
  });
}

/**
 * `GET /address/places/{place_id}` — turns the tapped suggestion into an address.
 *
 * A MUTATION, not a query, because it is an ACTION: it happens once, on a deliberate tap, and
 * costs a Google Place Details call. Nothing re-runs it on a remount.
 *
 * The response is the reverse-geocode shape plus `place_id` / `place_name`, so the caller
 * primes the reverse-geocode cache with it and the map picker reads it as if a pin had been
 * dropped there — one code path from "an address the user settled on" into the site block.
 * That priming also PRESERVES a better `address_line_1`: for a point with no street number
 * the geocoder's first comma-separated fragment is junk ("246R+8CQ", a bare pincode), and the
 * place endpoint substitutes the name the user actually tapped. Re-geocoding the coordinates
 * would throw that away and put the junk back in front of the user.
 */
export function useGetPlace() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ placeId, sessionToken }: { placeId: string; sessionToken: string }) =>
      api.get<PlaceDetails>(
        `/address/places/${encodeURIComponent(placeId)}${httpQuery({ session_token: sessionToken })}`,
      ),
    onSuccess: place => {
      const coords = place.geo_coordinates;
      if (coords) qc.setQueryData(qk.reverseGeocode(coords.latitude, coords.longitude), place);
    },
  });
}
