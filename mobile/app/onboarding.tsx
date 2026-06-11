import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ImageBackground,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { DarkColors, LightColors, Spacing, Radius } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { useUserStore } from '@/store';

export default function OnboardingScreen() {
  const router = useRouter();
  const { setUser, isDark, toggleTheme } = useUserStore();
  const Colors = isDark ? DarkColors : LightColors;
  const styles = useMemo(() => getStyles(Colors, isDark), [isDark]);

  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [error, setError] = useState('');
  const [nameFocused, setNameFocused] = useState(false);
  const [ageFocused, setAgeFocused] = useState(false);

  const handleContinue = () => {
    setError('');
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError('Please tell us your name.');
      return;
    }
    if (!age || isNaN(Number(age)) || Number(age) < 5 || Number(age) > 120) {
      setError('Please enter a valid age (5 – 120).');
      return;
    }
    setUser(trimmedName, age);
    router.replace('/splash');
  };

  /* ── Shared inner content (card + form) ───────────────────── */
  const innerContent = (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      {/* Theme toggle – top-right */}
      <TouchableOpacity
        style={styles.themeToggle}
        onPress={toggleTheme}
        activeOpacity={0.75}
        accessibilityLabel="Toggle theme"
      >
        <Ionicons
          name={isDark ? 'sunny' : 'moon'}
          size={20}
          color={isDark ? '#FDFDFD' : '#0F172A'}
        />
      </TouchableOpacity>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.brandPill}>
              <Ionicons name="subway" size={12} color={Colors.accent} style={{ marginRight: 6 }} />
              <Text style={[styles.brand, { color: Colors.accent }]}>NAMMA CHENNAI METRO</Text>
            </View>
            <Text style={[styles.title, { color: isDark ? Colors.white : Colors.textPrimary }]}>
              Let's get{'\n'}to know you!
            </Text>
            <Text style={[styles.subtitle, { color: isDark ? 'rgba(255,255,255,0.65)' : Colors.textSecondary }]}>
              Personalize your transit experience{'\n'}across Chennai.
            </Text>
          </View>

          {/* Form Card */}
          <View style={styles.formCard}>
            {/* Error banner */}
            {!!error && (
              <View style={styles.errorBanner}>
                <Ionicons name="alert-circle" size={16} color={Colors.danger} />
                <Text style={[styles.errorText, { color: Colors.danger }]}>{error}</Text>
              </View>
            )}

            {/* Name */}
            <View style={styles.inputContainer}>
              <Text style={[styles.label, { color: isDark ? 'rgba(255,255,255,0.8)' : Colors.textSecondary }]}>
                Your Name
              </Text>
              <View style={[
                styles.inputWrapper,
                { borderColor: nameFocused ? Colors.accent : Colors.border },
                { backgroundColor: isDark ? 'rgba(12, 6, 8, 0.75)' : Colors.bgInput },
              ]}>
                <Ionicons
                  name="person-outline"
                  size={18}
                  color={nameFocused ? Colors.accent : Colors.textMuted}
                  style={{ marginRight: 10 }}
                />
                <TextInput
                  style={[styles.input, { color: isDark ? Colors.white : Colors.textPrimary }]}
                  placeholder="e.g. Surya"
                  placeholderTextColor={Colors.textMuted}
                  value={name}
                  onChangeText={(text) => { setName(text); setError(''); }}
                  onFocus={() => setNameFocused(true)}
                  onBlur={() => setNameFocused(false)}
                  autoCapitalize="words"
                  autoCorrect={false}
                />
              </View>
            </View>

            {/* Age */}
            <View style={styles.inputContainer}>
              <Text style={[styles.label, { color: isDark ? 'rgba(255,255,255,0.8)' : Colors.textSecondary }]}>
                Your Age
              </Text>
              <View style={[
                styles.inputWrapper,
                { borderColor: ageFocused ? Colors.accent : Colors.border },
                { backgroundColor: isDark ? 'rgba(12, 6, 8, 0.75)' : Colors.bgInput },
              ]}>
                <Ionicons
                  name="calendar-outline"
                  size={18}
                  color={ageFocused ? Colors.accent : Colors.textMuted}
                  style={{ marginRight: 10 }}
                />
                <TextInput
                  style={[styles.input, { color: isDark ? Colors.white : Colors.textPrimary }]}
                  placeholder="Age"
                  placeholderTextColor={Colors.textMuted}
                  value={age}
                  onChangeText={(text) => { setAge(text.replace(/[^0-9]/g, '')); setError(''); }}
                  onFocus={() => setAgeFocused(true)}
                  onBlur={() => setAgeFocused(false)}
                  keyboardType="numeric"
                  maxLength={3}
                />
              </View>
            </View>

            {/* CTA */}
            <TouchableOpacity
              activeOpacity={0.88}
              onPress={handleContinue}
              style={styles.continueBtnWrapper}
            >
              <LinearGradient
                colors={['#FF0A54', '#C9003D']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.continueBtn}
              >
                <Text style={styles.continueBtnText}>Continue</Text>
                <Ionicons name="arrow-forward" size={20} color="#FFFFFF" style={{ marginLeft: 8 }} />
              </LinearGradient>
            </TouchableOpacity>

            {/* Footer note */}
            <Text style={[styles.footerNote, { color: isDark ? 'rgba(255,255,255,0.3)' : Colors.textMuted }]}>
              By continuing you agree to our Terms & Privacy Policy.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );

  /* ── Dark mode: full‑bleed photo + gradient overlay ─────── */
  if (isDark) {
    return (
      <ImageBackground
        source={{ uri: 'https://images.unsplash.com/photo-1548695679-8b067d7100b2?q=80&w=1000' }}
        style={{ flex: 1 }}
        resizeMode="cover"
      >
        <LinearGradient
          colors={['rgba(12, 6, 8, 0.55)', 'rgba(12, 6, 8, 0.92)', '#0C0608']}
          style={StyleSheet.absoluteFill}
        />
        {innerContent}
      </ImageBackground>
    );
  }

  /* ── Light mode: soft gradient background ─────────────────── */
  return (
    <LinearGradient
      colors={['#FCF7F8', '#FFF0F3', '#FCF7F8']}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={{ flex: 1 }}
    >
      {innerContent}
    </LinearGradient>
  );
}

