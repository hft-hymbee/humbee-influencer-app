/**
 * S2 / S4 / S8 — the map picker. docs/construction-site-address-capture.md §4.
 *
 * THE PIN IS FIXED TO THE CENTRE OF THE SCREEN AND THE MAP MOVES UNDER IT. That is the delivery
 * -app pattern and it is chosen for this user: it works one-handed, and it never asks for a
 * precise touch on a small target — which is what a draggable marker demands from someone
 * standing on a site in the sun wearing work gloves.
 *
 * The three designed states are ONE screen, differing only in what the sheet and banner say:
 *   S2  default — no fix yet, pin at the last site or the district centroid
 *   S4  a GPS fix — camera recentred on it, accuracy circle, the pin has grown
 *   S8  permission denied or GPS off — banner, and the manual pin still completes the flow (R5)
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import MapView, { Circle, PROVIDER_GOOGLE, type Details, type Region } from 'react-native-maps';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, elevation, hitSlopFor, radius, spacing } from '../../../theme';
import { Icon, Text } from '../../../components';
import { accuracyLabel, type DraftSite } from '../../../domain/site';
import type { GeoCoordinates } from '../../../api/types';
import { isGeocodeRetryable } from '../../../api';
import { CentrePin } from './CentrePin';
import { LocationSheet } from './LocationSheet';
import { useSiteCapture } from './useSiteCapture';

/**
 * Where the map opens when there is nothing better. Zoom is expressed as a delta —
 * 0.01 ≈ street level, which is the spec's "zoom 16".
 */
const STREET_DELTA = 0.01;

/**
 * NEW DELHI — Connaught Place. The default camera when there is no site on the draft and no
 * GPS fix yet.
 *
 * It opens at STREET level rather than zoomed out over the country. A wide camera looks safer
 * but is worse to use: panning from four degrees of latitude down to a rooftop is a long drag
 * on a phone, and the pin sits over nowhere in particular the whole way.
 *
 * It is a CAMERA POSITION, not a pin. The sheet deliberately stays empty — "Move the map to
 * place the pin" — until the user actually moves the map or takes a fix, so Confirm cannot be
 * pressed on an address nobody chose. That matters more than a pre-filled sheet here: for a
 * user who taps through, a default that resolves to a real Delhi address is a demand filed
 * against the wrong site, which nothing downstream would catch.
 */
const FALLBACK_REGION: Region = {
  latitude: 28.6139,
  longitude: 77.2090,
  latitudeDelta: STREET_DELTA,
  longitudeDelta: STREET_DELTA,
};

