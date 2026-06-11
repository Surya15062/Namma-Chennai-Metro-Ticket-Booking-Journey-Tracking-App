import React, { useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Modal,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { DarkColors, LightColors, Spacing, Radius } from '@/constants/theme';
import { useUserStore, useLanguageStore } from '@/store';
import type { AppLanguage } from '@/store';

// ─── Language Data ────────────────────────────────────────────────────────────

type LanguageOption = {
  id: AppLanguage;
  nativeName: string;    // Name in its own script
  englishName: string;   // Name in English
  script: string;        // Sample script preview
  region: string;        // Region hint
  flag: string;          // Emoji flag
};

const LANGUAGES: LanguageOption[] = [
  {
    id: 'English',
    nativeName: 'English',
    englishName: 'English',
    script: 'Welcome to Namma Chennai Metro',
    region: 'Global',
    flag: '🇬🇧',
  },
  {
    id: 'Tamil',
    nativeName: 'தமிழ்',
    englishName: 'Tamil',
    script: 'நம்ம சென்னை மெட்ரோவிற்கு வரவேற்கிறோம்',
    region: 'Tamil Nadu',
    flag: '🇮🇳',
  },
  {
    id: 'Malayalam',
    nativeName: 'മലയാളം',
    englishName: 'Malayalam',
    script: 'ചെന്നൈ മെട്രോയിലേക്ക് സ്വാഗതം',
    region: 'Kerala',
    flag: '🇮🇳',
  },
  {
    id: 'Telugu',
    nativeName: 'తెలుగు',
    englishName: 'Telugu',
    script: 'నమ్మ చెన్నై మెట్రోకు స్వాగతం',
    region: 'Andhra Pradesh & Telangana',
    flag: '🇮🇳',
  },
  {
    id: 'Kannada',
    nativeName: 'ಕನ್ನಡ',
    englishName: 'Kannada',
    script: 'ನಮ್ಮ ಚೆನ್ನೈ ಮೆಟ್ರೋಗೆ ಸ್ವಾಗತ',
    region: 'Karnataka',
    flag: '🇮🇳',
  },
];

// ─── Animated Language Row ────────────────────────────────────────────────────

function LanguageRow({
  option,
  isSelected,
  onSelect,
  isLast,
  Colors,
  isDark,
}: {
  option: LanguageOption;
  isSelected: boolean;
  onSelect: () => void;
  isLast: boolean;
  Colors: typeof DarkColors;
  isDark: boolean;
}) {
  const scale = useRef(new Animated.Value(1)).current;
  const pressIn = () =>
    Animated.spring(scale, { toValue: 0.97, useNativeDriver: true, speed: 50 }).start();
  const pressOut = () =>
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 20 }).start();

  return (
    <>
      <Animated.View style={{ transform: [{ scale }] }}>
        <TouchableOpacity
          style={styles.langRow}
          onPress={onSelect}
          onPressIn={pressIn}
          onPressOut={pressOut}
          activeOpacity={0.9}
        >
          {/* Flag & native name block */}
          <View
            style={[
              styles.langFlagWrap,
              {
                backgroundColor: isSelected
                  ? 'rgba(255,10,84,0.12)'
                  : Colors.bgInput,
                borderColor: isSelected
                  ? 'rgba(255,10,84,0.3)'
                  : Colors.border,
              },
            ]}
          >
            <Text style={styles.langFlag}>{option.flag}</Text>
          </View>

          {/* Text block */}
          <View style={styles.langTextWrap}>
            <View style={styles.langNameRow}>
              <Text style={[styles.langNative, { color: Colors.textPrimary }]}>
                {option.nativeName}
              </Text>
              {option.id !== 'English' && (
                <Text style={[styles.langEnglish, { color: Colors.textMuted }]}>
                  {' · '}
                  {option.englishName}
                </Text>
              )}
            </View>
            <Text
              style={[styles.langScript, { color: Colors.textMuted }]}
              numberOfLines={1}
            >
              {option.script}
            </Text>
            <Text style={[styles.langRegion, { color: Colors.textMuted }]}>
              <Ionicons name="location-outline" size={10} />
              {'  '}
              {option.region}
            </Text>
          </View>

          {/* Radio */}
          <View
            style={[
              styles.radioCircle,
              {
                borderColor: isSelected ? Colors.accent : Colors.border,
              },
            ]}
          >
            {isSelected && (
              <View
                style={[styles.radioFill, { backgroundColor: Colors.accent }]}
              />
            )}
          </View>
        </TouchableOpacity>
      </Animated.View>
      {!isLast && (
        <View
          style={[
            styles.divider,
            {
              backgroundColor: Colors.border,
              marginLeft: 16 + 48 + 12,
            },
          ]}
        />
      )}
    </>
  );
}

