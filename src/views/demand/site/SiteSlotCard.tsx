/**
 * S1 / S7 — the site's place in the cart. One component, `site` nullable: the filled card
 * REPLACES the empty slot in the same position, so nothing on the screen shifts when a site is
 * attached. That is why the slot sits below the cart lines and above Submit in both states.
 *
 * It is a CART-level card, not a per-line one (spec R1): the site belongs to the demand, and
 * products added afterwards inherit it.
 */
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { colors, radius, spacing } from '../../../theme';
import { Button, Card, HexMark, Icon, Text } from '../../../components';
import { draftSiteLine, type DraftSite } from '../../../domain/site';

export function SiteSlotCard({
  site, onAdd, onChange,
}: { site: DraftSite | null; onAdd: () => void; onChange: () => void }) {
  if (!site) {
    return (
      // `emphasis` is the chestnut hairline — every other cart card is neutral, and this is the
      // outstanding action.
      <Card emphasis padding={16}>
        <View style={styles.body}>
          <View style={styles.head}>
            <View style={styles.hex}>
              <HexMark size={32} backgroundColor={colors.primary10} />
              <View style={styles.hexIcon} pointerEvents="none">
                <Icon name="LocationPin" size={16} color={colors.primary100} />
              </View>
            </View>
            <View style={styles.grow}>
              <Text variant="rowTitle">Construction Site</Text>
              <Text variant="body" color={colors.textSecondary}>
                Where this material will be delivered. Required to submit.
              </Text>
            </View>
          </View>
          <Button label="Add Site Address" variant="outline" size="medium" onPress={onAdd} fullWidth />
        </View>
      </Card>
    );
  }

  return (
    <Card padding={14}>
      <View style={styles.filled}>
        <View style={styles.thumb}>
          <Icon name="LocationPin" size={18} color={colors.primary100} />
        </View>
        <View style={styles.grow}>
          <Text variant="overline" color={colors.textSecondary}>Construction site</Text>
          <Text variant="rowTitle" numberOfLines={1}>{site.addressLine1}</Text>
          {/* Composed from the parts the user just confirmed — the draft has no server line. */}
          <Text variant="body" color={colors.textSecondary} numberOfLines={2}>
            {[draftSiteLine(site), site.pincodeId ? `· ${site.pincodeId}` : ''].filter(Boolean).join(' ')}
          </Text>
          <Text variant="bodyBold" color={colors.primary100} onPress={onChange} style={styles.change}>
            Change
          </Text>
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  body: { gap: spacing.s12 },
  head: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.s10 },
  hex: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  hexIcon: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' },
  grow: { flex: 1 },
  filled: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.s12 },
  thumb: {
    width: 64, height: 64,
    borderRadius: radius.m,
    backgroundColor: colors.sunken,
    alignItems: 'center',
    justifyContent: 'center',
  },
  change: { marginTop: spacing.s6 },
});
