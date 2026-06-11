import React, { useEffect, useCallback, useState, useMemo } from 'react';
import {
  ScrollView, View, Text, StyleSheet, TouchableOpacity,
  RefreshControl, Image, Modal, Dimensions, Animated, Platform, ImageBackground
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { DarkColors, LightColors, Spacing, Radius, Shadow } from '@/constants/theme';
import { Card, SectionHeader, LineDot, LiveIndicator, Skeleton, Divider } from '@/components/UI';
import { TrainTimingCard } from '@/components/TrainTimingCard';
import { Badge } from '@/components/Badge';
import { Button } from '@/components/Button';
import { useAppStore, useUserStore, useBookingStore } from '@/store';
import QRCode from 'react-native-qrcode-svg';
import { BlurView } from 'expo-blur';

// Known approximate coordinates for core Chennai Metro active stations
const METRO_NODES = [
  { name: 'Puratchi Thalaivi Dr. J. Jayalalithaa CMBT Metro', lat: 13.063, lon: 80.203 },
  { name: 'Arignar Anna Alandur Metro', lat: 13.004, lon: 80.201 },
  { name: 'Chennai International Airport', lat: 12.981, lon: 80.163 },
  { name: 'Puratchi Thalaivar Dr. M.G. Ramachandran Central Metro', lat: 13.081, lon: 80.273 },
  { name: 'Anna Nagar Tower', lat: 13.084, lon: 80.216 },
  { name: 'Vadapalani', lat: 13.050, lon: 80.211 },
  { name: 'Guindy', lat: 13.009, lon: 80.213 },
  { name: 'Washermanpet', lat: 13.109, lon: 80.287 },
  { name: 'Thirumangalam', lat: 13.085, lon: 80.194 }
];

const HOTSPOT_MAPPING: Record<string, string[]> = {
  'Vadapalani': ['Vadapalani Murugan Temple', 'Nexus Vijaya Mall'],
  'Government Estate': ['Marina Beach'],
  'Thousand Lights': ['Semmozhi Poonga'],
  'Egmore': ['Government Museum Chennai'],
  'High Court': ['Parrys Corner'],
  'Chennai Central': ['Ripon Building'],
  'Central Metro': ['Ripon Building'],
  'Puratchi Thalaivar Dr. M.G. Ramachandran Central Metro': ['Ripon Building'],
  'CMBT': ['Koyambedu Market'],
  'Puratchi Thalaivi Dr. J. Jayalalithaa CMBT Metro': ['Koyambedu Market'],
  'Anna Nagar Tower': ['Anna Nagar Tower Park'],
  'Guindy': ['Phoenix Marketcity Chennai'],
  'St Thomas Mount': ['St. Thomas Mount Church'],
  'Arignar Anna Alandur Metro': ['Kathipara Urban Square'],
  'Teynampet': ['Pondy Bazaar'],
};

const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const p = 0.017453292519943295; // Math.PI / 180
  const a = 0.5 - Math.cos((lat2 - lat1) * p) / 2 +
    Math.cos(lat1 * p) * Math.cos(lat2 * p) *
    (1 - Math.cos((lon2 - lon1) * p)) / 2;
  return 12742 * Math.asin(Math.sqrt(a)); // 2 * R; R = 6371 km
};

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { systemStatus, quickRoutes, isLoadingStatus, fetchSystemStatus, fetchQuickRoutes, removeQuickRoute } = useAppStore();
  const { user, isDark } = useUserStore();
  const { activeTicket, activeTicketCount, activeTicketBookedAt, clearActiveTicket } = useBookingStore();

  const Colors = isDark ? DarkColors : LightColors;
  const styles = useMemo(() => getStyles(Colors, isDark), [isDark]);

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  }, []);

  const [refreshing, setRefreshing] = useState(false);
  const [cityName, setCityName] = useState('Locating...');
  const [nearestStation, setNearestStation] = useState<string>('Locating...');
  const [walkingTime, setWalkingTime] = useState<number>(0);
  const [isTicketModalVisible, setTicketModalVisible] = useState(false);
  const [activeModalSlide, setActiveModalSlide] = useState(0);

  const hotspotText = useMemo(() => {
    if (!nearestStation || nearestStation === 'Locating...') return null;
    let suggestions: string[] = [];
    Object.keys(HOTSPOT_MAPPING).forEach(key => {
      if (nearestStation.includes(key)) suggestions = HOTSPOT_MAPPING[key];
    });
    
    if (suggestions.length === 0) return null;
    
    const hour = new Date().getHours();
    const isEveningOrWeekend = hour >= 16 || new Date().getDay() === 0 || new Date().getDay() === 6;
    
    const picked = suggestions.length > 1 ? (isEveningOrWeekend ? suggestions[1] : suggestions[0]) : suggestions[0];
    
    const shortNameKey = Object.keys(HOTSPOT_MAPPING).find(key => nearestStation.includes(key)) || nearestStation;
    let shortName = shortNameKey;
    if (shortName === 'Puratchi Thalaivar Dr. M.G. Ramachandran Central Metro' || shortName === 'Central Metro') shortName = 'Chennai Central';
    if (shortName === 'Puratchi Thalaivi Dr. J. Jayalalithaa CMBT Metro') shortName = 'CMBT';

    return `You’re near ${shortName} \u2013 Visit ${picked}?`;
  }, [nearestStation]);

  const activeTicketAnim = React.useRef(new Animated.Value(1)).current;
  const activeTicketOpacity = activeTicketAnim.interpolate({ inputRange: [0.95, 1], outputRange: [0.7, 1] });
  const handleTicketPressIn = () => Animated.timing(activeTicketAnim, { toValue: 0.95, duration: 150, useNativeDriver: true }).start();
  const handleTicketPressOut = () => Animated.timing(activeTicketAnim, { toValue: 1, duration: 150, useNativeDriver: true }).start();

  const heroBtnAnim = React.useRef(new Animated.Value(1)).current;
  const handleHeroBtnPressIn = () => Animated.timing(heroBtnAnim, { toValue: 0.93, duration: 120, useNativeDriver: true }).start();
  const handleHeroBtnPressOut = () => Animated.timing(heroBtnAnim, { toValue: 1, duration: 120, useNativeDriver: true }).start();

  const loadLocationAndNearestStation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setCityName('Location Disabled');
        setNearestStation('Chennai International Airport'); // Fallback purely for Live data visuals
        return;
      }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });

      const geocode = await Location.reverseGeocodeAsync({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      });
      if (geocode.length > 0) {
        setCityName(geocode[0].city || geocode[0].region || 'Chennai');
      } else {
        setCityName('Chennai');
      }

      // Calculate closest
      let closest = METRO_NODES[0];
      let minDistance = Infinity;
      METRO_NODES.forEach(node => {
        const d = getDistance(loc.coords.latitude, loc.coords.longitude, node.lat, node.lon);
        if (d < minDistance) {
          minDistance = d;
          closest = node;
        }
      });
      setNearestStation(closest.name);
      setWalkingTime(Math.max(1, Math.round(minDistance * 3))); // 1km ≈ 3 min walking
    } catch {
      setCityName('Chennai');
      setNearestStation('Puratchi Thalaivi Dr. J. Jayalalithaa CMBT Metro');
      setWalkingTime(0);
    }
  };

  const load = useCallback(async () => {
    await Promise.all([fetchSystemStatus(), fetchQuickRoutes(), loadLocationAndNearestStation()]);
  }, []);

  useEffect(() => { load(); }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, []);

  const isTicketValid = useMemo(() => {
    if (!activeTicket || !activeTicketBookedAt) return false;
    const now = Date.now();
    const hoursElapsed = (now - activeTicketBookedAt) / (1000 * 60 * 60);
    return hoursElapsed < 3;
  }, [activeTicket, activeTicketBookedAt]);

  useEffect(() => {
    if (activeTicket && !isTicketValid) {
      clearActiveTicket();
    }
  }, [activeTicket, isTicketValid, clearActiveTicket]);

  const handleQuickBook = (source: string, destination: string) => {
    router.push({ pathname: '/(tabs)/book', params: { source, destination } });
  };

  return (
    <View style={styles.safeContainer}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 80 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.accent} />}
      >
        {/* Premium Greeting Header */}
        <View style={[styles.header, { paddingTop: Math.max(insets.top + 10, Spacing.xl) }]}>
          <View style={styles.headerContent}>
            <Text style={styles.greetingText}>{greeting}!👋</Text>
            <Text style={styles.userName}>{user?.name || 'Surya'}</Text>
          </View>
          <TouchableOpacity onPress={() => router.push('/profile')} activeOpacity={0.8} style={styles.avatarButton}>
            {user?.avatar ? (
              <Image source={{ uri: user.avatar }} style={styles.avatarImage} />
            ) : (
              <View style={styles.avatarFallback}>
                <Ionicons name="person" size={22} color={Colors.white} />
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Content Wrapper */}
        <View style={styles.innerContent}>

          {/* Smart Location-Based Auto Card */}
          {hotspotText ? (
            <TouchableOpacity activeOpacity={0.8} style={[styles.smartCard, { backgroundColor: isDark ? Colors.bgSurface : '#FFFFFF', borderColor: isDark ? Colors.border : 'rgba(0,0,0,0.06)' }]}>
              <View style={styles.smartCardHeader}>
                <Ionicons name="location" size={14} color={Colors.accent} />
                <Text style={[styles.smartCardLabel, { color: Colors.accent }]}>METRO FAVOURITE</Text>
              </View>
              <View style={styles.smartCardBody}>
                <Text style={[styles.smartCardText, { color: Colors.textPrimary }]} numberOfLines={2}>{hotspotText}</Text>
                <View style={[styles.smartCardArrow, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)' }]}>
                  <Ionicons name="arrow-forward" size={14} color={Colors.textPrimary} />
                </View>
              </View>
            </TouchableOpacity>
          ) : (
            <View style={styles.areaRow}>
              <View style={styles.liveLocationPulse}>
                <View style={styles.liveLocationDot} />
              </View>
              <Text style={styles.area}>{cityName}</Text>
            </View>
          )}

          {/* Nearest Station */}
          <SectionHeader title="NEAREST METRO STATION" style={styles.sectionHeader} />
          <View style={styles.nearestWrapper}>
            <TrainTimingCard station={nearestStation} variant="reference" limit={3} walkingTime={walkingTime} />
          </View>

          {/* Book CTA */}
          <SectionHeader title="BOOK TICKET" style={styles.sectionHeader} />
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => router.push('/(tabs)/book')}
            onPressIn={handleHeroBtnPressIn}
            onPressOut={handleHeroBtnPressOut}
          >
            <Animated.View style={{ transform: [{ scale: heroBtnAnim }] }}>
              <View style={[styles.cleanBookCard, { backgroundColor: isDark ? Colors.bgSurface : '#FAFAFA', borderColor: isDark ? Colors.border : 'rgba(0,0,0,0.06)' }]}>
                {/* ── Content (Left Side) ── */}
                <View style={styles.cleanBookBody}>
                  <View style={styles.cleanBookIconBox}>
                    <Ionicons name="ticket-outline" size={16} color="#E1004C" />
                  </View>
                  <Text style={[styles.cleanBookTitle, { color: Colors.textPrimary }]}>Book Your{'\n'}Metro Ticket</Text>
                  <Text style={[styles.cleanBookSub, { color: Colors.textSecondary }]}>Quick. Smooth. Reliable.</Text>
                  
                  <View style={[styles.cleanBookBtn, { backgroundColor: '#E1004C' }]}>
                    <Text style={styles.cleanBookBtnText}>Book Now</Text>
                    <Ionicons name="arrow-forward" size={14} color="#FFF" />
                  </View>
                </View>

                {/* ── Clean Icon on Right Side ── */}
                <View style={styles.cleanBookRightIconWrap}>
                  <Ionicons name="ticket" size={90} color={isDark ? 'rgba(225,0,76,0.12)' : 'rgba(225,0,76,0.06)'} />
                </View>
              </View>
            </Animated.View>
          </TouchableOpacity>

          {/* Active Ticket */}
          <SectionHeader title="ACTIVE TICKET" style={styles.sectionHeader} />
          {isTicketValid && activeTicket ? (
            <Animated.View style={{ transform: [{ scale: activeTicketAnim }], opacity: activeTicketOpacity }}>
              <TouchableOpacity
                activeOpacity={0.95}
                onPress={() => setTicketModalVisible(true)}
                onPressIn={handleTicketPressIn}
                onPressOut={handleTicketPressOut}
              >
                <View style={[styles.activeTicketCard, { backgroundColor: Colors.bgSurface, borderColor: 'rgba(255,10,84,0.18)' }]}>
                  {/* Red accent top bar */}
                  <LinearGradient
                    colors={['#FF0A54', '#C9003D']}
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                    style={styles.activeTicketAccentBar}
                  >
                    <View style={styles.activeTicketBarContent}>
                      <Ionicons name="train" size={12} color="#FFF" />
                      <Text style={styles.activeTicketBrandBar}>M-TICKET · ACTIVE</Text>
                    </View>
                    <View style={styles.activeTicketValidChip}>
                      <View style={styles.activeTicketPulseDot} />
                      <Text style={styles.activeTicketValidText}>VALID</Text>
                    </View>
                  </LinearGradient>

                  <View style={styles.activeTicketBody}>
                    <View style={styles.activeTicketInfo}>
                      {/* Route timeline */}
                      <View style={styles.activeTicketRouteVertical}>
                        <View style={styles.atRouteRow}>
                          <View style={[styles.atDot, { backgroundColor: Colors.textMuted }]} />
                          <Text style={styles.activeTicketStation} numberOfLines={1}>{activeTicket.ticket.source}</Text>
                        </View>
                        <View style={[styles.atBar, { backgroundColor: Colors.accent + '60' }]} />
                        <View style={styles.atRouteRow}>
                          <View style={[styles.atDot, styles.atDotDest, { borderColor: Colors.accent }]} />
                          <Text style={[styles.activeTicketStation, { color: Colors.accent }]} numberOfLines={1}>
                            {activeTicket.ticket.destination}
                          </Text>
                        </View>
                      </View>
                      {/* Meta chips */}
                      <View style={styles.activeTicketChips}>
                        <View style={[styles.atChip, { backgroundColor: Colors.bgInput }]}>
                          <Ionicons name="people-outline" size={12} color={Colors.textMuted} />
                          <Text style={[styles.atChipText, { color: Colors.textSecondary }]}>
                            {activeTicketCount} {activeTicketCount === 1 ? 'pax' : 'pax'}
                          </Text>
                        </View>
                        <View style={[styles.atChip, { backgroundColor: Colors.bgInput }]}>
                          <Ionicons name="time-outline" size={12} color={Colors.textMuted} />
                          <Text style={[styles.atChipText, { color: Colors.textSecondary }]}>Valid 3h</Text>
                        </View>
                        <View style={[styles.atChip, { backgroundColor: 'rgba(255,10,84,0.1)' }]}>
                          <Text style={[styles.atChipText, { color: Colors.accent, fontWeight: '800' }]}>
                            ₹{(activeTicket.fare * (activeTicketCount || 1)).toFixed(0)}
                          </Text>
                        </View>
                      </View>
                    </View>

                    {/* QR Code */}
                    <View style={styles.activeTicketQR}>
                      <View style={styles.qrBg}>
                        <QRCode
                          value={activeTicket.ticket?.id ?? 'demo-qr'}
                          size={72}
                          color="#000000"
                          backgroundColor="#FFFFFF"
                        />
                      </View>
                      <Text style={[styles.qrHint, { color: Colors.textMuted }]}>Tap to expand</Text>
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            </Animated.View>
          ) : (
            <TouchableOpacity
              onPress={() => router.push('/(tabs)/book')}
              activeOpacity={0.85}
              style={[styles.emptyTicketCard, { backgroundColor: Colors.bgSurface, borderColor: Colors.border }]}
            >
              <LinearGradient
                colors={['rgba(255,10,84,0.07)', 'rgba(255,10,84,0.02)']}
                style={styles.emptyTicketGradient}
              >
                <View style={[styles.emptyTicketIconWrap, { backgroundColor: 'rgba(255,10,84,0.1)' }]}>
                  <Ionicons name="ticket-outline" size={28} color={Colors.accent} />
                </View>
                <View style={styles.emptyTicketText}>
                  <Text style={[styles.emptyTicketTitle, { color: Colors.textPrimary }]}>No Active Ticket</Text>
                  <Text style={[styles.emptyTicketSub, { color: Colors.textMuted }]}>Book your next metro journey</Text>
                </View>
                <View style={[styles.emptyTicketArrow, { backgroundColor: 'rgba(255,10,84,0.12)' }]}>
                  <Ionicons name="arrow-forward" size={18} color={Colors.accent} />
                </View>
              </LinearGradient>
            </TouchableOpacity>
          )}

          {/* System Status */}
          {systemStatus && (
            <>
              <SectionHeader
                title="SYSTEM STATUS"
                action={
                  <View style={styles.liveBadgeRow}>
                    <View style={[styles.liveLocationDot, { width: 6, height: 6, marginRight: 4 }]} />
                    <Text style={{ fontSize: 11, fontWeight: '800', color: Colors.success, textTransform: 'uppercase', letterSpacing: 0.5 }}>LIVE</Text>
                  </View>
                }
                style={styles.sectionHeader}
              />
              <View style={[styles.systemStatusCard, { backgroundColor: Colors.bgSurface, borderColor: Colors.border }]}>
                {Object.entries(systemStatus.lines).map(([line, info], idx, arr) => {
                  const isGood = info.status === 'Normal';
                  const lineColor = line === 'Green' ? Colors.greenLine : Colors.blueLine;
                  return (
                    <View key={line}>
                      <View style={[styles.modernRow, { paddingHorizontal: Spacing.lg, paddingVertical: 12 }]}>
                        <View style={[styles.systemLineDot, { backgroundColor: lineColor }]} />
                        <Text style={[styles.modernDir, { color: Colors.textPrimary }]}>{line} Line</Text>
                        <View style={[styles.systemStatusBadge, { backgroundColor: isGood ? Colors.success + '18' : Colors.warning + '18', borderColor: isGood ? Colors.success + '44' : Colors.warning + '44' }]}>
                          <View style={[styles.systemStatusDot, { backgroundColor: isGood ? Colors.success : Colors.warning }]} />
                          <Text style={[styles.systemStatusText, { color: isGood ? Colors.success : Colors.warning }]}>
                            {isGood ? 'Good Service' : info.status}
                          </Text>
                        </View>
                      </View>
                      {idx !== arr.length - 1 && <View style={[styles.modernDivider, { backgroundColor: Colors.border, marginLeft: Spacing.lg + 10 + 8 }]} />}
                    </View>
                  );
                })}
              </View>
            </>
          )}

          {/* Quick Routes */}
          <SectionHeader
            title="QUICK ROUTES"
            style={styles.sectionHeader}
            action={
              <TouchableOpacity onPress={() => router.push('/(tabs)/book')} style={styles.addBtn}>
                <Ionicons name="add" size={16} color={Colors.textSecondary} />
                <Text style={styles.addBtnText}>Add</Text>
              </TouchableOpacity>
            }
          />

          {quickRoutes.length === 0 ? (
            <View style={[styles.emptyState, { backgroundColor: Colors.bgSurface, borderColor: Colors.border }]}>
              <View style={[styles.emptyStateIcon, { backgroundColor: 'rgba(255,10,84,0.08)' }]}>
                <Ionicons name="map-outline" size={28} color={Colors.accent} />
              </View>
              <Text style={[styles.emptyText, { color: Colors.textPrimary }]}>No saved routes yet</Text>
              <Text style={[styles.emptySubText, { color: Colors.textMuted }]}>Book a journey and save it for quick access</Text>
            </View>
          ) : (
            quickRoutes.map((route) => (
              <View key={route.id} style={[styles.quickCard, { backgroundColor: Colors.bgSurface, borderColor: Colors.border }]}>
                <TouchableOpacity
                  style={styles.quickRow}
                  onPress={() => handleQuickBook(route.source, route.destination)}
                  activeOpacity={0.8}
                >
                  <View style={[styles.quickIcon, { backgroundColor: isDark ? 'rgba(255,10,84,0.1)' : 'rgba(255,10,84,0.08)' }]}>
                    <Ionicons name="swap-horizontal-outline" size={18} color={Colors.accent} />
                  </View>
                  <View style={styles.quickRouteInfo}>
                    <View style={styles.quickRouteRow}>
                      <View style={[styles.quickDot, { backgroundColor: Colors.textMuted }]} />
                      <Text style={[styles.quickSource, { color: Colors.textSecondary }]} numberOfLines={1}>{route.source}</Text>
                    </View>
                    <View style={[styles.quickLineBar, { backgroundColor: Colors.accent + '30' }]} />
                    <View style={styles.quickRouteRow}>
                      <View style={[styles.quickDot, styles.quickDotDest, { borderColor: Colors.accent }]} />
                      <Text style={[styles.quickDest, { color: Colors.textPrimary }]} numberOfLines={1}>{route.destination}</Text>
                    </View>
                  </View>
                  <View style={styles.quickRight}>
                    <View style={[styles.quickUseBadge, { backgroundColor: isDark ? 'rgba(255,10,84,0.1)' : 'rgba(255,10,84,0.08)' }]}>
                      <Text style={[styles.quickUseText, { color: Colors.accent }]}>{route.use_count}×</Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => removeQuickRoute(route.id)}
                      style={[styles.deleteBtn, { backgroundColor: 'rgba(239,68,68,0.08)' }]}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Ionicons name="trash-outline" size={15} color={Colors.danger} />
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              </View>
            ))
          )}

        </View>
      </ScrollView>

      {/* Ticket Modal Overlay */}
      <Modal visible={isTicketModalVisible} transparent animationType="slide" onRequestClose={() => setTicketModalVisible(false)}>
        <View style={styles.modalOverlay}>
          {activeTicket && activeTicketBookedAt && (
            <View style={styles.modalContent}>
              <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setTicketModalVisible(false)}>
                <Ionicons name="close" size={24} color="#FFFFFF" />
              </TouchableOpacity>

              <Text style={[styles.modalBrand, { color: Colors.accent }]}>NAMMA CHENNAI METRO</Text>
              <Text style={[styles.modalTitle, { color: '#FFFFFF' }]}>M-Ticket Details</Text>

              <ScrollView
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ alignItems: 'flex-start' }}
                onMomentumScrollEnd={(e) => {
                  const contentOffsetX = e.nativeEvent.contentOffset.x;
                  const slideW = Dimensions.get('window').width - 2 * Spacing.xl;
                  setActiveModalSlide(Math.round(contentOffsetX / slideW));
                }}
              >
                {Array.from({ length: activeTicketCount }).map((_, i) => (
                  <View key={i} style={{ width: Dimensions.get('window').width - 2 * Spacing.xl, paddingHorizontal: 4 }}>

                    {/* Premium Physical Ticket Design */}
                    <View style={styles.physicalTicket}>
                      <View style={styles.physicalTicketTop}>
                        {activeTicketCount > 1 && (
                          <Text style={{ fontSize: 13, fontWeight: '700', color: Colors.textSecondary, marginBottom: Spacing.sm }}>Passenger {i + 1}</Text>
                        )}
                        <QRCode
                          value={`${activeTicket.ticket?.source?.substring(0, 2).toUpperCase() ?? 'XX'}${activeTicket.ticket?.id?.substring(0, 4).toUpperCase() ?? '1111'}${String.fromCharCode(81 + i)}`}
                          size={180}
                          color="#000000"
                          backgroundColor="#FFFFFF"
                        />
                        <Text style={styles.ticketIdText}>
                          {`${activeTicket.ticket?.source?.substring(0, 2).toUpperCase() ?? 'XX'}${activeTicket.ticket?.id?.substring(0, 4).toUpperCase() ?? '1111'}${String.fromCharCode(81 + i)}`}
                        </Text>
                      </View>

                      {/* The Cutout Divider */}
                      <View style={styles.ticketDividerWrap}>
                        <View style={[styles.ticketNotch, styles.notchLeft]} />
                        <View style={styles.ticketDashedLine} />
                        <View style={[styles.ticketNotch, styles.notchRight]} />
                      </View>

                      <View style={styles.physicalTicketBottom}>
                        <View style={styles.ticketRouteRow}>
                          <View style={styles.ticketRouteCol}>
                            <View style={styles.ticketRouteIconRow}>
                              <Ionicons name="train" size={14} color={Colors.accent} />
                              <Text style={styles.ticketStationShort}>{activeTicket.ticket.source.substring(0, 4).toUpperCase()}</Text>
                            </View>
                            <Text style={styles.ticketStationFull} numberOfLines={2}>{activeTicket.ticket.source}</Text>
                          </View>
                          <View style={styles.ticketArrowWrap}>
                            <Text style={styles.ticketArrow}>------&gt;</Text>
                          </View>
                          <View style={[styles.ticketRouteCol, { alignItems: 'flex-end' }]}>
                            <View style={styles.ticketRouteIconRow}>
                              <Text style={styles.ticketStationShort}>{activeTicket.ticket.destination.substring(0, 4).toUpperCase()}</Text>
                              <Ionicons name="train" size={14} color={Colors.accent} />
                            </View>
                            <Text style={[styles.ticketStationFull, { textAlign: 'right' }]} numberOfLines={2}>{activeTicket.ticket.destination}</Text>
                          </View>
                        </View>

                        <View style={styles.ticketDashedLineSecondary} />

                        <View style={styles.ticketGrid}>
                          <View style={styles.ticketGridRow}>
                            <Text style={styles.ticketGridLabel}>Date</Text>
                            <Text style={styles.ticketGridValue}>{new Date(activeTicketBookedAt).toLocaleDateString()} ({new Date(activeTicketBookedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})</Text>
                          </View>
                          <View style={styles.ticketGridRow}>
                            <Text style={styles.ticketGridLabel}>Passenger</Text>
                            <Text style={styles.ticketGridValue}>{activeTicketCount} People</Text>
                          </View>
                          <View style={styles.ticketGridRow}>
                            <Text style={styles.ticketGridLabel}>Amount (One Way)</Text>
                            <Text style={styles.ticketGridValue}>₹{(activeTicket.fare * (activeTicketCount || 1)).toFixed(2)}</Text>
                          </View>
                        </View>
                      </View>
                    </View>

                  </View>
                ))}
              </ScrollView>
              {activeTicketCount > 1 && (
                <View style={styles.modalSwipeHintRow}>
                  <View style={styles.modalDotsContainer}>
                    {Array.from({ length: activeTicketCount }).map((_, idx) => (
                      <View key={idx} style={[styles.modalDot, activeModalSlide === idx && styles.modalDotActive]} />
                    ))}
                  </View>
                </View>
              )}
            </View>
          )}
        </View>
      </Modal>
    </View>
  );
}

