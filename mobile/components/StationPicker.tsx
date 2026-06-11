import React, { useState, useCallback, useMemo } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  FlatList, StyleSheet, Modal, StyleProp, ViewStyle
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { DarkColors, LightColors, Spacing, Radius } from '@/constants/theme';
import { LineDot } from './UI';
import { Ionicons } from '@expo/vector-icons';
import { useStationSearch } from '@/hooks/useStationSearch';
import { Station } from '@/services/api';
import { useUserStore } from '@/store';

interface StationPickerProps {
  value: string;
  onChange: (station: string) => void;
  placeholder?: string;
  label?: string;
  customTrigger?: (onPress: () => void, value: string, placeholder: string) => React.ReactNode;
}

export const StationPicker: React.FC<StationPickerProps> = ({
  value, onChange, placeholder = 'Search station', label, customTrigger,
}) => {
  const { isDark } = useUserStore();
  const Colors = isDark ? DarkColors : LightColors;
  const styles = useMemo(() => getStyles(Colors, isDark), [isDark]);

  const [modalVisible, setModalVisible] = useState(false);
  const [query, setQuery] = useState('');
  const { results, loading, search, clear } = useStationSearch();

  const handleOpen = useCallback(() => {
    setQuery('');
    clear();
    setModalVisible(true);
  }, []);

  const handleSelect = useCallback((station: Station) => {
    onChange(station.station_name);
    setModalVisible(false);
    setQuery('');
    clear();
  }, [onChange]);

  const handleQueryChange = (text: string) => {
    setQuery(text);
    search(text);
  };

  const renderItem = ({ item }: { item: Station }) => {
    const line = item.line as 'Green' | 'Blue';
    const isInterchange = item.is_interchange === 1;
    return (
      <TouchableOpacity
        style={styles.optionCard}
        onPress={() => handleSelect(item)}
        activeOpacity={0.8}
      >
        <View style={styles.optionBadgeWrapper}>
          <LineDot line={isInterchange ? 'interchange' : line} size={14} />
        </View>
        <View style={styles.optionContent}>
          <Text style={styles.optionText}>{item.station_name}</Text>
          <Text style={[styles.lineTag, { color: line === 'Green' ? Colors.greenLine : Colors.blueLine }]}>
            {line} Line {isInterchange && '• Interchange'}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={Colors.textMuted} />
      </TouchableOpacity>
    );
  };

  return (
    <>
      {customTrigger ? customTrigger(handleOpen, value, placeholder) : (
        <>
          {label && <Text style={styles.label}>{label}</Text>}
          <TouchableOpacity style={styles.trigger} onPress={handleOpen} activeOpacity={0.85}>
            <Ionicons name="train-outline" size={20} color={Colors.accent} />
            <Text style={[styles.triggerText, !value && styles.placeholder]} numberOfLines={1}>
              {value || placeholder}
            </Text>
            <Ionicons name="chevron-down" size={18} color={Colors.textMuted} />
          </TouchableOpacity>
        </>
      )}

      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setModalVisible(false)}
      >
        <SafeAreaView style={styles.modal}>
          {/* Modal Header */}
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Station</Text>
            <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeBtn}>
              <Ionicons name="close" size={20} color={Colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Search Input */}
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color={Colors.textMuted} />
            <TextInput
              style={styles.searchInput}
              value={query}
              onChangeText={handleQueryChange}
              placeholder="Type station name..."
              placeholderTextColor={Colors.borderHover}
              autoFocus
              autoCorrect={false}
            />
            {query.length > 0 && (
              <TouchableOpacity onPress={() => { setQuery(''); clear(); }} style={styles.clearBtnInner}>
                <Ionicons name="close-circle" size={20} color={Colors.textMuted} />
              </TouchableOpacity>
            )}
          </View>

          {/* Results Area */}
          <View style={styles.resultsWrapper}>
            {loading && (
              <View style={styles.loadingRow}>
                <Text style={styles.loadingText}>Searching...</Text>
              </View>
            )}

            <FlatList
              data={results}
              keyExtractor={(item, index) => item.id ? item.id.toString() : `${item.station_name}-${index}`}
              renderItem={renderItem}
              contentContainerStyle={{ paddingBottom: Spacing.xl }}
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={
                query.length > 0 && !loading ? (
                  <View style={styles.emptyState}>
                    <View style={styles.illustrationCircle}>
                      <Ionicons name="search-outline" size={48} color={Colors.textMuted} />
                    </View>
                    <Text style={styles.emptyTitle}>No stations found</Text>
                    <Text style={styles.emptyText}>We couldn't find a match for "{query}"</Text>
                  </View>
                ) : query.length === 0 ? (
                  <View style={styles.emptyState}>
                    <View style={[styles.illustrationOuterRing, { borderColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }]}>
                      <View style={[styles.illustrationInnerRing, { backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)' }]}>
                        <Ionicons name="subway-outline" size={42} color={Colors.accent} />
                      </View>
                    </View>
                    <Text style={styles.emptyTitle}>Search for a metro station to get started</Text>
                    <Text style={styles.emptyText}>Find your departure or destination platform instantly</Text>
                  </View>
                ) : null
              }
              keyboardShouldPersistTaps="handled"
            />
          </View>
        </SafeAreaView>
      </Modal>
    </>
  );
};

