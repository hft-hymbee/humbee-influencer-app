/**
 * S5 — location search.
 *
 * ⚠️ THE RESULTS LIST HAS NO BACKEND. V2 ships exactly one address endpoint,
 * `GET /address/reverse-geocode` (pin → address). There is no forward search and no saved-sites
 * store; the UI spec's §7 endpoint table proposes `/geo/search` and `/influencer/sites` but is
 * explicitly marked "proposal — reconcile with backend", and the reconciliation went the other
 * way. Raised in docs/06-inputs-needed.md.
 *
 * The screen is built anyway, because the rest of it is real: "Use Current Location" is the
 * fastest path to a pin and the spec puts it here as row one. When `/geo/search` lands, the
 * ONLY change needed is to give `results` a query — the list, the rows, the empty state and the
 * hand-off back to the map are all already wired.
 *
 * Deliberately NOT faked with a client-side list of recent pins in MMKV: "your saved sites" that
 * only exist on one device, are lost on reinstall and are invisible to Ops would be inventing
 * product behaviour, and it would be inventing it in the one place the user is most likely to
 * trust it.
 */
import React, { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, hitSlopFor, radius, spacing } from '../../../theme';
import { EmptyState, Icon, Input, Text } from '../../../components';
import type { GeoCoordinates } from '../../../api/types';

/** Spec S5: nothing is searched under three characters, and results cap at eight. */
const MIN_QUERY = 3;

export type SearchResult = {
  id: string;
  name: string;
  address: string;
  distanceLabel: string | null;
  coords: GeoCoordinates;
};

export function LocationSearchScreen({
  onBack, onUseCurrentLocation, onPick,
}: {
  onBack: () => void;
  onUseCurrentLocation: () => void;
  onPick: (coords: GeoCoordinates) => void;
}) {
  const insets = useSafeAreaInsets();
  const [q, setQ] = useState('');

  /**
   * The wiring point. One line to replace when the endpoint exists:
   *   const { data: results = [] } = usePlaceSearchQuery(q, { enabled: q.length >= MIN_QUERY });
   */
  const results: SearchResult[] = [];
  const searching = q.trim().length >= MIN_QUERY;

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
            onChangeText={setQ}
            autoFocus
            returnKeyType="search"
            style={styles.input}
          />
        </View>
        {q ? (
          <Pressable onPress={() => setQ('')} hitSlop={hitSlopFor(24)} accessibilityRole="button" accessibilityLabel="Clear">
            <Icon name="Close" size={24} color={colors.textSecondary} />
          </Pressable>
        ) : null}
      </View>

      {/* Row one, always — the spec's "fastest way to pin the site", and the one path here that
          works today. Goes through the same single entry point as the sheet's button, so the OS
          prompt still fires only from an explicit tap (R4). */}
      <Pressable style={styles.row} onPress={onUseCurrentLocation} accessibilityRole="button">
        <Icon name="MyLocation" size={24} color={colors.primary100} />
        <View style={styles.grow}>
          <Text variant="rowTitle" color={colors.primary100}>Use Current Location</Text>
          <Text variant="body" color={colors.textSecondary}>Fastest way to pin the site</Text>
        </View>
      </Pressable>

      {results.length ? (
        <View>
          <Text variant="overline" color={colors.textSecondary} style={styles.sectionHead}>Results</Text>
          {results.map(r => (
            <Pressable key={r.id} style={styles.row} onPress={() => onPick(r.coords)} accessibilityRole="button">
              <Icon name="LocationMarker" size={24} color={colors.textSecondary} />
              <View style={styles.grow}>
                <Text variant="leaderboardName" numberOfLines={1}>{r.name}</Text>
                <Text variant="body" color={colors.textSecondary} numberOfLines={1}>{r.address}</Text>
              </View>
              {r.distanceLabel ? (
                <Text variant="meta" color={colors.textSecondary}>{r.distanceLabel}</Text>
              ) : null}
            </Pressable>
          ))}
        </View>
      ) : searching ? (
        <EmptyState
          title="No match"
          body="Place search is not available yet. Move the pin on the map instead."
        />
      ) : (
        <EmptyState
          title="Search for the site"
          body="Type an area, colony or landmark — or place the pin on the map yourself."
        />
      )}
    </View>
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
