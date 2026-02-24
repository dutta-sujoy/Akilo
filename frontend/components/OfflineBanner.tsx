
import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, StyleSheet } from 'react-native';
import { useNetwork } from '../core/network';
import { WifiOff } from 'lucide-react-native';

export const OfflineBanner = () => {
  const { isOnline, pendingCount } = useNetwork();
  const slideAnim = useRef(new Animated.Value(-60)).current;

  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: isOnline ? -60 : 0,
      useNativeDriver: true,
      tension: 80,
      friction: 12,
    }).start();
  }, [isOnline]);

  return (
    <Animated.View style={[styles.banner, { transform: [{ translateY: slideAnim }] }]}>
      <WifiOff color="#fbbf24" size={16} />
      <Text style={styles.text}>
        You're offline
        {pendingCount > 0 ? ` • ${pendingCount} change${pendingCount > 1 ? 's' : ''} pending` : ' • changes will sync automatically'}
      </Text>
    </Animated.View>
  );
};
const styles = StyleSheet.create({
  banner: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: '#1c1917',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    gap: 8,
    zIndex: 1000,
    borderBottomWidth: 1,
    borderBottomColor: '#fbbf2430',
  },
  text: {
    color: '#fbbf24',
    fontSize: 13,
    fontWeight: '600',
  },
});
