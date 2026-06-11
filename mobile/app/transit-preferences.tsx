import React, { useMemo, useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  TextInput,
  Modal,
  Pressable,
  Animated,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { DarkColors, LightColors, Spacing, Radius } from '@/constants/theme';
import { useUserStore, useTransitStore } from '@/store';
import type { MetroLine, RoutePriority, CoachPreference } from '@/store';

// ─── Chennai Metro Station List ───────────────────────────────────────────────

const CHENNAI_METRO_STATIONS = [
  'Puratchi Thalaivi Dr. J. Jayalalithaa CMBT Metro',
  'Arignar Anna Alandur Metro',
  'Chennai International Airport',
  'Puratchi Thalaivar Dr. M.G. Ramachandran Central Metro',
  'Anna Nagar Tower',
  'Vadapalani',
  'Koyambedu',
  'Arumbakkam',
  'Vadapalani',
  'Ashok Nagar',
  'Ekkattuthangal',
  'Guindy',
  'Little Mount',
  'Saidapet',
  'Nandanam',
  'Teynampet',
  'AG-DMS',
  'Thousand Lights',
  'LIC',
  'Washermanpet',
  'Thirumangalam',
  'Nehru Park',
  'Kilpauk Medical College',
  'Pachaiyappas College',
  'Shenoy Nagar',
  'Anna Nagar East',
  'Thirumangalam',
];

// ─── Sub-Components ───────────────────────────────────────────────────────────

/** Section header row */
function SectionHeading({ title, icon, Colors, isDark }: {
  title: string;
  icon: keyof typeof Ionicons['glyphMap'];
  Colors: typeof DarkColors;
  isDark: boolean;
}) {
  return (
    <View style={sh.wrap}>
      <View style={[sh.iconPill, { backgroundColor: isDark ? 'rgba(255,10,84,0.15)' : 'rgba(255,10,84,0.1)' }]}>
        <Ionicons name={icon} size={15} color={Colors.accent} />
      </View>
      <Text style={[sh.title, { color: Colors.textMuted }]}>{title}</Text>
    </View>
  );
}
const sh = StyleSheet.create({
  wrap: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10, paddingLeft: 4 },
  iconPill: { width: 26, height: 26, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 11, fontWeight: '800', letterSpacing: 1.5, textTransform: 'uppercase' },
});

/** Animated chip button */
function ChipButton({ label, selected, color, onPress, Colors }: {
  label: string;
  selected: boolean;
  color: string;
  onPress: () => void;
  Colors: typeof DarkColors;
}) {
  const scale = useRef(new Animated.Value(1)).current;
  const pressIn = () => Animated.spring(scale, { toValue: 0.94, useNativeDriver: true, speed: 40 }).start();
  const pressOut = () => Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 20 }).start();

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <TouchableOpacity
        onPress={onPress}
        onPressIn={pressIn}
        onPressOut={pressOut}
        activeOpacity={0.9}
        style={[
          chipSt.chip,
          {
            backgroundColor: selected ? color : Colors.bgInput,
            borderColor: selected ? color : Colors.border,
          },
        ]}
      >
        {selected && (
          <Ionicons name="checkmark-circle" size={14} color="#FFF" style={{ marginRight: 4 }} />
        )}
        <Text style={[chipSt.label, { color: selected ? '#FFF' : Colors.textSecondary }]}>
          {label}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
}
const chipSt = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: Radius.pill,
    borderWidth: 1.5,
    marginRight: 8,
    marginBottom: 8,
  },
  label: { fontSize: 13, fontWeight: '700' },
});

/** Animated toggle row */
function ToggleRow({ icon, label, sublabel, value, onToggle, Colors, isDark, isLast }: {
  icon: keyof typeof Ionicons['glyphMap'];
  label: string;
  sublabel: string;
  value: boolean;
  onToggle: () => void;
  Colors: typeof DarkColors;
  isDark: boolean;
  isLast?: boolean;
}) {
  return (
    <>
      <View style={tr.row}>
        <View style={[tr.iconWrap, { backgroundColor: Colors.bgInput }]}>
          <Ionicons name={icon} size={18} color={value ? Colors.accent : Colors.textMuted} />
        </View>
        <View style={tr.text}>
          <Text style={[tr.label, { color: Colors.textPrimary }]}>{label}</Text>
          <Text style={[tr.sub, { color: Colors.textMuted }]}>{sublabel}</Text>
        </View>
        <Switch
          value={value}
          onValueChange={onToggle}
          trackColor={{ false: Colors.border, true: 'rgba(255,10,84,0.35)' }}
          thumbColor={value ? Colors.accent : isDark ? '#555' : '#CCC'}
          ios_backgroundColor={Colors.border}
        />
      </View>
      {!isLast && <View style={[tr.divider, { backgroundColor: Colors.border, marginLeft: 16 + 38 + 12 }]} />}
    </>
  );
}
const tr = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: Spacing.lg, gap: Spacing.md },
  iconWrap: { width: 38, height: 38, borderRadius: Radius.sm, alignItems: 'center', justifyContent: 'center' },
  text: { flex: 1 },
  label: { fontSize: 15, fontWeight: '600', marginBottom: 2 },
  sub: { fontSize: 12, fontWeight: '500' },
  divider: { height: 1 },
});

