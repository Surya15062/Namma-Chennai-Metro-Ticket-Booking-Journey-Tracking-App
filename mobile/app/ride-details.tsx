import React, { useState, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Share,
  Alert,
  Clipboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import QRCode from 'react-native-qrcode-svg';
import { DarkColors, LightColors, Spacing, Radius } from '@/constants/theme';
import { useUserStore, useRidesStore } from '@/store';
import type { MetroLineColor, RideStatus } from '@/store';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(ts: number) {
  return new Date(ts).toLocaleDateString('en-IN', {
    weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
  });
}
function formatTime(ts: number) {
  return new Date(ts).toLocaleTimeString('en-IN', {
    hour: '2-digit', minute: '2-digit', hour12: true,
  });
}
function formatDuration(min: number) {
  if (min === 0) return '—';
  if (min < 60) return `${min} min`;
  return `${Math.floor(min / 60)}h ${min % 60}m`;
}

// ─── Config ───────────────────────────────────────────────────────────────────

const LINE_CONFIG: Record<string, { color: string; darkColor: string }> = {
  'Blue Line': { color: '#2563EB', darkColor: '#5B9BFF' },
  'Green Line': { color: '#059669', darkColor: '#34D399' },
  'Interchange': { color: '#D97706', darkColor: '#F59E0B' },
  'Both Lines': { color: '#D97706', darkColor: '#F59E0B' },
};

const STATUS_CONFIG: Record<RideStatus, { bg: string; text: string; icon: keyof typeof Ionicons['glyphMap'] }> = {
  Completed: { bg: 'rgba(5,150,105,0.15)',  text: '#059669', icon: 'checkmark-circle' },
  Active:    { bg: 'rgba(245,158,11,0.15)', text: '#D97706', icon: 'radio-button-on' },
  Cancelled: { bg: 'rgba(239,68,68,0.15)',  text: '#DC2626', icon: 'close-circle' },
};

// ─── Info Row ─────────────────────────────────────────────────────────────────

function InfoRow({ label, value, icon, Colors, isLast, copyable }: {
  label: string;
  value: string;
  icon: keyof typeof Ionicons['glyphMap'];
  Colors: typeof DarkColors;
  isLast?: boolean;
  copyable?: boolean;
}) {
  const handleCopy = () => {
    Clipboard.setString(value);
    Alert.alert('Copied', `${label} copied to clipboard`);
  };
  return (
    <>
      <View style={ir.row}>
        <View style={[ir.iconWrap, { backgroundColor: Colors.bgInput }]}>
          <Ionicons name={icon} size={16} color={Colors.textMuted} />
        </View>
        <View style={ir.textWrap}>
          <Text style={[ir.label, { color: Colors.textMuted }]}>{label}</Text>
          <Text style={[ir.value, { color: Colors.textPrimary }]} numberOfLines={2}>{value}</Text>
        </View>
        {copyable && (
          <TouchableOpacity onPress={handleCopy} style={ir.copyBtn} activeOpacity={0.7}>
            <Ionicons name="copy-outline" size={16} color={Colors.textMuted} />
          </TouchableOpacity>
        )}
      </View>
      {!isLast && <View style={[ir.divider, { backgroundColor: Colors.border, marginLeft: 16 + 34 + 12 }]} />}
    </>
  );
}
const ir = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: Spacing.lg, gap: 12 },
  iconWrap: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  textWrap: { flex: 1 },
  label: { fontSize: 11, fontWeight: '700', letterSpacing: 0.6, textTransform: 'uppercase', marginBottom: 3 },
  value: { fontSize: 14, fontWeight: '600', lineHeight: 19 },
  copyBtn: { padding: 6 },
  divider: { height: 1 },
});

// ─── Star Rating ──────────────────────────────────────────────────────────────

