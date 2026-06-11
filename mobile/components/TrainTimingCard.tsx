import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { DarkColors, LightColors, Spacing, Radius } from '@/constants/theme';
import { Card, LineDot, Skeleton } from './UI';
import { Ionicons } from '@expo/vector-icons';
import { useTrainTiming } from '@/hooks/useTrainTiming';
import { useUserStore } from '@/store';

interface TrainTimingCardProps {
  station: string | null;
  compact?: boolean;
  variant?: 'default' | 'modern' | 'compact' | 'reference';
  limit?: number;
  walkingTime?: number;
}

export const TrainTimingCard: React.FC<TrainTimingCardProps> = ({
  station, compact = false, variant = 'default', limit, walkingTime
}) => {
  const { isDark } = useUserStore();
  const Colors = isDark ? DarkColors : LightColors;
  const styles = useMemo(() => getStyles(Colors, isDark), [isDark]);

  const { data, loading, error, refetch } = useTrainTiming(station);

  if (!station) return null;

  const active_trains = data?.active_trains || [];
  const displayTrains = limit ? active_trains.slice(0, limit) : active_trains;

  const isModern    = variant === 'modern';
  const isReference = variant === 'reference';
  const isCompact   = variant === 'compact' || compact;

  if (active_trains.length === 0) {
    if (loading) {
      return (
        <View style={{ gap: Spacing.md }}>
          <Skeleton width="100%" height={isCompact ? 60 : isReference ? 160 : isModern ? 60 : 100} style={{ borderRadius: Radius.lg }} />
          {!isCompact && !isModern && !isReference && <Skeleton width="100%" height={100} style={{ borderRadius: Radius.lg }} />}
        </View>
      );
    }
    if (isReference) {
      return (
        <View style={[styles.refCard, {
          backgroundColor: isDark ? Colors.bgSurface : '#FFF',
          borderColor: isDark ? Colors.border : 'rgba(0,0,0,0.08)',
        }]}>
          <View style={styles.refHeader}>
            <View style={[styles.refIcon, { backgroundColor: isDark ? Colors.bgCard : '#F2F2F2' }]}>
              <Ionicons name="train-outline" size={22} color={Colors.textMuted} />
            </View>
            <Text style={[styles.refStation, { color: Colors.textPrimary }]} numberOfLines={1}>
              {station}
            </Text>
          </View>
          <View style={[styles.refDivider, { backgroundColor: isDark ? Colors.border : 'rgba(0,0,0,0.07)' }]} />
          <View style={styles.refEmptyRow}>
            <Ionicons name="time-outline" size={18} color={Colors.textMuted} style={{ opacity: 0.5 }} />
            <Text style={[styles.refEmptyText, { color: Colors.textMuted }]}>No live data available</Text>
          </View>
        </View>
      );
    }
    return (
      <Card style={[styles.emptyCard, (isCompact || isModern) && { padding: Spacing.md }]}>
        <Ionicons name="train-outline" size={(isCompact || isModern) ? 24 : 40} color={Colors.textMuted} style={{ opacity: 0.4, marginBottom: Spacing.sm }} />
        <Text style={[styles.emptyTitle, (isCompact || isModern) && { fontSize: 14 }]}>No Live Data</Text>
        {!isCompact && !isModern && <Text style={styles.emptySub}>No trains arriving at {station}</Text>}
      </Card>
    );
  }

  // ── Modern variant ─────────────────────────────────────────────
  if (isModern) {
    return (
      <View style={[styles.modernCard, {
        backgroundColor: isDark ? Colors.bgSurface : '#FFF',
        borderColor: Colors.border,
      }]}>
        {/* Accent bar + Station header */}
        <View style={styles.modernHeader}>
          <View style={[styles.modernAccentBar, { backgroundColor: Colors.accent }]} />
          <View style={styles.modernHeaderContent}>
            <View style={styles.modernHeaderTop}>
              <Text style={[styles.modernStationTitle, { color: Colors.textPrimary }]} numberOfLines={1}>
                {station}
              </Text>
              {walkingTime !== undefined && walkingTime > 0 && (
                <View style={[styles.modernWalkBadge, { backgroundColor: Colors.bgInput, borderColor: Colors.border }]}>
                  <Ionicons name="walk-outline" size={12} color={Colors.textSecondary} />
                  <Text style={[styles.modernWalkText, { color: Colors.textSecondary }]}>{walkingTime} min walk</Text>
                </View>
              )}
            </View>
            <View style={[styles.modernLivePill, { backgroundColor: Colors.success + '18', borderColor: Colors.success + '44' }]}>
              <View style={[styles.modernLiveDot, { backgroundColor: Colors.success }]} />
              <Text style={[styles.modernLiveLabel, { color: Colors.success }]}>LIVE ARRIVALS</Text>
            </View>
          </View>
        </View>

        {/* Train rows */}
        <View style={styles.modernList}>
          {displayTrains.map((t, idx) => {
            const isGreen = t.line === 'Green';
            const lineColor = isGreen ? Colors.greenLine : Colors.blueLine;
            const isNow = t.eta === 0;
            return (
              <View key={idx} style={[
                styles.modernRow,
                idx !== displayTrains.length - 1 && { borderBottomWidth: 1, borderBottomColor: Colors.border },
              ]}>
                {/* Line dot */}
                <View style={[styles.modernLineDot, { backgroundColor: lineColor }]} />

                {/* Direction + line label */}
                <View style={styles.modernDirWrap}>
                  <Text style={[styles.modernDir, { color: Colors.textPrimary }]} numberOfLines={1}>
                    {t.direction}
                  </Text>
                  <View style={[styles.modernLinePill, { backgroundColor: lineColor + '1A', borderColor: lineColor + '55' }]}>
                    <Text style={[styles.modernLinePillText, { color: lineColor }]}>{t.line} Line</Text>
                  </View>
                </View>

                {/* ETA */}
                <View style={[
                  styles.modernEtaBadge,
                  {
                    backgroundColor: isNow
                      ? Colors.success + '1A'
                      : isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
                    borderColor: isNow ? Colors.success + '55' : Colors.border,
                  },
                ]}>
                  {isNow && <View style={[styles.modernNowDot, { backgroundColor: Colors.success }]} />}
                  <Text style={[
                    styles.modernEtaValue,
                    { color: isNow ? Colors.success : Colors.textPrimary },
                  ]}>
                    {isNow ? 'Now' : `${t.eta}`}
                  </Text>
                  {!isNow && <Text style={[styles.modernEtaMin, { color: Colors.textMuted }]}>min</Text>}
                </View>
              </View>
            );
          })}
        </View>
      </View>
    );
  }

  // ── Reference variant (matches screenshot exactly) ────────────────
  if (isReference) {
    return (
      <View style={[styles.refCard, {
        backgroundColor: isDark ? Colors.bgSurface : '#FFF',
        borderColor: isDark ? Colors.border : 'rgba(0,0,0,0.08)',
      }]}>
        {/* Header row: circular icon + station name + walking pill */}
        <View style={styles.refHeader}>
          <View style={[styles.refIcon, { backgroundColor: 'transparent', borderColor: Colors.textPrimary, borderWidth: 2 }]}>
            <Ionicons name="train" size={22} color={Colors.textPrimary} />
          </View>
          <Text style={[styles.refStation, { color: Colors.textPrimary }]} numberOfLines={1} adjustsFontSizeToFit>
            {station}
          </Text>
          {walkingTime !== undefined && walkingTime > 0 && (
            <View style={[styles.refWalkPill, { backgroundColor: isDark ? Colors.bgCard : '#F0F0F0' }]}>
              <Ionicons name="walk" size={12} color={isDark ? Colors.textSecondary : '#555'} style={{ marginRight: 4 }} />
              <Text style={[styles.refWalkText, { color: Colors.textSecondary }]}>{walkingTime} min away</Text>
            </View>
          )}
        </View>

        {/* Separator */}
        <View style={[styles.refDivider, { backgroundColor: isDark ? Colors.border : 'rgba(0,0,0,0.07)' }]} />

        {/* Train rows */}
        {displayTrains.map((t, idx) => {
          const lineColor = t.line === 'Green' ? Colors.greenLine : Colors.blueLine;
          const etaText = t.eta === 0 ? 'Now' : `${t.eta}m`;
          const isLast = idx === displayTrains.length - 1;
          return (
            <View key={idx}>
              <View style={styles.refRow}>
                <View style={[styles.refDot, { backgroundColor: lineColor }]} />
                <Text style={[styles.refDir, { color: Colors.textPrimary }]} numberOfLines={1}>
                  {t.direction}
                </Text>
                <Text style={[styles.refEta, { color: t.eta === 0 ? Colors.success : Colors.textPrimary }]}>
                  {etaText}
                </Text>
              </View>
              {!isLast && (
                <View style={[styles.refRowDivider, { backgroundColor: isDark ? Colors.border : 'rgba(0,0,0,0.06)' }]} />
              )}
            </View>
          );
        })}
      </View>
    );
  }

  // ── Compact variant ────────────────────────────────────────────
  if (isCompact) {
    return (
      <View style={styles.compactGrid}>
        {displayTrains.map((t, idx) => (
          <View key={idx} style={[
            styles.compactRow,
            idx !== displayTrains.length - 1 && { borderBottomWidth: 1, borderBottomColor: Colors.border, paddingBottom: 8 },
          ]}>
            <LineDot line={t.line as any} size={10} />
            <Text style={[styles.compactDir, { color: Colors.textPrimary }]} numberOfLines={1}>{t.direction}</Text>
            <Text style={[styles.compactEta, { color: t.eta === 0 ? Colors.success : Colors.textPrimary }]}>
              {t.eta === 0 ? 'Now' : `${t.eta}m`}
            </Text>
          </View>
        ))}
      </View>
    );
  }

  // ── Default full variant ───────────────────────────────────────
  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <View style={styles.headerTitleGroup}>
          <Text style={[styles.mainTitle, { color: Colors.textPrimary }]}>{station}</Text>
          <Text style={[styles.subTitle, { color: Colors.textSecondary }]}>Platform Overview</Text>
        </View>
        <View style={[styles.livePill, { backgroundColor: Colors.success + '18', borderColor: Colors.success + '44' }]}>
          <View style={[styles.liveDot, { backgroundColor: Colors.success }]} />
          <Text style={[styles.liveLabel, { color: Colors.success }]}>LIVE</Text>
        </View>
      </View>

      {displayTrains.map((train, idx) => {
        const isGreen = train.line === 'Green';
        const lineColor = isGreen ? Colors.greenLine : Colors.blueLine;
        const isNow = train.eta === 0;

        let statusBg   = Colors.success + '18';
        let statusText = Colors.success;
        if (train.status === 'Scheduled') { statusBg = Colors.blueLine + '18'; statusText = Colors.blueLine; }
        if (train.status === 'Delayed')   { statusBg = Colors.danger  + '18'; statusText = Colors.danger;   }

        return (
          <View key={idx} style={[styles.trainCard, {
            backgroundColor: isDark ? Colors.bgCard : '#FFF',
            borderColor: isDark ? Colors.border : 'rgba(0,0,0,0.07)',
          }]}>
            {/* Edge */}
            <View style={[styles.cardEdge, { backgroundColor: lineColor }]} />

            <View style={styles.trainInner}>
              <View style={styles.trainDetails}>
                <Text style={[styles.directionText, { color: Colors.textPrimary }]}>{train.direction}</Text>
                <View style={styles.platformRow}>
                  <View style={[styles.platformPill, { backgroundColor: Colors.bgInput, borderColor: Colors.border }]}>
                    <Text style={[styles.platformText, { color: Colors.textSecondary }]}>{train.platform}</Text>
                  </View>
                  <View style={[styles.linePill, { backgroundColor: lineColor + '15', borderColor: lineColor + '44' }]}>
                    <View style={[styles.linePillDot, { backgroundColor: lineColor }]} />
                    <Text style={[styles.linePillText, { color: lineColor }]}>{train.line} Line</Text>
                  </View>
                </View>
              </View>

              <View style={styles.timingSection}>
                <View style={[styles.etaBadge, {
                  backgroundColor: isNow ? Colors.success + '18' : (isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)'),
                  borderColor: isNow ? Colors.success + '55' : Colors.border,
                }]}>
                  {isNow && <View style={[styles.nowDot, { backgroundColor: Colors.success }]} />}
                  <Text style={[styles.etaValue, { color: isNow ? Colors.success : Colors.textPrimary }]}>
                    {isNow ? 'NOW' : train.eta}
                  </Text>
                  {!isNow && <Text style={[styles.etaMin, { color: Colors.textMuted }]}>MIN</Text>}
                </View>
                <View style={[styles.statusPill, { backgroundColor: statusBg }]}>
                  <Text style={[styles.statusText, { color: statusText }]}>{train.status}</Text>
                </View>
              </View>
            </View>
          </View>
        );
      })}
    </View>
  );
};