export function MapPickerScreen({
  seedCoords, onBack, onSearch, onConfirm,
}: {
  /** A pin handed over by the search screen. Drops the camera there, still draggable (S5). */
  seedCoords?: GeoCoordinates | null;
  onBack: () => void;
  onSearch: () => void;
  onConfirm: (site: DraftSite) => void;
}) {
  const insets = useSafeAreaInsets();
  const vm = useSiteCapture();
  const map = useRef<MapView | null>(null);
  const [movedOnce, setMovedOnce] = useState(false);

  /**
   * Applied ONCE per pick. `seedCoords` is a handover, not state: re-applying it on every
   * render would pin the camera to the search result and make the map undraggable. The camera
   * follows because `dropPinFromSearch` raises a camera target, same as a GPS fix does.
   */
  const seeded = useRef<string | null>(null);
  useEffect(() => {
    if (!seedCoords) return;
    const key = `${seedCoords.latitude},${seedCoords.longitude}`;
    if (seeded.current === key) return;
    seeded.current = key;
    vm.dropPinFromSearch(seedCoords);
  }, [seedCoords, vm]);

  /**
   * THE ONE PLACE THE CAMERA IS DRIVEN FROM. The mark is nailed to the centre of the screen,
   * so a pin the user did not drag into place — a GPS fix, a search result — only becomes
   * visible when the map moves under it. Without this, "Use Current Location" updated the
   * sheet and left the mark sitting over wherever the map already was.
   *
   * Keyed on the nonce, not the coordinates, so tapping again after drifting away re-centres
   * on the same fix.
   */
  const target = vm.cameraTarget;
  useEffect(() => {
    if (!target) return;
    map.current?.animateToRegion({
      latitude: Number(target.coords.latitude),
      longitude: Number(target.coords.longitude),
      latitudeDelta: STREET_DELTA,
      longitudeDelta: STREET_DELTA,
    }, 350);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target?.nonce]);

  const initialRegion = useMemo<Region>(() => (
    vm.pin.coords
      ? {
          latitude: Number(vm.pin.coords.latitude),
          longitude: Number(vm.pin.coords.longitude),
          latitudeDelta: STREET_DELTA,
          longitudeDelta: STREET_DELTA,
        }
      : FALLBACK_REGION
  ), [vm.pin.coords]);

  /**
   * Every camera rest reports the centre as the new pin. The VM debounces the geocode behind
   * this, so dragging across a city costs one lookup, not one per frame.
   *
   * `isGesture` is passed straight through and is load-bearing: it is how the VM tells a thumb
   * apart from its own `animateToRegion` settling, and so whether a GPS fix survives landing.
   */
  const onRegionChangeComplete = useCallback((region: Region, details: Details) => {
    setMovedOnce(true);
    vm.movePin({
      latitude: region.latitude.toFixed(6),
      longitude: region.longitude.toFixed(6),
    }, { isGesture: details?.isGesture });
  }, [vm]);

  const accuracy = accuracyLabel(vm.pin.accuracyM, vm.pin.source);
  const hasFix = vm.pin.source === 'gps' && vm.pin.accuracyM != null;

  return (
    <View style={styles.screen}>
      <MapView
        ref={map}
        /**
         * Google on Android; the PLATFORM DEFAULT (Apple Maps) on iOS.
         *
         * Forcing PROVIDER_GOOGLE on iOS pulls in the Google Maps iOS SDK and needs a second,
         * separately-billed key wired through AppDelegate — for a picker whose only job is to
         * let a thumb park a pin over a roof. Apple Maps needs neither and renders on a
         * simulator out of the box. The pin, the sheet and the geocode are ours either way:
         * nothing in this flow reads a place name off the map itself.
         */
        provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
        style={StyleSheet.absoluteFill}
        initialRegion={initialRegion}
        onRegionChangeComplete={onRegionChangeComplete}
        // The blue dot is the OS's own and needs the permission; the pin is ours either way.
        showsUserLocation={vm.permission === 'granted'}
        showsMyLocationButton={false}
        toolbarEnabled={false}
        // A11y: the map itself is decorative — the sheet carries the address in text.
        importantForAccessibility="no-hide-descendants"
      >
        {hasFix && vm.pin.coords ? (
          <Circle
            center={{
              latitude: Number(vm.pin.coords.latitude),
              longitude: Number(vm.pin.coords.longitude),
            }}
            radius={vm.pin.accuracyM ?? 0}
            fillColor={colors.info10}
            strokeColor={colors.info100}
            strokeWidth={1}
          />
        ) : null}
      </MapView>

      {/* The pin does not move with the map — it IS the centre of the screen. */}
      <CentrePin size={hasFix ? 40 : 34} showTooltip={!movedOnce} dragChip={hasFix} />

      <View style={[styles.topBar, { paddingTop: insets.top + spacing.s }]} pointerEvents="box-none">
        <View style={styles.searchBar}>
          <Pressable onPress={onBack} hitSlop={hitSlopFor(24)} accessibilityRole="button" accessibilityLabel="Back">
            <Icon name="ArrowBack" size={24} color={colors.textPrimary} />
          </Pressable>
          <Pressable style={styles.searchTap} onPress={onSearch} accessibilityRole="search" accessibilityLabel="Search area, colony or landmark">
            <Text
              variant="bodyLarge"
              color={vm.resolved?.locationName ? colors.textPrimary : colors.textTertiary}
              numberOfLines={1}
            >
              {vm.resolved?.locationName
                ? `${vm.resolved.locationName}${vm.resolved.districtName ? `, ${vm.resolved.districtName}` : ''}`
                : 'Search area, colony or landmark'}
            </Text>
          </Pressable>
          <Icon name="Search" size={24} color={colors.primary100} />
        </View>

        {/* S8 — the flow is not blocked, it just has to be finished by hand. */}
        {vm.permissionBlocked || vm.fixError ? (
          <View style={styles.banner}>
            <Icon name="InfoOutlined" size={16} color={colors.error100} />
            <Text variant="body" color={colors.textSecondary} style={styles.grow}>
              {vm.fixError ?? 'Location access is off. Search for the area, or move the pin by hand.'}
            </Text>
            {vm.permissionBlocked ? (
              <Pressable onPress={() => vm.openAppSettings()} hitSlop={hitSlopFor(20)} accessibilityRole="button">
                <Text variant="bodyBold" color={colors.primary100}>Open Settings</Text>
              </Pressable>
            ) : null}
          </View>
        ) : null}
      </View>


      <LocationSheet
        site={vm.resolved}
        isGeocoding={vm.isGeocoding}
        accuracy={accuracy}
        /**
         * A pin with no pincode is not a site — the server derives state and district from it,
         * so there is nothing to file. The user's action is to move the pin.
         */
        unserviceable={vm.isUnserviceable}
        error={
          vm.geocodeError
            ? (isGeocodeRetryable(vm.geocodeError)
                ? 'Could not read this location.'
                : 'This location cannot be used. Move the pin.')
            : null
        }
        onRetry={isGeocodeRetryable(vm.geocodeError) ? () => { void vm.retryGeocode(); } : undefined}
        locating={vm.locating}
        onUseCurrentLocation={vm.askForLocation}
        onConfirm={() => { if (vm.resolved) onConfirm(vm.resolved); }}
        /**
         * Confirm stays available when the GEOCODE failed — the pin's coordinates are still
         * good and the address can be typed on the next screen (spec §8) — but not when the
         * geocode succeeded and told us the place is unserviceable.
         */
        canConfirm={vm.resolved != null && !vm.isUnserviceable}
      />

    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.sunken },
  topBar: {
    position: 'absolute', top: 0, left: 0, right: 0,
    paddingHorizontal: spacing.m,
    gap: spacing.s,
  },
  searchBar: {
    minHeight: 48,
    borderRadius: radius.m,
    backgroundColor: colors.surface,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.s12,
    paddingHorizontal: spacing.s12,
    ...elevation.e2,
  },
  searchTap: { flex: 1, minHeight: 48, justifyContent: 'center' },
  banner: {
    backgroundColor: colors.surface,
    borderRadius: radius.m,
    padding: spacing.s12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.s,
    ...elevation.e2,
  },
  grow: { flex: 1 },
});
