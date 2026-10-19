import React, { ReactNode } from 'react';
import { Pressable, Text, View } from 'react-native';
import { styles as s, colors } from './theme';
export function Button({
  label,
  onPress,
  secondary = false,
  disabled = false,
  testID,
}: {
  label: string;
  onPress: () => void;
  secondary?: boolean;
  disabled?: boolean;
  testID?: string;
}) {
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        s.button,
        secondary && s.secondary,
        { opacity: disabled ? 0.45 : pressed ? 0.75 : 1 },
      ]}
    >
      <Text style={[s.buttonText, secondary && s.secondaryText]}>{label}</Text>
    </Pressable>
  );
}
export function Card({ children }: { children: ReactNode }) {
  return <View style={s.card}>{children}</View>;
}
export function Meter({ value, total, label }: { value: number; total: number; label: string }) {
  return (
    <View
      accessible
      accessibilityLabel={`${label}: ${value} / ${total}`}
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: total, now: value }}
      style={{ gap: 8 }}
    >
      <View style={s.spread}>
        <Text style={s.muted}>{label}</Text>
        <Text style={s.muted}>
          {value} / {total}
        </Text>
      </View>
      <View style={s.bar}>
        <View style={[s.fill, { width: `${total ? Math.min(100, (value / total) * 100) : 0}%` }]} />
      </View>
    </View>
  );
}
export function Stat({
  value,
  label,
  light = false,
}: {
  value: number | string;
  label: string;
  light?: boolean;
}) {
  return (
    <View style={{ gap: 4, flex: 1, minWidth: 80 }}>
      <Text style={[s.title, light && { color: '#FFFFFF' }]}>{value}</Text>
      <Text style={[s.muted, light && { color: '#E6EEE5' }]}>{label}</Text>
    </View>
  );
}
export function Choice({
  label,
  selected,
  onPress,
  disabled = false,
  testID,
}: {
  label: string;
  selected?: boolean;
  onPress: () => void;
  disabled?: boolean;
  testID?: string;
}) {
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityState={{ selected, disabled }}
      disabled={disabled}
      onPress={onPress}
      style={[s.option, selected && s.selected]}
    >
      <Text style={[s.body, selected && { color: colors.green, fontWeight: '700' }]}>{label}</Text>
    </Pressable>
  );
}
