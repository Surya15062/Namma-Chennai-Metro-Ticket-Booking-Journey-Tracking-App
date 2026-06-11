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
  TextInput,
  Alert,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { DarkColors, LightColors, Spacing, Radius } from '@/constants/theme';
import { useUserStore, usePaymentStore } from '@/store';
import type { UpiProvider, SavedUpiId, SavedBankAccount } from '@/store';

// ─── Provider Config ──────────────────────────────────────────────────────────

type ProviderMeta = {
  id: UpiProvider;
  color: string;
  darkColor: string;
  iconName: keyof typeof Ionicons['glyphMap'];
  handle: string;       // typical UPI handle suffix
  tagline: string;
};

const PROVIDERS: ProviderMeta[] = [
  {
    id: 'Google Pay',
    color: '#4285F4',
    darkColor: '#5B9BFF',
    iconName: 'logo-google',
    handle: '@okicici / @okhdfcbank',
    tagline: 'Pay with your Google account',
  },
  {
    id: 'PhonePe',
    color: '#5F259F',
    darkColor: '#9B59FF',
    iconName: 'phone-portrait-outline',
    handle: '@ybl',
    tagline: 'India\'s most-used UPI app',
  },
  {
    id: 'Paytm',
    color: '#00B9F1',
    darkColor: '#3ED4FF',
    iconName: 'wallet-outline',
    handle: '@paytm',
    tagline: 'Pay with Paytm wallet or UPI',
  },
  {
    id: 'Other UPI',
    color: '#FF6B35',
    darkColor: '#FF8E5E',
    iconName: 'apps-outline',
    handle: '@upi',
    tagline: 'Any BHIM-compatible UPI ID',
  },
];

const getProvider = (id: UpiProvider) => PROVIDERS.find((p) => p.id === id) ?? PROVIDERS[3];

// ─── Animated scale wrapper ───────────────────────────────────────────────────

function Pressable2({
  children,
  onPress,
  style,
}: {
  children: React.ReactNode;
  onPress: () => void;
  style?: any;
}) {
  const scale = useRef(new Animated.Value(1)).current;
  const pressIn = () =>
    Animated.spring(scale, { toValue: 0.97, useNativeDriver: true, speed: 50 }).start();
  const pressOut = () =>
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 20 }).start();
  return (
    <Animated.View style={[{ transform: [{ scale }] }, style]}>
      <TouchableOpacity
        onPress={onPress}
        onPressIn={pressIn}
        onPressOut={pressOut}
        activeOpacity={0.9}
      >
        {children}
      </TouchableOpacity>
    </Animated.View>
  );
}

// ─── Provider Icon Badge ──────────────────────────────────────────────────────

function ProviderBadge({
  provider,
  size = 40,
  isDark,
}: {
  provider: UpiProvider;
  size?: number;
  isDark: boolean;
}) {
  const meta = getProvider(provider);
  const color = isDark ? meta.darkColor : meta.color;
  return (
    <View
      style={[
        pb.wrap,
        {
          width: size,
          height: size,
          borderRadius: size / 4,
          backgroundColor: color + '18',
          borderColor: color + '44',
        },
      ]}
    >
      <Ionicons name={meta.iconName} size={size * 0.5} color={color} />
    </View>
  );
}
const pb = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
  },
});

// ─── Add UPI Modal ────────────────────────────────────────────────────────────

