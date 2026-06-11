import React from 'react';
import { View, Text, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { Radius, Spacing, Typography } from '@/constants/theme';
import { useThemeColors } from './UI';

interface BadgeProps {
  label: string;
  variant?: 'success' | 'warning' | 'danger' | 'info' | 'accent' | 'green' | 'blue' | 'muted';
  style?: StyleProp<ViewStyle>;
}

export const Badge: React.FC<BadgeProps> = ({ label, variant = 'info', style }) => {
  const Colors = useThemeColors();

  const variantStyles = {
    success: { bg: Colors.success + '1A',   text: Colors.success,  border: Colors.success + '44'  },
    warning: { bg: Colors.warning + '1A',   text: Colors.warning,  border: Colors.warning + '44'  },
    danger:  { bg: Colors.danger  + '1A',   text: Colors.danger,   border: Colors.danger  + '44'  },
    info:    { bg: Colors.blueLine + '1A',  text: Colors.blueLine, border: Colors.blueLine + '44' },
    accent:  { bg: 'rgba(255,10,84,0.12)',  text: Colors.accent,   border: 'rgba(255,10,84,0.3)'  },
    green:   { bg: Colors.greenLine + '1A', text: Colors.greenLine,border: Colors.greenLine + '44'},
    blue:    { bg: Colors.blueLine + '1A',  text: Colors.blueLine, border: Colors.blueLine + '44' },
    muted:   { bg: Colors.bgInput,          text: Colors.textMuted,border: Colors.border          },
  }[variant];

  return (
    <View style={[
      styles.badge,
      { backgroundColor: variantStyles.bg, borderColor: variantStyles.border },
      style
    ]}>
      <Text style={[styles.text, { color: variantStyles.text }]}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 4,
    borderRadius: Radius.pill,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  text: {
    ...Typography.xs,
    fontWeight: '800',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
});
