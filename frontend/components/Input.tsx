
import { TextInput, View, Text, TextInputProps, StyleSheet } from 'react-native';

interface InputProps extends TextInputProps {
  label?: string;
  className?: string;
}

export const Input = ({ label, className, ...props }: InputProps) => {
  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      <TextInput 
        placeholderTextColor="#52525b" 
        style={styles.input}
        {...props}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    color: '#a1a1aa',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 4,
    marginBottom: 8,
  },
  input: {
    height: 48,
    backgroundColor: '#18181b',
    borderRadius: 12,
    paddingHorizontal: 16,
    color: '#ffffff',
    borderWidth: 1,
    borderColor: '#27272a',
  }
});
