/**
 * Screen 00 — first-launch language chooser. docs/08-screen-inventory.md §2.
 *
 * DESIGN PENDING: this screen has no handoff spec. Built from the design-system primitives and
 * the PRD §4.0 rules; get it reviewed against the handoff's visual language before shipping.
 *
 * The rules that are NOT negotiable and are implemented here:
 *  - Appears BEFORE login, because the login screen itself must render in the chosen language.
 *  - Each language labelled in ITS OWN SCRIPT first, Latin name secondary. Usable by someone
 *    who reads only one of the options — including the instruction above them.
 *  - A scrolling list, not a fixed set: must survive 10+ languages at 360dp and 200% font scale.
 *  - Catalogue is Ops-configured and served by GET /config; the bundled list below is only the
 *    offline fallback so a first launch with no connectivity still works.
 *  - Stored device-locally immediately (no user exists yet), written to the server on login.
 */
import React, { useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, radius, spacing } from '../../theme';
import { Button, Icon, Text } from '../../components';
import { storage } from '../../store/storage';
import { useConfigQuery } from '../../api';

export type LanguageOption = { tag: string; native: string; latin: string };

/**
 * Bundled fallback. Ordered per PRD §4.0: device locale first (applied at runtime), then
 * Hindi and English always visible without scrolling, then the Ops order.
 */
const FALLBACK_LANGUAGES: LanguageOption[] = [
  { tag: 'hi-IN', native: 'हिन्दी', latin: 'Hindi' },
  { tag: 'en-IN', native: 'English', latin: 'English' },
  { tag: 'mr-IN', native: 'मराठी', latin: 'Marathi' },
];

export const LANGUAGE_KEY = 'language';

export function getStoredLanguage(): string | null {
  return storage.getString(LANGUAGE_KEY) ?? null;
}

export function LanguageScreen({ onDone }: { onDone: (tag: string) => void }) {
  const insets = useSafeAreaInsets();
  const { data: config } = useConfigQuery();
  const [selected, setSelected] = useState<string | null>(null);

  /**
   * Only offer a language once app-UI coverage is complete — partial translation is a worse
   * experience than not offering it. The server's supportedLocales is that gate.
   */
  const languages: LanguageOption[] = (() => {
    const supported = config?.supported_locales;
    if (!supported?.length) return FALLBACK_LANGUAGES;
    const known = new Map(FALLBACK_LANGUAGES.map(l => [l.tag, l]));
    return supported.map(tag => known.get(tag) ?? { tag, native: tag, latin: tag });
  })();

  const confirm = () => {
    if (!selected) return;
    storage.set(LANGUAGE_KEY, selected);
    onDone(selected);
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.surface, paddingTop: insets.top + spacing.s24 }}>
      <View style={{ paddingHorizontal: spacing.s24, gap: spacing.s6, paddingBottom: spacing.s20 }}>
        {/* Deliberately short and in both scripts: the instruction must not be the barrier. */}
        <Text variant="screenTitle">भाषा चुनें</Text>
        <Text variant="bodyLarge" color={colors.textTertiary}>Choose your language</Text>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: spacing.s24, gap: spacing.s12, paddingBottom: spacing.s24 }}>
        {languages.map(lang => {
          const active = lang.tag === selected;
          return (
            <Pressable
              key={lang.tag}
              onPress={() => setSelected(lang.tag)}
              accessibilityRole="radio"
              accessibilityState={{ selected: active }}
              accessibilityLabel={`${lang.native}. ${lang.latin}`}
              style={{
                minHeight: 64,
                borderRadius: radius.m,
                borderWidth: active ? 2 : 1,
                borderColor: active ? colors.primary100 : colors.border,
                paddingHorizontal: spacing.m - (active ? 1 : 0),
                flexDirection: 'row',
                alignItems: 'center',
                gap: spacing.s12,
                backgroundColor: active ? colors.primary10 : colors.surface,
              }}
            >
              <View style={{ flex: 1 }}>
                {/* Native script FIRST and larger — the whole point of this screen. */}
                <Text variant="sectionHeading">{lang.native}</Text>
                <Text variant="meta" color={colors.textTertiary}>{lang.latin}</Text>
              </View>
              {active ? <Icon name="CheckCircle" size={24} color={colors.primary100} /> : null}
            </Pressable>
          );
        })}
      </ScrollView>

      <View style={{ padding: spacing.s24, paddingBottom: insets.bottom + spacing.m }}>
        <Button label="Continue" onPress={confirm} disabled={!selected} fullWidth />
      </View>
    </View>
  );
}
