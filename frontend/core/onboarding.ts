import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const ONBOARDING_KEY_PREFIX = 'onboarding_completed_';

// Check if user has completed onboarding
export const hasCompletedOnboarding = async (userId: string): Promise<boolean> => {
  try {
    if (Platform.OS === 'web') {
      const value = localStorage.getItem(`${ONBOARDING_KEY_PREFIX}${userId}`);
      return value === 'true';
    } else {
      const value = await AsyncStorage.getItem(`${ONBOARDING_KEY_PREFIX}${userId}`);
      return value === 'true';
    }
  } catch (error) {
    console.error('Error checking onboarding status:', error);
    return false;
  }
};

// Mark onboarding as completed for a user
export const markOnboardingComplete = async (userId: string): Promise<void> => {
  try {
    if (Platform.OS === 'web') {
      localStorage.setItem(`${ONBOARDING_KEY_PREFIX}${userId}`, 'true');
    } else {
      await AsyncStorage.setItem(`${ONBOARDING_KEY_PREFIX}${userId}`, 'true');
    }
    console.log('Onboarding marked as complete for user:', userId);
  } catch (error) {
    console.error('Error marking onboarding complete:', error);
  }
};

// Clear onboarding status (useful for testing or logout)
export const clearOnboardingStatus = async (userId: string): Promise<void> => {
  try {
    if (Platform.OS === 'web') {
      localStorage.removeItem(`${ONBOARDING_KEY_PREFIX}${userId}`);
    } else {
      await AsyncStorage.removeItem(`${ONBOARDING_KEY_PREFIX}${userId}`);
    }
  } catch (error) {
    console.error('Error clearing onboarding status:', error);
  }
};
