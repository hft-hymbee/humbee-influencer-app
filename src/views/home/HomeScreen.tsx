/**
 * Screen 03 — Home. docs/design-spec/04-screens/03-home.md
 *
 * ONE call (GET /home) fills the screen. Quick links sit ABOVE My Rewards and the carousel is
 * full width — both were explicit client decisions, so do not reorder them.
 */
import React from 'react';
import { Pressable, View } from 'react-native';
import { colors, radius, spacing } from '../../theme';
import {
  BannerCarousel, Card, EmptyState, HexMark, Icon, ListContainer, ProductMark,
  Screen, ScreenHeader, SkeletonBlock, SkeletonCards, SkeletonTiles, StatTile, StatusBadge, Text,
} from '../../components';
import type { IconName } from '../../components';
import { useHomeScreen } from './useHomeScreen';

export function HomeScreen({
  onNavigate, onOpenProfile,
}: { onNavigate: (route: string) => void; onOpenProfile: () => void }) {
  const vm = useHomeScreen();

  const header = (
    <ScreenHeader title="Home" subtitle="HUMBEE Influencer Programme" onPressAccount={onOpenProfile} />
  );

  if (vm.isSkeleton) {
    return (
      <Screen header={header}>
        <View style={{ gap: spacing.s20 }}>
          <SkeletonBlock height={32} width="60%" />
          <SkeletonBlock height={150} round={radius.m} />
          <SkeletonTiles count={2} />
          <SkeletonCards count={2} height={84} />
          <SkeletonCards count={4} height={56} />
        </View>
      </Screen>
    );
  }

  return (
    <Screen header={header} onRefresh={vm.refetch} refreshing={vm.isRefreshing}>
      <View style={{ gap: spacing.s20 }}>
        {/* Welcome. A long name WRAPS to two lines — never truncate. */}
        <View style={{ gap: spacing.xxs }}>
          <Text variant="body" color={colors.textTertiary}>Welcome back</Text>
          <Text variant="screenTitle">{vm.name}</Text>
        </View>

        <BannerCarousel banners={vm.banners} />

        <View style={{ flexDirection: 'row', gap: spacing.s }}>
          <StatTile
            label="Rewards allotted · all manufacturers"
            value={vm.rewardsAllotted}
            valueColor={colors.success100}
          />
          <StatTile
            label="Points earned this year"
            value={vm.pointsThisYear}
            valueColor={colors.success100}
          />
        </View>

        {/* Quick links — 2x2, above My Rewards. Filtered by entitlement. */}
        {vm.quickLinks.length ? (
          <View style={{ gap: spacing.s10 }}>
            <Text variant="overline" color={colors.textTertiary}>Quick Links</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.s12 }}>
              {vm.quickLinks.map(link => (
                <Pressable
                  key={link.module}
                  onPress={() => onNavigate(link.route)}
                  accessibilityRole="button"
                  accessibilityLabel={`${link.label}. ${link.meta}`}
                  style={{ flexGrow: 1, flexBasis: '46%' }}
                >
                  <Card padding={14}>
                    <View style={{ gap: spacing.s10 }}>
                      <HexMark size={36} backgroundColor={colors.primary10}>
                        <Icon name={link.icon as IconName} size={20} color={colors.primary100} />
                      </HexMark>
                      <View>
                        <Text variant="rowTitle">{link.label}</Text>
                        <Text variant="meta" color={colors.textTertiary}>{link.meta}</Text>
                      </View>
                    </View>
                  </Card>
                </Pressable>
              ))}
            </View>
          </View>
        ) : null}

        {/* My Rewards — 4 most recent across ALL manufacturers, newest first. */}
        {vm.canSeeRewards ? (
          <View style={{ gap: spacing.s10 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text variant="overline" color={colors.textTertiary} style={{ flex: 1 }}>My Rewards</Text>
              <Pressable onPress={() => onNavigate('Rewards')} accessibilityRole="button">
                <Text variant="metaBold" color={colors.primary100}>View All</Text>
              </Pressable>
            </View>

            {vm.recentRewards.length ? (
              <ListContainer>
                {vm.recentRewards.map(r => (
                  <Pressable
                    key={r.id}
                    onPress={() => onNavigate('Rewards')}
                    accessibilityRole="button"
                    accessibilityLabel={`${r.gift}, ${r.manufacturer_name}, ${r.status}`}
                    style={{
                      minHeight: 56, paddingVertical: spacing.s10, paddingHorizontal: spacing.s14,
                      flexDirection: 'row', alignItems: 'center', gap: spacing.s12,
                    }}
                  >
                    <ProductMark name={r.mark} size={32} />
                    <View style={{ flex: 1 }}>
                      <Text variant="rowTitle" numberOfLines={1}>{r.gift}</Text>
                      <Text variant="meta" color={colors.textTertiary}>
                        {`${r.manufacturer_name} · ${r.released_on_label}`}
                      </Text>
                    </View>
                    <StatusBadge status={r.status} height={22} />
                  </Pressable>
                ))}
              </ListContainer>
            ) : (
              // The designed no-rewards state. Quick links stay.
              <Card padding={16}>
                <Text variant="body" color={colors.textSecondary}>
                  No gifts yet. Capture demands to enter the next lucky draw.
                </Text>
              </Card>
            )}
          </View>
        ) : null}

        {vm.isError && !vm.name ? (
          <EmptyState title="Could not load Home" body="Pull down to try again." />
        ) : null}
      </View>
    </Screen>
  );
}
