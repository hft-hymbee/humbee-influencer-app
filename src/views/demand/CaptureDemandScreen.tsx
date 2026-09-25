/**
 * Screen 06 — Capture Demand. docs/design-spec/04-screens/06-capture-demand.md
 *
 * Everything happens on ONE screen — no wizard, no page-turns. Sections rise in as choices are
 * made. The reset rules are in domain/demand.ts.
 *
 * V2 changed the flow in three ways:
 *   1. Industry → Manufacturer directly. The sub-industry step and the "HUMBEE will route it"
 *      branch are gone from the contract, so they are gone from here. The industry step itself
 *      then came off the screen too (client decision): the picker opens straight onto a grid of
 *      manufacturer logo tiles, and the industry is recorded from whichever tile is tapped.
 *   2. Products load per manufacturer, on demand, instead of arriving inside the tree.
 *   3. A submission carries a LIST of products. "Add another product" builds that list; the
 *      line being composed is folded in at submit, so the common single-product capture is
 *      still one pass down the screen with no extra tap.
 */
import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { colors, radius, spacing } from '../../theme';
import {
  Button, Card, Icon, Input, Screen, ScreenHeader, Select, SkeletonBlock, Text, UomSelector,
} from '../../components';
import { ModuleTabs } from './components/ModuleTabs';
import { DemandTrail } from './components/DemandTrail';
import { CartLines, ManufacturerGrid } from './components/PickCards';
import { SiteSlotCard } from './site/SiteSlotCard';
import { useCaptureDemand } from './useCaptureDemand';
import { normaliseDecimal } from '../../domain/format';
import { ApiError, isSiteRejected, isStaleCatalog, isStaleDistrict } from '../../api';
import type { CreateDemandResult } from '../../api/types';

