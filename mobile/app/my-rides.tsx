import React, { useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  TextInput,
  Alert,
} from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { DarkColors, LightColors, Spacing, Radius } from '@/constants/theme';
import { useUserStore, useRidesStore } from '@/store';
import type { RideRecord, RideStatus, MetroLineColor } from '@/store';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(ts: number) {
  const d = new Date(ts);
  return d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
}
function formatTime(ts: number) {
  return new Date(ts).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
}
function shortStation(name: string, max = 22) {
  if (name.length <= max) return name;
  // Try to abbreviate known long names
  if (name.includes('CMBT')) return 'CMBT Metro';
  if (name.includes('Central Metro')) return 'Central Metro';
  if (name.includes('Airport')) return 'Airport';
  if (name.includes('Alandur')) return 'Alandur Metro';
  return name.substring(0, max - 1) + '…';
}

// ─── Line config ──────────────────────────────────────────────────────────────

const LINE_CONFIG: Record<MetroLineColor, { color: string; darkColor: string; label: string }> = {
  'Blue Line': { color: '#2563EB', darkColor: '#5B9BFF', label: 'Blue Line' },
  'Green Line': { color: '#059669', darkColor: '#34D399', label: 'Green Line' },
  'Interchange': { color: '#D97706', darkColor: '#F59E0B', label: 'Interchange' },
  'Both Lines': { color: '#D97706', darkColor: '#F59E0B', label: 'Both Lines' },
};

// ─── Status config ────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<RideStatus, { bg: string; text: string; icon: keyof typeof Ionicons['glyphMap'] }> = {
  Completed: { bg: 'rgba(5,150,105,0.12)', text: '#059669', icon: 'checkmark-circle-outline' },
  Active:    { bg: 'rgba(245,158,11,0.12)', text: '#D97706', icon: 'radio-button-on-outline' },
  Cancelled: { bg: 'rgba(239,68,68,0.12)',  text: '#DC2626', icon: 'close-circle-outline' },
};

// ─── Ride Card ────────────────────────────────────────────────────────────────

