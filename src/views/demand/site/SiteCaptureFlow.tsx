/**
 * The site flow as ONE route: map → search → address form.
 *
 * WHY ONE ROUTE AND NOT THREE. The three screens share a single pin, and the pin is the thing
 * being edited. Splitting them across the root stack would mean either passing the pin through
 * navigation params — where a back-swipe silently reverts it — or lifting it to a store that
 * only these three screens read. A local step keeps "the pin" and "the screen showing it" in
 * one place, and `useSiteCapture` holds the state across all three.
 *
 * Confirmed sites land on the DRAFT, not here, which is what lets the user back out of the form
 * and return to find the pin and the typed lines intact (spec §8, "Back from S6").
 */
import React, { useState } from 'react';
import type { GeoCoordinates } from '../../../api/types';
import type { DraftSite } from '../../../domain/site';
import { useDemandDraftStore } from '../../../store/demandDraftStore';
import { MapPickerScreen } from './MapPickerScreen';
import { LocationSearchScreen } from './LocationSearchScreen';
import { SiteAddressForm } from './SiteAddressForm';

type Step = 'map' | 'search' | 'confirm';

export function SiteCaptureFlow({ onDone, onCancel }: { onDone: () => void; onCancel: () => void }) {
  const [step, setStep] = useState<Step>('map');
  /** The site being confirmed — set when the map hands one over, cleared on the way back. */
  const [pending, setPending] = useState<DraftSite | null>(null);
  /** A search pick has to reach the map's VM; this carries it across the step change. */
  const [searchPick, setSearchPick] = useState<GeoCoordinates | null>(null);
  const setSite = useDemandDraftStore(s => s.setSite);
  const draftSite = useDemandDraftStore(s => s.draft.site);

  /**
   * Where the map is, as far as the search screen is concerned: the last pick, else the site
   * already on the draft. Used only to bias ranking.
   */
  const pinned = searchPick ?? draftSite?.coords ?? null;

  if (step === 'search') {
    return (
      <LocationSearchScreen
        // The map centre biases ranking. Null on a first search, which the server answers
        // nationally — correct, since there is nothing yet to be near.
        near={pinned}
        onBack={() => setStep('map')}
        onUseCurrentLocation={() => { setSearchPick(null); setStep('map'); }}
        /**
         * The place arrives already RESOLVED — coordinates and component ids — and the
         * endpoint has primed the reverse-geocode cache with it. So handing the map its
         * coordinates costs no second lookup and, more importantly, keeps the better
         * `address_line_1`: for a point with no street number the geocoder's own first line
         * is a plus code or a bare pincode, and the place endpoint substitutes the name the
         * user just tapped. Re-resolving here would put the junk back.
         */
        onPicked={place => {
          if (place.geo_coordinates) setSearchPick(place.geo_coordinates);
          setStep('map');
        }}
      />
    );
  }

  if (step === 'confirm' && pending) {
    return (
      <SiteAddressForm
        site={pending}
        onBack={() => setStep('map')}
        onChangeOnMap={() => setStep('map')}
        onSave={site => { setSite(site); onDone(); }}
      />
    );
  }

  return (
    <MapPickerScreen
      seedCoords={searchPick}
      onBack={onCancel}
      onSearch={() => setStep('search')}
      onConfirm={site => { setPending(site); setStep('confirm'); }}
    />
  );
}
