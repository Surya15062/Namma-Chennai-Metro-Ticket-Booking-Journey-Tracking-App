import React, { useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Image, Animated, Easing,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { DarkColors, LightColors, Spacing, Radius } from '@/constants/theme';
import { useUserStore, useLanguageStore } from '@/store';

// ─── Menu Data ───────────────────────────────────────────────────────────────

type MenuRow = {
  id: string;
  icon: keyof typeof Ionicons['glyphMap'];
  label: string;
  sublabel?: string;
  route?: string;
  onPress?: () => void;
  badge?: string;
  danger?: boolean;
  accent?: boolean;
};

type Section = {
  title: string;
  rows: MenuRow[];
};

// ─── Animated Row Component ───────────────────────────────────────────────────

function MenuRowItem({
  row,
  isLast,
  Colors,
  styles,
  onPress,
}: {
  row: MenuRow;
  isLast: boolean;
  Colors: typeof DarkColors;
  styles: ReturnType<typeof getStyles>;
  onPress: () => void;
}) {
  const scaleAnim = React.useRef(new Animated.Value(1)).current;

  const handlePressIn = () =>
    Animated.timing(scaleAnim, { toValue: 0.97, duration: 100, useNativeDriver: true }).start();
  const handlePressOut = () =>
    Animated.timing(scaleAnim, { toValue: 1, duration: 100, useNativeDriver: true }).start();

  const iconColor = row.danger
    ? Colors.danger
    : row.accent
    ? Colors.accent
    : Colors.textSecondary;

  const iconBg = row.danger
    ? 'rgba(239,68,68,0.12)'
    : row.accent
    ? 'rgba(255,10,84,0.12)'
    : Colors.bgInput;

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity
        style={styles.menuRow}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={0.9}
      >
        {/* Icon Pill */}
        <View style={[styles.iconPill, { backgroundColor: iconBg }]}>
          <Ionicons name={row.icon} size={19} color={iconColor} />
        </View>

        {/* Label */}
        <View style={styles.rowLabel}>
          <Text style={[styles.rowText, row.danger && { color: Colors.danger }]}>
            {row.label}
          </Text>
          {row.sublabel ? (
            <Text style={styles.rowSublabel}>{row.sublabel}</Text>
          ) : null}
        </View>

        {/* Right side */}
        {row.badge ? (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{row.badge}</Text>
          </View>
        ) : null}
        <Ionicons
          name="chevron-forward"
          size={16}
          color={Colors.textMuted}
          style={{ opacity: row.danger ? 0 : 1 }}
        />
      </TouchableOpacity>
      {!isLast && <View style={styles.rowDivider} />}
    </Animated.View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function ProfileScreen() {
  const router = useRouter();
  const { user, isDark, toggleTheme, clearUser } = useUserStore();
  const { language } = useLanguageStore();
  const Colors = isDark ? DarkColors : LightColors;
  const styles = useMemo(() => getStyles(Colors, isDark), [isDark]);

  // Train animation for theme toggle
  const [trainAnim] = React.useState(new Animated.Value(-400));
  const [fadeAnim] = React.useState(new Animated.Value(0));
  const [isTransitioning, setIsTransitioning] = React.useState(false);

  const handleThemeToggle = () => {
    setIsTransitioning(true);
    Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }).start(() => {
      Animated.timing(trainAnim, {
        toValue: 600,
        duration: 800,
        easing: Easing.inOut(Easing.cubic),
        useNativeDriver: true,
      }).start(() => {
        toggleTheme();
        trainAnim.setValue(-400);
        Animated.timing(fadeAnim, { toValue: 0, duration: 300, useNativeDriver: true }).start(
          () => setIsTransitioning(false)
        );
      });
    });
  };

  const SECTIONS: Section[] = [
    {
      title: 'Account',
      rows: [
        {
          id: 'profile',
          icon: 'person-circle-outline',
          label: 'My Profile',
          sublabel: 'Name, email, phone',
          route: '/account',
        },
        {
          id: 'favourites',
          icon: 'heart-outline',
          label: 'Favourites',
          sublabel: 'Saved routes & stations',
          route: '/(tabs)/book',
        },
        {
          id: 'rides',
          icon: 'trail-sign-outline',
          label: 'My Rides',
          sublabel: 'Journey history',
          route: '/my-rides',
        },
        {
          id: 'payment',
          icon: 'wallet-outline',
          label: 'Payment Management',
          sublabel: 'UPI, cards & passes',
          route: '/payment-management',
        },
      ],
    },
    {
      title: 'Preferences',
      rows: [
        {
          id: 'appearance',
          icon: isDark ? 'moon' : 'sunny',
          label: 'App Appearance',
          sublabel: isDark ? 'Dark Mode' : 'Light Mode',
          onPress: handleThemeToggle,
          accent: true,
        },
        {
          id: 'transit',
          icon: 'train-outline',
          label: 'Transit Preferences',
          sublabel: 'Line, seat & accessibility',
          route: '/transit-preferences',
        },
        {
          id: 'language',
          icon: 'language-outline',
          label: 'App Language',
          sublabel: language,
          route: '/app-language',
        },
        {
          id: 'notifications',
          icon: 'notifications-outline',
          label: 'Notifications',
          sublabel: 'Alerts & reminders',
          route: '/(tabs)/book',
        },
      ],
    },
    {
      title: 'Support',
      rows: [
        {
          id: 'share',
          icon: 'share-social-outline',
          label: 'Share with Friends',
          route: '/(tabs)/book',
        },
        {
          id: 'help',
          icon: 'headset-outline',
          label: 'Help & Support',
          route: '/(tabs)/book',
        },
        {
          id: 'safety',
          icon: 'shield-checkmark-outline',
          label: 'Safety',
          route: '/(tabs)/book',
        },
        {
          id: 'about',
          icon: 'information-circle-outline',
          label: 'About Namma Chennai Metro',
          route: '/(tabs)/book',
        },
      ],
    },
    {
      title: 'Account Actions',
      rows: [
        {
          id: 'signout',
          icon: 'log-out-outline',
          label: 'Sign Out',
          danger: true,
          onPress: () => {
            clearUser();
            router.replace('/');
          },
        },
      ],
    },
  ];

  const displayName = user?.name || 'Traveller';
  const displayEmail = user?.email || 'No email set';
  const initials = displayName
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .substring(0, 2);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profile</Text>
        <TouchableOpacity
          style={styles.editBtn}
          onPress={() => router.push('/account')}
          activeOpacity={0.8}
        >
          <Ionicons name="create-outline" size={18} color={Colors.accent} />
          <Text style={styles.editBtnText}>Edit</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* ── Profile Hero Card ── */}
        <LinearGradient
          colors={
            isDark
              ? ['rgba(255,10,84,0.18)', 'rgba(255,10,84,0.04)']
              : ['rgba(255,10,84,0.1)', 'rgba(255,10,84,0.02)']
          }
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroCard}
        >
          {/* Avatar */}
          <TouchableOpacity
            onPress={() => router.push('/account')}
            activeOpacity={0.85}
            style={styles.avatarWrap}
          >
            {user?.avatar ? (
              <Image source={{ uri: user.avatar }} style={styles.avatar} />
            ) : (
              <LinearGradient
                colors={['#FF0A54', '#C9003D']}
                style={styles.avatarInitials}
              >
                <Text style={styles.initialsText}>{initials}</Text>
              </LinearGradient>
            )}
            {/* Camera badge */}
            <View style={[styles.cameraBadge, { backgroundColor: Colors.accent }]}>
              <Ionicons name="camera" size={11} color="#FFF" />
            </View>
          </TouchableOpacity>

          {/* User info */}
          <Text style={styles.heroName}>{displayName}</Text>
          <Text style={styles.heroEmail}>{displayEmail}</Text>

          {/* CTA */}
          <TouchableOpacity
            style={styles.viewProfileBtn}
            onPress={() => router.push('/account')}
            activeOpacity={0.85}
          >
            <Text style={styles.viewProfileText}>View Full Profile</Text>
            <Ionicons name="arrow-forward" size={14} color={Colors.accent} />
          </TouchableOpacity>
        </LinearGradient>

        {/* ── Sections ── */}
        <View style={styles.sectionsWrap}>
          {SECTIONS.map((section) => (
            <View key={section.title} style={styles.section}>
              <Text style={styles.sectionTitle}>{section.title.toUpperCase()}</Text>
              <View style={styles.sectionCard}>
                {section.rows.map((row, idx) => (
                  <MenuRowItem
                    key={row.id}
                    row={row}
                    isLast={idx === section.rows.length - 1}
                    Colors={Colors}
                    styles={styles}
                    onPress={
                      row.onPress
                        ? row.onPress
                        : row.route
                        ? () => router.push(row.route as any)
                        : () => {}
                    }
                  />
                ))}
              </View>
            </View>
          ))}
        </View>

        {/* ── App version ── */}
        <Text style={styles.versionText}>Namma Chennai Metro · v2.0.0</Text>
        <View style={{ height: 40 }} />
      </ScrollView>

      {/* ── Theme transition overlay ── */}
      {isTransitioning && (
        <Animated.View style={[styles.transitionOverlay, { opacity: fadeAnim }]}>
          <Animated.View style={{ transform: [{ translateX: trainAnim }] }}>
            <View style={styles.trainWrapper}>
              <Ionicons name="train" size={120} color={Colors.accent} />
              <View style={styles.speedLine1} />
              <View style={styles.speedLine2} />
              <View style={styles.speedLine3} />
            </View>
          </Animated.View>
        </Animated.View>
      )}
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const getStyles = (Colors: typeof DarkColors, isDark: boolean) =>
  StyleSheet.create({
    safe: { flex: 1, backgroundColor: Colors.bgBase },
    scroll: { flex: 1 },

    // Header
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
      backgroundColor: Colors.bgInput,
      alignItems: 'center',
      justifyContent: 'center',
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: '800',
      color: Colors.textPrimary,
      letterSpacing: -0.3,
    },
    editBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      backgroundColor: 'rgba(255,10,84,0.1)',
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: Radius.pill,
      borderWidth: 1,
      borderColor: 'rgba(255,10,84,0.2)',
    },
    editBtnText: {
      color: Colors.accent,
      fontSize: 14,
      fontWeight: '700',
    },

    // Hero Card
    heroCard: {
      marginHorizontal: Spacing.lg,
      marginTop: Spacing.sm,
      marginBottom: Spacing.xl,
      borderRadius: Radius.lg,
      paddingVertical: Spacing.xxl,
      paddingHorizontal: Spacing.xl,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: isDark ? 'rgba(255,10,84,0.15)' : 'rgba(255,10,84,0.1)',
    },
    avatarWrap: { position: 'relative', marginBottom: Spacing.lg },
    avatar: {
      width: 88,
      height: 88,
      borderRadius: 44,
      borderWidth: 3,
      borderColor: Colors.accent,
    },
    avatarInitials: {
      width: 88,
      height: 88,
      borderRadius: 44,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 3,
      borderColor: 'rgba(255,10,84,0.4)',
    },
    initialsText: {
      fontSize: 32,
      fontWeight: '900',
      color: '#FFFFFF',
      letterSpacing: -1,
    },
    cameraBadge: {
      position: 'absolute',
      bottom: 2,
      right: 2,
      width: 26,
      height: 26,
      borderRadius: 13,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 2,
      borderColor: Colors.bgBase,
    },
    heroName: {
      fontSize: 24,
      fontWeight: '800',
      color: Colors.textPrimary,
      letterSpacing: -0.5,
      marginBottom: 4,
    },
    heroEmail: {
      fontSize: 14,
      color: Colors.textMuted,
      fontWeight: '500',
      marginBottom: Spacing.lg,
    },
    viewProfileBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: 'rgba(255,10,84,0.1)',
      paddingHorizontal: 18,
      paddingVertical: 9,
      borderRadius: Radius.pill,
      borderWidth: 1,
      borderColor: 'rgba(255,10,84,0.2)',
    },
    viewProfileText: {
      color: Colors.accent,
      fontSize: 14,
      fontWeight: '700',
    },

    // Sections
    sectionsWrap: { paddingHorizontal: Spacing.lg },
    section: { marginBottom: Spacing.xl },
    sectionTitle: {
      fontSize: 11,
      fontWeight: '800',
      color: Colors.textMuted,
      letterSpacing: 1.5,
      marginBottom: Spacing.sm,
      marginLeft: Spacing.xs,
    },
    sectionCard: {
      backgroundColor: Colors.bgSurface,
      borderRadius: Radius.lg,
      borderWidth: 1,
      borderColor: Colors.border,
      overflow: 'hidden',
    },
    menuRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 14,
      paddingHorizontal: Spacing.lg,
      gap: Spacing.md,
    },
    iconPill: {
      width: 38,
      height: 38,
      borderRadius: Radius.sm,
      alignItems: 'center',
      justifyContent: 'center',
    },
    rowLabel: { flex: 1 },
    rowText: {
      fontSize: 15,
      fontWeight: '600',
      color: Colors.textPrimary,
      marginBottom: 1,
    },
    rowSublabel: {
      fontSize: 12,
      color: Colors.textMuted,
      fontWeight: '500',
    },
    badge: {
      backgroundColor: Colors.accent,
      paddingHorizontal: 9,
      paddingVertical: 3,
      borderRadius: Radius.pill,
    },
    badgeText: { color: '#FFF', fontSize: 11, fontWeight: '800' },
    rowDivider: {
      height: 1,
      backgroundColor: Colors.border,
      marginLeft: 16 + 38 + 12, // indented past icon
    },

    versionText: {
      textAlign: 'center',
      fontSize: 12,
      color: Colors.textMuted,
      fontWeight: '500',
      marginTop: Spacing.sm,
    },

    // Theme transition
    transitionOverlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: Colors.bgBase,
      zIndex: 999,
      justifyContent: 'center',
      alignItems: 'center',
    },
    trainWrapper: { flexDirection: 'row', alignItems: 'center' },
    speedLine1: {
      width: 120,
      height: 4,
      backgroundColor: Colors.accent,
      borderRadius: 2,
      marginLeft: -20,
      opacity: 0.8,
    },
    speedLine2: {
      width: 80,
      height: 2,
      backgroundColor: Colors.textMuted,
      borderRadius: 1,
      position: 'absolute',
      top: 20,
      left: -60,
      opacity: 0.5,
    },
    speedLine3: {
      width: 200,
      height: 2,
      backgroundColor: Colors.greenLine,
      borderRadius: 1,
      position: 'absolute',
      bottom: 20,
      left: -100,
      opacity: 0.6,
    },
  });