function RideCard({
  ride,
  onPress,
  Colors,
  isDark,
}: {
  ride: RideRecord;
  onPress: () => void;
  Colors: typeof DarkColors;
  isDark: boolean;
}) {
  const scale = useRef(new Animated.Value(1)).current;
  const pressIn = () =>
    Animated.spring(scale, { toValue: 0.975, useNativeDriver: true, speed: 50 }).start();
  const pressOut = () =>
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 20 }).start();

  const line = LINE_CONFIG[ride.line as MetroLineColor];
  const lineColor = line ? (isDark ? line.darkColor : line.color) : Colors.textMuted;
  const status = STATUS_CONFIG[ride.status] || STATUS_CONFIG['Completed'];
  const isCancelled = ride.status === 'Cancelled';

  return (
    <Animated.View style={{ transform: [{ scale }], marginBottom: Spacing.md }}>
      <TouchableOpacity
        onPress={onPress}
        onPressIn={pressIn}
        onPressOut={pressOut}
        activeOpacity={0.95}
      >
        <View
          style={[
            cardSt.card,
            {
              backgroundColor: Colors.bgSurface,
              borderColor: Colors.border,
              opacity: isCancelled ? 0.72 : 1,
            },
          ]}
        >
          {/* ── Top Row: date + fare ── */}
          <View style={cardSt.topRow}>
            <View style={cardSt.topLeft}>
              {/* Metro icon badge */}
              <LinearGradient
                colors={[lineColor + '28', lineColor + '10']}
                style={[cardSt.iconBadge, { borderColor: lineColor + '44' }]}
              >
                <Ionicons name="train" size={20} color={lineColor} />
              </LinearGradient>
              <View>
                <Text style={[cardSt.dateText, { color: Colors.textPrimary }]}>
                  {formatDate(ride.timestamp)} · {formatTime(ride.timestamp)}
                </Text>
                <Text style={[cardSt.brandText, { color: Colors.textMuted }]}>
                  Namma Chennai Metro
                </Text>
              </View>
            </View>
            <View style={cardSt.fareWrap}>
              <Text style={[cardSt.fareText, { color: Colors.textPrimary }]}>
                ₹{ride.fare}
              </Text>
              {ride.passengers > 1 && (
                <Text style={[cardSt.farePassengers, { color: Colors.textMuted }]}>
                  ×{ride.passengers}
                </Text>
              )}
            </View>
          </View>

          {/* ── Divider ── */}
          <View style={[cardSt.divider, { backgroundColor: Colors.border }]} />

          {/* ── Route section ── */}
          <View style={cardSt.routeSection}>
            {/* Timeline dots */}
            <View style={cardSt.timeline}>
              <View style={[cardSt.dotTop, { backgroundColor: Colors.textMuted }]} />
              <View style={[cardSt.timelineBar, { backgroundColor: lineColor + '60' }]} />
              <View style={[cardSt.dotBottom, { borderColor: lineColor, backgroundColor: lineColor + '30' }]} />
            </View>
            {/* Station names */}
            <View style={cardSt.stationCol}>
              <Text style={[cardSt.sourceText, { color: Colors.textMuted }]} numberOfLines={1}>
                {shortStation(ride.source)}
              </Text>
              <Text style={[cardSt.destText, { color: Colors.textPrimary }]} numberOfLines={1}>
                {shortStation(ride.destination)}
              </Text>
            </View>

            {/* QR Code always visible as requested */}
            <View style={{ justifyContent: 'center', backgroundColor: '#FFF', padding: 6, borderRadius: 10, borderWidth: 1, borderColor: 'rgba(0,0,0,0.1)' }}>
              <QRCode value={ride.ticketId || ride.id} size={42} />
            </View>
          </View>

          {/* ── Footer chips ── */}
          <View style={cardSt.footerRow}>
            {/* Line chip */}
            {ride.line === 'Interchange' || ride.line === 'Both Lines' ? (
              <View style={[cardSt.chip, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)', borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)' }]}>
                <View style={[cardSt.chipDot, { backgroundColor: '#2563EB' }]} />
                <Text style={[cardSt.chipText, { color: Colors.textSecondary }]}>Blue Line</Text>
                <Ionicons name="arrow-forward" size={10} color={Colors.textMuted} style={{ marginHorizontal: 3 }} />
                <View style={[cardSt.chipDot, { backgroundColor: '#059669' }]} />
                <Text style={[cardSt.chipText, { color: Colors.textSecondary }]}>Green Line</Text>
              </View>
            ) : (
              <View style={[cardSt.chip, { backgroundColor: lineColor + '18', borderColor: lineColor + '44' }]}>
                <View style={[cardSt.chipDot, { backgroundColor: lineColor }]} />
                <Text style={[cardSt.chipText, { color: lineColor }]}>{line?.label || ride.line}</Text>
              </View>
            )}

            {/* Status chip */}
            <View style={[cardSt.chip, { backgroundColor: status.bg, borderColor: status.text + '44' }]}>
              <Ionicons name={status.icon} size={11} color={status.text} style={{ marginRight: 3 }} />
              <Text style={[cardSt.chipText, { color: status.text }]}>{ride.status}</Text>
            </View>

            {/* Duration (non-cancelled) */}
            {!isCancelled && (
              <View style={[cardSt.chip, { backgroundColor: Colors.bgInput, borderColor: Colors.border }]}>
                <Ionicons name="time-outline" size={11} color={Colors.textMuted} style={{ marginRight: 3 }} />
                <Text style={[cardSt.chipText, { color: Colors.textMuted }]}>{ride.durationMin} min</Text>
              </View>
            )}

            {/* Star rating (if rated) */}
            {ride.rating && (
              <View style={[cardSt.chip, { backgroundColor: 'rgba(245,158,11,0.1)', borderColor: 'rgba(245,158,11,0.3)' }]}>
                <Ionicons name="star" size={11} color="#D97706" style={{ marginRight: 3 }} />
                <Text style={[cardSt.chipText, { color: '#D97706' }]}>{ride.rating}/5</Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

const cardSt = StyleSheet.create({
  card: {
    borderRadius: 18,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  topLeft: { flexDirection: 'row', alignItems: 'center', gap: 11, flex: 1 },
  iconBadge: {
    width: 42, height: 42, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center', borderWidth: 1.5,
  },
  dateText: { fontSize: 14, fontWeight: '700', letterSpacing: -0.2 },
  brandText: { fontSize: 11, fontWeight: '500', marginTop: 2 },
  fareWrap: { alignItems: 'flex-end' },
  fareText: { fontSize: 22, fontWeight: '900', letterSpacing: -0.5 },
  farePassengers: { fontSize: 11, fontWeight: '600', marginTop: 1 },
  divider: { height: 1, marginHorizontal: Spacing.lg },
  routeSection: {
    flexDirection: 'row',
    padding: Spacing.lg,
    paddingVertical: 14,
    gap: 12,
  },
  timeline: { width: 14, alignItems: 'center', paddingTop: 3 },
  dotTop: { width: 8, height: 8, borderRadius: 4 },
  timelineBar: { flex: 1, width: 2, marginVertical: 3, borderRadius: 1 },
  dotBottom: { width: 12, height: 12, borderRadius: 6, borderWidth: 2 },
  stationCol: { flex: 1, justifyContent: 'space-between', gap: 8 },
  sourceText: { fontSize: 13, fontWeight: '600' },
  destText: { fontSize: 15, fontWeight: '800' },
  footerRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  chip: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 9, paddingVertical: 4,
    borderRadius: Radius.pill, borderWidth: 1,
  },
  chipDot: { width: 6, height: 6, borderRadius: 3, marginRight: 5 },
  chipText: { fontSize: 11, fontWeight: '700' },
});

// ─── Filter Bar ───────────────────────────────────────────────────────────────

type FilterOption = 'All' | 'Completed' | 'Active' | 'Cancelled';

function FilterBar({
  active,
  onChange,
  Colors,
  isDark,
}: {
  active: FilterOption;
  onChange: (f: FilterOption) => void;
  Colors: typeof DarkColors;
  isDark: boolean;
}) {
  const OPTIONS: FilterOption[] = ['All', 'Completed', 'Active', 'Cancelled'];
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={fb.row}
    >
      {OPTIONS.map((opt) => {
        const isActive = active === opt;
        return (
          <TouchableOpacity
            key={opt}
            style={[
              fb.chip,
              {
                backgroundColor: isActive ? Colors.accent : Colors.bgInput,
                borderColor: isActive ? Colors.accent : Colors.border,
              },
            ]}
            onPress={() => onChange(opt)}
            activeOpacity={0.8}
          >
            <Text style={[fb.chipText, { color: isActive ? '#FFF' : Colors.textSecondary }]}>
              {opt}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}
const fb = StyleSheet.create({
  row: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.md, gap: 8 },
  chip: {
    paddingHorizontal: 16, paddingVertical: 7,
    borderRadius: Radius.pill, borderWidth: 1.5,
  },
  chipText: { fontSize: 13, fontWeight: '700' },
});

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function MyRidesScreen() {
  const router = useRouter();
  const { isDark } = useUserStore();
  const { rides, clearRides } = useRidesStore();
  const Colors = isDark ? DarkColors : LightColors;

  const [searchQuery, setSearchQuery] = useState('');

  const filteredRides = useMemo(() => {
    let result = [...rides].sort((a, b) => b.timestamp - a.timestamp);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (r) =>
          r.source.toLowerCase().includes(q) ||
          r.destination.toLowerCase().includes(q) ||
          r.ticketId.toLowerCase().includes(q)
      );
    }
    return result;
  }, [rides, searchQuery]);

  const handleClearHistory = () => {
    Alert.alert(
      "Clear History",
      "Clear all ride history?",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Clear", style: "destructive", onPress: clearRides }
      ]
    );
  };

  // Stats
  const totalSpent = rides.filter((r) => r.status === 'Completed').reduce((a, r) => a + r.fare, 0);
  const completedCount = rides.filter((r) => r.status === 'Completed').length;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: Colors.bgBase }]} edges={['top']}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={[styles.backBtn, { backgroundColor: Colors.bgInput }]}
          activeOpacity={0.8}
        >
          <Ionicons name="arrow-back" size={22} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: Colors.textPrimary }]}>My Rides</Text>
        {rides.length > 0 ? (
          <TouchableOpacity onPress={handleClearHistory} style={[styles.backBtn, { backgroundColor: 'rgba(239,68,68,0.1)' }]}>
            <Ionicons name="trash-outline" size={20} color="#EF4444" />
          </TouchableOpacity>
        ) : (
          <View style={{ width: 40 }} />
        )}
      </View>

      {/* ── Stats strip ── */}
      <LinearGradient
        colors={
          isDark
            ? ['rgba(255,10,84,0.14)', 'rgba(37,99,235,0.1)']
            : ['rgba(255,10,84,0.07)', 'rgba(37,99,235,0.05)']
        }
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.statsStrip, { borderColor: Colors.border }]}
      >
        <View style={styles.statsItem}>
          <Text style={[styles.statsValue, { color: Colors.textPrimary }]}>{completedCount}</Text>
          <Text style={[styles.statsKey, { color: Colors.textMuted }]}>Completed</Text>
        </View>
        <View style={[styles.statsSep, { backgroundColor: Colors.border }]} />
        <View style={styles.statsItem}>
          <Text style={[styles.statsValue, { color: Colors.textPrimary }]}>₹{totalSpent}</Text>
          <Text style={[styles.statsKey, { color: Colors.textMuted }]}>Total Spent</Text>
        </View>
        <View style={[styles.statsSep, { backgroundColor: Colors.border }]} />
        <View style={styles.statsItem}>
          <Text style={[styles.statsValue, { color: Colors.textPrimary }]}>
            {rides.reduce((a, r) => a + r.distanceKm, 0).toFixed(1)} km
          </Text>
          <Text style={[styles.statsKey, { color: Colors.textMuted }]}>Distance</Text>
        </View>
      </LinearGradient>

      {/* ── Search ── */}
      <View style={[styles.searchWrap, { backgroundColor: Colors.bgInput, borderColor: Colors.border }]}>
        <Ionicons name="search-outline" size={17} color={Colors.textMuted} />
        <TextInput
          style={[styles.searchInput, { color: Colors.textPrimary }]}
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search station or ticket ID…"
          placeholderTextColor={Colors.textMuted}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={16} color={Colors.textMuted} />
          </TouchableOpacity>
        )}
      </View>


      {/* ── Ride list ── */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      >
        {filteredRides.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="train-outline" size={52} color={Colors.textMuted} style={{ opacity: 0.4 }} />
            <Text style={[styles.emptyTitle, { color: Colors.textPrimary }]}>No rides found</Text>
            <Text style={[styles.emptySub, { color: Colors.textMuted }]}>
              Your real metro journey tickets will appear here when you book them
            </Text>
          </View>
        ) : (
          filteredRides.map((ride) => (
            <RideCard
              key={ride.id}
              ride={ride}
              Colors={Colors}
              isDark={isDark}
              onPress={() =>
                router.push({ pathname: '/ride-details', params: { id: ride.id } })
              }
            />
          ))
        )}
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1 },
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
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { flex: 1, fontSize: 20, fontWeight: '800', letterSpacing: -0.4 },
  countBadge: {
    minWidth: 28, height: 24,
    borderRadius: 12, alignItems: 'center',
    justifyContent: 'center', paddingHorizontal: 8,
  },
  countText: { color: '#FFF', fontSize: 12, fontWeight: '800' },

  statsStrip: {
    flexDirection: 'row',
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
    borderRadius: 14,
    paddingVertical: 14,
    borderWidth: 1,
  },
  statsItem: { flex: 1, alignItems: 'center', gap: 2 },
  statsSep: { width: 1, marginVertical: 4 },
  statsValue: { fontSize: 17, fontWeight: '900', letterSpacing: -0.4 },
  statsKey: { fontSize: 10, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },

  searchWrap: {
    flexDirection: 'row', alignItems: 'center',
    marginHorizontal: Spacing.lg, marginBottom: Spacing.md,
    borderRadius: 12, borderWidth: 1,
    paddingHorizontal: 12, paddingVertical: 10, gap: 8,
  },
  searchInput: { flex: 1, fontSize: 14, fontWeight: '500', padding: 0 },

  scroll: { flex: 1 },
  listContent: { paddingHorizontal: Spacing.lg, paddingTop: 4 },

  emptyState: { alignItems: 'center', paddingVertical: 80, gap: 10 },
  emptyTitle: { fontSize: 17, fontWeight: '800' },
  emptySub: { fontSize: 13, fontWeight: '500', textAlign: 'center', lineHeight: 19 },
});