function StarRating({ rating, onRate, Colors }: {
  rating: number | null;
  onRate: (r: number) => void;
  Colors: typeof DarkColors;
}) {
  const [hovered, setHovered] = useState<number | null>(null);
  const display = hovered ?? rating ?? 0;

  const labels = ['Poor', 'Fair', 'Good', 'Great', 'Excellent'];

  return (
    <View style={sr.wrap}>
      <Text style={[sr.title, { color: Colors.textPrimary }]}>Rate your journey</Text>
      <View style={sr.starsRow}>
        {[1, 2, 3, 4, 5].map((star) => {
          const filled = star <= display;
          const scale = useRef(new Animated.Value(1)).current;
          return (
            <TouchableOpacity
              key={star}
              onPress={() => onRate(star)}
              onPressIn={() => {
                setHovered(star);
                Animated.spring(scale, { toValue: 1.3, useNativeDriver: true, speed: 50 }).start();
              }}
              onPressOut={() => {
                setHovered(null);
                Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 20 }).start();
              }}
              activeOpacity={1}
            >
              <Animated.View style={{ transform: [{ scale }] }}>
                <Ionicons
                  name={filled ? 'star' : 'star-outline'}
                  size={34}
                  color={filled ? '#F59E0B' : Colors.border}
                />
              </Animated.View>
            </TouchableOpacity>
          );
        })}
      </View>
      {display > 0 && (
        <Text style={[sr.label, { color: '#F59E0B' }]}>{labels[display - 1]}</Text>
      )}
      {rating && (
        <Text style={[sr.ratedText, { color: Colors.textMuted }]}>You rated this journey</Text>
      )}
    </View>
  );
}
const sr = StyleSheet.create({
  wrap: { alignItems: 'center', paddingVertical: Spacing.xl, gap: 10 },
  title: { fontSize: 15, fontWeight: '700' },
  starsRow: { flexDirection: 'row', gap: 8 },
  label: { fontSize: 14, fontWeight: '800' },
  ratedText: { fontSize: 12, fontWeight: '500' },
});

// ─── Action Button ────────────────────────────────────────────────────────────

function ActionButton({ icon, label, onPress, color, bg }: {
  icon: keyof typeof Ionicons['glyphMap'];
  label: string;
  onPress: () => void;
  color: string;
  bg: string;
}) {
  const scale = useRef(new Animated.Value(1)).current;
  return (
    <Animated.View style={[ab.wrap, { transform: [{ scale }] }]}>
      <TouchableOpacity
        style={[ab.btn, { backgroundColor: bg }]}
        onPress={onPress}
        onPressIn={() => Animated.spring(scale, { toValue: 0.95, useNativeDriver: true, speed: 50 }).start()}
        onPressOut={() => Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 20 }).start()}
        activeOpacity={0.9}
      >
        <Ionicons name={icon} size={20} color={color} />
        <Text style={[ab.label, { color }]}>{label}</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}