const getStyles = (Colors: any, isDark: boolean) => StyleSheet.create({
  label: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: Colors.textMuted,
    marginBottom: Spacing.sm,
  },
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bgInput,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.lg,
    paddingVertical: 14,
    gap: Spacing.md,
  },
  triggerText: { flex: 1, fontSize: 16, color: Colors.textPrimary, fontWeight: '500' },
  placeholder:  { color: Colors.textMuted },

  // Modal
  modal: { flex: 1, backgroundColor: Colors.bgBase },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.lg,
  },
  modalTitle: { fontSize: 24, fontWeight: '800', color: Colors.textPrimary },
  closeBtn: {
    width: 36, height: 36,
    borderRadius: 18,
    backgroundColor: Colors.bgInput,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },

  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#ffffff',
    borderRadius: Radius.lg,
    marginHorizontal: Spacing.xl,
    marginBottom: Spacing.lg,
    paddingHorizontal: Spacing.lg,
    paddingVertical: 16,
    gap: Spacing.md,
    borderWidth: 1,
    borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
  },
  searchInput: { flex: 1, fontSize: 17, color: Colors.textPrimary, fontWeight: '500' },
  clearBtnInner: { padding: 4, marginRight: -8 },

  resultsWrapper: { flex: 1 },

  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : '#ffffff',
    borderRadius: Radius.lg,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.lg,
    marginHorizontal: Spacing.xl,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: isDark ? 0.2 : 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  optionBadgeWrapper: {
    width: 40, alignItems: 'center', justifyContent: 'center'
  },
  optionContent: { flex: 1, paddingLeft: Spacing.sm },
  optionText: { fontSize: 17, color: Colors.textPrimary, fontWeight: '700', marginBottom: 4 },
  lineTag: { fontSize: 12, fontWeight: '700' },

  loadingRow: { padding: Spacing.xl, alignItems: 'center' },
  loadingText: { color: Colors.textMuted, fontSize: 14, fontWeight: '600' },
  
  // Custom Minimal Illustration Empty State
  emptyState: { alignItems: 'center', paddingHorizontal: Spacing.xxl, paddingTop: 80 },
  illustrationOuterRing: {
    width: 140, height: 140,
    borderRadius: 70,
    borderWidth: 1,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xl,
  },
  illustrationInnerRing: {
    width: 90, height: 90,
    borderRadius: 45,
    alignItems: 'center',
    justifyContent: 'center',
  },
  illustrationCircle: {
    width: 100, height: 100,
    borderRadius: 50,
    backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: Spacing.xl,
  },
  emptyTitle: { color: Colors.textPrimary, fontSize: 18, fontWeight: '800', textAlign: 'center', marginBottom: Spacing.sm, lineHeight: 26 },
  emptyText: { color: Colors.textSecondary, fontSize: 14, textAlign: 'center', fontWeight: '500', lineHeight: 22 },
});