function AddUpiModal({
  visible,
  onClose,
  onAdd,
  Colors,
  isDark,
}: {
  visible: boolean;
  onClose: () => void;
  onAdd: (provider: UpiProvider, upiId: string) => void;
  Colors: typeof DarkColors;
  isDark: boolean;
}) {
  const [selectedProvider, setSelectedProvider] = useState<UpiProvider>('Google Pay');
  const [upiId, setUpiId] = useState('');

  const meta = getProvider(selectedProvider);
  const color = isDark ? meta.darkColor : meta.color;
  const isValid = upiId.trim().length > 4 && upiId.includes('@');

  const handleAdd = () => {
    if (!isValid) return;
    onAdd(selectedProvider, upiId.trim());
    setUpiId('');
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={am.overlay} onPress={onClose}>
        <Pressable
          style={[am.sheet, { backgroundColor: Colors.bgSurface }]}
          onPress={() => {}}
        >
          <View style={[am.handle, { backgroundColor: Colors.border }]} />
          <Text style={[am.title, { color: Colors.textPrimary }]}>Add UPI ID</Text>

          {/* Provider selector */}
          <Text style={[am.sublabel, { color: Colors.textMuted }]}>Choose provider</Text>
          <View style={am.providerGrid}>
            {PROVIDERS.map((p) => {
              const c = isDark ? p.darkColor : p.color;
              const isActive = selectedProvider === p.id;
              return (
                <TouchableOpacity
                  key={p.id}
                  style={[
                    am.providerChip,
                    {
                      backgroundColor: isActive ? c + '18' : Colors.bgInput,
                      borderColor: isActive ? c : Colors.border,
                    },
                  ]}
                  onPress={() => setSelectedProvider(p.id)}
                  activeOpacity={0.8}
                >
                  <Ionicons
                    name={p.iconName}
                    size={16}
                    color={isActive ? c : Colors.textMuted}
                  />
                  <Text
                    style={[
                      am.providerChipLabel,
                      { color: isActive ? c : Colors.textMuted },
                    ]}
                  >
                    {p.id.split(' ')[0]}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* UPI input */}
          <Text style={[am.sublabel, { color: Colors.textMuted }]}>
            Enter UPI ID{' '}
            <Text style={{ fontWeight: '400', fontSize: 11 }}>
              (e.g. name{meta.handle.split('/')[0].trim()})
            </Text>
          </Text>
          <View
            style={[
              am.inputWrap,
              {
                backgroundColor: Colors.bgInput,
                borderColor: isValid ? color : Colors.border,
              },
            ]}
          >
            <Ionicons name="at-outline" size={18} color={Colors.textMuted} />
            <TextInput
              style={[am.input, { color: Colors.textPrimary }]}
              value={upiId}
              onChangeText={setUpiId}
              placeholder={`yourname${meta.handle.split('/')[0].trim()}`}
              placeholderTextColor={Colors.textMuted}
              autoCapitalize="none"
              keyboardType="email-address"
            />
            {isValid && <Ionicons name="checkmark-circle" size={18} color={isDark ? meta.darkColor : meta.color} />}
          </View>

          {/* Buttons */}
          <View style={am.btnRow}>
            <TouchableOpacity
              style={[am.btn, { backgroundColor: Colors.bgInput, borderColor: Colors.border, borderWidth: 1 }]}
              onPress={onClose}
              activeOpacity={0.8}
            >
              <Text style={[am.btnText, { color: Colors.textSecondary }]}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                am.btn,
                { backgroundColor: isValid ? Colors.accent : Colors.bgInput, opacity: isValid ? 1 : 0.5 },
              ]}
              onPress={handleAdd}
              disabled={!isValid}
              activeOpacity={0.8}
            >
              <Text style={[am.btnText, { color: isValid ? '#FFF' : Colors.textMuted }]}>
                Add UPI
              </Text>
            </TouchableOpacity>
          </View>
          <View style={{ height: 20 }} />
        </Pressable>
      </Pressable>
    </Modal>
  );
}
const am = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'flex-end' },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 12,
    paddingHorizontal: Spacing.xl,
  },
  handle: {
    width: 40, height: 4, borderRadius: 2,
    alignSelf: 'center', marginBottom: 16,
  },
  title: { fontSize: 20, fontWeight: '800', marginBottom: 20, letterSpacing: -0.3 },
  sublabel: {
    fontSize: 11, fontWeight: '700', letterSpacing: 1,
    textTransform: 'uppercase', marginBottom: 10,
  },
  providerGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  providerChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 12, paddingVertical: 9,
    borderRadius: Radius.pill, borderWidth: 1.5,
  },
  providerChipLabel: { fontSize: 13, fontWeight: '700' },
  inputWrap: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    borderRadius: Radius.md, borderWidth: 1.5,
    paddingHorizontal: 14, paddingVertical: 12,
    marginBottom: 20,
  },
  input: { flex: 1, fontSize: 15, fontWeight: '500', padding: 0 },
  btnRow: { flexDirection: 'row', gap: 10 },
  btn: {
    flex: 1, paddingVertical: 14,
    borderRadius: Radius.lg, alignItems: 'center',
  },
  btnText: { fontSize: 15, fontWeight: '700' },
});

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function PaymentManagementScreen() {
  const router = useRouter();
  const { isDark } = useUserStore();
  const Colors = isDark ? DarkColors : LightColors;

  const {
    savedUpiIds,
    savedBankAccounts,
    defaultPaymentId,
    addUpiId,
    removeUpiId,
    setDefaultPayment,
    addBankAccount,
    removeBankAccount,
  } = usePaymentStore();

  const [addUpiVisible, setAddUpiVisible] = useState(false);

  // ── Helper: confirm remove ──
  const confirmRemoveUpi = (upi: SavedUpiId) => {
    Alert.alert(
      'Remove Payment Method',
      `Remove ${upi.upiId}? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Remove', style: 'destructive', onPress: () => removeUpiId(upi.id) },
      ]
    );
  };

  const confirmRemoveBank = (bank: SavedBankAccount) => {
    Alert.alert(
      'Remove Bank Account',
      `Remove bank account ending in •••• ${bank.accountLast4}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Remove', style: 'destructive', onPress: () => removeBankAccount(bank.id) },
      ]
    );
  };

  // Default item label
  const defaultLabel = (() => {
    const upi = savedUpiIds.find((u) => u.id === defaultPaymentId);
    if (upi) return `${upi.provider} · ${upi.upiId}`;
    const bank = savedBankAccounts.find((b) => b.id === defaultPaymentId);
    if (bank) return `${bank.bankName} ···· ${bank.accountLast4}`;
    return 'None set';
  })();

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
        <Text style={[styles.headerTitle, { color: Colors.textPrimary }]}>
          Payment Management
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>

        {/* ── Security strip ── */}
        <LinearGradient
          colors={
            isDark
              ? ['rgba(16,185,129,0.14)', 'rgba(16,185,129,0.03)']
              : ['rgba(5,150,105,0.08)', 'rgba(5,150,105,0.01)']
          }
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[
            styles.secureStrip,
            { borderColor: Colors.success + (isDark ? '33' : '22') },
          ]}
        >
          <View style={[styles.secureBadge, { backgroundColor: Colors.success + '22' }]}>
            <Ionicons name="shield-checkmark" size={18} color={Colors.success} />
          </View>
          <View style={styles.secureText}>
            <Text style={[styles.secureTitle, { color: Colors.textPrimary }]}>
              Secure Payments
            </Text>
            <Text style={[styles.secureSub, { color: Colors.textMuted }]}>
              All transactions are encrypted &amp; PCI-DSS compliant
            </Text>
          </View>
        </LinearGradient>

        <View style={styles.content}>

          {/* ────────────────────────────────────────────────────── */}
          {/* Default Payment Method */}
          {/* ────────────────────────────────────────────────────── */}
          <View style={styles.section}>
            <Text style={[styles.sectionLabel, { color: Colors.textMuted }]}>DEFAULT METHOD</Text>
            <View style={[styles.card, { backgroundColor: Colors.bgSurface, borderColor: Colors.border }]}>
              <View style={styles.defaultRow}>
                <View style={[styles.defaultIcon, { backgroundColor: Colors.accent + '18' }]}>
                  <Ionicons name="star" size={18} color={Colors.accent} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.defaultLabel, { color: Colors.textPrimary }]}>
                    Default Payment
                  </Text>
                  <Text style={[styles.defaultValue, { color: Colors.accent }]} numberOfLines={1}>
                    {defaultLabel}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
              </View>
            </View>
          </View>

          {/* ────────────────────────────────────────────────────── */}
          {/* Saved UPI IDs */}
          {/* ────────────────────────────────────────────────────── */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionLabel, { color: Colors.textMuted }]}>SAVED UPI IDs</Text>
              <TouchableOpacity
                style={[styles.addBtn, { backgroundColor: 'rgba(255,10,84,0.1)', borderColor: 'rgba(255,10,84,0.2)' }]}
                onPress={() => setAddUpiVisible(true)}
                activeOpacity={0.8}
              >
                <Ionicons name="add" size={15} color={Colors.accent} />
                <Text style={[styles.addBtnText, { color: Colors.accent }]}>Add</Text>
              </TouchableOpacity>
            </View>

            {savedUpiIds.length === 0 ? (
              <View style={[styles.emptyCard, { backgroundColor: Colors.bgSurface, borderColor: Colors.border }]}>
                <Ionicons name="wallet-outline" size={32} color={Colors.textMuted} style={{ opacity: 0.5 }} />
                <Text style={[styles.emptyText, { color: Colors.textMuted }]}>No UPI IDs saved</Text>
                <TouchableOpacity
                  style={[styles.emptyAddBtn, { backgroundColor: 'rgba(255,10,84,0.1)' }]}
                  onPress={() => setAddUpiVisible(true)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.emptyAddText, { color: Colors.accent }]}>+ Add UPI ID</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={[styles.card, { backgroundColor: Colors.bgSurface, borderColor: Colors.border }]}>
                {savedUpiIds.map((upi, idx) => {
                  const meta = getProvider(upi.provider);
                  const color = isDark ? meta.darkColor : meta.color;
                  const isDefault = upi.id === defaultPaymentId;
                  return (
                    <React.Fragment key={upi.id}>
                      <View style={styles.upiRow}>
                        <ProviderBadge provider={upi.provider} isDark={isDark} />
                        <View style={styles.upiInfo}>
                          <View style={styles.upiNameRow}>
                            <Text style={[styles.upiProvider, { color: Colors.textPrimary }]}>
                              {upi.provider}
                            </Text>
                            {isDefault && (
                              <View style={[styles.defaultTag, { backgroundColor: color + '22', borderColor: color + '55' }]}>
                                <Text style={[styles.defaultTagText, { color }]}>Default</Text>
                              </View>
                            )}
                          </View>
                          <Text style={[styles.upiId, { color: Colors.textMuted }]}>
                            {upi.upiId}
                          </Text>
                        </View>
                        {/* Actions */}
                        <View style={styles.upiActions}>
                          {!isDefault && (
                            <TouchableOpacity
                              style={[styles.actionBtn, { backgroundColor: color + '15' }]}
                              onPress={() => setDefaultPayment(upi.id)}
                              activeOpacity={0.8}
                            >
                              <Text style={[styles.actionBtnText, { color }]}>Set Default</Text>
                            </TouchableOpacity>
                          )}
                          <TouchableOpacity
                            style={[styles.actionBtn, { backgroundColor: 'rgba(239,68,68,0.1)' }]}
                            onPress={() => confirmRemoveUpi(upi)}
                            activeOpacity={0.8}
                          >
                            <Ionicons name="trash-outline" size={14} color={Colors.danger} />
                          </TouchableOpacity>
                        </View>
                      </View>
                      {idx < savedUpiIds.length - 1 && (
                        <View style={[styles.divider, { backgroundColor: Colors.border, marginLeft: 16 + 40 + 12 }]} />
                      )}
                    </React.Fragment>
                  );
                })}
              </View>
            )}
          </View>

          {/* ────────────────────────────────────────────────────── */}
          {/* Quick-add Provider Chips */}
          {/* ────────────────────────────────────────────────────── */}
          <View style={styles.section}>
            <Text style={[styles.sectionLabel, { color: Colors.textMuted }]}>QUICK ADD</Text>
            <View style={styles.providerShortcuts}>
              {PROVIDERS.map((p) => {
                const color = isDark ? p.darkColor : p.color;
                const alreadyAdded = savedUpiIds.some((u) => u.provider === p.id);
                return (
                  <Pressable2
                    key={p.id}
                    onPress={() => setAddUpiVisible(true)}
                    style={styles.shortcutCard}
                  >
                    <LinearGradient
                      colors={[color + '22', color + '08']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={[
                        styles.shortcutInner,
                        { borderColor: color + '44' },
                      ]}
                    >
                      <Ionicons name={p.iconName} size={26} color={color} />
                      <Text style={[styles.shortcutLabel, { color: Colors.textPrimary }]}>
                        {p.id.split(' ')[0]}
                      </Text>
                      <Text style={[styles.shortcutHandle, { color }]}>{p.handle.split('/')[0].trim()}</Text>
                      {alreadyAdded && (
                        <View style={[styles.shortcutBadge, { backgroundColor: color + '22' }]}>
                          <Ionicons name="checkmark" size={10} color={color} />
                        </View>
                      )}
                    </LinearGradient>
                  </Pressable2>
                );
              })}
            </View>
          </View>

          {/* ────────────────────────────────────────────────────── */}
          {/* Saved Bank Accounts */}
          {/* ────────────────────────────────────────────────────── */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionLabel, { color: Colors.textMuted }]}>BANK ACCOUNTS</Text>
              <TouchableOpacity
                style={[styles.addBtn, { backgroundColor: isDark ? 'rgba(59,130,246,0.12)' : 'rgba(37,99,235,0.08)', borderColor: Colors.blueLine + '44' }]}
                onPress={() => {
                  Alert.prompt(
                    'Add Bank Account',
                    'Enter bank name (e.g. HDFC Bank)',
                    [
                      { text: 'Cancel', style: 'cancel' },
                      {
                        text: 'Next',
                        onPress: (bankName?: string) => {
                          if (!bankName) return;
                          addBankAccount(bankName, '1234', 'HDFC0000001');
                        },
                      },
                    ],
                    'plain-text',
                    '',
                    'default'
                  );
                }}
                activeOpacity={0.8}
              >
                <Ionicons name="add" size={15} color={Colors.blueLine} />
                <Text style={[styles.addBtnText, { color: Colors.blueLine }]}>Link</Text>
              </TouchableOpacity>
            </View>

            {savedBankAccounts.length === 0 ? (
              <View style={[styles.emptyCard, { backgroundColor: Colors.bgSurface, borderColor: Colors.border }]}>
                <Ionicons name="business-outline" size={32} color={Colors.textMuted} style={{ opacity: 0.5 }} />
                <Text style={[styles.emptyText, { color: Colors.textMuted }]}>No bank accounts linked</Text>
                <Text style={[styles.emptySub, { color: Colors.textMuted }]}>
                  Link your bank account for direct debit payments
                </Text>
              </View>
            ) : (
              <View style={[styles.card, { backgroundColor: Colors.bgSurface, borderColor: Colors.border }]}>
                {savedBankAccounts.map((bank, idx) => (
                  <React.Fragment key={bank.id}>
                    <View style={styles.bankRow}>
                      <View style={[styles.bankIcon, { backgroundColor: Colors.bgInput }]}>
                        <Ionicons name="business-outline" size={20} color={Colors.textSecondary} />
                      </View>
                      <View style={styles.bankInfo}>
                        <Text style={[styles.bankName, { color: Colors.textPrimary }]}>
                          {bank.bankName}
                        </Text>
                        <Text style={[styles.bankAcct, { color: Colors.textMuted }]}>
                          AC •••• {bank.accountLast4} · IFSC {bank.ifsc}
                        </Text>
                      </View>
                      <TouchableOpacity
                        style={[styles.actionBtn, { backgroundColor: 'rgba(239,68,68,0.1)' }]}
                        onPress={() => confirmRemoveBank(bank)}
                        activeOpacity={0.8}
                      >
                        <Ionicons name="trash-outline" size={14} color={Colors.danger} />
                      </TouchableOpacity>
                    </View>
                    {idx < savedBankAccounts.length - 1 && (
                      <View style={[styles.divider, { backgroundColor: Colors.border, marginLeft: 16 + 44 + 12 }]} />
                    )}
                  </React.Fragment>
                ))}
              </View>
            )}
          </View>

          {/* ────────────────────────────────────────────────────── */}
          {/* Settings rows */}
          {/* ────────────────────────────────────────────────────── */}
          <View style={styles.section}>
            <Text style={[styles.sectionLabel, { color: Colors.textMuted }]}>PAYMENT SETTINGS</Text>
            <View style={[styles.card, { backgroundColor: Colors.bgSurface, borderColor: Colors.border }]}>
              {[
                {
                  icon: 'finger-print-outline' as const,
                  label: 'Biometric Authentication',
                  sub: 'Require fingerprint for payments',
                  value: true,
                },
                {
                  icon: 'receipt-outline' as const,
                  label: 'Auto-generate Receipt',
                  sub: 'Send receipt to your email',
                  value: false,
                },
              ].map((item, idx, arr) => (
                <React.Fragment key={item.label}>
                  <View style={styles.settingsRow}>
                    <View style={[styles.settingsIcon, { backgroundColor: Colors.bgInput }]}>
                      <Ionicons name={item.icon} size={18} color={Colors.textMuted} />
                    </View>
                    <View style={styles.settingsText}>
                      <Text style={[styles.settingsLabel, { color: Colors.textPrimary }]}>
                        {item.label}
                      </Text>
                      <Text style={[styles.settingsSub, { color: Colors.textMuted }]}>{item.sub}</Text>
                    </View>
                    <Switch
                      value={item.value}
                      onValueChange={() => {}}
                      trackColor={{ false: Colors.border, true: 'rgba(255,10,84,0.35)' }}
                      thumbColor={item.value ? Colors.accent : isDark ? '#555' : '#CCC'}
                      ios_backgroundColor={Colors.border}
                    />
                  </View>
                  {idx < arr.length - 1 && (
                    <View style={[styles.divider, { backgroundColor: Colors.border, marginLeft: 16 + 38 + 12 }]} />
                  )}
                </React.Fragment>
              ))}
            </View>
          </View>

          {/* ── Footer note ── */}
          <View
            style={[
              styles.footerNote,
              {
                backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
                borderColor: Colors.border,
              },
            ]}
          >
            <Ionicons name="lock-closed-outline" size={14} color={Colors.textMuted} />
            <Text style={[styles.footerNoteText, { color: Colors.textMuted }]}>
              Payment data is encrypted and stored securely on this device. 
              Namma Chennai Metro does not store card or bank details on its servers.
            </Text>
          </View>

          <View style={{ height: 48 }} />
        </View>
      </ScrollView>

      {/* ── Add UPI Modal ── */}
      <AddUpiModal
        visible={addUpiVisible}
        onClose={() => setAddUpiVisible(false)}
        onAdd={addUpiId}
        Colors={Colors}
        isDark={isDark}
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
    width: 40, height: 40, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { fontSize: 18, fontWeight: '800', letterSpacing: -0.3 },

  // Secure strip
  secureStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.sm,
    marginBottom: Spacing.xl,
    padding: Spacing.md,
    borderRadius: Radius.lg,
    borderWidth: 1,
    gap: Spacing.md,
  },
  secureBadge: {
    width: 40, height: 40, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
  },
  secureText: { flex: 1 },
  secureTitle: { fontSize: 14, fontWeight: '700', marginBottom: 2 },
  secureSub: { fontSize: 12, fontWeight: '500', lineHeight: 16 },

  content: { paddingHorizontal: Spacing.lg },

  section: { marginBottom: Spacing.xl },
  sectionHeader: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', marginBottom: 10,
  },
  sectionLabel: {
    fontSize: 11, fontWeight: '800',
    letterSpacing: 1.5, marginBottom: 10,
    marginLeft: 4,
  },
  card: {
    borderRadius: Radius.lg, borderWidth: 1, overflow: 'hidden',
  },
  divider: { height: 1 },

  // Default row
  defaultRow: {
    flexDirection: 'row', alignItems: 'center',
    padding: Spacing.lg, gap: Spacing.md,
  },
  defaultIcon: {
    width: 40, height: 40, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
  },
  defaultLabel: { fontSize: 13, fontWeight: '600', marginBottom: 2 },
  defaultValue: { fontSize: 14, fontWeight: '700' },

  // Add button
  addBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: Radius.pill, borderWidth: 1,
  },
  addBtnText: { fontSize: 13, fontWeight: '700' },

  // UPI row
  upiRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 12, paddingHorizontal: Spacing.lg, gap: Spacing.md,
  },
  upiInfo: { flex: 1 },
  upiNameRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 3 },
  upiProvider: { fontSize: 14, fontWeight: '700' },
  upiId: { fontSize: 12, fontWeight: '500' },
  defaultTag: {
    paddingHorizontal: 7, paddingVertical: 2,
    borderRadius: Radius.pill, borderWidth: 1,
  },
  defaultTagText: { fontSize: 10, fontWeight: '800' },
  upiActions: { flexDirection: 'row', gap: 6, alignItems: 'center' },
  actionBtn: {
    paddingHorizontal: 8, paddingVertical: 6,
    borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center',
  },
  actionBtnText: { fontSize: 11, fontWeight: '700' },

  // Provider shortcut cards
  providerShortcuts: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 10,
  },
  shortcutCard: { width: '47%' },
  shortcutInner: {
    borderRadius: Radius.lg, borderWidth: 1.5,
    padding: 14, alignItems: 'center', gap: 4,
    position: 'relative',
  },
  shortcutLabel: { fontSize: 13, fontWeight: '700', marginTop: 2 },
  shortcutHandle: { fontSize: 11, fontWeight: '600' },
  shortcutBadge: {
    position: 'absolute', top: 8, right: 8,
    width: 18, height: 18, borderRadius: 9,
    alignItems: 'center', justifyContent: 'center',
  },

  // Bank row
  bankRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 14, paddingHorizontal: Spacing.lg, gap: Spacing.md,
  },
  bankIcon: {
    width: 44, height: 44, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
  },
  bankInfo: { flex: 1 },
  bankName: { fontSize: 14, fontWeight: '700', marginBottom: 3 },
  bankAcct: { fontSize: 12, fontWeight: '500' },

  // Settings row
  settingsRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 14, paddingHorizontal: Spacing.lg, gap: Spacing.md,
  },
  settingsIcon: {
    width: 38, height: 38, borderRadius: Radius.sm,
    alignItems: 'center', justifyContent: 'center',
  },
  settingsText: { flex: 1 },
  settingsLabel: { fontSize: 15, fontWeight: '600', marginBottom: 2 },
  settingsSub: { fontSize: 12, fontWeight: '500' },

  // Empty state
  emptyCard: {
    borderRadius: Radius.lg, borderWidth: 1,
    padding: Spacing.xl, alignItems: 'center', gap: 8,
  },
  emptyText: { fontSize: 14, fontWeight: '600', marginTop: 4 },
  emptySub: { fontSize: 12, fontWeight: '500', textAlign: 'center', lineHeight: 17 },
  emptyAddBtn: {
    marginTop: 4, paddingHorizontal: 16, paddingVertical: 8,
    borderRadius: Radius.pill,
  },
  emptyAddText: { fontSize: 14, fontWeight: '700' },

  // Footer note
  footerNote: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 8,
    padding: Spacing.md, borderRadius: Radius.md, borderWidth: 1,
    marginBottom: Spacing.lg,
  },
  footerNoteText: { flex: 1, fontSize: 11, fontWeight: '500', lineHeight: 16 },
});