// ─── Confirm Modal ────────────────────────────────────────────────────────────

function ConfirmModal({
  visible,
  option,
  onConfirm,
  onCancel,
  Colors,
}: {
  visible: boolean;
  option: LanguageOption | null;
  onConfirm: () => void;
  onCancel: () => void;
  Colors: typeof DarkColors;
}) {
  if (!option) return null;
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <Pressable style={cm.overlay} onPress={onCancel}>
        <Pressable
          style={[cm.card, { backgroundColor: Colors.bgSurface, borderColor: Colors.border }]}
          onPress={() => {}}
        >
          <Text style={cm.emoji}>{option.flag}</Text>
          <Text style={[cm.title, { color: Colors.textPrimary }]}>
            Change Language?
          </Text>
          <Text style={[cm.nativeName, { color: Colors.accent }]}>
            {option.nativeName}
          </Text>
          <Text style={[cm.subtitle, { color: Colors.textMuted }]}>
            The app will switch to {option.englishName}.{'\n'}
            Some labels may restart on next open.
          </Text>
          <View style={cm.btnRow}>
            <TouchableOpacity
              style={[cm.btn, cm.cancelBtn, { borderColor: Colors.border, backgroundColor: Colors.bgInput }]}
              onPress={onCancel}
              activeOpacity={0.8}
            >
              <Text style={[cm.btnText, { color: Colors.textSecondary }]}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[cm.btn, { backgroundColor: Colors.accent }]}
              onPress={onConfirm}
              activeOpacity={0.8}
            >
              <Text style={[cm.btnText, { color: '#FFF' }]}>Apply</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
