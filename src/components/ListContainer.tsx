/**
 * Component C9 — a bordered container whose children are separated by row hairlines
 * (`inset 0 -1px 0 #F2F2F2` in the design; a bottom border here).
 */
import React from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';
import { colors, radius } from '../theme';

export function ListContainer({ children, style }: { children: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  const items = React.Children.toArray(children).filter(Boolean);
  return (
    <View
      style={[
        { backgroundColor: colors.surface, borderRadius: radius.m, borderWidth: 1, borderColor: colors.border, overflow: 'hidden' },
        style,
      ]}
    >
      {items.map((child, i) => (
        <View
          key={i}
          style={i < items.length - 1 ? { borderBottomWidth: 1, borderBottomColor: colors.sunken } : undefined}
        >
          {child}
        </View>
      ))}
    </View>
  );
}