const ab = StyleSheet.create({
  wrap: { flex: 1 },
  btn: {
    alignItems: 'center', justifyContent: 'center',
    paddingVertical: 14, borderRadius: 14, gap: 6,
  },
  label: { fontSize: 12, fontWeight: '700', textAlign: 'center' },
});

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function RideDetailsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { isDark } = useUserStore();
  const { rides, setRating } = useRidesStore();
  const Colors = isDark ? DarkColors : LightColors;

  const ride = rides.find((r) => r.id === id);

  if (!ride) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: Colors.bgBase, alignItems: 'center', justifyContent: 'center' }} edges={['top']}>
        <Ionicons name="alert-circle-outline" size={48} color={Colors.textMuted} />
        <Text style={{ color: Colors.textMuted, marginTop: 12, fontSize: 16 }}>Ride not found</Text>
        <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 20 }}>
          <Text style={{ color: Colors.accent, fontWeight: '700' }}>Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const line = LINE_CONFIG[ride.line] || LINE_CONFIG['Blue Line'];
  const lineColor = isDark ? line.darkColor : line.color;
  const status = STATUS_CONFIG[ride.status] || STATUS_CONFIG['Completed'];
  const isCancelled = ride.status === 'Cancelled';

  const handleBookAgain = () => {
    router.push({
      pathname: '/(tabs)/book',
      params: { source: ride.source, destination: ride.destination },
    });
  };

  const handleShare = async () => {
    await Share.share({
      message:
        `🚇 Namma Chennai Metro Journey\n` +
        `📍 ${ride.source} → ${ride.destination}\n` +
        `📅 ${formatDate(ride.timestamp)} at ${formatTime(ride.timestamp)}\n` +
        `🎫 Ticket: ${ride.ticketId}\n` +
        `💰 Fare: ₹${ride.fare} (${ride.passengers} passenger${ride.passengers > 1 ? 's' : ''})\n` +
        `⏱ Duration: ${formatDuration(ride.durationMin)}`,
    });
  };

  const handleDownloadReceipt = () => {
    Alert.alert('Receipt', 'Receipt PDF generated and saved to Downloads.', [{ text: 'OK' }]);
  };

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
        <Text style={[styles.headerTitle, { color: Colors.textPrimary }]}>Ride Details</Text>
        <TouchableOpacity
          onPress={handleShare}
          style={[styles.shareBtn, { backgroundColor: Colors.bgInput }]}
          activeOpacity={0.8}
        >
          <Ionicons name="share-outline" size={20} color={Colors.textPrimary} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>

        {/* ── Main ticket card ── */}
        <View style={[styles.ticketCard, { backgroundColor: Colors.bgSurface, borderColor: Colors.border }]}>

          {/* ── Gradient header ── */}
          <LinearGradient
            colors={[lineColor + '30', lineColor + '08']}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={[styles.ticketHeader, { borderBottomColor: Colors.border }]}
          >
            <View style={styles.ticketHeaderTop}>
              <View style={styles.ticketHeaderLeft}>
                <View style={[styles.trainBadge, { backgroundColor: lineColor + '28', borderColor: lineColor + '55' }]}>
                  <Ionicons name="train" size={24} color={lineColor} />
                </View>
                <View>
                  <Text style={[styles.ticketBrand, { color: Colors.textPrimary }]}>NAMMA CHENNAI METRO</Text>
                  <Text style={[styles.ticketDateTime, { color: Colors.textMuted }]}>
                    {formatDate(ride.timestamp)} · {formatTime(ride.timestamp)}
                  </Text>
                </View>
              </View>
              {/* Status badge */}
              <View style={[styles.statusBadge, { backgroundColor: status.bg }]}>
                <Ionicons name={status.icon} size={12} color={status.text} />
                <Text style={[styles.statusText, { color: status.text }]}>{ride.status}</Text>
              </View>
            </View>

            {/* Fare + line */}
            <View style={styles.ticketFareRow}>
              <View>
                <Text style={[styles.fareLabel, { color: Colors.textMuted }]}>Total Fare</Text>
                <Text style={[styles.fareAmount, { color: Colors.textPrimary }]}>₹{ride.fare}</Text>
                {ride.passengers > 1 && (
                  <Text style={[styles.farePassengers, { color: Colors.textMuted }]}>
                    {ride.passengers} passengers · ₹{Math.round(ride.fare / ride.passengers)} each
                  </Text>
                )}
              </View>
              {ride.line === 'Interchange' || ride.line === 'Both Lines' ? (
                <View style={[styles.lineTag, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)', borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)' }]}>
                  <View style={[styles.lineDot, { backgroundColor: '#2563EB' }]} />
                  <Text style={[styles.lineTagText, { color: Colors.textSecondary }]}>Blue Line</Text>
                  <Ionicons name="arrow-forward" size={10} color={Colors.textMuted} style={{ marginHorizontal: 2 }} />
                  <View style={[styles.lineDot, { backgroundColor: '#059669' }]} />
                  <Text style={[styles.lineTagText, { color: Colors.textSecondary }]}>Green Line</Text>
                </View>
              ) : (
                <View style={[styles.lineTag, { backgroundColor: lineColor + '20', borderColor: lineColor + '55' }]}>
                  <View style={[styles.lineDot, { backgroundColor: lineColor }]} />
                  <Text style={[styles.lineTagText, { color: lineColor }]}>{ride.line}</Text>
                </View>
              )}
            </View>
          </LinearGradient>

          {/* ── Ticket notch divider ── */}
          <View style={styles.notchRow}>
            <View style={[styles.notch, styles.notchLeft, { backgroundColor: Colors.bgBase }]} />
            <View style={[styles.dashedLine, { borderColor: Colors.border }]} />
            <View style={[styles.notch, styles.notchRight, { backgroundColor: Colors.bgBase }]} />
          </View>

          {/* ── Route section ── */}
          <View style={styles.routeSection}>
            <Text style={[styles.routeSectionLabel, { color: Colors.textMuted }]}>ROUTE</Text>
            <View style={styles.routeRow}>
              {/* Timeline */}
              <View style={styles.routeTimeline}>
                <View style={[styles.routeDotFrom, { backgroundColor: Colors.textMuted }]} />
                <View style={[styles.routeBar, { backgroundColor: lineColor }]} />
                <View style={[styles.routeDotTo, { borderColor: lineColor, backgroundColor: lineColor + '25' }]} />
              </View>
              {/* Stations */}
              <View style={styles.routeStations}>
                <View style={styles.routeStationBlock}>
                  <Text style={[styles.routeStationLabel, { color: Colors.textMuted }]}>FROM</Text>
                  <Text style={[styles.routeStationName, { color: Colors.textPrimary }]}>{ride.source}</Text>
                </View>
                <View style={{ height: 16 }} />
                <View style={styles.routeStationBlock}>
                  <Text style={[styles.routeStationLabel, { color: Colors.textMuted }]}>TO</Text>
                  <Text style={[styles.routeStationName, { color: Colors.textPrimary }]}>{ride.destination}</Text>
                </View>
              </View>
            </View>
          </View>

          {/* ── Journey metrics ── */}
          {!isCancelled && (
            <View style={[styles.metricsRow, { borderTopColor: Colors.border }]}>
              {[
                { icon: 'time-outline' as const, label: 'Duration', value: formatDuration(ride.durationMin) },
                { icon: 'speedometer-outline' as const, label: 'Distance', value: `${ride.distanceKm} km` },
                { icon: 'enter-outline' as const, label: 'Entry', value: ride.entryGate },
                { icon: 'exit-outline' as const, label: 'Exit', value: ride.exitGate },
              ].map((m, idx, arr) => (
                <React.Fragment key={m.label}>
                  <View style={styles.metricItem}>
                    <Ionicons name={m.icon} size={16} color={lineColor} style={{ marginBottom: 4 }} />
                    <Text style={[styles.metricValue, { color: Colors.textPrimary }]}>{m.value}</Text>
                    <Text style={[styles.metricLabel, { color: Colors.textMuted }]}>{m.label}</Text>
                  </View>
                  {idx < arr.length - 1 && (
                    <View style={[styles.metricSep, { backgroundColor: Colors.border }]} />
                  )}
                </React.Fragment>
              ))}
            </View>
          )}
        </View>

        {/* ── Ticket info card ── */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: Colors.textMuted }]}>TICKET INFORMATION</Text>
          <View style={[styles.card, { backgroundColor: Colors.bgSurface, borderColor: Colors.border }]}>
            <InfoRow
              icon="barcode-outline"
              label="Ticket ID"
              value={ride.ticketId}
              Colors={Colors}
              copyable
            />
            <InfoRow
              icon="people-outline"
              label="Passengers"
              value={`${ride.passengers} Adult${ride.passengers > 1 ? 's' : ''}`}
              Colors={Colors}
            />
            <InfoRow
              icon="wallet-outline"
              label="Payment Method"
              value={ride.paymentMethod}
              Colors={Colors}
            />
            <InfoRow
              icon="calendar-outline"
              label="Booking Date"
              value={`${formatDate(ride.timestamp)} at ${formatTime(ride.timestamp)}`}
              Colors={Colors}
              isLast
            />
          </View>
        </View>

        {/* ── QR Code section ── */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: Colors.textMuted }]}>ENTRY QR CODE</Text>
          <View style={[styles.qrCard, { backgroundColor: Colors.bgSurface, borderColor: Colors.border }]}>
            <View style={styles.qrWrap}>
              <QRCode
                value={ride.ticketId}
                size={150}
                color={isDark ? '#FFFFFF' : '#000000'}
                backgroundColor={isDark ? Colors.bgSurface : '#FFFFFF'}
              />
            </View>
            <Text style={[styles.qrHint, { color: Colors.textMuted }]}>
              Scan at station turnstile · Valid for single entry
            </Text>
            <Text style={[styles.qrTicketId, { color: Colors.accent }]}>{ride.ticketId}</Text>
          </View>
        </View>

        {/* ── Star rating ── */}
        <View style={styles.section}>
          <View style={[styles.card, { backgroundColor: Colors.bgSurface, borderColor: Colors.border }]}>
            <StarRating
              rating={ride.rating}
              onRate={(r) => setRating(ride.id, r)}
              Colors={Colors}
            />
          </View>
        </View>

        {/* ── Action buttons ── */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: Colors.textMuted }]}>ACTIONS</Text>
          <View style={styles.actionsGrid}>
            <ActionButton
              icon="download-outline"
              label="Download Receipt"
              onPress={handleDownloadReceipt}
              color={isDark ? '#5B9BFF' : '#2563EB'}
              bg={isDark ? 'rgba(59,130,246,0.15)' : 'rgba(37,99,235,0.08)'}
            />
            <ActionButton
              icon="share-social-outline"
              label="Share Ticket"
              onPress={handleShare}
              color={isDark ? '#34D399' : '#059669'}
              bg={isDark ? 'rgba(16,185,129,0.15)' : 'rgba(5,150,105,0.08)'}
            />
          </View>
          <View style={[styles.actionsGrid, { marginTop: 10 }]}>
            <ActionButton
              icon="repeat-outline"
              label="Book Again"
              onPress={handleBookAgain}
              color="#FFF"
              bg={Colors.accent}
            />
            <ActionButton
              icon="headset-outline"
              label="Get Help"
              onPress={() => Alert.alert('Support', 'Opening support chat…')}
              color={isDark ? '#AFAAB0' : '#475569'}
              bg={Colors.bgInput}
            />
          </View>
        </View>

        <View style={{ height: 48 }} />
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
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    paddingTop: Spacing.lg,
  },
  backBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '800', letterSpacing: -0.3 },
  shareBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },

  // ── Ticket card
  ticketCard: {
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.xl,
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 5,
  },
  ticketHeader: {
    padding: Spacing.lg,
    borderBottomWidth: 0,
    gap: Spacing.md,
  },
  ticketHeaderTop: {
    flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between',
  },
  ticketHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  trainBadge: {
    width: 48, height: 48, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center', borderWidth: 1.5,
  },
  ticketBrand: { fontSize: 11, fontWeight: '800', letterSpacing: 0.8 },
  ticketDateTime: { fontSize: 12, fontWeight: '500', marginTop: 3 },
  statusBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: Radius.pill,
  },
  statusText: { fontSize: 11, fontWeight: '800' },
  ticketFareRow: {
    flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between',
  },
  fareLabel: { fontSize: 11, fontWeight: '600', letterSpacing: 0.5, marginBottom: 2 },
  fareAmount: { fontSize: 36, fontWeight: '900', letterSpacing: -1 },
  farePassengers: { fontSize: 12, fontWeight: '500', marginTop: 2 },
  lineTag: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: Radius.pill, borderWidth: 1.5,
  },
  lineDot: { width: 8, height: 8, borderRadius: 4 },
  lineTagText: { fontSize: 12, fontWeight: '800' },

  // ── Notch divider
  notchRow: { flexDirection: 'row', alignItems: 'center', height: 24 },
  notch: {
    width: 20, height: 20, borderRadius: 10,
    position: 'absolute', zIndex: 2,
  },
  notchLeft: { left: -10 },
  notchRight: { right: -10 },
  dashedLine: {
    flex: 1, borderTopWidth: 1.5, borderStyle: 'dashed',
    marginHorizontal: 10,
  },

  // ── Route
  routeSection: { padding: Spacing.lg, paddingTop: Spacing.md },
  routeSectionLabel: {
    fontSize: 10, fontWeight: '800', letterSpacing: 1.5,
    marginBottom: 14,
  },
  routeRow: { flexDirection: 'row', gap: 14 },
  routeTimeline: { width: 16, alignItems: 'center', paddingTop: 6 },
  routeDotFrom: { width: 8, height: 8, borderRadius: 4 },
  routeBar: { flex: 1, width: 2.5, borderRadius: 2, marginVertical: 4 },
  routeDotTo: { width: 14, height: 14, borderRadius: 7, borderWidth: 2.5 },
  routeStations: { flex: 1 },
  routeStationBlock: { gap: 3 },
  routeStationLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 1.2 },
  routeStationName: { fontSize: 14, fontWeight: '700', lineHeight: 19 },

  // ── Metrics
  metricsRow: {
    flexDirection: 'row', borderTopWidth: 1,
    paddingVertical: Spacing.lg,
  },
  metricItem: { flex: 1, alignItems: 'center', gap: 2 },
  metricValue: { fontSize: 14, fontWeight: '800' },
  metricLabel: { fontSize: 10, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.4 },
  metricSep: { width: 1, marginVertical: 4 },

  // ── Section
  section: { marginBottom: Spacing.xl, paddingHorizontal: Spacing.lg },
  sectionLabel: {
    fontSize: 10, fontWeight: '800', letterSpacing: 1.5,
    marginBottom: 10, marginLeft: 4,
  },
  card: { borderRadius: Radius.lg, borderWidth: 1, overflow: 'hidden' },

  // ── QR
  qrCard: {
    borderRadius: Radius.lg, borderWidth: 1,
    padding: Spacing.xl, alignItems: 'center', gap: 12,
  },
  qrWrap: {
    padding: 12, borderRadius: 14,
    backgroundColor: '#FFFFFF',
  },
  qrHint: { fontSize: 12, fontWeight: '500', textAlign: 'center' },
  qrTicketId: { fontSize: 13, fontWeight: '800', letterSpacing: 0.5 },

  // ── Actions
  actionsGrid: { flexDirection: 'row', gap: 10 },
});
