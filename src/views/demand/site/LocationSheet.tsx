/**
 * The map picker's bottom sheet — spec S2 (collapsed), S4 (a fix, with derived chips) and S8
 * (fallback copy). One component: the three states differ in what is known about the pin, not
 * in what the sheet is.
 *
 * THE DERIVED CHIPS ARE THE POINT OF THIS SHEET. They show the influencer the geography the
 * pin resolved to — pincode, district, state, locality — BEFORE they commit to it. That
 * matters here more than in most address flows, because those four values are not typed and
 * cannot be typed: the server derives the stored state and district from the pincode and
 * rejects anything that contradicts it. If the pin is wrong, this is where it must be caught.
 */
import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, elevation, radius, spacing } from '../../../theme';
import { Button, HexMark, Icon, Text } from '../../../components';
import type { DraftSite } from '../../../domain/site';

export function LocationSheet({
  site, isGeocoding, accuracy, unserviceable, error, onRetry,
  locating, onUseCurrentLocation, onConfirm, canConfirm,
}: {
  site: DraftSite | null;
  isGeocoding: boolean;
  accuracy: { text: string; weak: boolean } | null;
  unserviceable: boolean;
  error: string | null;
  onRetry?: () => void;
  locating: boolean;
  onUseCurrentLocation: () => void;
  onConfirm: () => void;
  canConfirm: boolean;
}) {
  const insets = useSafeAreaInsets();
  const hasChips = site && (site.pincodeId || site.districtName || site.stateName || site.locationName);

  return (
    <View style={[styles.sheet, { paddingBottom: insets.bottom + spacing.m }]}>
      <View style={styles.handle} />

      {/*
        In flight, the PREVIOUS text stays and fades rather than blanking. A sheet that empties
        on every camera idle flickers the whole time the map is moving, and the old address is
        a better guess than nothing while the new one resolves.
      */}
      <View style={isGeocoding ? styles.pending : null}>
        <Text variant="overline" color={colors.textSecondary}>Selected location</Text>

        {site ? (
          <View style={styles.addressRow}>
            <View style={styles.hex}>
              <HexMark size={32} backgroundColor={colors.primary10} />
              <View style={styles.hexIcon} pointerEvents="none">
                <Icon name="LocationPin" size={16} color={colors.primary100} />
              </View>
            </View>
            <View style={styles.grow}>
              <Text variant="sectionHeader" numberOfLines={1}>
                {site.locationName ?? site.addressLine1 ?? 'Dropped pin'}
              </Text>
              {/* The provider's own single line — already de-duplicated. Never re-joined here. */}
              <Text variant="body" color={colors.textSecondary} numberOfLines={2}>
                {site.formattedAddress}
              </Text>
            </View>
          </View>
        ) : (
          <Text variant="body" color={colors.textTertiary}>
            {isGeocoding ? 'Reading this location…' : 'Move the map to place the pin.'}
          </Text>
        )}
      </View>

      {hasChips ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
          {site!.pincodeId ? <DerivedChip label="Pincode" value={String(site!.pincodeId)} /> : null}
          {site!.districtName ? <DerivedChip label="District" value={site!.districtName} /> : null}
          {site!.stateName ? <DerivedChip label="State" value={site!.stateName} /> : null}
          {site!.locationName ? <DerivedChip label="Area" value={site!.locationName} /> : null}
        </ScrollView>
      ) : null}

      {accuracy ? (
        <Text variant="metaBold" color={accuracy.weak ? colors.warning200 : colors.success100}>
          {accuracy.text}
        </Text>
      ) : null}

      {/*
        A geocode that SUCCEEDS can still be unusable: no pincode means the server has nothing
        to derive the state and district from, so the pin cannot become a site at all. This is
        not an error state on the wire, which is exactly why it needs saying here.
      */}
      {unserviceable ? (
        <Strip tone="error" text="We do not serve this location yet. Move the pin." />
      ) : error ? (
        <Strip tone="error" text={error} action={onRetry ? { label: 'Retry', onPress: onRetry } : undefined} />
      ) : (
        <Strip tone="info" text="Pin the gate of the site, not the nearest main road." />
      )}

      <Button
        label="Use Current Location"
        variant="outline"
        size="medium"
        onPress={onUseCurrentLocation}
        loading={locating}
        fullWidth
      />
      <Button label="Confirm Location" onPress={onConfirm} disabled={!canConfirm} fullWidth />
    </View>
  );
}

/** A read-only key/value pill. Announced as "Pincode 302012" — key and value in one label. */
function DerivedChip({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.chip} accessibilityLabel={`${label} ${value}`}>
      <Text variant="meta" color={colors.textSecondary}>{label}</Text>
      <Text variant="metaBold" color={colors.textPrimary}>{value}</Text>
    </View>
  );
}

function Strip({
  tone, text, action,
}: { tone: 'info' | 'error'; text: string; action?: { label: string; onPress: () => void } }) {
  const isError = tone === 'error';
  return (
    <View style={[styles.strip, { backgroundColor: isError ? colors.error10 : colors.info10 }]}>
      <Icon name="InfoOutlined" size={16} color={isError ? colors.error100 : colors.info100} />
      <Text variant="body" color={colors.textSecondary} style={styles.grow}>{text}</Text>
      {action ? (
        <Text variant="bodyBold" color={colors.primary100} onPress={action.onPress}>
          {action.label}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  sheet: {
    position: 'absolute', left: 0, right: 0, bottom: 0,
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.l,
    borderTopRightRadius: radius.l,
    padding: spacing.m,
    gap: spacing.s12,
    ...elevation.e2,
  },
  handle: {
    width: 36, height: 4, borderRadius: 2,
    backgroundColor: colors.border,
    alignSelf: 'center',
    marginBottom: spacing.xs,
  },
  pending: { opacity: 0.4 },
  addressRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.s10, marginTop: spacing.s6 },
  hex: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  hexIcon: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' },
  grow: { flex: 1 },
  chips: { gap: spacing.s, paddingRight: spacing.m },
  chip: {
    height: 28,
    borderRadius: radius.pill,
    backgroundColor: colors.sunken,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.s10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.s6,
  },
  strip: {
    borderRadius: radius.m,
    padding: spacing.s10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.s,
  },
});
