/**
 * S5 — location search. Backed by `GET /address/search` + `GET /address/places/{place_id}`.
 *
 * TWO CALLS, because that is Google's model and its billing: autocomplete turns keystrokes
 * into candidates, Place Details turns the chosen candidate into a point. A suggestion is NOT
 * an address — it carries no coordinates and no component ids — so nothing can be confirmed
 * from this screen. Tapping a row resolves it, and the map is still where the user confirms.
 *
 * ONE SESSION TOKEN spans the whole visit: minted when this screen opens, sent on every
 * keystroke and on the details call, then retired. That is what makes Google bill a session
 * rather than N requests, and it is why the token is generated here rather than server-side —
 * only the client knows when a search begins and ends.
 *
 * Three things the server owns and this screen simply obeys:
 *   - a THREE-character minimum, enforced before the request (two characters match half of
 *     India and would cost a billable call per keystroke to say so)
 *   - the map centre as a RANKING bias, never a filter
 *   - relevance ORDER as returned; `distance_metres` is shown but never sorted on
 */
import React, { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, hitSlopFor, radius, spacing } from '../../../theme';
import { EmptyState, Icon, Input, Text } from '../../../components';
import {
  isPlaceExpired, isSearchUnavailable, MIN_SEARCH_QUERY, newSessionToken,
  useAddressSearchQuery, useGetPlace,
} from '../../../api';
import type { AddressSuggestion, GeoCoordinates, PlaceDetails } from '../../../api/types';
import { useDebounced } from './useDebounced';

export function LocationSearchScreen({
  near, onBack, onUseCurrentLocation, onPicked,
}: {
  /** The map centre, when there is one. Biases ranking — the first search is national. */
  near: GeoCoordinates | null;
  onBack: () => void;
  onUseCurrentLocation: () => void;
  /** A RESOLVED place: coordinates plus the platform's component ids. */
  onPicked: (place: PlaceDetails) => void;
}) {
  const insets = useSafeAreaInsets();
  const [q, setQ] = useState('');
  const [error, setError] = useState<string | null>(null);

  // One per visit to this screen. Not regenerated on re-render: a new token mid-session is a
  // new bill, and it breaks the link between these keystrokes and the details call that ends them.
  const sessionToken = useMemo(newSessionToken, []);

  /**
   * 300 ms, the server's own recommendation. Typing is far faster than this on a phone
   * keyboard, and every character that slips through is a billable Google request.
   */
  const debounced = useDebounced(q, 300);
  const search = useAddressSearchQuery(debounced, { near, sessionToken });
  const getPlace = useGetPlace();

  const typed = q.trim();
  const tooShort = typed.length > 0 && typed.length < MIN_SEARCH_QUERY;
  const suggestions = search.data?.suggestions ?? [];
  /** Only while the CURRENT text is what is in flight — otherwise the spinner never rests. */
  const searching = search.isFetching || (typed.length >= MIN_SEARCH_QUERY && debounced !== typed);

  const pick = async (s: AddressSuggestion) => {
    setError(null);
    try {
      onPicked(await getPlace.mutateAsync({ placeId: s.place_id, sessionToken }));
    } catch (e) {
      /**
       * A place id expiring is EXPECTED, not exceptional — Google's ids are short-lived, and a
       * place it can name but not locate fails the same way. Both mean "search again", never
       * "retry this id", so the list stays and the copy says so.
       */
      setError(
        isPlaceExpired(e) ? 'That place is no longer available. Search again.'
        : 'Could not open that place. Try another result.',
      );
    }
  };

  return (
    <View style={[styles.screen, { paddingTop: insets.top + spacing.s }]}>
      <View style={styles.field}>
        <Pressable onPress={onBack} hitSlop={hitSlopFor(24)} accessibilityRole="button" accessibilityLabel="Back">
          <Icon name="ArrowBack" size={24} color={colors.textPrimary} />
        </Pressable>
        <View style={styles.grow}>
          <Input
            placeholder="Search area, colony or landmark"
            value={q}
            onChangeText={t => { setQ(t); setError(null); }}
            autoFocus
            returnKeyType="search"
            style={styles.input}
          />
        </View>
        {searching ? <ActivityIndicator size="small" color={colors.primary100} /> : null}
        {q && !searching ? (
          <Pressable onPress={() => setQ('')} hitSlop={hitSlopFor(24)} accessibilityRole="button" accessibilityLabel="Clear">
            <Icon name="Close" size={24} color={colors.textSecondary} />
          </Pressable>
        ) : null}
      </View>

      {/* Row one, always — the spec's "fastest way to pin the site". Goes through the same
          single entry point as the sheet's button, so the OS prompt still only ever fires
          from an explicit tap (R4). */}
      <Pressable style={styles.row} onPress={onUseCurrentLocation} accessibilityRole="button">
        <Icon name="MyLocation" size={24} color={colors.primary100} />
        <View style={styles.grow}>
          <Text variant="rowTitle" color={colors.primary100}>Use Current Location</Text>
          <Text variant="body" color={colors.textSecondary}>Fastest way to pin the site</Text>
        </View>
      </Pressable>

      {error ? <Text variant="body" color={colors.error100}>{error}</Text> : null}

      <View style={styles.grow}>
        {suggestions.length ? (
          <FlashList
            data={suggestions}
            keyExtractor={s => s.place_id}
            keyboardShouldPersistTaps="handled"
            ListHeaderComponent={
              <Text variant="overline" color={colors.textSecondary} style={styles.sectionHead}>
                Results
              </Text>
            }
            renderItem={({ item }) => <SuggestionRow suggestion={item} onPress={() => pick(item)} />}
          />
        ) : tooShort ? (
          // The server would answer SEARCH_QUERY_TOO_SHORT; saying it here costs no request.
          <EmptyState
            title="Keep typing"
            body={`Type at least ${MIN_SEARCH_QUERY} letters to search.`}
          />
        ) : searching ? null
        : search.error ? (
          <EmptyState
            title={isSearchUnavailable(search.error) ? 'Search is unavailable' : 'Could not search'}
            body="Move the map to place the pin instead."
          />
        ) : debounced.length >= MIN_SEARCH_QUERY ? (
          // An empty list is a real answer — nothing matched. Not a failure, not a retry prompt.
          <EmptyState title="No match" body="Try a different name, or move the pin on the map." />
        ) : (
          <EmptyState
            title="Search for the site"
            body="Type an area, colony or landmark — or place the pin on the map yourself."
          />
        )}
      </View>
    </View>
  );
}