const cm = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  card: {
    width: '100%',
    borderRadius: 24,
    padding: Spacing.xl,
    alignItems: 'center',
    borderWidth: 1,
    gap: 6,
  },
  emoji: { fontSize: 40, marginBottom: 4 },
  title: { fontSize: 18, fontWeight: '800', letterSpacing: -0.3 },
  nativeName: { fontSize: 22, fontWeight: '900', letterSpacing: -0.5 },
  subtitle: {
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 19,
    marginTop: 4,
  },
  btnRow: { flexDirection: 'row', gap: 10, marginTop: 16, width: '100%' },
  btn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: Radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtn: { borderWidth: 1 },
  btnText: { fontSize: 15, fontWeight: '700' },
});

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function AppLanguageScreen() {
  const router = useRouter();
  const { isDark } = useUserStore();
  const { language, setLanguage } = useLanguageStore();
  const Colors = isDark ? DarkColors : LightColors;

  const [pending, setPending] = useState<LanguageOption | null>(null);
  const [confirmVisible, setConfirmVisible] = useState(false);

  const currentOption = LANGUAGES.find((l) => l.id === language) ?? LANGUAGES[0];

  const handleRowPress = (option: LanguageOption) => {
    if (option.id === language) return; // already selected
    setPending(option);
    setConfirmVisible(true);
  };

  const handleConfirm = () => {
    if (pending) setLanguage(pending.id);
    setConfirmVisible(false);
    setPending(null);
  };

  const handleCancel = () => {
    setConfirmVisible(false);
    setPending(null);
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: Colors.bgBase }]} edges={['top']}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: Colors.bgInput }]} activeOpacity={0.8}>
          <Ionicons name="arrow-back" size={22} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: Colors.textPrimary }]}>App Language</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>

        {/* ── Current language hero ── */}
        <LinearGradient
          colors={
            isDark
              ? ['rgba(255,10,84,0.16)', 'rgba(255,10,84,0.04)']
              : ['rgba(255,10,84,0.08)', 'rgba(255,10,84,0.01)']
          }
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[
            styles.heroCard,
            {
              borderColor: isDark
                ? 'rgba(255,10,84,0.18)'
                : 'rgba(255,10,84,0.1)',
            },
          ]}
        >
          <Text style={styles.currentFlag}>{currentOption.flag}</Text>
          <View style={styles.heroText}>
            <Text style={[styles.heroNative, { color: Colors.textPrimary }]}>
              {currentOption.nativeName}
            </Text>
            <Text style={[styles.heroSublabel, { color: Colors.textMuted }]}>
              Currently active language
            </Text>
          </View>
          <View style={[styles.activePill, { backgroundColor: Colors.accent }]}>
            <Ionicons name="checkmark" size={12} color="#FFF" />
            <Text style={styles.activePillText}>Active</Text>
          </View>
        </LinearGradient>

        {/* ── Note ── */}
        <View
          style={[
            styles.infoNote,
            {
              backgroundColor: isDark
                ? 'rgba(245,158,11,0.1)'
                : 'rgba(217,119,6,0.07)',
              borderColor: isDark
                ? 'rgba(245,158,11,0.2)'
                : 'rgba(217,119,6,0.15)',
            },
          ]}
        >
          <Ionicons name="information-circle-outline" size={16} color={Colors.warning} />
          <Text style={[styles.infoNoteText, { color: Colors.warning }]}>
            Language change applies to UI labels. Content may require an app restart.
          </Text>
        </View>

        {/* ── Language list ── */}
        <View style={styles.sectionWrap}>
          <Text style={[styles.sectionLabel, { color: Colors.textMuted }]}>
            SELECT LANGUAGE
          </Text>
          <View
            style={[
              styles.card,
              { backgroundColor: Colors.bgSurface, borderColor: Colors.border },
            ]}
          >
            {LANGUAGES.map((option, idx) => (
              <LanguageRow
                key={option.id}
                option={option}
                isSelected={language === option.id}
                onSelect={() => handleRowPress(option)}
                isLast={idx === LANGUAGES.length - 1}
                Colors={Colors}
                isDark={isDark}
              />
            ))}
          </View>
        </View>

        {/* ── Footer ── */}
        <Text style={[styles.footerNote, { color: Colors.textMuted }]}>
          Namma Chennai Metro supports 5 South Indian languages.
          {'\n'}More languages coming soon.
        </Text>

        <View style={{ height: 48 }} />
      </ScrollView>

      {/* ── Confirm modal ── */}
      <ConfirmModal
        visible={confirmVisible}
        option={pending}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
        Colors={Colors}
      />
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    paddingTop: Spacing.lg,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
  },

  // Hero
  heroCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.sm,
    marginBottom: Spacing.lg,
    padding: Spacing.lg,
    borderRadius: Radius.lg,
    borderWidth: 1,
    gap: Spacing.md,
  },
  currentFlag: { fontSize: 36 },
  heroText: { flex: 1 },
  heroNative: { fontSize: 20, fontWeight: '800', letterSpacing: -0.3 },
  heroSublabel: { fontSize: 12, fontWeight: '500', marginTop: 2 },
  activePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radius.pill,
  },
  activePillText: { fontSize: 11, fontWeight: '800', color: '#FFF' },

  // Info note
  infoNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginHorizontal: Spacing.lg,
    padding: 12,
    borderRadius: Radius.md,
    borderWidth: 1,
    marginBottom: Spacing.lg,
  },
  infoNoteText: { flex: 1, fontSize: 12, fontWeight: '500', lineHeight: 17 },

  // Section
  sectionWrap: { paddingHorizontal: Spacing.lg, marginBottom: Spacing.xl },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.5,
    marginBottom: 10,
    marginLeft: 4,
  },
  card: {
    borderRadius: Radius.lg,
    borderWidth: 1,
    overflow: 'hidden',
  },

  // Language row
  langRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  langFlagWrap: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
  },
  langFlag: { fontSize: 24 },
  langTextWrap: { flex: 1 },
  langNameRow: { flexDirection: 'row', alignItems: 'baseline', flexWrap: 'wrap' },
  langNative: { fontSize: 16, fontWeight: '700' },
  langEnglish: { fontSize: 13, fontWeight: '500' },
  langScript: { fontSize: 12, fontWeight: '400', marginTop: 3, fontStyle: 'italic' },
  langRegion: { fontSize: 11, fontWeight: '600', marginTop: 3, letterSpacing: 0.3 },
  radioCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioFill: { width: 10, height: 10, borderRadius: 5 },
  divider: { height: 1 },

  footerNote: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 18,
    marginHorizontal: Spacing.xl,
    marginBottom: Spacing.xl,
  },
});
