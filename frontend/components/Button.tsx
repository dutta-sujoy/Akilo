
import { Text, TouchableOpacity, ActivityIndicator, StyleSheet, ViewStyle, TextStyle } from 'react-native';

interface ButtonProps {
  title: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'outline';
  className?: string;
}

export const Button = ({ title, onPress, loading, disabled, variant = 'primary', className }: ButtonProps) => {
  const variantStyles: Record<string, ViewStyle> = {
    primary: { backgroundColor: '#3b82f6' },
    secondary: { backgroundColor: '#18181b' },
    outline: { backgroundColor: 'transparent', borderWidth: 1, borderColor: '#3f3f46' }
  };
  
  const textVariantStyles: Record<string, TextStyle> = {
    primary: { color: '#ffffff', fontWeight: 'bold' },
    secondary: { color: '#ffffff', fontWeight: '600' },
    outline: { color: '#d4d4d8', fontWeight: '600' }
  };

  return (
    <TouchableOpacity 
      onPress={onPress} 
      disabled={loading || disabled}
      style={[styles.button, variantStyles[variant], (loading || disabled) && styles.disabled]}
      activeOpacity={0.8}
    >
      {loading ? <ActivityIndicator color="white" /> : <Text style={[styles.text, textVariantStyles[variant]]}>{title}</Text>}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    height: 48,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    marginTop: 16,
  },
  text: {
    fontSize: 16,
  },
  disabled: {
    opacity: 0.7,
  }
});
