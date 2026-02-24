
import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, ViewStyle } from 'react-native';

// Animated shimmer box — opacity pulse
const SkeletonBox = ({ width, height, borderRadius = 12, style }: {
  width: number | string;
  height: number;
  borderRadius?: number;
  style?: ViewStyle;
}) => {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.7, duration: 800, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.3, duration: 800, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);

  return (
    <Animated.View
      style={[
        { width: width as any, height, borderRadius, backgroundColor: '#153528', opacity },
        style,
      ]}
    />
  );
};

// ─── Dashboard Skeleton ───
export const DashboardSkeleton = () => (
  <View style={s.container}>
    {/* Header */}
    <SkeletonBox width={160} height={28} style={{ marginBottom: 6 }} />
    <SkeletonBox width={200} height={14} style={{ marginBottom: 24 }} />

    {/* Macro ring card */}
    <SkeletonBox width="100%" height={260} borderRadius={24} style={{ marginBottom: 16 }} />

    {/* Macro stats row */}
    <View style={s.row}>
      <SkeletonBox width="48%" height={80} borderRadius={16} />
      <SkeletonBox width="48%" height={80} borderRadius={16} />
    </View>
    <View style={[s.row, { marginTop: 12 }]}>
      <SkeletonBox width="48%" height={80} borderRadius={16} />
      <SkeletonBox width="48%" height={80} borderRadius={16} />
    </View>

    {/* Water & Weight cards */}
    <SkeletonBox width="100%" height={140} borderRadius={20} style={{ marginTop: 16 }} />
    <SkeletonBox width="100%" height={140} borderRadius={20} style={{ marginTop: 12 }} />
  </View>
);

// ─── History Skeleton ───
export const HistorySkeleton = () => (
  <View style={s.container}>
    {/* Header */}
    <SkeletonBox width={120} height={28} style={{ marginBottom: 20 }} />

    {/* Date nav */}
    <View style={[s.row, { marginBottom: 16 }]}>
      <SkeletonBox width={36} height={36} borderRadius={18} />
      <SkeletonBox width={140} height={20} />
      <SkeletonBox width={36} height={36} borderRadius={18} />
    </View>

    {/* Summary strip */}
    <View style={[s.row, { marginBottom: 20 }]}>
      <SkeletonBox width="23%" height={56} borderRadius={12} />
      <SkeletonBox width="23%" height={56} borderRadius={12} />
      <SkeletonBox width="23%" height={56} borderRadius={12} />
      <SkeletonBox width="23%" height={56} borderRadius={12} />
    </View>

    {/* Meal groups */}
    {[1, 2, 3].map((i) => (
      <View key={i} style={{ marginBottom: 16 }}>
        <SkeletonBox width={100} height={16} style={{ marginBottom: 10 }} />
        <SkeletonBox width="100%" height={64} borderRadius={14} style={{ marginBottom: 8 }} />
        <SkeletonBox width="100%" height={64} borderRadius={14} />
      </View>
    ))}
  </View>
);

// ─── Analytics Skeleton ───
export const AnalyticsSkeleton = () => (
  <View style={s.container}>
    {/* Header */}
    <SkeletonBox width={180} height={28} style={{ marginBottom: 6 }} />
    <SkeletonBox width={220} height={14} style={{ marginBottom: 24 }} />

    {/* Toggle */}
    <SkeletonBox width="100%" height={48} borderRadius={14} style={{ marginBottom: 24 }} />

    {/* Main chart card */}
    <SkeletonBox width="100%" height={220} borderRadius={24} style={{ marginBottom: 16 }} />

    {/* Quick stats */}
    <SkeletonBox width="100%" height={80} borderRadius={20} style={{ marginBottom: 16 }} />

    {/* Small cards */}
    <SkeletonBox width="100%" height={140} borderRadius={20} style={{ marginBottom: 16 }} />
    <SkeletonBox width="100%" height={140} borderRadius={20} />
  </View>
);

// ─── Profile Skeleton ───
export const ProfileSkeleton = () => (
  <View style={s.container}>
    {/* Header */}
    <SkeletonBox width={100} height={24} style={{ marginBottom: 24 }} />

    {/* Profile card */}
    <View style={[s.row, { marginBottom: 20, gap: 16 }]}>
      <SkeletonBox width={56} height={56} borderRadius={28} />
      <View style={{ flex: 1, gap: 8 }}>
        <SkeletonBox width={120} height={18} />
        <SkeletonBox width={180} height={14} />
      </View>
    </View>

    {/* Stats row */}
    <SkeletonBox width="100%" height={80} borderRadius={16} style={{ marginBottom: 20 }} />

    {/* Badges */}
    <View style={[s.row, { marginBottom: 24 }]}>
      <SkeletonBox width="48%" height={64} borderRadius={12} />
      <SkeletonBox width="48%" height={64} borderRadius={12} />
    </View>

    {/* Section title */}
    <SkeletonBox width={140} height={20} style={{ marginBottom: 16 }} />

    {/* Targets grid */}
    <View style={[s.row, { marginBottom: 12 }]}>
      <SkeletonBox width="48%" height={72} borderRadius={12} />
      <SkeletonBox width="48%" height={72} borderRadius={12} />
    </View>
    <View style={s.row}>
      <SkeletonBox width="48%" height={72} borderRadius={12} />
      <SkeletonBox width="48%" height={72} borderRadius={12} />
    </View>
  </View>
);

const s = StyleSheet.create({
  container: { padding: 20 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
});
