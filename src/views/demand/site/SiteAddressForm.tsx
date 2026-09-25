/**
 * S6 — Site Address. The last step before the site is attached to the cart.
 *
 * TWO KINDS OF FIELD, AND THE DIFFERENCE IS LOAD-BEARING:
 *
 *   TYPED    Address line 1, line 2, landmark. A plot number is never in a geocode, and a
 *            driver needs a landmark as much as an address, so these are the user's.
 *   DERIVED  Pincode, district, state. These are READ-ONLY here, and that is a deliberate
 *            divergence from the UI spec's own screen (which shows them as editable inputs).
 *            The contract stores the state and district the PINCODE names, and REJECTS a
 *            district or state that contradicts it — `SITE_ADDRESS_INVALID`, nothing stored —
 *            rather than silently correcting it. An editable field that the server will refuse
 *            is worse than no field: it invites a correction that can only fail at submit,
 *            several taps later, with the whole cart already built.
 *
 *            The spec's own note under these fields already says the right thing, and it is
 *            kept verbatim: "Pincode, District and State came from the pin. Change the pin to
 *            change them." The pin IS the way to correct them, and Change On Map is right there.
 *            Raised as a spec/contract conflict in docs/06-inputs-needed.md.
 */
import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { colors, radius, spacing } from '../../../theme';
import { Button, Icon, Input, Screen, ScreenHeader, Text } from '../../../components';
import {
  isSiteComplete, siteErrors, type DraftSite,
} from '../../../domain/site';

export function SiteAddressForm({
  site, onBack, onChangeOnMap, onSave,
}: {
  site: DraftSite;
  onBack: () => void;
  onChangeOnMap: () => void;
  onSave: (site: DraftSite) => void;
}) {
  /**
   * Edited as a LOCAL COPY. The draft's site is only written on save, so backing out of this
   * screen cannot half-apply an edit — and the pin behind it stays exactly as confirmed.
   */
  const [draft, setDraft] = useState<DraftSite>(site);
  const [showErrors, setShowErrors] = useState(false);

  const errors = siteErrors(draft);
  const visible = showErrors ? errors : { addressLine1: null, addressLine2: null, landmark: null };
  const set = (patch: Partial<DraftSite>) => setDraft(d => ({ ...d, ...patch }));

  const save = () => {
    if (!isSiteComplete(draft)) { setShowErrors(true); return; }
    onSave(draft);
  };

  const header = (
    <ScreenHeader
      title="Site Address"
      subtitle="Check what we picked up from the map"
      onBack={onBack}
    />
  );

  return (
    <Screen header={header}>
      <View style={styles.body}>
        {/*
          Not a live map — a static line naming the pin, with the way back to it. Rendering a
          second MapView here would cost a second map instance on a 2 GB device for a thumbnail
          nobody pans.
        */}
        <View style={styles.pinRow}>
          <Icon name="LocationPin" size={20} color={colors.primary100} />
          <Text variant="body" color={colors.textSecondary} style={styles.grow} numberOfLines={2}>
            {draft.formattedAddress}
          </Text>
          <Text variant="metaBold" color={colors.primary100} onPress={onChangeOnMap}>
            Change On Map
          </Text>
        </View>

        <View style={styles.guidance}>
          <Text variant="body" color={colors.textSecondary}>
            Fill in the house or plot number and a landmark — drivers need both.
          </Text>
        </View>

        <Input
          label="Address Line 1"
          placeholder="Plot / house number, street"
          value={draft.addressLine1}
          onChangeText={t => set({ addressLine1: t })}
          error={visible.addressLine1 ?? undefined}
        />
        <Input
          label="Address Line 2"
          placeholder="Area, colony"
          value={draft.addressLine2}
          onChangeText={t => set({ addressLine2: t })}
          error={visible.addressLine2 ?? undefined}
        />
        <Input
          label="Enter Landmark"
          placeholder="Nearest school, temple, factory"
          value={draft.landmark}
          onChangeText={t => set({ landmark: t })}
          error={visible.landmark ?? undefined}
        />

        <View style={styles.derivedRow}>
          <View style={styles.grow}>
            <DerivedField label="Pincode" value={draft.pincodeId ? String(draft.pincodeId) : '—'} />
          </View>
          <View style={styles.grow}>
            <DerivedField label="District" value={draft.districtName ?? '—'} />
          </View>
        </View>
        <DerivedField label="State" value={draft.stateName ?? '—'} />

        <Text variant="meta" color={colors.textTertiary}>
          Pincode, District and State came from the pin. Change the pin to change them.
        </Text>

        {/*
          The button FLOWS with the fields rather than being pinned to the bottom of the screen.
          Pinned, it stranded itself a long way below the last input on a tall handset — the
          form reads as finished and the action is somewhere else entirely — and it sat under
          the Android navigation bar, which clipped the label. Inline, it lands where the eye
          already is: immediately after the last thing the user filled in.
        */}
        <Button label="Save Site Address" onPress={save} fullWidth />
      </View>
    </Screen>
  );
}

/**
 * A derived value, shown in the shape of a field so the form reads as one thing, but not a
 * TextInput: there is nothing to type into it and a focus ring would promise otherwise.
 */
function DerivedField({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.derived} accessibilityLabel={`${label}, ${value}, from the map pin`}>
      <Text variant="bodyBold" color={colors.textSecondary}>{label}</Text>
      <View style={styles.derivedBox}>
        <Text variant="bodyLarge" color={colors.textPrimary} numberOfLines={1}>{value}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  body: { gap: spacing.m },
  grow: { flex: 1 },
  pinRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.s10,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.m,
    padding: spacing.s12,
  },
  guidance: {
    backgroundColor: colors.warning10,
    borderRadius: radius.m,
    padding: spacing.s12,
  },
  derivedRow: { flexDirection: 'row', gap: spacing.s12 },
  derived: { gap: spacing.s6 },
  derivedBox: {
    minHeight: 48,
    justifyContent: 'center',
    borderRadius: radius.m,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.sunken,
    paddingHorizontal: spacing.s12,
  },
});