export function CaptureDemandScreen({
  onOpenProfile, onTabChange, onSubmitted, onCaptureSite,
}: {
  onOpenProfile: () => void;
  onTabChange: (tab: 'new' | 'mine') => void;
  onSubmitted: (result: CreateDemandResult) => void;
  /** Opens the site flow (map → search → address form). */
  onCaptureSite: () => void;
}) {
  const vm = useCaptureDemand();
  const [error, setError] = useState<string | null>(null);

  /**
   * S7's one-time confirmation strip. Derived from the site APPEARING on the draft rather than
   * passed back through navigation: the site flow writes to the draft and pops, so there is no
   * return value to carry a flag on, and watching the transition keeps the two screens from
   * having to know about each other.
   */
  const [siteJustSaved, setSiteJustSaved] = useState(false);
  const hadSite = useRef(vm.draft.site != null);
  useEffect(() => {
    const has = vm.draft.site != null;
    if (has && !hadSite.current) setSiteJustSaved(true);
    if (!has) setSiteJustSaved(false);
    hadSite.current = has;
  }, [vm.draft.site]);

  const submit = async () => {
    setError(null);
    try {
      const result = await vm.submitDemand();
      if (result) onSubmitted(result);
    } catch (e) {
      /**
       * Keep EVERY choice intact on a rejection — the submission is atomic, so nothing was
       * stored and the draft is still exactly what the user meant.
       */
      if (isStaleCatalog(e)) {
        setError('That product or unit is no longer available. Pick it again.');
      } else if (isSiteRejected(e)) {
        /**
         * The site did not validate — an unserved pincode, or a district or state that
         * contradicts it. `message` names which check failed and is the only place that detail
         * exists, so it is shown rather than replaced. Nothing was stored, and the fix is
         * always the same: back to the map.
         */
        setError(e instanceof ApiError ? e.message : 'That site address could not be used. Pick the location again.');
      } else if (isStaleDistrict(e)) {
        // The industry tree has already been invalidated by the mutation, so the picker
        // reloads itself with a district that resolves. Nothing was stored.
        setError('Your area could not be confirmed. Choose your manufacturer again.');
      } else {
        setError(e instanceof ApiError ? e.message : 'Could not submit the demand. Try again.');
      }
    }
  };

  const header = (
    <>
      <ScreenHeader title="Capture Demand" subtitle="Raise quantity against your manufacturer" onPressAccount={onOpenProfile} />
      <ModuleTabs value="new" onChange={onTabChange} />
      <DemandTrail steps={vm.trailSteps} />
    </>
  );

  if (vm.isSkeleton) {
    return (
      <Screen header={header}>
        <View style={{ gap: spacing.m }}>
          <SkeletonBlock height={110} />
          <SkeletonBlock height={90} />
        </View>
      </Screen>
    );
  }

  /**
   * Pull to refresh re-reads the catalogue and empties the draft (see `refresh` in the VM).
   * The error banner goes with it: it described a submission attempt against the tree that has
   * just been replaced.
   */
  const refresh = () => {
    setError(null);
    setSiteJustSaved(false);
    vm.refresh();
  };

  return (
    <Screen header={header} onRefresh={refresh} refreshing={vm.isRefreshing}>
      <View style={{ gap: spacing.s20 }}>
        {siteJustSaved ? (
          <View style={styles.savedStrip}>
            <Icon name="CheckCircle" size={16} color={colors.success100} />
            <Text variant="body" color={colors.textSecondary}>Site address saved</Text>
          </View>
        ) : null}

        {/*
          1. Manufacturer — the FIRST and only picker. The industry step was removed: the
          catalogue is already filtered to the caller's district, so the industry was a tap
          that narrowed a list the influencer navigates by brand anyway.
        */}
        <View style={{ gap: spacing.s }}>
          <Text variant="sectionHeader">Manufacturer</Text>
          {/* Tapping the selected tile again unticks it and empties the draft. */}
          <ManufacturerGrid
            items={vm.manufacturers}
            value={vm.draft.manufacturerId}
            onChange={vm.chooseManufacturer}
          />
        </View>

        {/* 2. Products already in this submission */}
        {vm.draft.lines.length ? (
          <View style={{ gap: spacing.s }}>
            <Text variant="sectionHeader">
              {`In this demand · ${vm.draft.lines.length}`}
            </Text>
            <CartLines lines={vm.draft.lines} onRemove={vm.removeLine} />
          </View>
        ) : null}

        {/* 3. Product + quantity */}
        {vm.showQuantityCard ? (
          <Card padding={16}>
            <View style={{ gap: spacing.m }}>
              {vm.isLoadingProducts ? (
                <SkeletonBlock height={44} />
              ) : (
                <Select
                  label="Select Product"
                  placeholder="Choose product"
                  options={vm.productOptions}
                  value={vm.draft.productId}
                  onChange={v => vm.chooseProduct(Number(v))}
                  searchable
                  searchPlaceholder="Search product"
                />
              )}

              {/* The server's own rate string, per BASE unit. Never recompute a rate here. */}
              {vm.pointsHint ? (
                <Text variant="meta" color={colors.textTertiary}>{vm.pointsHint}</Text>
              ) : null}

              {/* A product may appear only ONCE per submission — caught here, not by the server. */}
              {vm.isDuplicate ? (
                <Text variant="meta" color={colors.error100}>
                  That product is already in this demand. Remove it above to change the quantity.
                </Text>
              ) : null}

              <View style={{ flexDirection: 'row', gap: spacing.s12, alignItems: 'flex-start' }}>
                <View style={{ flex: 1 }}>
                  <Input
                    label="Enter Quantity"
                    placeholder="0"
                    keyboardType="decimal-pad"
                    inputMode="decimal"
                    value={vm.draft.qty}
                    onChangeText={t => vm.setQty(normaliseDecimal(t))}
                  />
                </View>
                <UomSelector options={vm.uoms} value={vm.uom} onChange={vm.setUom} />
              </View>

              <Text variant="body" color={colors.textTertiary}>{vm.summary}</Text>

              <Button
                label="Add Another Product"
                variant="outline"
                onPress={vm.addLine}
                disabled={!vm.canAdd}
                fullWidth
              />
            </View>
          </Card>
        ) : null}

        {/*
          4. The construction site. Its position is FIXED — below the cart lines, above Submit —
          so that filling it swaps the empty slot for the site card in place and nothing on the
          screen shifts under the user's thumb.
        */}
        {vm.draft.manufacturerId != null ? (
          <SiteSlotCard site={vm.draft.site} onAdd={onCaptureSite} onChange={onCaptureSite} />
        ) : null}

        {error ? <Text variant="body" color={colors.error100}>{error}</Text> : null}

        <Button
          label="Submit Demand"
          onPress={submit}
          disabled={!vm.canSubmit}
          loading={vm.isSubmitting}
          fullWidth
        />

        {/* Says WHY Submit is dead, rather than leaving a disabled button to be puzzled over. */}
        {vm.submitBlockedReason ? (
          <Text variant="meta" color={colors.textSecondary} style={{ textAlign: 'center' }}>
            {vm.submitBlockedReason}
          </Text>
        ) : null}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  savedStrip: {
    backgroundColor: colors.success10,
    borderRadius: radius.m,
    padding: spacing.s10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.s,
  },
});