/**
 * Google's two-line split: the place, then its administrative tail. `description` is the same
 * thing joined for a one-line row — render one shape or the other, never both.
 */
function SuggestionRow({
  suggestion, onPress,
}: { suggestion: AddressSuggestion; onPress: () => void }) {
  const title = suggestion.main_text ?? suggestion.description ?? '';
  return (
    <Pressable style={styles.row} onPress={onPress} accessibilityRole="button" accessibilityLabel={suggestion.description ?? title}>
      <Icon name="LocationMarker" size={24} color={colors.textSecondary} />
      <View style={styles.grow}>
        <Text variant="leaderboardName" numberOfLines={1}>{title}</Text>
        {suggestion.secondary_text ? (
          <Text variant="body" color={colors.textSecondary} numberOfLines={1}>
            {suggestion.secondary_text}
          </Text>
        ) : null}
      </View>
      {/* Straight-line, and only present when the search carried coordinates. */}
      {suggestion.distance_metres != null ? (
        <Text variant="meta" color={colors.textSecondary}>
          {suggestion.distance_metres >= 1000
            ? `${(suggestion.distance_metres / 1000).toFixed(1)} km`
            : `${suggestion.distance_metres} m`}
        </Text>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.surface, paddingHorizontal: spacing.m, gap: spacing.s12 },
  field: { flexDirection: 'row', alignItems: 'center', gap: spacing.s12 },
  input: { minHeight: 48, borderRadius: radius.m },
  grow: { flex: 1 },
  row: {
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.s12,
    borderBottomWidth: 1,
    borderBottomColor: colors.sunken,
    paddingVertical: spacing.s,
  },
  sectionHead: { marginTop: spacing.s12, marginBottom: spacing.s6 },
});
