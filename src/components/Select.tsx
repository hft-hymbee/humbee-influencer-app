/**
 * `Select` — the design system's **Drop Down**, used once: "Select SKU" on Capture Demand.
 *
 * NOT a bottom sheet. The library's variants are `Close` · `Open` · `Open with Search`, and
 * `Drop down item` is `Enabled` · `Hover` (docs/design-system/HUMBEE-DESIGN-RULES.md §4.2) —
 * i.e. a panel that hangs off the bottom of the field, with the field's bottom corners squared
 * so the two read as one control. The sibling VCP app implements the same control the same way
 * (`humbee-mobile-app/src/app_V3/UiKit/organisms/CustomDropDown.tsx`).
 *
 * The panel is drawn in a transparent `Modal` positioned over the measured field rather than
 * absolutely inside the card, because an absolute child that overflows its parent is clipped
 * unpredictably on Android inside a ScrollView.
 */
import React, { useMemo, useRef, useState } from 'react';
import {
  Dimensions, Modal, Pressable, ScrollView, StyleSheet, TextInput, View, type LayoutRectangle,
} from 'react-native';
import { colors, hitSlopFor, MIN_TAP, radius, spacing, typography } from '../theme';
import { Text } from './Text';
import { Icon } from './Icon';

export type SelectOption = { value: number | string; label: string };

/** `maxHeight` in the DS implementation. Roughly four rows, then the list scrolls. */
const PANEL_MAX_HEIGHT = 200;

export function Select({
  label, placeholder, options, value, onChange, searchable = false, searchPlaceholder = 'Search',
}: {
  label: string;
  placeholder: string;
  options: SelectOption[];
  value: number | string | null;
  onChange: (v: number | string) => void;
  /** `Open with Search`. The SKU list can run long, so Capture Demand turns this on. */
  searchable?: boolean;
  searchPlaceholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [anchor, setAnchor] = useState<LayoutRectangle | null>(null);
  const fieldRef = useRef<React.ComponentRef<typeof View>>(null);
  const selected = options.find(o => o.value === value);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? options.filter(o => o.label.toLowerCase().includes(q)) : options;
  }, [options, query]);

  function openPanel() {
    fieldRef.current?.measureInWindow((x, y, width, height) => {
      setAnchor({ x, y, width, height });
      setQuery('');
      setOpen(true);
    });
  }

  function close() {
    setOpen(false);
    setQuery('');
  }

  // Flip above the field when there is not enough room below it.
  const screenH = Dimensions.get('window').height;
  const below = anchor ? screenH - (anchor.y + anchor.height) : 0;
  const flip = anchor ? below < 160 : false;

  return (
    <View style={styles.block}>
      <Text variant="bodyBold" color={colors.textSecondary}>{label}</Text>
      <View ref={fieldRef} collapsable={false}>
        <Pressable
          onPress={openPanel}
          hitSlop={hitSlopFor(MIN_TAP)}
          accessibilityRole="button"
          accessibilityState={{ expanded: open }}
          accessibilityLabel={`${label}. ${selected ? selected.label : placeholder}`}
          style={[styles.field, open ? (flip ? styles.fieldOpenUp : styles.fieldOpenDown) : null]}
        >
          <Text
            variant="bodyLarge"
            color={selected ? colors.textPrimary : colors.textTertiary}
            numberOfLines={1}
            style={styles.fieldText}
          >
            {selected ? selected.label : placeholder}
          </Text>
          <Icon name={open ? 'ChevronUp' : 'ChevronDown'} size={20} color={colors.textTertiary} />
        </Pressable>
      </View>

      <Modal visible={open} transparent animationType="none" onRequestClose={close}>
        {/* Tapping anywhere off the panel closes it — the DS dropdown has no scrim. */}
        <Pressable style={styles.backdrop} onPress={close} />
        {anchor ? (
          <View
            style={[
              styles.panel,
              flip ? styles.panelUp : styles.panelDown,
              {
                left: anchor.x,
                width: anchor.width,
                // Flipped, the panel's BOTTOM is pinned to the field's top so a short list
                // does not float away from the control.
                ...(flip
                  ? { bottom: screenH - anchor.y, maxHeight: PANEL_MAX_HEIGHT }
                  : { top: anchor.y + anchor.height, maxHeight: PANEL_MAX_HEIGHT }),
              },
            ]}
          >
            {searchable ? (
              <View style={styles.searchRow}>
                <TextInput
                  value={query}
                  onChangeText={setQuery}
                  placeholder={searchPlaceholder}
                  placeholderTextColor={colors.textTertiary}
                  autoFocus
                  style={styles.searchInput}
                />
              </View>
            ) : null}

            <ScrollView keyboardShouldPersistTaps="handled">
              {filtered.length === 0 ? (
                <View style={styles.empty}>
                  <Text variant="body" color={colors.textTertiary}>No matching SKU</Text>
                </View>
              ) : (
                filtered.map(opt => {
                  const active = opt.value === value;
                  return (
                    <Pressable
                      key={String(opt.value)}
                      onPress={() => { onChange(opt.value); close(); }}
                      accessibilityRole="button"
                      accessibilityState={{ selected: active }}
                      style={[styles.item, active ? styles.itemActive : null]}
                    >
                      <Text variant={active ? 'rowTitle' : 'bodyLarge'} numberOfLines={1} style={styles.itemText}>
                        {opt.label}
                      </Text>
                      {active ? <Icon name="CheckCircle" size={20} color={colors.primary100} /> : null}
                    </Pressable>
                  );
                })
              )}
            </ScrollView>
          </View>
        ) : null}
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  block: { gap: spacing.s6 },
  field: {
    minHeight: MIN_TAP,
    borderRadius: radius.m,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.s12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.s,
  },
  // Open: the field and the panel are one control, so the joined edge loses its radius.
  fieldOpenDown: { borderColor: colors.textPrimary, borderBottomLeftRadius: 0, borderBottomRightRadius: 0 },
  fieldOpenUp: { borderColor: colors.textPrimary, borderTopLeftRadius: 0, borderTopRightRadius: 0 },
  fieldText: { flex: 1 },
  backdrop: { flex: 1 },
  panel: {
    position: 'absolute',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.textPrimary,
    overflow: 'hidden',
  },
  panelDown: {
    borderTopWidth: 0,
    borderBottomLeftRadius: radius.m,
    borderBottomRightRadius: radius.m,
  },
  panelUp: {
    borderBottomWidth: 0,
    borderTopLeftRadius: radius.m,
    borderTopRightRadius: radius.m,
  },
  searchRow: {
    paddingHorizontal: spacing.s,
    paddingVertical: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.sunken,
  },
  searchInput: {
    height: 36,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.s,
    paddingHorizontal: spacing.s,
    color: colors.textPrimary,
    ...typography.body,
  },
  item: {
    minHeight: 44,
    paddingHorizontal: spacing.s12,
    paddingVertical: spacing.s,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.s10,
  },
  itemActive: { backgroundColor: colors.primary10 },
  itemText: { flex: 1 },
  empty: { padding: spacing.m, alignItems: 'center' },
});
