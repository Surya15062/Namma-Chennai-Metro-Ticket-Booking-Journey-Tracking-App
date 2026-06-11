import React, { useState, useEffect, useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Image, Alert, Animated, Easing, Modal, Pressable
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { DarkColors, LightColors, Spacing, Radius } from '@/constants/theme';
import { useUserStore } from '@/store';

// Preset avatar URLs
const PRESET_AVATARS = [
  'https://ui-avatars.com/api/?name=User&background=FF0A54&color=fff',
  'https://ui-avatars.com/api/?name=Traveller&background=A485FF&color=fff',
  'https://ui-avatars.com/api/?name=Metro&background=32D74B&color=fff',
  'https://ui-avatars.com/api/?name=Chennai&background=0A84FF&color=fff'
];

// ─── Field Row ────────────────────────────────────────────────────────────────

function FieldRow({
  icon,
  label,
  value,
  placeholder,
  keyboardType,
  autoCapitalize,
  onChangeText,
  isLast,
  isEditing,
  Colors,
}: {
  icon: keyof typeof Ionicons['glyphMap'];
  label: string;
  value: string;
  placeholder: string;
  keyboardType?: any;
  autoCapitalize?: any;
  onChangeText: (v: string) => void;
  isLast?: boolean;
  isEditing: boolean;
  Colors: typeof DarkColors;
}) {
  return (
    <>
      <View style={fieldStyles.row}>
        <View style={[fieldStyles.iconWrap, { backgroundColor: Colors.bgInput }]}>
          <Ionicons name={icon} size={18} color={Colors.textMuted} />
        </View>
        <View style={fieldStyles.textWrap}>
          <Text style={[fieldStyles.label, { color: Colors.textMuted }]}>{label}</Text>
          {isEditing ? (
            <TextInput
              style={[fieldStyles.input, { color: Colors.textPrimary }]}
              value={value}
              onChangeText={onChangeText}
              placeholder={placeholder}
              placeholderTextColor={Colors.textMuted}
              keyboardType={keyboardType}
              autoCapitalize={autoCapitalize}
            />
          ) : (
            <Text
              style={[
                fieldStyles.value,
                { color: value ? Colors.textPrimary : Colors.textMuted },
              ]}
            >
              {value || placeholder}
            </Text>
          )}
        </View>
      </View>
      {!isLast && <View style={[fieldStyles.divider, { backgroundColor: Colors.border, marginLeft: 16 + 38 + 12 }]} />}
    </>
  );
}

const fieldStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: Spacing.lg, gap: Spacing.md },
  iconWrap: { width: 38, height: 38, borderRadius: Radius.sm, alignItems: 'center', justifyContent: 'center' },
  textWrap: { flex: 1 },
  label: { fontSize: 11, fontWeight: '700', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 3 },
  value: { fontSize: 16, fontWeight: '600' },
  input: { fontSize: 16, fontWeight: '600', padding: 0 },
  divider: { height: 1, marginLeft: 66 },
});

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function AccountScreen() {
  const router = useRouter();
  const { user, updateUser, clearUser, isDark } = useUserStore();
  const Colors = isDark ? DarkColors : LightColors;
  const styles = useMemo(() => getStyles(Colors, isDark), [isDark]);

  const [isEditing, setIsEditing] = useState(false);
  const [isAvatarModalVisible, setAvatarModalVisible] = useState(false);

  const [name, setName] = useState(user?.name || '');
  const [age, setAge] = useState(user?.age || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [avatar, setAvatar] = useState(user?.avatar || PRESET_AVATARS[0]);

  // Draft state while editing
  const [draftName, setDraftName] = useState(name);
  const [draftAge, setDraftAge] = useState(age);
  const [draftEmail, setDraftEmail] = useState(email);
  const [draftPhone, setDraftPhone] = useState(phone);
  const [draftAvatar, setDraftAvatar] = useState(avatar);

  const handleEditToggle = () => {
    if (!isEditing) {
      // Start editing: copy current values to draft
      setDraftName(name);
      setDraftAge(age);
      setDraftEmail(email);
      setDraftPhone(phone);
      setDraftAvatar(avatar);
    }
    setIsEditing(!isEditing);
  };

  const handleSave = () => {
    setName(draftName);
    setAge(draftAge);
    setEmail(draftEmail);
    setPhone(draftPhone);
    setAvatar(draftAvatar);
    updateUser({ name: draftName, age: draftAge, email: draftEmail, phone: draftPhone, avatar: draftAvatar });
    setIsEditing(false);
  };

  const handleDiscard = () => {
    setIsEditing(false);
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'This action is permanent and cannot be undone. All your booked tickets and settings will be lost.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => { clearUser(); router.replace('/'); }
        }
      ]
    );
  };

  const displayName = name || 'Traveller';
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
        <Text style={styles.headerTitle}>My Profile</Text>
        <TouchableOpacity
          style={[styles.actionBtn, isEditing && styles.actionBtnActive]}
          onPress={isEditing ? handleSave : handleEditToggle}
          activeOpacity={0.8}
        >
          <Ionicons
            name={isEditing ? 'checkmark' : 'create-outline'}
            size={17}
            color={Colors.accent}
          />
          <Text style={styles.actionBtnText}>{isEditing ? 'Save' : 'Edit'}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* ── Avatar Hero ── */}
        <LinearGradient
          colors={
            isDark
              ? ['rgba(255,10,84,0.15)', 'rgba(255,10,84,0.03)']
              : ['rgba(255,10,84,0.08)', 'rgba(255,10,84,0.01)']
          }
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroGradient}
        >
          {/* Avatar */}
          <TouchableOpacity
            style={styles.avatarWrap}
            onPress={isEditing ? () => setAvatarModalVisible(true) : undefined}
            activeOpacity={isEditing ? 0.8 : 1}
          >
            {(isEditing ? draftAvatar : avatar) ? (
              <Image
                source={{ uri: isEditing ? draftAvatar : avatar }}
                style={styles.avatarImg}
              />
            ) : (
              <LinearGradient colors={['#FF0A54', '#C9003D']} style={styles.avatarPlaceholder}>
                <Text style={styles.initialsText}>{initials}</Text>
              </LinearGradient>
            )}
            {isEditing && (
              <View style={[styles.editBadge, { backgroundColor: Colors.accent }]}>
                <Ionicons name="camera" size={13} color="#FFF" />
              </View>
            )}
          </TouchableOpacity>

          {/* Name & email in view mode */}
          {!isEditing && (
            <>
              <Text style={styles.heroName}>{displayName}</Text>
              <Text style={styles.heroEmail}>{email || 'No email set'}</Text>
            </>
          )}
          {isEditing && (
            <Text style={styles.tapToChange}>Tap avatar to change photo</Text>
          )}
        </LinearGradient>

        {/* ── Discard Banner (only when editing) ── */}
        {isEditing && (
          <TouchableOpacity style={styles.discardBanner} onPress={handleDiscard} activeOpacity={0.8}>
            <Ionicons name="close-circle-outline" size={16} color={Colors.textMuted} />
            <Text style={styles.discardText}>Tap here to discard changes</Text>
          </TouchableOpacity>
        )}

        {/* ── Personal Details Card ── */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>PERSONAL DETAILS</Text>
          <View style={[styles.card, isEditing && styles.cardEditing]}>
            <FieldRow
              icon="person-outline"
              label="Full Name"
              value={isEditing ? draftName : name}
              placeholder="Enter your name"
              onChangeText={setDraftName}
              isEditing={isEditing}
              Colors={Colors}
            />
            <FieldRow
              icon="calendar-outline"
              label="Age"
              value={isEditing ? draftAge : age}
              placeholder="Enter your age"
              keyboardType="numeric"
              onChangeText={setDraftAge}
              isEditing={isEditing}
              Colors={Colors}
            />
            <FieldRow
              icon="mail-outline"
              label="Email Address"
              value={isEditing ? draftEmail : email}
              placeholder="name@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
              onChangeText={setDraftEmail}
              isEditing={isEditing}
              Colors={Colors}
            />
            <FieldRow
              icon="call-outline"
              label="Phone Number"
              value={isEditing ? draftPhone : phone}
              placeholder="+91 00000 00000"
              keyboardType="phone-pad"
              onChangeText={setDraftPhone}
              isEditing={isEditing}
              Colors={Colors}
              isLast
            />
          </View>
        </View>

        {/* ── Danger Zone ── */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: Colors.danger }]}>DANGER ZONE</Text>
          <View style={styles.card}>
            <TouchableOpacity
              style={styles.dangerRow}
              onPress={handleDeleteAccount}
              activeOpacity={0.8}
            >
              <View style={[styles.iconWrap, { backgroundColor: 'rgba(239,68,68,0.12)' }]}>
                <Ionicons name="trash-outline" size={18} color={Colors.danger} />
              </View>
              <Text style={[styles.dangerText, { color: Colors.danger }]}>Delete Account</Text>
              <Ionicons name="chevron-forward" size={16} color={Colors.danger} style={{ opacity: 0.5 }} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* ── Avatar Picker Modal ── */}
      <Modal
        visible={isAvatarModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setAvatarModalVisible(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setAvatarModalVisible(false)}>
          <View style={[styles.avatarModal, { backgroundColor: Colors.bgSurface }]}>
            <View style={[styles.modalHandle, { backgroundColor: Colors.border }]} />
            <Text style={[styles.modalTitle, { color: Colors.textPrimary }]}>Choose Avatar</Text>
            <View style={styles.avatarGrid}>
              {PRESET_AVATARS.map((uri, idx) => (
                <TouchableOpacity
                  key={idx}
                  onPress={() => { setDraftAvatar(uri); setAvatarModalVisible(false); }}
                  activeOpacity={0.8}
                >
                  <Image
                    source={{ uri }}
                    style={[
                      styles.avatarOption,
                      draftAvatar === uri && styles.avatarOptionSelected,
                      { borderColor: Colors.accent },
                    ]}
                  />
                  {draftAvatar === uri && (
                    <View style={[styles.avatarCheck, { backgroundColor: Colors.accent }]}>
                      <Ionicons name="checkmark" size={12} color="#FFF" />
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity
              style={[styles.modalDismiss, { backgroundColor: Colors.bgInput }]}
              onPress={() => setAvatarModalVisible(false)}
            >
              <Text style={[styles.modalDismissText, { color: Colors.textPrimary }]}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>
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
    actionBtn: {
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
    actionBtnActive: {
      backgroundColor: 'rgba(255,10,84,0.18)',
      borderColor: 'rgba(255,10,84,0.4)',
    },
    actionBtnText: {
      color: Colors.accent,
      fontSize: 14,
      fontWeight: '700',
    },

    // Hero
    heroGradient: {
      marginHorizontal: Spacing.lg,
      marginTop: Spacing.sm,
      marginBottom: Spacing.xl,
      borderRadius: Radius.lg,
      paddingVertical: Spacing.xxl,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: isDark ? 'rgba(255,10,84,0.15)' : 'rgba(255,10,84,0.1)',
    },
    avatarWrap: { position: 'relative', marginBottom: Spacing.md },
    avatarImg: {
      width: 90,
      height: 90,
      borderRadius: 45,
      borderWidth: 3,
      borderColor: Colors.accent,
    },
    avatarPlaceholder: {
      width: 90,
      height: 90,
      borderRadius: 45,
      alignItems: 'center',
      justifyContent: 'center',
    },
    initialsText: {
      fontSize: 34,
      fontWeight: '900',
      color: '#FFFFFF',
      letterSpacing: -1,
    },
    editBadge: {
      position: 'absolute',
      bottom: 2,
      right: 2,
      width: 28,
      height: 28,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 2.5,
      borderColor: Colors.bgBase,
    },
    heroName: {
      fontSize: 22,
      fontWeight: '800',
      color: Colors.textPrimary,
      letterSpacing: -0.4,
      marginBottom: 4,
    },
    heroEmail: {
      fontSize: 14,
      color: Colors.textMuted,
      fontWeight: '500',
    },
    tapToChange: {
      marginTop: 4,
      fontSize: 13,
      color: Colors.accent,
      fontWeight: '600',
    },

    // Discard banner
    discardBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      marginHorizontal: Spacing.lg,
      marginBottom: Spacing.md,
      padding: 10,
      borderRadius: Radius.md,
      backgroundColor: Colors.bgInput,
      borderWidth: 1,
      borderColor: Colors.border,
    },
    discardText: {
      fontSize: 13,
      color: Colors.textMuted,
      fontWeight: '500',
    },

    // Sections
    section: { marginBottom: Spacing.xl, paddingHorizontal: Spacing.lg },
    sectionLabel: {
      fontSize: 11,
      fontWeight: '800',
      color: Colors.textMuted,
      letterSpacing: 1.5,
      marginBottom: Spacing.sm,
      marginLeft: Spacing.xs,
    },
    card: {
      backgroundColor: Colors.bgSurface,
      borderRadius: Radius.lg,
      borderWidth: 1,
      borderColor: Colors.border,
      overflow: 'hidden',
    },
    cardEditing: {
      borderColor: 'rgba(255,10,84,0.3)',
      shadowColor: '#FF0A54',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.08,
      shadowRadius: 8,
      elevation: 2,
    },
    iconWrap: {
      width: 38,
      height: 38,
      borderRadius: Radius.sm,
      alignItems: 'center',
      justifyContent: 'center',
    },
    dangerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 14,
      paddingHorizontal: Spacing.lg,
      gap: Spacing.md,
    },
    dangerText: {
      flex: 1,
      fontSize: 15,
      fontWeight: '600',
    },

    // Avatar Modal
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.6)',
      justifyContent: 'flex-end',
    },
    avatarModal: {
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      paddingTop: 12,
      paddingBottom: 40,
      paddingHorizontal: Spacing.xl,
    },
    modalHandle: {
      width: 40,
      height: 4,
      borderRadius: 2,
      alignSelf: 'center',
      marginBottom: Spacing.lg,
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: '800',
      textAlign: 'center',
      marginBottom: Spacing.xl,
      letterSpacing: -0.3,
    },
    avatarGrid: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      marginBottom: Spacing.xl,
    },
    avatarOption: {
      width: 70,
      height: 70,
      borderRadius: 35,
      borderWidth: 3,
      borderColor: 'transparent',
    },
    avatarOptionSelected: {
      borderWidth: 3,
    },
    avatarCheck: {
      position: 'absolute',
      bottom: 2,
      right: 2,
      width: 22,
      height: 22,
      borderRadius: 11,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 2,
      borderColor: '#FFF',
    },
    modalDismiss: {
      paddingVertical: 14,
      borderRadius: Radius.lg,
      alignItems: 'center',
    },
    modalDismissText: {
      fontSize: 16,
      fontWeight: '700',
    },
  });
