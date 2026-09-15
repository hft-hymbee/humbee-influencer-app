/**
 * The Umang Utsav banner.
 *
 * The background is the Figma `BG` node (27548:67897) — theme `gradients.utsavBanner`, not a
 * hand-mixed amber. Its grain layer is a fractal-noise SVG filter with no RN equivalent, so
 * the gradient carries the look on its own.
 *
 * The handoff ships a supplied bitmap, and notes that IF venue/date/invitee count must be
 * dynamic it has to be rebuilt as composed markup. The contract DOES send those fields
 * (`utsav.city`, `venue`, `date_label`, `invited_count_label`), so this is the composed version —
 * built to the spec in docs/design-spec/04-screens/10-rewards.md §3.
 */
import React from 'react';
import { View } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { colors, gradients, radius, spacing } from '../../../theme';
import { ProductMark, Text } from '../../../components';
import type { Utsav } from '../../../api/types';

export function UtsavBanner({ utsav }: { utsav: Utsav }) {
  return (
    <LinearGradient
      colors={[...gradients.utsavBanner.colors]}
      locations={[...gradients.utsavBanner.locations]}
      start={gradients.utsavBanner.start}
      end={gradients.utsavBanner.end}
      style={{ borderRadius: radius.m, overflow: 'hidden', borderWidth: 1, borderColor: colors.primary25 }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.s12, padding: spacing.s14 }}>
        <ProductMark name="UmangUtsav" size={48} />
        <View style={{ flex: 1 }}>
          <Text variant="headerTitle">Umang Utsav</Text>
          <Text variant="body" color={colors.textSecondary}>Respect · Recognition · Reward</Text>
        </View>
        <View
          style={{
            height: 26, paddingHorizontal: spacing.s12, borderRadius: radius.pill,
            backgroundColor: colors.textPrimary, justifyContent: 'center',
          }}
        >
          <Text variant="metaBold" color={colors.white}>{utsav.city}</Text>
        </View>
      </View>

      <View
        style={{
          paddingHorizontal: spacing.s14, paddingTop: spacing.s12, paddingBottom: spacing.s14,
          gap: spacing.s6, borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.10)',
        }}
      >
        <Text variant="bodyBold">{utsav.invited_count_label}</Text>
        {/* `venue` is nullable on the live API — eligible-but-not-yet-announced is a real
            state, and printing "null" under Venue is how it shows up if you assume otherwise. */}
        {utsav.venue ? (
          <View style={{ flexDirection: 'row', gap: spacing.s }}>
            <Text variant="body" color={colors.textSecondary} style={{ width: 44 }}>Venue</Text>
            <Text variant="bodyBold" style={{ flex: 1 }}>{utsav.venue}</Text>
          </View>
        ) : null}
        <View style={{ flexDirection: 'row', gap: spacing.s }}>
          <Text variant="body" color={colors.textSecondary} style={{ width: 44 }}>Date</Text>
          <Text variant="bodyBold" style={{ flex: 1 }}>{utsav.date_label}</Text>
        </View>
      </View>
    </LinearGradient>
  );
}
