import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  ScrollView, View, Text, StyleSheet, TouchableOpacity,
  TextInput, Animated, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { DarkColors, LightColors, Spacing, Radius } from '@/constants/theme';
import { getStations, Station } from '@/services/api';
import { useUserStore } from '@/store';

type LineFilter = 'All' | 'Green' | 'Blue';
type SortMode  = 'default' | 'az';

// ─── Filter tab config ────────────────────────────────────────────────────────
const FILTERS: { key: LineFilter; label: string; icon: string }[] = [
  { key: 'All',   label: 'All Lines',   icon: 'apps-outline'  },
  { key: 'Green', label: 'Green Line',  icon: 'ellipse'       },
  { key: 'Blue',  label: 'Blue Line',   icon: 'ellipse'       },
];


// ─── Station card ─────────────────────────────────────────────────────────────
function StationCard({
  item,
  index,
  isFirst,
  isLast,
  lineColor,
  Colors,
  isDark,
  onTimings,
}: {
  item: Station;
  index: number;
  isFirst: boolean;
  isLast: boolean;
  lineColor: string;
  Colors: typeof DarkColors;
  isDark: boolean;
  onTimings: () => void;
}) {
  const scale = useRef(new Animated.Value(1)).current;
  const pressIn  = () => Animated.spring(scale, { toValue: 0.985, useNativeDriver: true, speed: 50 }).start();
  const pressOut = () => Animated.spring(scale, { toValue: 1,     useNativeDriver: true, speed: 20 }).start();

  const isInterchange = item.is_interchange === 1 || 
    item.station_name === 'Puratchi Thalaivar Dr. M.G. Ramachandran Central Metro' ||
    item.station_name === 'Arignar Anna Alandur Metro';
    
  const nodeBg = isInterchange
    ? lineColor + '22'
    : isDark ? Colors.bgBase : Colors.bgSurface;

  return (
    <View style={sc.row}>
      {/* ── Track column ── */}
      <View style={sc.track}>
        <View style={[sc.trackLineTop,    { backgroundColor: isFirst ? 'transparent' : lineColor + 'A0' }]} />
        <View style={[sc.trackNode,       { borderColor: lineColor, backgroundColor: nodeBg }]}>
          {isInterchange && <View style={[sc.trackNodeInner, { backgroundColor: lineColor }]} />}
        </View>
        <View style={[sc.trackLineBottom, { backgroundColor: isLast ? 'transparent' : lineColor + 'A0' }]} />
      </View>

      {/* ── Card ── */}
      <Animated.View style={[sc.cardWrap, { transform: [{ scale }] }]}>
        <TouchableOpacity
          onPressIn={pressIn}
          onPressOut={pressOut}
          activeOpacity={1}
          style={[sc.card, {
            backgroundColor: isDark ? Colors.bgSurface : '#FFF',
            borderColor: isInterchange ? 'rgba(217, 119, 6, 0.35)' : (isDark ? Colors.border : 'rgba(0,0,0,0.07)'),
            borderWidth: isInterchange ? 1.5 : 1,
          }]}
        >
          {/* Left accent */}
          <View style={[sc.accentBar, { backgroundColor: isInterchange ? Colors.interchange : lineColor }]} />

          <View style={sc.cardBody}>
            {/* Station name */}
            <Text style={[sc.name, { color: Colors.textPrimary }]} numberOfLines={2}>
              {item.station_name}
            </Text>

            {/* Chips row */}
            <View style={sc.chips}>
              {/* Line badge / Interchange badge */}
              {isInterchange ? (
                <View style={[sc.lineBadge, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)', borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)' }]}>
                  <View style={{ flexDirection: 'row', marginRight: 2 }}>
                    <View style={[sc.lineDotIC, { backgroundColor: Colors.blueLine, zIndex: 2 }]} />
                    <View style={[sc.lineDotIC, { backgroundColor: Colors.greenLine, marginLeft: -4 }]} />
                  </View>
                  <Text style={[sc.lineBadgeText, { color: Colors.textSecondary, marginLeft: 2 }]}>Interchange</Text>
                </View>
              ) : (
                <View style={[sc.lineBadge, { backgroundColor: lineColor + '1A', borderColor: lineColor + '55' }]}>
                  <View style={[sc.lineDot, { backgroundColor: lineColor }]} />
                  <Text style={[sc.lineBadgeText, { color: lineColor }]}>{item.line} Line</Text>
                </View>
              )}

              {/* Status */}
              <View style={[sc.statusChip, { backgroundColor: Colors.success + '18', borderColor: Colors.success + '44' }]}>
                <View style={[sc.statusDot, { backgroundColor: Colors.success }]} />
                <Text style={[sc.statusText, { color: Colors.success }]}>Open</Text>
              </View>
            </View>
          </View>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const sc = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'stretch', paddingRight: 4 },
  // Track
  track: { width: 36, alignItems: 'center', flexShrink: 0 },
  trackLineTop:    { width: 3, flex: 1, borderRadius: 2, minHeight: 16 },
  trackNode: {
    width: 16, height: 16, borderRadius: 8, borderWidth: 3,
    alignItems: 'center', justifyContent: 'center',
    zIndex: 2, marginVertical: 0,
  },
  trackNodeInner:  { width: 5, height: 5, borderRadius: 2.5 },
  trackLineBottom: { width: 3, flex: 1, borderRadius: 2, minHeight: 16 },
  // Card
  cardWrap: { flex: 1, marginBottom: 10 },
  card: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: 14, borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 8,
    elevation: 2,
  },
  accentBar: { width: 4, alignSelf: 'stretch' },
  cardBody: { flex: 1, paddingVertical: 12, paddingHorizontal: 12, gap: 8 },
  name: { fontSize: 14, fontWeight: '800', lineHeight: 18, letterSpacing: -0.2 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 5 },
  lineBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 7, paddingVertical: 3,
    borderRadius: Radius.pill, borderWidth: 1,
  },
  lineDot: { width: 6, height: 6, borderRadius: 3 },
  lineDotIC: { width: 8, height: 8, borderRadius: 4, borderWidth: 1, borderColor: '#FFF' },
  lineBadgeText: { fontSize: 10, fontWeight: '800' },
  statusChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 7, paddingVertical: 3,
    borderRadius: Radius.pill, borderWidth: 1,
  },
  statusDot: { width: 5, height: 5, borderRadius: 2.5 },
  statusText: { fontSize: 10, fontWeight: '700' },
  interchangeChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 7, paddingVertical: 3,
    borderRadius: Radius.pill, borderWidth: 1,
  },
  interchangeText: { fontSize: 10, fontWeight: '700' },
});

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function MapScreen() {
  const router = useRouter();
  const { isDark } = useUserStore();
  const Colors = isDark ? DarkColors : LightColors;

  const [stations, setStations] = useState<Station[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [filter,   setFilter]   = useState<LineFilter>('All');
  const [search,   setSearch]   = useState('');
  const [sort,     setSort]     = useState<SortMode>('default');

  // Filter tab slide animation
  const filterAnim = useRef(new Animated.Value(0)).current;
  const filterMap  = { All: 0, Green: 1, Blue: 2 };
  const onFilter   = (f: LineFilter) => {
    Animated.spring(filterAnim, {
      toValue: filterMap[f],
      useNativeDriver: false,
      speed: 30, bounciness: 4,
    }).start();
    setFilter(f);
  };

  useEffect(() => {
    getStations().then((data) => { setStations(data); setLoading(false); });
  }, []);

  const stats = useMemo(() => {
    const green = stations.filter((s) => s.line === 'Green').length;
    const blue  = stations.filter((s) => s.line === 'Blue').length;
    return { green, blue, total: stations.length };
  }, [stations]);

  const filteredStations = useMemo(() => {
    let result = filter === 'All' ? stations : stations.filter((s) => s.line === filter);
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((s) => s.station_name.toLowerCase().includes(q));
    }
    if (sort === 'az') result = [...result].sort((a, b) => a.station_name.localeCompare(b.station_name));
    return result;
  }, [stations, filter, search, sort]);

  const getLineColor = (line: string) =>
    line === 'Green' ? Colors.greenLine : Colors.blueLine;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: Colors.bgBase }]} edges={['top']}>

      {/* ── Header ── */}
      <View style={styles.header}>
        <View>
          <Text style={[styles.title, { color: Colors.textPrimary }]}>Network Map</Text>
          <Text style={[styles.subtitle, { color: Colors.textMuted }]}>
            Chennai Metro stations & live timings
          </Text>
        </View>
        <View style={[styles.headerBadge, { backgroundColor: 'rgba(255,10,84,0.1)' }]}>
          <Ionicons name="train-outline" size={20} color={Colors.accent} />
        </View>
      </View>

      {/* ── Filter Tabs ── */}
      <View style={[styles.filterWrap, { backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)', borderColor: Colors.border }]}>
        {FILTERS.map((f) => {
          const isActive = filter === f.key;
          const activeBg =
            f.key === 'Green' ? Colors.greenLine :
            f.key === 'Blue'  ? Colors.blueLine  :
            Colors.accent;
          return (
            <TouchableOpacity
              key={f.key}
              style={[
                styles.filterTab,
                isActive && { backgroundColor: activeBg },
              ]}
              onPress={() => onFilter(f.key)}
              activeOpacity={0.85}
            >
              {f.key !== 'All' && (
                <View style={[styles.filterDot, { backgroundColor: isActive ? '#FFF' : (f.key === 'Green' ? Colors.greenLine : Colors.blueLine) }]} />
              )}
              <Text style={[styles.filterText, { color: isActive ? '#FFF' : Colors.textSecondary }]}>
                {f.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Stats Card ── */}
        <View style={[styles.statsCard, {
          backgroundColor: isDark ? Colors.bgSurface : '#FFF',
          borderColor: Colors.border,
        }]}>
          {/* Gradient accent top */}
          <LinearGradient
            colors={['rgba(255,10,84,0.08)', 'transparent']}
            style={styles.statsGradient}
          />
          <View style={styles.statsRow}>
            {/* Total */}
            <View style={styles.statCol}>
              <Text style={[styles.statNum, { color: Colors.textPrimary }]}>{stats.total}</Text>
              <Text style={[styles.statLabel, { color: Colors.textMuted }]}>Total{'\n'}Stations</Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: Colors.border }]} />
            {/* Green */}
            <View style={styles.statCol}>
              <View style={styles.statIconRow}>
                <View style={[styles.statLineDot, { backgroundColor: Colors.greenLine }]} />
                <Text style={[styles.statNum, { color: Colors.greenLine }]}>{stats.green}</Text>
              </View>
              <Text style={[styles.statLabel, { color: Colors.textMuted }]}>Green{'\n'}Line</Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: Colors.border }]} />
            {/* Blue */}
            <View style={styles.statCol}>
              <View style={styles.statIconRow}>
                <View style={[styles.statLineDot, { backgroundColor: Colors.blueLine }]} />
                <Text style={[styles.statNum, { color: Colors.blueLine }]}>{stats.blue}</Text>
              </View>
              <Text style={[styles.statLabel, { color: Colors.textMuted }]}>Blue{'\n'}Line</Text>
            </View>
          </View>
        </View>

        {/* ── Search + Sort bar ── */}
        <View style={styles.searchRow}>
          <View style={[styles.searchBox, { backgroundColor: Colors.bgSurface, borderColor: Colors.border }]}>
            <Ionicons name="search-outline" size={16} color={Colors.textMuted} />
            <TextInput
              style={[styles.searchInput, { color: Colors.textPrimary }]}
              placeholder="Search station…"
              placeholderTextColor={Colors.textMuted}
              value={search}
              onChangeText={setSearch}
            />
            {search.length > 0 && (
              <TouchableOpacity onPress={() => setSearch('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Ionicons name="close-circle" size={16} color={Colors.textMuted} />
              </TouchableOpacity>
            )}
          </View>
          <TouchableOpacity
            style={[styles.sortBtn, { backgroundColor: Colors.bgSurface, borderColor: Colors.border }]}
            onPress={() => setSort(s => s === 'default' ? 'az' : 'default')}
            activeOpacity={0.8}
          >
            <Ionicons
              name={sort === 'az' ? 'text-outline' : 'swap-vertical-outline'}
              size={16}
              color={sort === 'az' ? Colors.accent : Colors.textSecondary}
            />
          </TouchableOpacity>
        </View>

        {/* Results count */}
        {!loading && (
          <Text style={[styles.resultsCount, { color: Colors.textMuted }]}>
            {filteredStations.length} station{filteredStations.length !== 1 ? 's' : ''}
            {sort === 'az' ? ' · A–Z' : ''}
            {search.trim() ? ` matching "${search}"` : ''}
          </Text>
        )}

        {/* ── Station list ── */}
        {loading ? (
          <View style={styles.loadingState}>
            <View style={[styles.loadingIcon, { backgroundColor: 'rgba(255,10,84,0.1)' }]}>
              <Ionicons name="train-outline" size={28} color={Colors.accent} />
            </View>
            <Text style={[styles.loadingText, { color: Colors.textPrimary }]}>Loading network…</Text>
            <Text style={[styles.loadingSubText, { color: Colors.textMuted }]}>Fetching station data</Text>
          </View>
        ) : filteredStations.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="location-outline" size={40} color={Colors.textMuted} style={{ opacity: 0.4 }} />
            <Text style={[styles.emptyTitle, { color: Colors.textPrimary }]}>No stations found</Text>
            <Text style={[styles.emptySub, { color: Colors.textMuted }]}>
              Try a different search or filter
            </Text>
          </View>
        ) : (
          <View style={styles.listContainer}>
            {filteredStations.map((item, index) => (
              <StationCard
                key={`${item.station_name}-${item.line}-${index}`}
                item={item}
                index={index}
                isFirst={index === 0}
                isLast={index === filteredStations.length - 1}
                lineColor={getLineColor(item.line)}
                Colors={Colors}
                isDark={isDark}
                onTimings={() =>
                  router.push({ pathname: '/(tabs)/timing', params: { station: item.station_name } })
                }
              />
            ))}
          </View>
        )}

        <View style={{ height: 80 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe: { flex: 1 },

  // ── Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.lg,
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: -0.5,
    marginBottom: 3,
  },
  subtitle: {
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 17,
  },
  headerBadge: {
    width: 44, height: 44, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
  },

  // ── Filter tabs
  filterWrap: {
    flexDirection: 'row',
    marginHorizontal: Spacing.xl,
    marginBottom: Spacing.lg,
    borderRadius: Radius.pill,
    borderWidth: 1,
    padding: 4,
    gap: 4,
  },
  filterTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    paddingHorizontal: 6,
    borderRadius: Radius.pill,
    gap: 5,
  },
  filterDot: {
    width: 7, height: 7, borderRadius: 3.5,
  },
  filterText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.1,
  },

  // ── Scroll
  scroll: { flex: 1 },
  content: { paddingHorizontal: Spacing.lg, paddingTop: 4 },

  // ── Stats card
  statsCard: {
    borderRadius: 18,
    borderWidth: 1,
    marginBottom: Spacing.xl,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.07,
    shadowRadius: 10,
    elevation: 4,
  },
  statsGradient: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    height: 50,
  },
  statsRow: {
    flexDirection: 'row',
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.sm,
  },
  statCol: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
  },
  statDivider: {
    width: 1,
    marginVertical: 8,
    borderRadius: 1,
  },
  statIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  statLineDot: {
    width: 8, height: 8, borderRadius: 4,
  },
  statNum: {
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
    letterSpacing: 0.2,
    lineHeight: 15,
  },

  // ── Search row
  searchRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === 'ios' ? 12 : 8,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    padding: 0,
  },
  sortBtn: {
    width: 44, height: 44,
    borderRadius: 12, borderWidth: 1,
    alignItems: 'center', justifyContent: 'center',
  },

  resultsCount: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.3,
    marginBottom: Spacing.md,
    marginLeft: 44,  // align with card content past track
  },

  // ── List
  listContainer: { paddingLeft: 4, paddingRight: 0 },

  // ── Loading
  loadingState: {
    alignItems: 'center',
    paddingVertical: 60,
    gap: 10,
  },
  loadingIcon: {
    width: 60, height: 60, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 4,
  },
  loadingText: { fontSize: 16, fontWeight: '800' },
  loadingSubText: { fontSize: 13, fontWeight: '500' },

  // ── Empty
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    gap: 8,
  },
  emptyTitle: { fontSize: 16, fontWeight: '800', marginTop: 8 },
  emptySub: { fontSize: 13, fontWeight: '500', textAlign: 'center' },
});
