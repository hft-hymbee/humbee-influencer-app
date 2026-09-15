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
import React from 'react';
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

  if (tab === 'mine') {
    return <MyDemandsScreen onOpenProfile={onOpenProfile} onTabChange={setTab} />;
  }

  return (
    <CaptureDemandScreen
      onOpenProfile={onOpenProfile}
      onTabChange={setTab}
      onSubmitted={result => nav.navigate('DemandCaptured', { result })}
    />
  );
}
