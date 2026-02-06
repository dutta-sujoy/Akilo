// Theme system for Akilo app - 3 color schemes

export type ThemeColors = {
  // Backgrounds
  background: string;
  backgroundLight: string;
  surface: string;
  surfaceLight: string;
  
  // Primary accent
  primary: string;
  primaryLight: string;
  primaryDark: string;
  
  // Secondary colors for macros
  protein: string;
  carbs: string;
  fats: string;
  water: string;
  
  // Text
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  
  // Borders
  border: string;
  borderLight: string;
  borderActive: string;
  
  // Status
  success: string;
  warning: string;
  danger: string;
};

export type Theme = {
  id: 'green' | 'black' | 'pink';
  name: string;
  colors: ThemeColors;
};

// Green Theme (Default)
const greenTheme: Theme = {
  id: 'green',
  name: 'Green',
  colors: {
    background: '#0a1a15',
    backgroundLight: '#0f2920',
    surface: '#0f2920',
    surfaceLight: '#153528',
    
    primary: '#22c55e',
    primaryLight: '#4ade80',
    primaryDark: '#16a34a',
    
    protein: '#3b82f6',
    carbs: '#22c55e',
    fats: '#f97316',
    water: '#06b6d4',
    
    textPrimary: '#ffffff',
    textSecondary: '#9ca3af',
    textMuted: '#6b7280',
    
    border: '#1f3d32',
    borderLight: '#2d5242',
    borderActive: '#22c55e',
    
    success: '#22c55e',
    warning: '#eab308',
    danger: '#ef4444',
  },
};

// Black Theme
const blackTheme: Theme = {
  id: 'black',
  name: 'Black',
  colors: {
    background: '#000000',
    backgroundLight: '#0f0f0f',
    surface: '#1a1a1a',
    surfaceLight: '#2a2a2a',
    
    primary: '#ffffff',
    primaryLight: '#f5f5f5',
    primaryDark: '#d4d4d4',
    
    protein: '#3b82f6',
    carbs: '#ffffff',
    fats: '#f97316',
    water: '#06b6d4',
    
    textPrimary: '#ffffff',
    textSecondary: '#a3a3a3',
    textMuted: '#737373',
    
    border: '#2a2a2a',
    borderLight: '#3a3a3a',
    borderActive: '#ffffff',
    
    success: '#ffffff',
    warning: '#eab308',
    danger: '#ef4444',
  },
};

// Pink Theme
const pinkTheme: Theme = {
  id: 'pink',
  name: 'Pink',
  colors: {
    background: '#1a0a14',
    backgroundLight: '#2d1425',
    surface: '#2d1425',
    surfaceLight: '#3d1e33',
    
    primary: '#ec4899',
    primaryLight: '#f472b6',
    primaryDark: '#db2777',
    
    protein: '#a78bfa',
    carbs: '#ec4899',
    fats: '#fb923c',
    water: '#38bdf8',
    
    textPrimary: '#ffffff',
    textSecondary: '#d4a5c5',
    textMuted: '#a3799a',
    
    border: '#4a2d42',
    borderLight: '#5a3d52',
    borderActive: '#ec4899',
    
    success: '#ec4899',
    warning: '#fbbf24',
    danger: '#f43f5e',
  },
};

export const themes = {
  green: greenTheme,
  black: blackTheme,
  pink: pinkTheme,
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};

export const borderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
};

// Legacy export for backward compatibility
export const colors = greenTheme.colors;