/** Checkbox row (for accessibility) */
function CheckRow({ icon, label, sublabel, checked, onToggle, Colors, isLast }: {
  icon: keyof typeof Ionicons['glyphMap'];
  label: string;
  sublabel: string;
  checked: boolean;
  onToggle: () => void;
  Colors: typeof DarkColors;
  isLast?: boolean;
}) {
  const scale = useRef(new Animated.Value(1)).current;
  const pressIn = () => Animated.spring(scale, { toValue: 0.97, useNativeDriver: true, speed: 50 }).start();
  const pressOut = () => Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 20 }).start();

  return (
    <>
      <Animated.View style={{ transform: [{ scale }] }}>
        <TouchableOpacity
          onPress={onToggle}
          onPressIn={pressIn}
          onPressOut={pressOut}
          activeOpacity={0.9}
          style={cr.row}
        >
          <View style={[cr.iconWrap, { backgroundColor: checked ? 'rgba(255,10,84,0.12)' : Colors.bgInput }]}>
            <Ionicons name={icon} size={18} color={checked ? Colors.accent : Colors.textMuted} />
          </View>
          <View style={cr.text}>
            <Text style={[cr.label, { color: Colors.textPrimary }]}>{label}</Text>
            <Text style={[cr.sub, { color: Colors.textMuted }]}>{sublabel}</Text>
          </View>
          <View style={[
            cr.checkbox,
            {
              backgroundColor: checked ? Colors.accent : 'transparent',
              borderColor: checked ? Colors.accent : Colors.border,
            }
          ]}>
            {checked && <Ionicons name="checkmark" size={13} color="#FFF" />}
          </View>
        </TouchableOpacity>
      </Animated.View>
      {!isLast && <View style={[cr.divider, { backgroundColor: Colors.border, marginLeft: 16 + 38 + 12 }]} />}
    </>
  );
}
const cr = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: Spacing.lg, gap: Spacing.md },
  iconWrap: { width: 38, height: 38, borderRadius: Radius.sm, alignItems: 'center', justifyContent: 'center' },
  text: { flex: 1 },
  label: { fontSize: 15, fontWeight: '600', marginBottom: 2 },
  sub: { fontSize: 12, fontWeight: '500' },
  checkbox: {
    width: 22, height: 22, borderRadius: 6,
    borderWidth: 2,
    alignItems: 'center', justifyContent: 'center',
  },
  divider: { height: 1 },
});

/** Station picker field */
function StationField({ icon, label, value, placeholder, onPress, Colors }: {
  icon: keyof typeof Ionicons['glyphMap'];
  label: string;
  value: string;
  placeholder: string;
  onPress: () => void;
  Colors: typeof DarkColors;
}) {
  return (
    <TouchableOpacity style={sf.row} onPress={onPress} activeOpacity={0.8}>
      <View style={[sf.iconWrap, { backgroundColor: Colors.bgInput }]}>
        <Ionicons name={icon} size={18} color={Colors.textMuted} />
      </View>
      <View style={sf.text}>
        <Text style={[sf.label, { color: Colors.textMuted }]}>{label}</Text>
        <Text style={[sf.value, { color: value ? Colors.textPrimary : Colors.textMuted }]} numberOfLines={1}>
          {value || placeholder}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
    </TouchableOpacity>
  );
}
const sf = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: Spacing.lg, gap: Spacing.md },
  iconWrap: { width: 38, height: 38, borderRadius: Radius.sm, alignItems: 'center', justifyContent: 'center' },
  text: { flex: 1 },
  label: { fontSize: 11, fontWeight: '700', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 3 },
  value: { fontSize: 15, fontWeight: '600' },
});

// ─── Station Search Modal ─────────────────────────────────────────────────────