const getStyles = (Colors: any, isDark: boolean) => StyleSheet.create({
  safeContainer: { flex: 1, backgroundColor: Colors.bgBase },
  scroll: { flex: 1 },
  content: {},   // paddingBottom set inline with insets
  innerContent: { paddingHorizontal: Spacing.lg },

  // ── Header ──────────────────────────────────────────────────
  header: {
    paddingHorizontal: Spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  headerContent: { flex: 1, paddingRight: Spacing.md },
  greetingText: {
    fontFamily: Platform.select({ ios: 'System', android: 'sans-serif-light', web: '"Inter", sans-serif' }) as string,
    fontWeight: '300',
    fontSize: Dimensions.get('window').width < 380 ? 14 : 16,
    color: Colors.textSecondary,
    marginTop: 6,
    marginBottom: -4,
    letterSpacing: 0.5,
  },
  userName: {
    fontFamily: Platform.select({ ios: 'System', android: 'sans-serif', web: '"Inter", sans-serif' }) as string,
    fontWeight: '600',
    fontSize: Dimensions.get('window').width < 380 ? 24 : 26,
    color: Colors.textPrimary,
    letterSpacing: -0.5,
    marginTop: 0,
  },
  avatarButton: {
    padding: 2,
    borderRadius: 25,
    borderWidth: 1.5,
    borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
  },
  avatarImage: { width: 48, height: 48, borderRadius: 24 },
  avatarFallback: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
    alignItems: 'center', justifyContent: 'center',
  },

  // ── Location row ────────────────────────────────────────────
  areaRow: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.lg },
  liveLocationPulse: {
    width: 14, height: 14, borderRadius: 7,
    backgroundColor: Colors.success + '25',
    alignItems: 'center', justifyContent: 'center',
    marginRight: 8,
  },
  liveLocationDot: {
    width: 7, height: 7, borderRadius: 3.5,
    backgroundColor: Colors.success,
  },
  area: { fontSize: 14, color: Colors.textSecondary, fontWeight: '700', letterSpacing: 0.4, flex: 1 },

  liveBadgeRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: isDark ? 'rgba(52,199,89,0.15)' : 'rgba(52,199,89,0.1)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: Radius.pill, borderWidth: 1, borderColor: isDark ? 'rgba(52,199,89,0.2)' : 'rgba(52,199,89,0.1)' },
  
  // ── Smart Auto Card ─────────────────────────────────────────
  smartCard: {
    marginBottom: Spacing.lg,
    padding: 14,
    borderRadius: Radius.lg,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: isDark ? 0.05 : 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  smartCardHeader: {
    flexDirection: 'row', alignItems: 'center',
    gap: 4, marginBottom: 8,
  },
  smartCardLabel: {
    fontSize: 10, fontWeight: '800', letterSpacing: 1.0,
  },
  smartCardBody: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  smartCardText: {
    flex: 1, fontSize: 13, fontWeight: '700', lineHeight: 20, marginRight: 10,
  },
  smartCardArrow: {
    width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center'
  },

  nearestWrapper: { marginBottom: Spacing.lg },
  stationLabelTxt: { fontSize: 22, fontWeight: '800', color: Colors.textPrimary },

  statusCard: { marginBottom: Spacing.lg, borderColor: Colors.border, padding: Spacing.lg },
  statusRow: { flexDirection: 'row', alignItems: 'center' },
  statusLabel: { fontSize: 11, fontWeight: '800', letterSpacing: 1.5, color: Colors.textMuted, marginBottom: 8 },
  linesRow: { flexDirection: 'row', gap: Spacing.md, flexWrap: 'wrap' },
  lineStatus: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  lineName: { fontSize: 13, fontWeight: '700', color: Colors.textSecondary },

  sectionHeader: { marginTop: Spacing.md, marginBottom: Spacing.sm },

  // ── Clean Book Card (matches screenshot exactly) ──────────────
  cleanBookCard: {
    borderRadius: 22,
    borderWidth: 1,
    marginBottom: Spacing.lg,
    flexDirection: 'row',
    overflow: 'hidden',
    minHeight: 180,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: isDark ? 0.15 : 0.08,
    shadowRadius: 20, elevation: 3,
  },
  cleanBookRightIconWrap: {
    position: 'absolute',
    right: 28,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  cleanBookBody: {
    width: '70%',
    padding: Spacing.xl,
    paddingRight: 0,
    gap: 4,
    justifyContent: 'center',
    zIndex: 2,
  },
  cleanBookIconBox: {
    width: 32, height: 32, borderRadius: 10,
    backgroundColor: '#FFF',
    borderWidth: 1, borderColor: 'rgba(0,0,0,0.08)',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 6,
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, shadowOffset: { width: 0, height: 2 },
  },
  cleanBookTitle: {
    fontSize: Dimensions.get('window').width < 380 ? 20 : 23,
    fontWeight: '900',
    letterSpacing: -0.5,
    lineHeight: 27,
  },
  cleanBookSub: {
    fontSize: Dimensions.get('window').width < 380 ? 12 : 13,
    fontWeight: '600',
    marginBottom: Spacing.sm,
  },
  cleanBookBtn: {
    alignSelf: 'flex-start',
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 16, paddingVertical: 10,
    borderRadius: Radius.pill,
    shadowColor: '#E1004C', shadowOpacity: 0.3, shadowRadius: 6, shadowOffset: { width: 0, height: 4 },
  },
  cleanBookBtnText: { color: '#FFF', fontSize: Dimensions.get('window').width < 380 ? 13 : 14, fontWeight: '800' },
  
  // legacy hero stubs (prevent undefined style refs)
  heroWrapper: { marginBottom: Spacing.lg, borderRadius: Radius.lg, overflow: 'hidden' },

  // ── System Status ────────────────────────────────────────────
  systemStatusCard: {
    borderRadius: Radius.lg, borderWidth: 1,
    marginBottom: Spacing.lg, overflow: 'hidden',
  },
  systemLineDot: { width: 10, height: 10, borderRadius: 5, marginRight: 10 },
  systemStatusBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: Radius.pill, borderWidth: 1,
  },
  systemStatusDot: { width: 5, height: 5, borderRadius: 2.5 },
  systemStatusText: { fontSize: 12, fontWeight: '700' },

  modernRow: { flexDirection: 'row', alignItems: 'center' },
  modernDivider: { height: 1 },
  modernDir: { flex: 1, fontSize: 15, fontWeight: '600' },

  // ── Quick Routes ─────────────────────────────────────────────
  quickCard: {
    marginBottom: Spacing.sm,
    borderRadius: Radius.lg, borderWidth: 1,
    overflow: 'hidden',
  },
  quickRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, padding: Spacing.lg },
  quickIcon: {
    width: 42, height: 42, borderRadius: Radius.md,
    alignItems: 'center', justifyContent: 'center',
  },
  quickRouteInfo: { flex: 1, gap: 4 },
  quickRouteRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  quickDot: { width: 7, height: 7, borderRadius: 3.5 },
  quickDotDest: { width: 9, height: 9, borderRadius: 4.5, borderWidth: 2, backgroundColor: 'transparent' },
  quickLineBar: { height: 18, width: 2, borderRadius: 1, marginLeft: 3.5 },
  quickSource: { fontSize: 13, fontWeight: '600', flex: 1 },
  quickDest: { fontSize: 14, fontWeight: '700', flex: 1 },
  quickRight: { alignItems: 'center', gap: 8 },
  quickUseBadge: {
    paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: Radius.pill,
  },
  quickUseText: { fontSize: 11, fontWeight: '800' },
  deleteBtn: {
    width: 30, height: 30, borderRadius: 8,
    alignItems: 'center', justifyContent: 'center',
  },
  addBtn: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.bgInput,
    paddingHorizontal: Spacing.md, paddingVertical: 6,
    borderRadius: Radius.pill, gap: 4,
  },
  addBtnText: { color: Colors.textPrimary, fontSize: 13, fontWeight: '600' },

  // ── Empty States ─────────────────────────────────────────────
  emptyState: {
    alignItems: 'center', paddingVertical: Spacing.xxl,
    marginBottom: Spacing.lg, borderRadius: Radius.lg,
    borderWidth: 1, gap: Spacing.sm,
  },
  emptyStateIcon: {
    width: 56, height: 56, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  emptyText: { fontSize: 15, textAlign: 'center', fontWeight: '700' },
  emptySubText: { fontSize: 13, textAlign: 'center', fontWeight: '500', paddingHorizontal: Spacing.xl },

  // ── Active Ticket ────────────────────────────────────────────
  activeTicketCard: {
    borderRadius: Radius.lg,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#FF0A54',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
  },
  activeTicketAccentBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: 8,
  },
  activeTicketBarContent: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  activeTicketBrandBar: { fontSize: 10, fontWeight: '900', color: '#FFF', letterSpacing: 1.2 },
  activeTicketValidChip: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  activeTicketPulseDot: { width: 5, height: 5, borderRadius: 2.5, backgroundColor: '#FFF' },
  activeTicketValidText: { fontSize: 10, fontWeight: '900', color: '#FFF', letterSpacing: 1 },
  activeTicketBody: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  activeTicketInfo: { flex: 1 },
  activeTicketRouteVertical: { marginBottom: Spacing.md },
  atRouteRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  atDot: { width: 8, height: 8, borderRadius: 4 },
  atDotDest: { width: 10, height: 10, borderRadius: 5, borderWidth: 2, backgroundColor: 'transparent' },
  atBar: { height: 18, width: 2, borderRadius: 1, marginLeft: 3 },
  activeTicketStation: { fontSize: 14, fontWeight: '700', color: Colors.textPrimary, flex: 1 },
  activeTicketChips: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  atChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 8, paddingVertical: 4,
    borderRadius: Radius.pill,
  },
  atChipText: { fontSize: 11, fontWeight: '700' },
  activeTicketQR: { alignItems: 'center', gap: 5 },
  qrBg: {
    padding: 8, borderRadius: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: 1, borderColor: 'rgba(0,0,0,0.08)',
  },
  qrHint: { fontSize: 9, fontWeight: '600', letterSpacing: 0.3 },

  // Empty ticket card
  emptyTicketCard: {
    borderRadius: Radius.lg, marginBottom: Spacing.lg,
    borderWidth: 1, overflow: 'hidden',
  },
  emptyTicketGradient: {
    flexDirection: 'row', alignItems: 'center',
    padding: Spacing.lg, gap: Spacing.md,
  },
  emptyTicketIconWrap: {
    width: 48, height: 48, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
  },
  emptyTicketText: { flex: 1 },
  emptyTicketTitle: { fontSize: 15, fontWeight: '800', marginBottom: 3 },
  emptyTicketSub: { fontSize: 12, fontWeight: '500' },
  emptyTicketArrow: {
    width: 36, height: 36, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
  },

  // Unused legacy kept for Card component compatibility
  emptyBtn: { marginTop: Spacing.sm, paddingVertical: 6, paddingHorizontal: 12, borderRadius: Radius.pill, backgroundColor: 'rgba(255, 10, 84, 0.12)' },
  emptyBtnText: { color: Colors.accent, fontSize: 14, fontWeight: '700' },

  // ── Ticket Modal ─────────────────────────────────────────────
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.88)',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
  },
  modalContent: {
    alignItems: 'center',
    paddingBottom: Spacing.xl,
    paddingTop: Spacing.xl,
  },
  modalCloseBtn: {
    position: 'absolute', top: -20, right: 0,
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255,10,84,0.18)',
    alignItems: 'center', justifyContent: 'center',
    zIndex: 10,
  },
  modalBrand: {
    fontSize: 11, fontWeight: '800', color: Colors.accent,
    letterSpacing: 2.5, marginBottom: 4,
  },
  modalTitle: {
    fontSize: 22, fontWeight: '900',
    color: '#FFFFFF', marginBottom: Spacing.lg,
  },
  physicalTicket: {
    backgroundColor: '#FFFFFF', borderRadius: 20,
    width: '100%', overflow: 'hidden',
  },
  physicalTicketTop: {
    paddingTop: Spacing.xxl, paddingBottom: Spacing.md,
    alignItems: 'center', backgroundColor: '#FFFFFF',
    paddingHorizontal: Spacing.xl,
  },
  ticketIdText: {
    fontSize: 15, color: Colors.accent, fontWeight: '800',
    marginTop: Spacing.lg, letterSpacing: 1.5,
  },
  ticketDividerWrap: {
    flexDirection: 'row', alignItems: 'center',
    height: 40, position: 'relative', backgroundColor: '#FFFFFF',
  },
  ticketNotch: {
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: 'rgba(0,0,0,0.88)',
    position: 'absolute', zIndex: 2,
  },
  notchLeft: { left: -15 },
  notchRight: { right: -15 },
  ticketDashedLine: {
    flex: 1, borderBottomWidth: 2,
    borderColor: '#E5E7EB', borderStyle: 'dashed',
    marginHorizontal: 15,
  },
  physicalTicketBottom: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.xl,
    paddingTop: Spacing.sm,
  },
  ticketRouteRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'flex-start', marginBottom: Spacing.md,
  },
  ticketRouteCol: { flex: 1 },
  ticketRouteIconRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  ticketStationShort: { fontSize: 18, fontWeight: '900', color: Colors.accent },
  ticketStationFull: { fontSize: 11, color: '#6B7280', fontWeight: '600' },
  ticketArrowWrap: { paddingHorizontal: 10, paddingTop: 2 },
  ticketArrow: { color: '#D1D5DB', fontWeight: '800', letterSpacing: 2 },
  ticketDashedLineSecondary: {
    width: '100%', borderBottomWidth: 1.5, borderColor: '#E5E7EB',
    borderStyle: 'dashed', marginVertical: Spacing.md,
  },
  ticketGrid: { gap: 12 },
  ticketGridRow: { flexDirection: 'row', justifyContent: 'space-between' },
  ticketGridLabel: { fontSize: 13, color: '#4B5563', fontWeight: '700' },
  ticketGridValue: { fontSize: 14, color: '#111827', fontWeight: '800' },

  modalSwipeHintRow: { alignItems: 'center', marginTop: Spacing.lg },
  modalDotsContainer: { flexDirection: 'row', gap: 4, marginBottom: 6 },
  modalDot: { width: 5, height: 5, borderRadius: 2.5, backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' },
  modalDotActive: { backgroundColor: Colors.accent, width: 12 },
  modalSwipeText: { fontSize: 11, color: Colors.textSecondary, fontWeight: '700' },
});
