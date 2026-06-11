import React, { useState, useMemo } from 'react';
import { ScrollView, View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { DarkColors, LightColors, Spacing, Radius } from '@/constants/theme';
import { SectionHeader } from '@/components/UI';
import { StationPicker } from '@/components/StationPicker';
import { TrainTimingCard } from '@/components/TrainTimingCard';
import { useUserStore } from '@/store';

const POPULAR_STATIONS = [
  { name: 'Guindy',                      tag: 'Popular' },
  { name: 'Puratchi Thalaivi Dr. J. Jayalalithaa CMBT Metro', tag: 'Hub' },
  { name: 'Arignar Anna Alandur Metro',      tag: 'Interchange' },
  { name: 'Puratchi Thalaivar Dr. M.G. Ramachandran Central Metro', tag: 'Interchange' },
  { name: 'Egmore',                      tag: 'Central' },
  { name: 'Anna Nagar Tower',            tag: '' },
  { name: 'Koyambedu',                   tag: 'Bus Hub' },
  { name: 'Chennai International Airport', tag: 'Airport' },
];

export default function TimingScreen() {
  const [selectedStation, setSelectedStation] = useState<string>('Guindy');
  const { isDark } = useUserStore();
  const Colors = isDark ? DarkColors : LightColors;
  const styles = useMemo(() => getStyles(Colors), [isDark]);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Live Timing</Text>
          <Text style={styles.subtitle}>Real-time train arrivals</Text>
        </View>

        {/* Station Search */}
        <View style={styles.searchRow}>
          <StationPicker
            value={selectedStation}
            onChange={setSelectedStation}
            placeholder="Search any station..."
          />
        </View>

        {/* Timing Card */}
        {selectedStation && (
          <View style={{ marginBottom: Spacing.xxl }}>
            <TrainTimingCard station={selectedStation} />
          </View>
        )}

        {/* Popular Stations */}
        <SectionHeader title="POPULAR STATIONS" />
        <View style={styles.popularList}>
          {POPULAR_STATIONS.map((s) => (
            <TouchableOpacity
              key={s.name}
              style={[
                styles.stationBtn,
                selectedStation === s.name && styles.stationBtnActive,
              ]}
              onPress={() => setSelectedStation(s.name)}
              activeOpacity={0.8}
            >
              <View style={styles.stationBtnLeft}>
                <View style={[
                  styles.stationIcon,
                  selectedStation === s.name && styles.stationIconActive,
                ]}>
                  <Ionicons name="train" size={20} color={selectedStation === s.name ? Colors.accent : Colors.textSecondary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.stationName} numberOfLines={2}>{s.name}</Text>
                  <Text style={styles.stationTag}>
                    {['Arignar Anna Alandur Metro', 'Puratchi Thalaivar Dr. M.G. Ramachandran Central Metro'].includes(s.name)
                      ? '⇄ Interchange'
                      : s.tag || 'Metro Station'}
                  </Text>
                </View>
              </View>
              {selectedStation === s.name ? (
                <View style={styles.liveRow}>
                  <View style={styles.liveDot} />
                  <Text style={styles.liveText}>LIVE</Text>
                </View>
              ) : (
                <Text style={styles.chevron}>›</Text>
              )}
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const getStyles = (Colors: any) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bgBase },
  scroll: { flex: 1 },
  content: { paddingHorizontal: Spacing.lg, paddingBottom: 32 },

  header: { paddingTop: Spacing.xl, marginBottom: Spacing.xl },
  title: { fontSize: 26, fontWeight: '900', color: Colors.textPrimary },
  subtitle: { fontSize: 14, color: Colors.textMuted, marginTop: 4 },

  searchRow: { marginBottom: Spacing.xl },

  popularList: { gap: Spacing.sm },
  stationBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.lg,
  },
  stationBtnActive: {
    borderColor: 'rgba(255,10,84,0.35)',
    backgroundColor: 'rgba(255,10,84,0.06)',
  },
  stationBtnLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, flex: 1 },
  stationIcon: {
    width: 44, height: 44,
    borderRadius: 22,
    backgroundColor: Colors.bgInput,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: Colors.border,
  },
  stationIconActive: { backgroundColor: 'rgba(255,10,84,0.1)', borderColor: 'rgba(255,10,84,0.3)' },
  stationName: { fontSize: 15, color: Colors.textPrimary, fontWeight: '700', flexShrink: 1, paddingRight: 8 },
  stationTag: { fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  chevron: { fontSize: 22, color: Colors.textMuted },
  liveRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  liveDot: { width: 7, height: 7, borderRadius: 3.5, backgroundColor: Colors.success },
  liveText: { fontSize: 10, fontWeight: '700', color: Colors.success, letterSpacing: 0.5 },
});
