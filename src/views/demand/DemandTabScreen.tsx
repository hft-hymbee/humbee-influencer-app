/**
 * The Demand nav tab hosts TWO screens behind an in-tab switch: New Demand (06) and
 * My Demands (08). That is the design — My Demands is the second tab of the Demand module,
 * not a fifth nav item.
 *
 * Success (07) is a separate ROOT route, because it must hide the bottom nav.
 *
 * V2 capture is ONLINE-ONLY, so there is no queued-offline path out of this screen any more:
 * a failed submission stays on screen with its selections intact and an error to act on.
 */
import React, { useEffect } from 'react';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { CaptureDemandScreen } from './CaptureDemandScreen';
import { MyDemandsScreen } from './MyDemandsScreen';
import type { RootStackParamList } from '../../navigation/types';
import { useDemandDraftStore } from '../../store/demandDraftStore';

export function DemandTabScreen({ onOpenProfile }: { onOpenProfile: () => void }) {
  const nav = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const tab = useDemandDraftStore(s => s.tab);
  const setTab = useDemandDraftStore(s => s.setTab);
  const reset = useDemandDraftStore(s => s.reset);

  /**
   * ARRIVING AT NEW DEMAND STARTS A NEW DEMAND. Entering the tab clears whatever the last one
   * left behind — manufacturer, cart lines, quantity and the construction site.
   *
   * It runs on the transition INTO 'new', not on every render, so building a cart is
   * undisturbed; what it catches is coming back after a submission or after a look at My
   * Demands. The alternative — a half-built cart resurfacing days later, still carrying a site
   * address from another job — is the worse failure for this user, because nothing on the
   * screen announces that the leftovers are old.
   *
   * It deliberately does NOT fire when the site-capture flow returns: that is a root route
   * pushed OVER the tabs, so this screen never unmounts and the tab never re-enters 'new'.
   * A site being captured is part of the demand in progress, not a previous one.
   */
  useEffect(() => {
    if (tab === 'new') reset();
  }, [tab, reset]);

  if (tab === 'mine') {
    return <MyDemandsScreen onOpenProfile={onOpenProfile} onTabChange={setTab} />;
  }

  return (
    <CaptureDemandScreen
      onOpenProfile={onOpenProfile}
      onTabChange={setTab}
      onSubmitted={result => nav.navigate('DemandCaptured', { result })}
      // Same route for "Add" and "Change" — the flow seeds itself from the draft's site, so
      // changing an address opens the map where the user left it rather than at a centroid.
      onCaptureSite={() => nav.navigate('SiteCapture')}
    />
  );
}
