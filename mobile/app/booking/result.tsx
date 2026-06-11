import React, { useEffect, useState, useMemo, useRef } from 'react';
import {
  ScrollView, View, Text, StyleSheet, TouchableOpacity, Animated, Dimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import QRCode from 'react-native-qrcode-svg';
import { DarkColors, LightColors, Spacing, Radius } from '@/constants/theme';
import { Card, Skeleton } from '@/components/UI';
import { RouteTrack } from '@/components/RouteTrack';
import { Button } from '@/components/Button';
import { Badge } from '@/components/Badge';
import { useBookingStore, useUserStore } from '@/store';

const generateSerialNumber = (source: string, index: number, id: string) => {
  const prefix = source.substring(0, 3).toUpperCase().replace(/[^A-Z]/g, '').padEnd(2, 'A');
  const numHash = Array.from(id || '1234').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const baseNumber = ((numHash * 13) % 8999) + 1000;
  return `${prefix}${baseNumber + index}`;
};

export default function BookingResultScreen() {
  const router = useRouter();
  const { ticket, route, source, destination, resetBooking, ticketCount } = useBookingStore();
  const [isQrLoading, setIsQrLoading] = useState(true);
  const [activeSlide, setActiveSlide] = useState(0);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const qrFadeAnim = useRef(new Animated.Value(0)).current;

  const { isDark } = useUserStore();
  const Colors = isDark ? DarkColors : LightColors;
  const styles = useMemo(() => getStyles(Colors, isDark), [isDark]);

  useEffect(() => {
    if (!ticket) {
      router.replace('/(tabs)/book');
    }
  }, [ticket]);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, friction: 8, tension: 40, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, friction: 8, tension: 50, useNativeDriver: true }),
    ]).start();

    const timer = setTimeout(() => {
      setIsQrLoading(false);
      Animated.timing(qrFadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start();
    }, 900);
    return () => clearTimeout(timer);
  }, []);

  if (!ticket) return null;

  const handleDone = () => {
    resetBooking();
    router.replace('/(tabs)');
  };

  const handleBookAnother = () => {
    resetBooking();
    router.replace('/(tabs)/book');
  };

  const ticketId = ticket.ticket?.id?.substring(0, 8).toUpperCase() ?? 'XXXXXXXX';
  
  const screenWidth = Dimensions.get('window').width;
  const gradientColors = isDark ? (['#140E10', '#0C0608'] as const) : (['#FFFFFF', '#FCF7F8'] as const);

  return (
    <LinearGradient colors={gradientColors} style={styles.safe}>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {/* Success Header */}
          <Animated.View style={[styles.success, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
            <View style={styles.successIconWrapper}>
              <Ionicons name="checkmark-circle" size={48} color={isDark ? '#FF0A54' : '#D20042'} />
            </View>
            <Text style={styles.successTitle}>Ticket Booked!</Text>
            <Text style={styles.successSubtitle}>Your digital ticket is ready</Text>
          </Animated.View>

        {/* Ticket Cards Carousel */}
        <Animated.View style={{ opacity: fadeAnim, transform: [{ scale: scaleAnim }] }}>
          <ScrollView 
            horizontal 
            pagingEnabled 
            showsHorizontalScrollIndicator={false}
            style={{ width: screenWidth }}
            contentContainerStyle={{ paddingBottom: Spacing.xl }}
            snapToInterval={screenWidth}
            decelerationRate="fast"
            onMomentumScrollEnd={(e) => {
              const contentOffsetX = e.nativeEvent.contentOffset.x;
              setActiveSlide(Math.round(contentOffsetX / screenWidth));
            }}
          >
            {Array.from({ length: ticketCount }).map((_, i) => {
              const serialNumber = generateSerialNumber(source, i, ticket.ticket?.id || '');
              return (
                <View key={i} style={{ width: screenWidth, alignItems: 'center', justifyContent: 'center' }}>
                  <View style={[styles.physicalTicket, { width: screenWidth - 48 }]}>
                    <View style={styles.physicalTicketTop}>
                      {ticketCount > 1 && (
                        <Text style={{ fontSize: 14, fontWeight: '800', color: '#6B7280', marginBottom: Spacing.md, textTransform: 'uppercase', letterSpacing: 1 }}>Passenger {i + 1}</Text>
                      )}
                      {isQrLoading ? (
                          <Skeleton width={180} height={180} style={{ borderRadius: Radius.md }} />
                      ) : (
                        <Animated.View style={{ opacity: qrFadeAnim }}>
                          <QRCode
                            value={serialNumber}
                            size={180}
                            color="#000000"
                            backgroundColor="#FFFFFF"
                          />
                        </Animated.View>
                      )}
                      <Text style={styles.ticketIdText}>{serialNumber}</Text>
                    </View>
                    
                    {/* The Cutout Divider */}
                    <View style={styles.ticketDividerWrap}>
                      <View style={styles.ticketDashedLine} />
                    </View>

                  <View style={styles.physicalTicketBottom}>
                    <View style={styles.ticketRouteRow}>
                      <View style={styles.ticketRouteCol}>
                        <View style={styles.ticketRouteIconRow}>
                          <Ionicons name="train" size={14} color={Colors.accent} />
                          <Text style={styles.ticketStationShort}>{source.substring(0,4).toUpperCase()}</Text>
                        </View>
                        <Text style={styles.ticketStationFull} numberOfLines={2}>{source}</Text>
                      </View>
                      <View style={styles.ticketArrowWrap}>
                        <Text style={styles.ticketArrow}>------&gt;</Text>
                      </View>
                      <View style={[styles.ticketRouteCol, { alignItems: 'flex-end' }]}>
                        <View style={styles.ticketRouteIconRow}>
                          <Text style={styles.ticketStationShort}>{destination.substring(0,4).toUpperCase()}</Text>
                          <Ionicons name="train" size={14} color={Colors.accent} />
                        </View>
                        <Text style={[styles.ticketStationFull, { textAlign: 'right' }]} numberOfLines={2}>{destination}</Text>
                      </View>
                    </View>

                    <View style={styles.ticketDashedLineSecondary} />

                    <View style={styles.ticketGrid}>
                      <View style={styles.ticketGridRow}>
                        <Text style={styles.ticketGridLabel}>Date</Text>
                        <Text style={styles.ticketGridValue}>{new Date().toLocaleDateString()} ({new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})</Text>
                      </View>
                      <View style={styles.ticketGridRow}>
                        <Text style={styles.ticketGridLabel}>Passenger</Text>
                        <Text style={styles.ticketGridValue}>{ticketCount === 1 ? '1 Person' : `${ticketCount} People`}</Text>
                      </View>
                      <View style={styles.ticketGridRow}>
                        <Text style={styles.ticketGridLabel}>Amount</Text>
                        <Text style={styles.ticketGridValue}>₹{ticket.fare} x {ticketCount}</Text>
                      </View>
                      <View style={[styles.ticketGridRow, { marginTop: 4, paddingTop: 8, borderTopWidth: 1, borderTopColor: '#F3F4F6' }]}>
                        <Text style={[styles.ticketGridLabel, { color: '#000000' }]}>Total</Text>
                        <Text style={[styles.ticketGridValue, { color: '#10B981', fontSize: 16 }]}>₹{ticket.fare * ticketCount}</Text>
                      </View>
                    </View>
                  </View>
                </View>
              </View>
            );
            })}
          </ScrollView>

          {ticketCount > 1 && (
            <Animated.View style={[styles.swipeHintRow, { opacity: fadeAnim }]}>
              <View style={styles.dotsContainer}>
                {Array.from({ length: ticketCount }).map((_, idx) => (
                  <View key={idx} style={[styles.dot, activeSlide === idx && styles.dotActive]} />
                ))}
              </View>
            </Animated.View>
          )}
        </Animated.View>

        <View style={{ paddingHorizontal: Spacing.md }}>
          {/* Route Details */}
          {ticket.route && (
            <Card style={styles.routeCard}>
              <Text style={styles.routeCardTitle}>ROUTE DETAILS</Text>
              <RouteTrack route={ticket.route} maxStations={6} />
            </Card>
          )}

          {/* Actions */}
          <Button
            label="Done"
            variant="primary"
            size="lg"
            fullWidth
            onPress={handleDone}
            style={styles.doneBtn}
          />
          <Button
            label="Book Another Trip"
            variant="secondary"
            size="md"
            fullWidth
            icon="←"
            onPress={handleBookAnother}
            style={{ marginBottom: Spacing.xl }}
          />
        </View>
      </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const getStyles = (Colors: any, isDark: boolean) => StyleSheet.create({
  safe: { flex: 1 },
  scroll: { flex: 1 },
  content: { paddingBottom: 40 },

  success: {
    alignItems: 'center',
    paddingTop: Spacing.lg,
    marginBottom: Spacing.xl,
    paddingHorizontal: Spacing.md,
    gap: 4,
  },
  successIconWrapper: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: isDark ? 'rgba(255, 10, 84, 0.15)' : 'rgba(255, 10, 84, 0.1)',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 8,
  },
  successTitle: { fontSize: 26, fontWeight: '900', color: isDark ? '#F8FAFC' : '#0F172A' },
  successSubtitle: { fontSize: 14, color: isDark ? '#94A3B8' : '#475569', fontWeight: '500' },

  // Physical Ticket Implementation
  physicalTicket: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    width: '100%',
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 2,
  },
  physicalTicketTop: {
    paddingTop: Spacing.xxl,
    paddingBottom: Spacing.md,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: Spacing.xl,
  },
  ticketIdText: {
    fontSize: 18,
    color: Colors.accent,
    fontWeight: '800',
    marginTop: Spacing.lg,
    letterSpacing: 2,
  },
  ticketDividerWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 30,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: Spacing.xl,
  },
  ticketDashedLine: {
    flex: 1,
    borderBottomWidth: 2,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
  },
  physicalTicketBottom: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.xl,
    paddingTop: Spacing.sm,
  },
  ticketRouteRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  ticketRouteCol: { flex: 1 },
  ticketRouteIconRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  ticketStationShort: { fontSize: 18, fontWeight: '900', color: Colors.accent },
  ticketStationFull: { fontSize: 11, color: '#6B7280', fontWeight: '600' },
  ticketArrowWrap: { paddingHorizontal: 10, paddingTop: 2 },
  ticketArrow: { color: '#D1D5DB', fontWeight: '800', letterSpacing: 2 },
  ticketDashedLineSecondary: {
    width: '100%',
    borderBottomWidth: 1.5,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
    marginVertical: Spacing.md,
  },
  ticketGrid: { gap: 12 },
  ticketGridRow: { flexDirection: 'row', justifyContent: 'space-between' },
  ticketGridLabel: { fontSize: 13, color: '#4B5563', fontWeight: '700' },
  ticketGridValue: { fontSize: 14, color: '#111827', fontWeight: '800' },

  routeCard: { marginBottom: Spacing.lg, padding: Spacing.lg },
  routeCardTitle: { fontSize: 11, fontWeight: '800', letterSpacing: 1.5, textTransform: 'uppercase', color: Colors.textMuted, marginBottom: Spacing.lg },
  doneBtn: { marginBottom: Spacing.md },

  swipeHintRow: { alignItems: 'center', marginBottom: Spacing.xl, marginTop: -Spacing.sm },
  dotsContainer: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' },
  dotActive: { backgroundColor: isDark ? '#FF0A54' : '#D20042', width: 24 },
});
