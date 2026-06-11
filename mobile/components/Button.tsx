import React, { useMemo } from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ViewStyle,
  StyleProp,
  ActivityIndicator,
  View,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { DarkColors, LightColors, Radius, Spacing } from '@/constants/theme';
import { useUserStore } from '@/store';

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'green';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  loading?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  icon?: string;
}

export const Button: React.FC<ButtonProps> = ({
  label, onPress, variant = 'primary', size = 'md',
  fullWidth = false, loading = false, disabled = false, style, icon
}) => {
  const { isDark } = useUserStore();
  const Colors = isDark ? DarkColors : LightColors;
  const styles = useMemo(() => getStyles(Colors), [isDark]);

  const scaleAnim = React.useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, { toValue: 0.96, useNativeDriver: true, speed: 50 }).start();
  };
  const handlePressOut = () => {
    Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, speed: 20 }).start();
  };

  const isDisabled = disabled || loading;

  const sizeStyle = {
    sm: { paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm, borderRadius: Radius.pill },
    md: { paddingHorizontal: Spacing.xl, paddingVertical: 13, borderRadius: Radius.md },
    lg: { paddingHorizontal: Spacing.xxl, paddingVertical: 16, borderRadius: Radius.md },
  }[size];

  const textSize = {
    sm: { fontSize: 13 },
    md: { fontSize: 15 },
    lg: { fontSize: 17 },
  }[size];

  const labelText = `${icon ? `${icon} ` : ''}${label}`;

  // ── Primary: brand accent gradient ──────────────────────────────
  if (variant === 'primary') {
    return (
      <Animated.View style={[fullWidth && styles.fullWidth, { opacity: isDisabled ? 0.55 : 1 }, { transform: [{ scale: scaleAnim }] }, style]}>
        <TouchableOpacity
          onPress={onPress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          disabled={isDisabled}
          activeOpacity={1}
          style={[fullWidth && styles.fullWidth]}
        >
          <LinearGradient
            colors={['#FF0A54', '#C9003D']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.base, sizeStyle, fullWidth && styles.fullWidth]}
          >
            {loading
              ? <ActivityIndicator size="small" color="#FFFFFF" />
              : <Text style={[styles.primaryText, textSize]}>{labelText}</Text>
            }
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
    );
  }

  // ── Green: success solid ─────────────────────────────────────────
  if (variant === 'green') {
    return (
      <Animated.View style={[fullWidth && styles.fullWidth, { opacity: isDisabled ? 0.55 : 1 }, { transform: [{ scale: scaleAnim }] }, style]}>
        <TouchableOpacity
          onPress={onPress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          disabled={isDisabled}
          activeOpacity={0.9}
          style={[fullWidth && styles.fullWidth]}
        >
          <View style={[styles.base, sizeStyle, fullWidth && styles.fullWidth, { backgroundColor: Colors.success }]}>
            {loading
              ? <ActivityIndicator size="small" color="#FFFFFF" />
              : <Text style={[styles.primaryText, textSize]}>{labelText}</Text>
            }
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  }

  // ── Secondary / Danger / Ghost ───────────────────────────────────
  const variantStyle = {
    secondary: {
      backgroundColor: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.05)',
      borderWidth: 1,
      borderColor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.1)',
    },
    danger: {
      backgroundColor: 'rgba(239,68,68,0.1)',
      borderWidth: 1,
      borderColor: 'rgba(239,68,68,0.25)',
    },
    ghost: { backgroundColor: 'transparent' },
  }[variant as 'secondary' | 'danger' | 'ghost'];

  const textVariantStyle = {
    secondary: { color: Colors.textPrimary },
    danger:    { color: Colors.danger },
    ghost:     { color: Colors.textSecondary },
  }[variant as 'secondary' | 'danger' | 'ghost'];

  return (
    <Animated.View style={[
      fullWidth && styles.fullWidth,
      isDisabled && { opacity: 0.5 },
      { transform: [{ scale: scaleAnim }] },
      style,
    ]}>
      <TouchableOpacity
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={isDisabled}
        activeOpacity={0.9}
        style={[
          styles.base,
          variantStyle,
          sizeStyle,
          fullWidth && styles.fullWidth,
        ]}
      >
        {loading ? (
          <ActivityIndicator size="small" color={variant === 'danger' ? Colors.danger : Colors.textPrimary} />
        ) : (
          <Text style={[styles.text, textVariantStyle, textSize]}>
            {labelText}
          </Text>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
};

const getStyles = (Colors: any) => StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  fullWidth: {
    width: '100%',
  },
  primaryText: {
    color: '#FFFFFF',
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  text: {
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});
