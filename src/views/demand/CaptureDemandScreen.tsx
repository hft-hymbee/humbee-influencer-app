/**
 * Screen 06 — Capture Demand. docs/design-spec/04-screens/06-capture-demand.md
 *
 * Everything happens on ONE screen — no wizard, no page-turns. Sections rise in as choices are
 * made. The reset rules are in domain/demand.ts.
 *
 * V2 changed the flow in three ways:
 *   1. Industry → Manufacturer directly. The sub-industry step and the "HUMBEE will route it"
 *      branch are gone from the contract, so they are gone from here.
 *   2. Products load per manufacturer, on demand, instead of arriving inside the tree.
 *   3. A submission carries a LIST of products. "Add another product" builds that list; the
 *      line being composed is folded in at submit, so the common single-product capture is
 *      still one pass down the screen with no extra tap.
 */
import React, { useState } from 'react';
import { View } from 'react-native';
import { colors, spacing } from '../../theme';
import {
  Button, Card, Input, Screen, ScreenHeader, Select, SkeletonBlock, Text, UomSelector,
} from '../../components';
import { ModuleTabs } from './components/ModuleTabs';
import { DemandTrail } from './components/DemandTrail';
import { CartLines, IndustryGrid, ManufacturerRows } from './components/PickCards';
import { useCaptureDemand } from './useCaptureDemand';
import { normaliseDecimal } from '../../domain/format';
import { ApiError, isStaleCatalog } from '../../api';
import type { CreateDemandResult } from '../../api/types';

export function CaptureDemandScreen({
  onOpenProfile, onTabChange, onSubmitted,
}: {
  onOpenProfile: () => void;
  onTabChange: (tab: 'new' | 'mine') => void;
  onSubmitted: (result: CreateDemandResult) => void;
}) {
  const vm = useCaptureDemand();
  const [error, setError] = useState<string | null>(null);

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

  return (
    <Screen header={header}>
      <View style={{ gap: spacing.s20 }}>
        {/* 1. Industry */}
        <View style={{ gap: spacing.s }}>
          <Text variant="overline" color={colors.textTertiary}>Industry</Text>
          <IndustryGrid items={vm.industries} value={vm.draft.industryId} onChange={vm.chooseIndustry} />
        </View>

        {/* 2. Manufacturer — the second and final level of the V2 picker */}
        {vm.industry ? (
          <View style={{ gap: spacing.s }}>
            <Text variant="overline" color={colors.textTertiary}>Manufacturer</Text>
            <ManufacturerRows
              items={vm.manufacturers}
              value={vm.draft.manufacturerId}
              onChange={vm.chooseManufacturer}
            />
          </View>
        ) : null}

        {/* 3. Products already in this submission */}
        {vm.draft.lines.length ? (
          <View style={{ gap: spacing.s }}>
            <Text variant="overline" color={colors.textTertiary}>
              {`In this demand · ${vm.draft.lines.length}`}
            </Text>
            <CartLines lines={vm.draft.lines} onRemove={vm.removeLine} />
          </View>
        ) : null}

        {/* 4. Product + quantity */}
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

        {error ? <Text variant="body" color={colors.error100}>{error}</Text> : null}

        <Button
          label="Submit Demand"
          onPress={submit}
          disabled={!vm.canSubmit}
          loading={vm.isSubmitting}
          fullWidth
        />
      </View>
    </Screen>
  );
}