function StationSearchModal({ visible, onClose, onSelect, title, Colors, isDark }: {
  visible: boolean;
  onClose: () => void;
  onSelect: (station: string) => void;
  title: string;
  Colors: typeof DarkColors;
  isDark: boolean;
}) {
  const [query, setQuery] = useState('');
  const filtered = CHENNAI_METRO_STATIONS.filter((s) =>
    s.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={ssm.overlay} onPress={onClose}>
        <Pressable style={[ssm.sheet, { backgroundColor: Colors.bgSurface }]} onPress={() => {}}>
          {/* Handle */}
          <View style={[ssm.handle, { backgroundColor: Colors.border }]} />

          {/* Title */}
          <Text style={[ssm.title, { color: Colors.textPrimary }]}>{title}</Text>

          {/* Search input */}
          <View style={[ssm.searchWrap, { backgroundColor: Colors.bgInput, borderColor: Colors.border }]}>
            <Ionicons name="search" size={16} color={Colors.textMuted} />
            <TextInput
              style={[ssm.searchInput, { color: Colors.textPrimary }]}
              value={query}
              onChangeText={setQuery}
              placeholder="Search station..."
              placeholderTextColor={Colors.textMuted}
              autoFocus
            />
            {query.length > 0 && (
              <TouchableOpacity onPress={() => setQuery('')}>
                <Ionicons name="close-circle" size={16} color={Colors.textMuted} />
              </TouchableOpacity>
            )}
          </View>

          {/* Station list */}
          <ScrollView style={ssm.list} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            {filtered.map((station) => (
              <TouchableOpacity
                key={station}
                style={[ssm.stationRow, { borderBottomColor: Colors.border }]}
                onPress={() => { onSelect(station); setQuery(''); onClose(); }}
                activeOpacity={0.7}
              >
                <Ionicons name="train-outline" size={16} color={Colors.textMuted} style={{ marginRight: 10 }} />
                <Text style={[ssm.stationText, { color: Colors.textPrimary }]} numberOfLines={2}>
                  {station}
                </Text>
              </TouchableOpacity>
            ))}
            {filtered.length === 0 && (
              <View style={ssm.emptyWrap}>
                <Ionicons name="search-outline" size={32} color={Colors.textMuted} />
                <Text style={[ssm.emptyText, { color: Colors.textMuted }]}>No stations found</Text>
              </View>
            )}
            <View style={{ height: 40 }} />
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
const ssm = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'flex-end' },
  sheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingTop: 12, maxHeight: '80%' },
  handle: { width: 40, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
  title: { fontSize: 18, fontWeight: '800', paddingHorizontal: 20, marginBottom: 14, letterSpacing: -0.3 },
  searchWrap: {
    flexDirection: 'row', alignItems: 'center',
    marginHorizontal: 16, borderRadius: 12,
    paddingHorizontal: 12, paddingVertical: 10,
    borderWidth: 1, gap: 8, marginBottom: 12,
  },
  searchInput: { flex: 1, fontSize: 15, fontWeight: '500', padding: 0 },
  list: { paddingHorizontal: 16 },
  stationRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 13, borderBottomWidth: 1,
  },
  stationText: { fontSize: 14, fontWeight: '500', flex: 1 },
  emptyWrap: { alignItems: 'center', paddingVertical: 40, gap: 10 },
  emptyText: { fontSize: 14, fontWeight: '600' },
});

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function TransitPreferencesScreen() {
  const router = useRouter();
  const { isDark } = useUserStore();
  const Colors = isDark ? DarkColors : LightColors;
  const styles = useMemo(() => getStyles(Colors, isDark), [isDark]);

  const {
    preferredLine, setPreferredLine,
    homeStation, setHomeStation,
    workStation, setWorkStation,
    routePriority, setRoutePriority,
    coachPreference, setCoachPreference,
    wheelchairFriendly, toggleWheelchair,
    liftEscalatorPreferred, toggleLiftEscalator,
    seniorCitizenFriendly, toggleSeniorCitizen,
    peakHourAlerts, togglePeakHourAlerts,
    rememberLastJourney, toggleRememberLastJourney,
    resetTransitPrefs,
  } = useTransitStore();

  const [homeModalOpen, setHomeModalOpen] = useState(false);
  const [workModalOpen, setWorkModalOpen] = useState(false);

  const handleReset = useCallback(() => {
    Alert.alert(
      'Reset Preferences',
      'All transit preferences will be restored to defaults. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Reset', style: 'destructive', onPress: resetTransitPrefs },
      ]
    );
  }, [resetTransitPrefs]);

  // Count how many preferences are active (non-default)
  const activeCount = [
    preferredLine !== 'Both Lines',
    homeStation !== '',
    workStation !== '',
    routePriority !== 'Fastest Route',
    coachPreference !== 'No Preference',
    wheelchairFriendly,
    liftEscalatorPreferred,
    seniorCitizenFriendly,
    !peakHourAlerts,
    !rememberLastJourney,
  ].filter(Boolean).length;

  // Line colors
  const LINE_COLORS: Record<MetroLine, string> = {
    'Blue Line': '#2563EB',
    'Green Line': '#059669',
    'Both Lines': Colors.accent,
  };

  const METRO_LINES: MetroLine[] = ['Blue Line', 'Green Line', 'Both Lines'];
  const ROUTE_PRIORITIES: RoutePriority[] = ['Fastest Route', 'Least Interchange', 'Less Walking', 'Cheapest Fare'];
  const COACH_PREFS: CoachPreference[] = ['Front Coach', 'Middle Coach', 'Rear Coach', 'No Preference'];

  const ROUTE_ICONS: Record<RoutePriority, keyof typeof Ionicons['glyphMap']> = {
    'Fastest Route': 'flash-outline',
    'Least Interchange': 'git-merge-outline',
    'Less Walking': 'footsteps-outline',
    'Cheapest Fare': 'pricetag-outline',
  };

  const COACH_ICONS: Record<CoachPreference, keyof typeof Ionicons['glyphMap']> = {
    'Front Coach': 'arrow-forward-circle-outline',
    'Middle Coach': 'remove-circle-outline',
    'Rear Coach': 'arrow-back-circle-outline',
    'No Preference': 'apps-outline',
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.8}>
          <Ionicons name="arrow-back" size={22} color={Colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Transit Preferences</Text>
          {activeCount > 0 && (
            <View style={[styles.activeCountBadge, { backgroundColor: Colors.accent }]}>
              <Text style={styles.activeCountText}>{activeCount} active</Text>
            </View>
          )}
        </View>
        <TouchableOpacity onPress={handleReset} style={styles.resetBtn} activeOpacity={0.8}>
          <Ionicons name="refresh-outline" size={18} color={Colors.textMuted} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* ── Hero summary strip ── */}
        <LinearGradient
          colors={isDark
            ? ['rgba(255,10,84,0.14)', 'rgba(37,100,235,0.08)']
            : ['rgba(255,10,84,0.07)', 'rgba(37,100,235,0.04)']}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          style={styles.heroStrip}
        >
          <View style={styles.heroStripItem}>
            <View style={[styles.heroStripDot, { backgroundColor: LINE_COLORS[preferredLine] }]} />
            <Text style={[styles.heroStripValue, { color: Colors.textPrimary }]}>{preferredLine}</Text>
            <Text style={[styles.heroStripKey, { color: Colors.textMuted }]}>Line</Text>
          </View>
          <View style={[styles.heroSep, { backgroundColor: Colors.border }]} />
          <View style={styles.heroStripItem}>
            <Ionicons name={ROUTE_ICONS[routePriority]} size={18} color={Colors.accent} />
            <Text style={[styles.heroStripValue, { color: Colors.textPrimary }]} numberOfLines={1}>
              {routePriority.split(' ')[0]}
            </Text>
            <Text style={[styles.heroStripKey, { color: Colors.textMuted }]}>Route</Text>
          </View>
          <View style={[styles.heroSep, { backgroundColor: Colors.border }]} />
          <View style={styles.heroStripItem}>
            <Ionicons name={COACH_ICONS[coachPreference]} size={18} color={Colors.accent} />
            <Text style={[styles.heroStripValue, { color: Colors.textPrimary }]} numberOfLines={1}>
              {coachPreference === 'No Preference' ? 'Any' : coachPreference.split(' ')[0]}
            </Text>
            <Text style={[styles.heroStripKey, { color: Colors.textMuted }]}>Coach</Text>
          </View>
        </LinearGradient>

        <View style={styles.content}>
          {/* ────────────────────────────────────────────────────── */}
          {/* 1. Preferred Metro Line */}
          {/* ────────────────────────────────────────────────────── */}
          <View style={styles.section}>
            <SectionHeading title="Preferred Metro Line" icon="train-outline" Colors={Colors} isDark={isDark} />
            <View style={styles.card}>
              {METRO_LINES.map((line, idx) => {
                const lineColor = LINE_COLORS[line];
                const isSelected = preferredLine === line;
                return (
                  <React.Fragment key={line}>
                    <TouchableOpacity
                      style={styles.radioRow}
                      onPress={() => setPreferredLine(line)}
                      activeOpacity={0.8}
                    >
                      {/* Colored line dot */}
                      <View style={[styles.lineDot, { backgroundColor: lineColor }]} />
                      <Text style={[styles.radioLabel, { color: Colors.textPrimary }]}>{line}</Text>
                      {line !== 'Both Lines' && (
                        <View style={[styles.lineTag, { backgroundColor: lineColor + '22', borderColor: lineColor + '55' }]}>
                          <Text style={[styles.lineTagText, { color: lineColor }]}>
                            {line === 'Blue Line' ? 'Line 1' : 'Line 2'}
                          </Text>
                        </View>
                      )}
                      <View style={[
                        styles.radioCircle,
                        { borderColor: isSelected ? lineColor : Colors.border }
                      ]}>
                        {isSelected && <View style={[styles.radioFill, { backgroundColor: lineColor }]} />}
                      </View>
                    </TouchableOpacity>
                    {idx < METRO_LINES.length - 1 && <View style={[styles.rowDivider, { backgroundColor: Colors.border, marginLeft: 16 + 12 + 10 }]} />}
                  </React.Fragment>
                );
              })}
            </View>
          </View>

          {/* ────────────────────────────────────────────────────── */}
          {/* 2. Frequent Stations */}
          {/* ────────────────────────────────────────────────────── */}
          <View style={styles.section}>
            <SectionHeading title="Frequent Stations" icon="location-outline" Colors={Colors} isDark={isDark} />
            <View style={styles.card}>
              <StationField
                icon="home-outline"
                label="Home Station"
                value={homeStation}
                placeholder="Set your home station"
                onPress={() => setHomeModalOpen(true)}
                Colors={Colors}
              />
              <View style={[styles.rowDivider, { backgroundColor: Colors.border, marginLeft: 16 + 38 + 12 }]} />
              <StationField
                icon="briefcase-outline"
                label="Work Station"
                value={workStation}
                placeholder="Set your work station"
                onPress={() => setWorkModalOpen(true)}
                Colors={Colors}
              />
              <View style={[styles.rowDivider, { backgroundColor: Colors.border, marginLeft: 16 + 38 + 12 }]} />
              {/* Saved stations hint row */}
              <TouchableOpacity style={styles.savedRow} activeOpacity={0.8}>
                <View style={[styles.savedIcon, { backgroundColor: Colors.bgInput }]}>
                  <Ionicons name="bookmark-outline" size={18} color={Colors.textMuted} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.savedLabel, { color: Colors.textPrimary }]}>Saved Stations</Text>
                  <Text style={[styles.savedSub, { color: Colors.textMuted }]}>Manage bookmarked stations</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
              </TouchableOpacity>
            </View>
            {(homeStation || workStation) && (
              <View style={[styles.stationChipRow]}>
                {homeStation ? (
                  <View style={[styles.stationChip, { backgroundColor: isDark ? 'rgba(16,185,129,0.12)' : 'rgba(5,150,105,0.08)', borderColor: Colors.greenLine + '44' }]}>
                    <Ionicons name="home" size={12} color={Colors.greenLine} />
                    <Text style={[styles.stationChipText, { color: Colors.greenLine }]} numberOfLines={1}>
                      {homeStation.split(' ')[0]}
                    </Text>
                  </View>
                ) : null}
                {workStation ? (
                  <View style={[styles.stationChip, { backgroundColor: isDark ? 'rgba(59,130,246,0.12)' : 'rgba(37,99,235,0.08)', borderColor: Colors.blueLine + '44' }]}>
                    <Ionicons name="briefcase" size={12} color={Colors.blueLine} />
                    <Text style={[styles.stationChipText, { color: Colors.blueLine }]} numberOfLines={1}>
                      {workStation.split(' ')[0]}
                    </Text>
                  </View>
                ) : null}
              </View>
            )}
          </View>

          {/* ────────────────────────────────────────────────────── */}
          {/* 3. Route Priority */}
          {/* ────────────────────────────────────────────────────── */}
          <View style={styles.section}>
            <SectionHeading title="Route Priority" icon="navigate-outline" Colors={Colors} isDark={isDark} />
            <View style={styles.card}>
              {ROUTE_PRIORITIES.map((priority, idx) => {
                const isSelected = routePriority === priority;
                const descriptions: Record<RoutePriority, string> = {
                  'Fastest Route': 'Minimize total journey time',
                  'Least Interchange': 'Fewer platform changes',
                  'Less Walking': 'Reduce walking distance',
                  'Cheapest Fare': 'Most economical ticket',
                };
                return (
                  <React.Fragment key={priority}>
                    <TouchableOpacity
                      style={styles.radioRow}
                      onPress={() => setRoutePriority(priority)}
                      activeOpacity={0.8}
                    >
                      <View style={[
                        styles.priorityIcon,
                        { backgroundColor: isSelected ? 'rgba(255,10,84,0.12)' : Colors.bgInput }
                      ]}>
                        <Ionicons name={ROUTE_ICONS[priority]} size={18} color={isSelected ? Colors.accent : Colors.textMuted} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.radioLabel, { color: Colors.textPrimary }]}>{priority}</Text>
                        <Text style={[styles.radioSub, { color: Colors.textMuted }]}>{descriptions[priority]}</Text>
                      </View>
                      <View style={[styles.radioCircle, { borderColor: isSelected ? Colors.accent : Colors.border }]}>
                        {isSelected && <View style={[styles.radioFill, { backgroundColor: Colors.accent }]} />}
                      </View>
                    </TouchableOpacity>
                    {idx < ROUTE_PRIORITIES.length - 1 && <View style={[styles.rowDivider, { backgroundColor: Colors.border, marginLeft: 16 + 38 + 12 }]} />}
                  </React.Fragment>
                );
              })}
            </View>
          </View>

          {/* ────────────────────────────────────────────────────── */}
          {/* 4. Coach Preference */}
          {/* ────────────────────────────────────────────────────── */}
          <View style={styles.section}>
            <SectionHeading title="Coach Preference" icon="bus-outline" Colors={Colors} isDark={isDark} />
            {/* Visual Train diagram */}
            <View style={[styles.trainDiagram, { backgroundColor: Colors.bgSurface, borderColor: Colors.border }]}>
              <Text style={[styles.trainDiagramLabel, { color: Colors.textMuted }]}>Direction of travel →</Text>
              <View style={styles.trainCoaches}>
                {(['Front Coach', 'Middle Coach', 'Rear Coach'] as CoachPreference[]).map((coach, idx) => {
                  const isActive = coachPreference === coach;
                  const coachLabel = ['Front', 'Middle', 'Rear'][idx];
                  return (
                    <TouchableOpacity
                      key={coach}
                      style={[
                        styles.coachBox,
                        idx === 0 && styles.coachBoxFirst,
                        idx === 2 && styles.coachBoxLast,
                        {
                          backgroundColor: isActive ? Colors.accent : Colors.bgInput,
                          borderColor: isActive ? Colors.accent : Colors.border,
                        }
                      ]}
                      onPress={() => setCoachPreference(coach)}
                      activeOpacity={0.8}
                    >
                      <Ionicons name="person-outline" size={14} color={isActive ? '#FFF' : Colors.textMuted} />
                      <Text style={[styles.coachBoxLabel, { color: isActive ? '#FFF' : Colors.textMuted }]}>{coachLabel}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
            {/* Chip row */}
            <View style={styles.chipWrap}>
              {COACH_PREFS.map((coach) => (
                <ChipButton
                  key={coach}
                  label={coach}
                  selected={coachPreference === coach}
                  color={Colors.accent}
                  onPress={() => setCoachPreference(coach)}
                  Colors={Colors}
                />
              ))}
            </View>
          </View>

          {/* ────────────────────────────────────────────────────── */}
          {/* 5. Accessibility */}
          {/* ────────────────────────────────────────────────────── */}
          <View style={styles.section}>
            <SectionHeading title="Accessibility" icon="accessibility-outline" Colors={Colors} isDark={isDark} />
            <View style={styles.card}>
              <CheckRow
                icon="accessibility-outline"
                label="Wheelchair Friendly Route"
                sublabel="Routes with ramp & wheelchair access"
                checked={wheelchairFriendly}
                onToggle={toggleWheelchair}
                Colors={Colors}
              />
              <CheckRow
                icon="arrow-up-circle-outline"
                label="Lift / Escalator Preferred"
                sublabel="Avoid stairs where possible"
                checked={liftEscalatorPreferred}
                onToggle={toggleLiftEscalator}
                Colors={Colors}
              />
              <CheckRow
                icon="people-outline"
                label="Senior Citizen Friendly"
                sublabel="Less crowded coaches & exits"
                checked={seniorCitizenFriendly}
                onToggle={toggleSeniorCitizen}
                Colors={Colors}
                isLast
              />
            </View>
            {(wheelchairFriendly || liftEscalatorPreferred || seniorCitizenFriendly) && (
              <View style={[styles.accessNote, { backgroundColor: isDark ? 'rgba(16,185,129,0.1)' : 'rgba(5,150,105,0.07)', borderColor: Colors.success + '33' }]}>
                <Ionicons name="information-circle-outline" size={15} color={Colors.success} />
                <Text style={[styles.accessNoteText, { color: Colors.success }]}>
                  Accessibility filters will be applied to all route suggestions.
                </Text>
              </View>
            )}
          </View>

          {/* ────────────────────────────────────────────────────── */}
          {/* 6 & 7. Smart Toggles */}
          {/* ────────────────────────────────────────────────────── */}
          <View style={styles.section}>
            <SectionHeading title="Smart Alerts & Behaviour" icon="notifications-outline" Colors={Colors} isDark={isDark} />
            <View style={styles.card}>
              <ToggleRow
                icon="alarm-outline"
                label="Peak Hour Alerts"
                sublabel="Get notified during busy hours (7–10AM, 5–9PM)"
                value={peakHourAlerts}
                onToggle={togglePeakHourAlerts}
                Colors={Colors}
                isDark={isDark}
              />
              <ToggleRow
                icon="time-outline"
                label="Remember Last Journey"
                sublabel="Auto-fill source & destination on next visit"
                value={rememberLastJourney}
                onToggle={toggleRememberLastJourney}
                Colors={Colors}
                isDark={isDark}
                isLast
              />
            </View>
          </View>

          {/* ────────────────────────────────────────────────────── */}
          {/* Reset / Info */}
          {/* ────────────────────────────────────────────────────── */}
          <TouchableOpacity
            style={[styles.resetCard, { borderColor: Colors.border, backgroundColor: Colors.bgSurface }]}
            onPress={handleReset}
            activeOpacity={0.8}
          >
            <View style={[styles.resetIcon, { backgroundColor: 'rgba(239,68,68,0.1)' }]}>
              <Ionicons name="refresh-outline" size={18} color={Colors.danger} />
            </View>
            <Text style={[styles.resetLabel, { color: Colors.danger }]}>Reset All Preferences</Text>
            <Ionicons name="chevron-forward" size={16} color={Colors.danger} style={{ opacity: 0.5 }} />
          </TouchableOpacity>

          <Text style={[styles.footerNote, { color: Colors.textMuted }]}>
            Preferences apply to journey planning on this device only.
            {'\n'}Data is stored locally and not shared.
          </Text>

          <View style={{ height: 48 }} />
        </View>
      </ScrollView>

      {/* ── Station Search Modals ── */}
      <StationSearchModal
        visible={homeModalOpen}
        onClose={() => setHomeModalOpen(false)}
        onSelect={setHomeStation}
        title="Select Home Station"
        Colors={Colors}
        isDark={isDark}
      />
      <StationSearchModal
        visible={workModalOpen}
        onClose={() => setWorkModalOpen(false)}
        onSelect={setWorkStation}
        title="Select Work Station"
        Colors={Colors}
        isDark={isDark}
      />
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const getStyles = (Colors: typeof DarkColors, isDark: boolean) =>
  StyleSheet.create({
    safe: { flex: 1, backgroundColor: Colors.bgBase },
    scroll: { flex: 1 },

    // ── Header
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: Spacing.lg,
      paddingVertical: Spacing.md,
      paddingTop: Spacing.lg,
      gap: Spacing.md,
    },
    backBtn: {
      width: 40, height: 40, borderRadius: 20,
      backgroundColor: Colors.bgInput,
      alignItems: 'center', justifyContent: 'center',
    },
    headerCenter: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 },
    headerTitle: { fontSize: 18, fontWeight: '800', color: Colors.textPrimary, letterSpacing: -0.3 },
    activeCountBadge: {
      paddingHorizontal: 8, paddingVertical: 3,
      borderRadius: Radius.pill,
    },
    activeCountText: { fontSize: 11, fontWeight: '800', color: '#FFF' },
    resetBtn: {
      width: 40, height: 40, borderRadius: 20,
      backgroundColor: Colors.bgInput,
      alignItems: 'center', justifyContent: 'center',
    },

    // ── Hero strip
    heroStrip: {
      flexDirection: 'row',
      marginHorizontal: Spacing.lg,
      marginBottom: Spacing.xl,
      borderRadius: Radius.lg,
      paddingVertical: 16,
      paddingHorizontal: Spacing.lg,
      borderWidth: 1,
      borderColor: isDark ? 'rgba(255,10,84,0.12)' : 'rgba(255,10,84,0.08)',
    },
    heroStripItem: { flex: 1, alignItems: 'center', gap: 3 },
    heroSep: { width: 1, marginVertical: 4 },
    heroStripDot: { width: 10, height: 10, borderRadius: 5 },
    heroStripValue: { fontSize: 14, fontWeight: '800', textAlign: 'center' },
    heroStripKey: { fontSize: 10, fontWeight: '600', letterSpacing: 0.5, textTransform: 'uppercase' },

    // ── Content
    content: { paddingHorizontal: Spacing.lg },
    section: { marginBottom: Spacing.xl },
    card: {
      backgroundColor: Colors.bgSurface,
      borderRadius: Radius.lg,
      borderWidth: 1,
      borderColor: Colors.border,
      overflow: 'hidden',
    },
    rowDivider: { height: 1 },

    // ── Radio rows
    radioRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 14,
      paddingHorizontal: Spacing.lg,
      gap: Spacing.md,
    },
    lineDot: { width: 10, height: 10, borderRadius: 5 },
    lineTag: {
      paddingHorizontal: 8, paddingVertical: 3,
      borderRadius: Radius.pill, borderWidth: 1,
      marginRight: Spacing.sm,
    },
    lineTagText: { fontSize: 11, fontWeight: '800' },
    radioLabel: { fontSize: 15, fontWeight: '600', flex: 1 },
    radioSub: { fontSize: 12, fontWeight: '500', marginTop: 2 },
    radioCircle: {
      width: 22, height: 22, borderRadius: 11,
      borderWidth: 2,
      alignItems: 'center', justifyContent: 'center',
    },
    radioFill: { width: 10, height: 10, borderRadius: 5 },
    priorityIcon: { width: 38, height: 38, borderRadius: Radius.sm, alignItems: 'center', justifyContent: 'center' },

    // ── Station chips
    stationChipRow: { flexDirection: 'row', gap: 8, marginTop: 10, flexWrap: 'wrap' },
    stationChip: {
      flexDirection: 'row', alignItems: 'center', gap: 5,
      paddingHorizontal: 10, paddingVertical: 5,
      borderRadius: Radius.pill, borderWidth: 1,
    },
    stationChipText: { fontSize: 12, fontWeight: '700' },
    savedRow: {
      flexDirection: 'row', alignItems: 'center',
      paddingVertical: 14, paddingHorizontal: Spacing.lg, gap: Spacing.md,
    },
    savedIcon: { width: 38, height: 38, borderRadius: Radius.sm, alignItems: 'center', justifyContent: 'center' },
    savedLabel: { fontSize: 15, fontWeight: '600', marginBottom: 2 },
    savedSub: { fontSize: 12, fontWeight: '500' },

    // ── Train diagram
    trainDiagram: {
      borderRadius: Radius.lg, borderWidth: 1,
      paddingVertical: 16, paddingHorizontal: Spacing.lg,
      marginBottom: 12,
    },
    trainDiagramLabel: { fontSize: 11, fontWeight: '600', letterSpacing: 0.5, marginBottom: 12 },
    trainCoaches: { flexDirection: 'row', gap: 6 },
    coachBox: {
      flex: 1, paddingVertical: 12,
      alignItems: 'center', gap: 4,
      borderRadius: 10, borderWidth: 1.5,
    },
    coachBoxFirst: { borderTopLeftRadius: 16, borderBottomLeftRadius: 16 },
    coachBoxLast: { borderTopRightRadius: 16, borderBottomRightRadius: 16 },
    coachBoxLabel: { fontSize: 11, fontWeight: '700' },

    // ── Chips
    chipWrap: { flexDirection: 'row', flexWrap: 'wrap', paddingTop: 4 },

    // ── Accessibility note
    accessNote: {
      flexDirection: 'row', alignItems: 'flex-start',
      gap: 8, marginTop: 10,
      padding: 12, borderRadius: Radius.md, borderWidth: 1,
    },
    accessNoteText: { flex: 1, fontSize: 13, fontWeight: '500', lineHeight: 18 },

    // ── Reset card
    resetCard: {
      flexDirection: 'row', alignItems: 'center',
      padding: Spacing.lg, borderRadius: Radius.lg,
      borderWidth: 1, gap: Spacing.md,
      marginBottom: Spacing.lg,
    },
    resetIcon: { width: 38, height: 38, borderRadius: Radius.sm, alignItems: 'center', justifyContent: 'center' },
    resetLabel: { flex: 1, fontSize: 15, fontWeight: '600' },

    // ── Footer note
    footerNote: {
      fontSize: 12, fontWeight: '500',
      textAlign: 'center', lineHeight: 18,
      marginBottom: Spacing.xl,
    },
  });
