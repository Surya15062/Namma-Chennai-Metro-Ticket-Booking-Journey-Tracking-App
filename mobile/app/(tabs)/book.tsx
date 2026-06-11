import React, { useEffect, useMemo } from 'react';
import {
  ScrollView, View, Text, StyleSheet, TouchableOpacity, Alert, Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { DarkColors, LightColors, Spacing, Radius } from '@/constants/theme';
import { Card, Divider } from '@/components/UI';
import { StationPicker } from '@/components/StationPicker';
import { RouteTrack } from '@/components/RouteTrack';
import { Button } from '@/components/Button';
import { Badge } from '@/components/Badge';
import { useBookingStore, useUserStore } from '@/store';

export default function BookScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ source?: string; destination?: string }>();

  const { isDark } = useUserStore();
  const Colors = isDark ? DarkColors : LightColors;
  const styles = useMemo(() => getStyles(Colors, isDark), [isDark]);
  const countAnim = React.useRef(new Animated.Value(1)).current;

  const {
    source, destination, route, ticket, ticketCount,
    isCalculating, isBooking, error,
    setSource, setDestination, swapStations, setTicketCount,
    calculateRoute, confirmBooking, resetBooking, clearError,
  } = useBookingStore();

  useEffect(() => {
    if (params.source) setSource(params.source);
    if (params.destination) setDestination(params.destination);
  }, [params.source, params.destination]);

  useEffect(() => {
    Animated.sequence([
      Animated.timing(countAnim, { toValue: 1.25, duration: 100, useNativeDriver: true }),
      Animated.timing(countAnim, { toValue: 1, duration: 100, useNativeDriver: true })
    ]).start();
  }, [ticketCount]);

  useEffect(() => {
    if (source && destination && source !== destination) {
      calculateRoute();
    }
  }, [source, destination]);

  useEffect(() => {
    if (ticket) {
      router.push('/booking/result');
    }
  }, [ticket]);

  useEffect(() => {
    if (error) {
      Alert.alert('Error', error, [{ text: 'OK', onPress: clearError }]);
    }
  }, [error]);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Book Ticket</Text>
          <Text style={styles.subtitle}>Select your journey</Text>
        </View>

        {/* Station Selection unified layout */}
        <View style={styles.selectionCardWrapper}>
          <View style={styles.selectionCardInner}>
            {/* From */}
            <StationPicker
              value={source}
              onChange={setSource}
              placeholder="Select departure station"
              customTrigger={(onPress, val, ph) => (
                <TouchableOpacity style={styles.stationRow} onPress={onPress} activeOpacity={0.7}>
                  <Ionicons name="train" size={24} color={Colors.textPrimary} style={styles.rowIcon} />
                  <View style={styles.rowTextCol}>
                    <Text style={styles.rowLabel}>From</Text>
                    <Text style={[styles.rowValue, !val && { color: Colors.textMuted }]}>{val || ph}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
                </TouchableOpacity>
              )}
            />

            {/* Separator */}
            <View style={styles.separatorContainer}>
              <View style={styles.cardSeparator} />
            </View>

            {/* To */}
            <StationPicker
              value={destination}
              onChange={setDestination}
              placeholder="Select arrival station"
              customTrigger={(onPress, val, ph) => (
                <TouchableOpacity style={styles.stationRow} onPress={onPress} activeOpacity={0.7}>
                  <Ionicons name="train" size={24} color={Colors.textPrimary} style={styles.rowIcon} />
                  <View style={styles.rowTextCol}>
                    <Text style={styles.rowLabel}>To</Text>
                    <Text style={[styles.rowValue, !val && { color: Colors.textMuted }]}>{val || ph}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
                </TouchableOpacity>
              )}
            />

            {/* Swap Button Absolute overlay */}
            <TouchableOpacity style={styles.swapBtnAbsolute} onPress={swapStations} activeOpacity={0.8}>
              <Ionicons name="swap-vertical" size={20} color={isDark ? Colors.white : Colors.bgSurface} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Loading */}
        {isCalculating && (
          <Card style={styles.loadingCard}>
            <Ionicons name="sync" size={24} color={Colors.accent} style={{ marginBottom: 8 }} />
            <Text style={styles.loadingText}>Calculating best route...</Text>
          </Card>
        )}

        {/* Route Summary */}
        {route && !isCalculating && (
          <>
            <Card style={styles.summaryCard}>
              <View style={styles.summaryHeader}>
                <Text style={styles.summaryTitle}>Route Summary</Text>
                <Badge
                  label={route.type === 'direct' ? 'Direct' : 'Interchange'}
                  variant={route.type === 'direct' ? 'success' : 'warning'}
                />
              </View>

              {route.type !== 'direct' && route.interchange && (
                <View style={styles.interchangeContainer}>
                  <Text style={styles.interchangeLabel}>Interchange Station</Text>
                  <Text style={styles.interchangeName}>{route.interchange}</Text>
                </View>
              )}

              <View style={styles.statsGrid}>
                <View style={styles.stat}>
                  <Text style={styles.statValue} numberOfLines={1}>₹{route.fare}</Text>
                  <Text style={styles.statLabel}>FARE</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.stat}>
                  <Text style={styles.statValue}>{route.travelTime}m</Text>
                  <Text style={styles.statLabel}>TIME</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.stat}>
                  <Text style={styles.statValue}>{route.totalStations}</Text>
                  <Text style={styles.statLabel}>STOPS</Text>
                </View>
              </View>
            </Card>

            {/* Route Track */}
            <Card style={styles.routeCard}>
              <Text style={styles.routeCardTitle}>ROUTE</Text>
              <RouteTrack route={route} maxStations={6} />
            </Card>

            {/* Ticket Selector */}
            <Card style={styles.counterCard}>
              <View style={styles.counterRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.counterTitle}>Passengers</Text>
                  <Text style={styles.counterSubtitle}>Maximum 3 tickets</Text>
                </View>
                <View style={styles.counterControls}>
                  <TouchableOpacity
                    onPress={() => setTicketCount(Math.max(1, ticketCount - 1))}
                    disabled={ticketCount <= 1}
                    style={[styles.counterBtn, ticketCount <= 1 && { opacity: 0.5 }]}
                  >
                    <Ionicons name="remove" size={20} color={isDark ? Colors.white : Colors.textPrimary} />
                  </TouchableOpacity>
                  <Animated.Text style={[styles.counterValue, { transform: [{ scale: countAnim }] }]}>{ticketCount}</Animated.Text>
                  <TouchableOpacity
                    onPress={() => setTicketCount(Math.min(3, ticketCount + 1))}
                    disabled={ticketCount >= 3}
                    style={[styles.counterBtn, ticketCount >= 3 && { opacity: 0.5 }]}
                  >
                    <Ionicons name="add" size={20} color={isDark ? Colors.white : Colors.textPrimary} />
                  </TouchableOpacity>
                </View>
              </View>
              <Divider style={{ marginVertical: Spacing.md }} />
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Total Fare</Text>
                <Text style={styles.totalValue}>₹{route.fare * ticketCount}</Text>
              </View>
            </Card>

            {/* Book Button */}
            <Button
              label="Confirm & Book Ticket"
              variant="primary"
              size="lg"
              fullWidth
              loading={isBooking}
              onPress={confirmBooking}
              style={styles.bookBtn}
            />
          </>
        )}

        {/* Empty State */}
        {!route && !isCalculating && (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconWrapper}>
              <Ionicons name="train" size={40} color={Colors.accent} />
            </View>
            <Text style={styles.emptyTitle}>Where are you going?</Text>
            <Text style={styles.emptySubtitle}>Select stations to see route and fare</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const getStyles = (Colors: any, isDark: boolean) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bgBase },
  scroll: { flex: 1 },
  content: { paddingHorizontal: Spacing.md, paddingBottom: 60 },

  header: { paddingTop: Spacing.lg, marginBottom: Spacing.lg },
  title: { fontSize: 28, fontWeight: '900', color: Colors.textPrimary, letterSpacing: -1 },
  subtitle: { fontSize: 14, color: Colors.textMuted, marginTop: 4, fontWeight: '500' },

  selectionCardWrapper: {
    backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : Colors.bgCard,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingVertical: Spacing.md,
    marginBottom: Spacing.xl,
  },
  selectionCardInner: {
    position: 'relative',
  },
  stationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
  },
  rowIcon: {
    marginRight: Spacing.md,
  },
  rowTextCol: {
    flex: 1,
  },
  rowLabel: {
    fontSize: 12,
    color: Colors.textMuted,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  rowValue: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  separatorContainer: {
    paddingLeft: Spacing.lg + 24 + Spacing.md, // Left padding + icon width + icon margin
    paddingRight: Spacing.lg,
    marginVertical: Spacing.xs,
  },
  cardSeparator: {
    height: 1,
    backgroundColor: Colors.borderHover,
  },
  swapBtnAbsolute: {
    position: 'absolute',
    right: Spacing.xl,
    top: '50%',
    marginTop: -18, // Half height to center
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: isDark ? '#32323D' : Colors.textPrimary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: isDark ? 'rgba(255,255,255,0.03)' : Colors.bgBase,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
    zIndex: 10,
  },

  loadingCard: { alignItems: 'center', justifyContent: 'center', padding: Spacing.xl, marginBottom: Spacing.lg },
  loadingText: { color: Colors.textSecondary, fontSize: 14, fontWeight: '600' },

  summaryCard: { marginBottom: Spacing.lg, padding: Spacing.lg },
  summaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  summaryTitle: { fontSize: 13, color: Colors.textSecondary, fontWeight: '700' },
  interchangeContainer: {
    marginBottom: Spacing.lg,
    paddingHorizontal: Spacing.xs,
  },
  interchangeLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  interchangeName: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textPrimary,
    lineHeight: 20,
  },
  statsGrid: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  stat: { alignItems: 'center', flex: 1 },
  statValue: { fontSize: 26, fontWeight: '900', color: Colors.textPrimary },
  statLabel: { fontSize: 10, color: Colors.textMuted, fontWeight: '800', letterSpacing: 1, marginTop: 4 },
  statDivider: { width: 1, height: 32, backgroundColor: Colors.border },

  routeCard: { marginBottom: Spacing.lg, padding: Spacing.lg },
  routeCardTitle: {
    fontSize: 11, fontWeight: '800', letterSpacing: 1.5,
    textTransform: 'uppercase', color: Colors.textMuted, marginBottom: Spacing.lg,
  },

  counterCard: { marginBottom: Spacing.xl, padding: Spacing.lg },
  counterRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  counterTitle: { fontSize: 16, fontWeight: '800', color: Colors.textPrimary, marginBottom: 2 },
  counterSubtitle: { fontSize: 13, color: Colors.textSecondary, fontWeight: '500' },
  counterControls: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  counterBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
    alignItems: 'center', justifyContent: 'center',
  },
  counterValue: { fontSize: 18, fontWeight: '800', color: Colors.textPrimary, minWidth: 20, textAlign: 'center' },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  totalLabel: { fontSize: 16, fontWeight: '700', color: Colors.textSecondary },
  totalValue: { fontSize: 24, fontWeight: '900', color: Colors.accent },

  bookBtn: { marginBottom: Spacing.xxl },

  emptyState: { alignItems: 'center', paddingTop: 40, gap: Spacing.md },
  emptyIconWrapper: { width: 72, height: 72, borderRadius: 22, backgroundColor: 'rgba(255,10,84,0.1)', borderWidth: 1, borderColor: 'rgba(255,10,84,0.2)', alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: Colors.textPrimary },
  emptySubtitle: { fontSize: 14, color: Colors.textMuted, textAlign: 'center', fontWeight: '500' },
});
