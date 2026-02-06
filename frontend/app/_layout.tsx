
import { Slot, useRouter, useSegments } from 'expo-router';
import { useEffect, useState } from 'react';
import { supabase } from '../core/supabase';
import { Session } from '@supabase/supabase-js';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';
import { ToastProvider } from '../components/Toast';
import { hasCompletedOnboarding } from '../core/onboarding';
import "../global.css";

export default function RootLayout() {
  const [session, setSession] = useState<Session | null>(null);
  const [initialized, setInitialized] = useState(false);
  const [checkingOnboarding, setCheckingOnboarding] = useState(false);
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setInitialized(true);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      console.log('Auth state changed:', _event, session?.user?.id);
      setSession(session);
      
      // When a user logs in, check if they need onboarding
      if (session && (_event === 'SIGNED_IN' || _event === 'USER_UPDATED')) {
        setCheckingOnboarding(true);
        try {
          const completed = await hasCompletedOnboarding(session.user.id);
          console.log('Onboarding completed:', completed);
          
          if (!completed) {
            console.log('Redirecting to onboarding...');
            router.replace('/(auth)/onboarding');
          } else {
            router.replace('/(tabs)');
          }
        } catch (e) {
          console.error('Error checking onboarding:', e);
          // If check fails, go to onboarding to be safe
          router.replace('/(auth)/onboarding');
        } finally {
          setCheckingOnboarding(false);
        }
      }
    });
    
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!initialized || checkingOnboarding) return;

    const inAuthGroup = segments[0] === '(auth)';
    const inOnboarding = (segments as string[]).length > 1 && (segments as string[])[1] === 'onboarding';

    if (session && inAuthGroup && !inOnboarding) {
      // User is logged in but in auth group (not onboarding) - check onboarding status
      const checkAndNavigate = async () => {
        const completed = await hasCompletedOnboarding(session.user.id);
        if (!completed) {
          router.replace('/(auth)/onboarding');
        } else {
          router.replace('/(tabs)');
        }
      };
      checkAndNavigate();
    } else if (!session && segments[0] !== '(auth)') {
      // User is not logged in and not in auth group - go to login
      router.replace('/(auth)/login');
    }
  }, [session, initialized, segments, checkingOnboarding]);

  if (!initialized || checkingOnboarding) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#22c55e" />
        <Text style={styles.loadingText}>
          {checkingOnboarding ? 'Preparing your experience...' : 'Loading...'}
        </Text>
      </View>
    );
  }

  return (
    <ToastProvider>
      <Slot />
    </ToastProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: '#0a1a15',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16
  },
  loadingText: {
    color: '#6b7280',
    fontSize: 14,
    marginTop: 12
  }
});
