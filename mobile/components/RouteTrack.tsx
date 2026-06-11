import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { RouteResponse } from '@/services/api';
import { DarkColors, LightColors, Spacing, Radius } from '@/constants/theme';
import { useUserStore } from '@/store';

interface RouteTrackProps {
  route: RouteResponse;
  maxStations?: number;
}

export const RouteTrack: React.FC<RouteTrackProps> = ({ route, maxStations }) => {
  const { isDark } = useUserStore();
  const Colors = isDark ? DarkColors : LightColors;
  const styles = useMemo(() => getStyles(Colors, isDark), [isDark]);

  const { stations, type, segments } = route;

  const displayStations = useMemo(() => {
    if (!maxStations || stations.length <= maxStations) return stations;
    // Show first 3, ellipsis, last 3
    const head = stations.slice(0, 3);
    const tail = stations.slice(-3);
    return { head, tail, middle: stations.length - 6 };
  }, [stations, maxStations]);

  const getLineColor = (line: string | undefined) => {
    if (line === 'Green') return Colors.greenLine;
    if (line === 'Blue')  return Colors.blueLine;
    return Colors.textMuted;
  };

  const getDotColor = (s: typeof stations[0], idx: number) => {
    if (idx === 0 || idx === stations.length - 1) return getLineColor(s.line);
    if (s.isInterchange) return Colors.interchange;
    return Colors.bgCardHover;
  };

  // Track gradient
  const trackColor = type === 'direct'
    ? getLineColor(stations[0]?.line)
    : undefined;

  const renderStation = (s: typeof stations[0], idx: number, globalIdx?: number) => {
    const i = globalIdx ?? idx;
    const isFirst = i === 0;
    const isLast  = i === stations.length - 1;
    const isHighlighted = isFirst || isLast;
    const dotColor = getDotColor(s, i);

    return (
      <View key={`${s.name}-${i}`} style={styles.stationRow}>
        <View style={styles.trackCenter}>
          <View style={[
            styles.dot,
            isHighlighted && styles.dotEndpoint,
            { backgroundColor: dotColor, shadowColor: dotColor },
          ]} />
        </View>
        <View style={styles.stationInfo}>
          <Text style={[
            styles.stationName,
            isHighlighted && styles.stationHighlighted,
            s.isInterchange && !isFirst && !isLast && styles.stationInterchange,
          ]}>
            {s.name}
          </Text>
          {isFirst && <View style={styles.fromBadge}><Text style={styles.fromBadgeText}>FROM</Text></View>}
          {isLast  && <View style={styles.toBadge}><Text style={styles.toBadgeText}>TO</Text></View>}
          {s.isInterchange && !isFirst && !isLast && (
            <View style={styles.ixBadge}><Text style={styles.ixText}>⇄ CHANGE LINE</Text></View>
          )}
        </View>
      </View>
    );
  };

  // Line segment color logic
  const interchangeIdx = type === 'interchange'
    ? stations.findIndex(s => s.isInterchange && !stations.indexOf(s) === false)
    : -1;

  if (typeof displayStations === 'object' && 'head' in displayStations) {
    // Collapsed view
    return (
      <View style={styles.container}>
        <TrackLine type={type} segments={segments} stationCount={stations.length} Colors={Colors} styles={styles} />
        {displayStations.head.map((s, i) => renderStation(s, i))}
        <View style={styles.stationRow}>
          <View style={styles.trackCenter}>
            <View style={[styles.dot, styles.dotEllipsis]} />
          </View>
          <View style={styles.stationInfo}>
            <Text style={styles.ellipsisText}>+{displayStations.middle} more stations</Text>
          </View>
        </View>
        {displayStations.tail.map((s, i) => renderStation(s, stations.length - 3 + i, stations.length - 3 + i))}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <TrackLine type={type} segments={segments} stationCount={stations.length} Colors={Colors} styles={styles} />
      {stations.map((s, i) => renderStation(s, i))}
    </View>
  );
};

// Internal track line component
const TrackLine: React.FC<{
  type: string;
  segments: RouteResponse['segments'];
  stationCount: number;
  Colors: any;
  styles: any;
}> = ({ type, segments, Colors, styles }) => {
  if (type === 'direct') {
    const color = segments[0]?.line === 'Blue' ? Colors.blueLine : Colors.greenLine;
    return <View style={[styles.trackLine, { backgroundColor: color }]} />;
  }
  // Interchange: gradient-like effect using two halves
  return (
    <View style={styles.trackLine}>
      <View style={{ flex: 1, backgroundColor: Colors.greenLine }} />
      <View style={{ flex: 1, backgroundColor: Colors.blueLine }} />
    </View>
  );
};

const getStyles = (Colors: any, isDark: boolean) => StyleSheet.create({
  container: {
    position: 'relative',
  },
  trackLine: {
    position: 'absolute',
    left: 11, // Centers a 2px line exactly within a 24px fixed container (11 px empty, 2px line, 11 px empty)
    top: 24,
    bottom: 24,
    width: 2,
    borderRadius: 1,
    flexDirection: 'column',
    zIndex: 1,
  },
  stationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    minHeight: 40,
    zIndex: 2,
  },
  trackCenter: {
    width: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {
    width: 11,
    height: 11,
    borderRadius: 5.5,
    borderWidth: 2,
    borderColor: Colors.bgCard,
  },
  dotEndpoint: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 3,
  },
  dotEllipsis: {
    backgroundColor: Colors.textMuted,
    shadowOpacity: 0,
  },
  stationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    flex: 1,
    paddingLeft: Spacing.sm,
    flexWrap: 'wrap',
  },
  stationName: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  stationHighlighted: {
    fontSize: 15,
    color: Colors.textPrimary,
    fontWeight: '700',
  },
  stationInterchange: {
    color: Colors.interchange,
    fontWeight: '600',
  },
  ellipsisText: {
    fontSize: 12,
    color: Colors.textMuted,
    fontStyle: 'italic',
  },
  fromBadge: {
    backgroundColor: 'rgba(255,10,84,0.12)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radius.pill,
  },
  fromBadgeText: { fontSize: 9, color: Colors.accent, fontWeight: '700' },
  toBadge: {
    backgroundColor: 'rgba(50, 215, 75, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radius.pill,
  },
  toBadgeText: { fontSize: 9, color: Colors.greenLine, fontWeight: '700' },
  ixBadge: {
    backgroundColor: Colors.interchangeDim,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radius.pill,
  },
  ixText: { fontSize: 9, color: Colors.interchange, fontWeight: '700' },
});