/* ── Dynamic styles ─────────────────────────────────────────── */
const getStyles = (Colors: typeof DarkColors, isDark: boolean) =>
  StyleSheet.create({
    safe: { flex: 1 },

    themeToggle: {
      position: 'absolute',
      top: 56,
      right: Spacing.xl,
      zIndex: 100,
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)',
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)',
    },

    scrollContent: {
      flexGrow: 1,
      paddingHorizontal: Spacing.xl,
      paddingTop: Spacing.xxxl + Spacing.xxl,
      paddingBottom: Spacing.xl,
      justifyContent: 'center',
    },

    header: {
      marginBottom: Spacing.xxl,
    },

    brandPill: {
      alignSelf: 'flex-start',
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: isDark ? 'rgba(255, 10, 84, 0.15)' : 'rgba(255, 10, 84, 0.08)',
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: Radius.pill,
      marginBottom: Spacing.lg,
      borderWidth: 1,
      borderColor: isDark ? 'rgba(255, 10, 84, 0.30)' : 'rgba(255, 10, 84, 0.20)',
    },

    brand: {
      fontSize: 11,
      fontWeight: '800',
      letterSpacing: 2,
    },

    title: {
      fontSize: 38,
      fontWeight: '900',
      marginBottom: Spacing.sm,
      letterSpacing: -0.8,
      lineHeight: 44,
    },

    subtitle: {
      fontSize: 15,
      lineHeight: 23,
    },

    /* Card */
    formCard: {
      backgroundColor: isDark ? 'rgba(20, 14, 16, 0.78)' : Colors.bgSurface,
      padding: Spacing.xl,
      borderRadius: Radius.xl,
      borderWidth: 1,
      borderColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(255, 10, 84, 0.10)',
      shadowColor: isDark ? '#000' : '#FF0A54',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: isDark ? 0.30 : 0.08,
      shadowRadius: 24,
      elevation: isDark ? 8 : 4,
    },

    /* Error */
    errorBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      backgroundColor: isDark ? 'rgba(239,68,68,0.12)' : 'rgba(220,38,38,0.06)',
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.sm + 2,
      borderRadius: Radius.sm,
      borderWidth: 1,
      borderColor: isDark ? 'rgba(239,68,68,0.25)' : 'rgba(220,38,38,0.18)',
      marginBottom: Spacing.lg,
    },
    errorText: {
      fontSize: 13,
      fontWeight: '600',
      flex: 1,
    },

    /* Inputs */
    inputContainer: {
      marginBottom: Spacing.lg,
    },
    label: {
      fontSize: 12,
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: 1,
      marginBottom: Spacing.sm,
    },
    inputWrapper: {
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 1.5,
      borderRadius: Radius.lg,
      paddingHorizontal: Spacing.lg,
      paddingVertical: 14,
    },
    input: {
      flex: 1,
      fontSize: 17,
      fontWeight: '500',
      padding: 0,          // remove default padding on Android
      margin: 0,
    },

    /* CTA */
    continueBtnWrapper: {
      marginTop: Spacing.md,
      borderRadius: Radius.pill,
      shadowColor: '#FF0A54',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.35,
      shadowRadius: 20,
      elevation: 8,
    },
    continueBtn: {
      flexDirection: 'row',
      paddingVertical: 18,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: Radius.pill,
    },
    continueBtnText: {
      color: '#FFFFFF',
      fontSize: 17,
      fontWeight: '800',
      letterSpacing: 0.5,
    },

    footerNote: {
      marginTop: Spacing.lg,
      fontSize: 12,
      textAlign: 'center',
      lineHeight: 18,
    },
  });
