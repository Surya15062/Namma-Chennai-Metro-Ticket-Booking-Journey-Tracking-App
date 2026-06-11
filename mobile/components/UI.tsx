import React from 'react';
import { View, Text, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { DarkColors, LightColors, Radius, Spacing, Shadow, Typography } from '@/constants/theme';
import { useUserStore } from '@/store';

// Helper hook for functional components
export const useThemeColors = () => {
  const { isDark } = useUserStore();
  return isDark ? DarkColors : LightColors;
};

interface CardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  variant?: 'default' | 'accent' | 'green' | 'blue' | 'outlined';
}

export const Card: React.FC<CardProps> = ({ children, style, variant = 'default' }) => {
  const Colors = useThemeColors();
  const { isDark } = useUserStore();

  const getVariantStyles = () => {
    switch (variant) {
      case 'outlined':
        return { backgroundColor: 'transparent', borderWidth: 1, borderColor: Colors.border };
      case 'accent':
        return {
          backgroundColor: isDark ? 'rgba(255,10,84,0.08)' : 'rgba(255,10,84,0.05)',
          borderColor: 'rgba(255,10,84,0.2)', borderWidth: 1,
        };
      case 'green':
        return { backgroundColor: Colors.greenDim, borderColor: Colors.greenLine, borderWidth: 1 };
      case 'blue':
        return { backgroundColor: Colors.blueDim,  borderColor: Colors.blueLine,  borderWidth: 1 };
      default:
        return {
          backgroundColor: Colors.bgSurface,
          borderColor: Colors.border, borderWidth: 1,
        };
    }
  };

  return (
    <View style={[styles.card, getVariantStyles(), Shadow.card, style]}>
      {children}
    </View>
  );
};

// ── Section Header ────────────────────────────────────────────
interface SectionHeaderProps {
  title: string;
  action?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({ title, action, style }) => {
  const Colors = useThemeColors();
  return (
    <View style={[styles.sectionHeader, style]}>
      <Text style={[styles.sectionTitle, { color: Colors.textMuted }]}>{title}</Text>
      {action}
    </View>
  );
};

// ── Line Dot ──────────────────────────────────────────────────
interface LineDotProps {
  line?: 'Green' | 'Blue' | 'interchange';
  size?: number;
  style?: StyleProp<ViewStyle>;
}

export const LineDot: React.FC<LineDotProps> = ({ line = 'Green', size = 10, style }) => {
  const Colors = useThemeColors();
  const color = {
    Green:       Colors.greenLine,
    Blue:        Colors.blueLine,
    interchange: Colors.interchange,
  }[line];

  return (
    <View style={[{
      width: size,
      height: size,
      borderRadius: size / 2,
      backgroundColor: color,
      // No glow — clean solid dot
    }, style]} />
  );
};

// ── Live Indicator ────────────────────────────────────────────
export const LiveIndicator: React.FC = () => {
  const Colors = useThemeColors();
  return (
    <View style={[styles.liveContainer, {
      backgroundColor: Colors.success + '18',
      borderColor: Colors.success + '44',
    }]}>
      <View style={[styles.liveDot, { backgroundColor: Colors.success }]} />
      <Text style={[styles.liveText, { color: Colors.success }]}>LIVE</Text>
    </View>
  );
};

// ── Skeleton ──────────────────────────────────────────────────
interface SkeletonProps {
  width?: number | string;
  height?: number;
  style?: StyleProp<ViewStyle>;
}

export const Skeleton: React.FC<SkeletonProps> = ({ width = '100%', height = 20, style }) => {
  const Colors = useThemeColors();
  return (
    <View style={[{ width: width as any, height, backgroundColor: Colors.bgCardHover, borderRadius: Radius.sm }, style]} />
  );
};

// ── Divider ───────────────────────────────────────────────────
export const Divider: React.FC<{ style?: StyleProp<ViewStyle> }> = ({ style }) => {
  const Colors = useThemeColors();
  return (
    <View style={[styles.divider, { backgroundColor: Colors.border }, style]} />
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: Radius.lg,
    borderWidth: 1,
    padding: Spacing.xl,
    overflow: 'hidden',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: Typography.xs.fontSize,
    fontWeight: '800',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  // Live indicator: no glow, clean bordered pill
  liveContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.pill,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  liveText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  divider: {
    height: 1,
    marginVertical: Spacing.lg,
  },
});