const getStyles = (Colors: any, isDark: boolean) => StyleSheet.create({
  container: { gap: Spacing.md },

  // ── Default header
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: Spacing.sm,
    paddingHorizontal: Spacing.xs,
  },
  headerTitleGroup: { flex: 1 },
  mainTitle: { fontSize: 22, fontWeight: '800', letterSpacing: -0.3 },
  subTitle:  { fontSize: 13, fontWeight: '500', marginTop: 2 },
  livePill: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: Radius.pill, borderWidth: 1,
  },
  liveDot:  { width: 6, height: 6, borderRadius: 3 },
  liveLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 0.8 },

  // ── Default train card
  trainCard: {
    flexDirection: 'row',
    borderRadius: Radius.lg, borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: isDark ? 0.2 : 0.05,
    shadowRadius: 8, elevation: 2,
  },
  cardEdge: { width: 4 },
  trainInner: {
    flex: 1, flexDirection: 'row',
    alignItems: 'center', padding: Spacing.lg,
    justifyContent: 'space-between',
  },
  trainDetails: { flex: 1, paddingRight: Spacing.md },
  directionText: { fontSize: 17, fontWeight: '800', marginBottom: 8 },
  platformRow:   { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, flexWrap: 'wrap' },
  platformPill: {
    paddingHorizontal: 8, paddingVertical: 4,
    borderRadius: Radius.pill, borderWidth: 1,
  },
  platformText: { fontSize: 11, fontWeight: '700' },
  linePill: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 8, paddingVertical: 4,
    borderRadius: Radius.pill, borderWidth: 1,
  },
  linePillDot:  { width: 6, height: 6, borderRadius: 3 },
  linePillText: { fontSize: 11, fontWeight: '700' },

  timingSection: { alignItems: 'center', gap: 6, minWidth: 70 },
  etaBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 10, paddingVertical: 8,
    borderRadius: 12, borderWidth: 1,
    minWidth: 60, justifyContent: 'center',
  },
  nowDot:   { width: 6, height: 6, borderRadius: 3 },
  etaValue: { fontSize: 20, fontWeight: '900' },
  etaMin:   { fontSize: 9,  fontWeight: '700', alignSelf: 'flex-end', marginBottom: 3 },
  statusPill: {
    paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: Radius.pill,
  },
  statusText: { fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.4 },

  // ── Empty
  emptyCard:  { padding: Spacing.xxl, alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { fontSize: 16, fontWeight: '800', marginBottom: 4 },
  emptySub:   { fontSize: 13, textAlign: 'center', marginBottom: Spacing.lg },

  // ── Compact
  compactGrid: { gap: 8 },
  compactRow:  { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  compactDir:  { flex: 1, fontSize: 14, fontWeight: '600' },
  compactEta:  { fontSize: 15, fontWeight: '800' },

  // ── Modern
  modernCard: {
    borderRadius: Radius.lg, borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: isDark ? 0.15 : 0.04,
    shadowRadius: 8, elevation: 2,
  },
  // Modern header
  modernHeader: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
  },
  modernAccentBar: {
    width: 4,
    alignSelf: 'stretch',
  },
  modernHeaderContent: {
    flex: 1,
    padding: Spacing.lg,
    paddingLeft: Spacing.md,
    gap: 6,
  },
  modernHeaderTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.sm,
  },
  modernStationTitle: {
    fontSize: 15, fontWeight: '800',
    letterSpacing: -0.2, flex: 1,
  },
  modernWalkBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 9, paddingVertical: 4,
    borderRadius: Radius.pill, borderWidth: 1,
  },
  modernWalkText: { fontSize: 11, fontWeight: '600' },
  modernLivePill: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    alignSelf: 'flex-start',
    paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: Radius.pill, borderWidth: 1,
  },
  modernLiveDot: { width: 5, height: 5, borderRadius: 2.5 },
  modernLiveLabel: { fontSize: 9, fontWeight: '800', letterSpacing: 0.8 },
  // Modern list
  modernList: { },
  modernRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 12, paddingHorizontal: Spacing.lg,
    gap: Spacing.md,
  },
  modernDivider:     { borderBottomWidth: 1 },
  modernLineDot:     { width: 10, height: 10, borderRadius: 5, flexShrink: 0 },
  modernDirWrap:     { flex: 1, gap: 4 },
  modernDir:         { fontSize: 14, fontWeight: '700' },
  modernLinePill: {
    alignSelf: 'flex-start',
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 7, paddingVertical: 2,
    borderRadius: Radius.pill, borderWidth: 1,
  },
  modernLinePillText: { fontSize: 10, fontWeight: '700' },
  modernEtaBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    paddingHorizontal: 12, paddingVertical: 8,
    borderRadius: 10, borderWidth: 1,
    minWidth: 68, justifyContent: 'center',
  },
  modernNowDot: { width: 5, height: 5, borderRadius: 2.5 },
  modernEtaValue: { fontSize: 16, fontWeight: '900' },
  modernEtaMin:   { fontSize: 10, fontWeight: '600', alignSelf: 'flex-end', marginBottom: 1 },
  // kept for compat
  modernEta:    { fontSize: 13, fontWeight: '800' },
  modernTitleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: Spacing.lg, paddingBottom: Spacing.md },
  modernTitleLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, flex: 1, paddingRight: Spacing.sm },
  modernIconCircle: { width: 32, height: 32, borderRadius: 10, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },

  // ── Reference
  refCard: {
    borderRadius: Radius.lg,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: isDark ? 0.1 : 0.04,
    shadowRadius: 8, elevation: 1,
  },
  refHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    paddingBottom: Spacing.md,
    gap: Spacing.sm,
  },
  refIcon: {
    width: 38, height: 38,
    borderRadius: 19,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: isDark ? Colors.border : '#222',
  },
  refStation: {
    flex: 1,
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  refWalkPill: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: Radius.pill,
  },
  refWalkText: { fontSize: 13, fontWeight: '600' },
  refDivider: { height: 1, marginHorizontal: Spacing.lg },
  refEmptyRow: { padding: Spacing.lg, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm },
  refEmptyText: { fontSize: 14, fontWeight: '500' },
  refRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 14, paddingHorizontal: Spacing.lg,
  },
  refRowDivider: { height: 1, marginLeft: Spacing.lg + 16, marginRight: Spacing.lg }, // thin line between rows
  refDot: { width: 8, height: 8, borderRadius: 4, marginRight: 12 },
  refDir: { flex: 1, fontSize: 16, fontWeight: '700' },
  refEta: { fontSize: 16, fontWeight: '700' },
});
