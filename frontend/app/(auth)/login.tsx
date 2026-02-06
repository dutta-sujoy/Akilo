
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, KeyboardAvoidingView, Platform, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState } from 'react';
import { useRouter, Link } from 'expo-router';
import { supabase } from '../../core/supabase';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react-native';

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      router.replace('/(tabs)');
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Image source={require('../../assets/logo.png')} style={styles.logoImage} />
          <Text style={styles.title}>Welcome Back</Text>
          <Text style={styles.subtitle}>Sign in to continue tracking your nutrition</Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Email</Text>
            <View style={styles.inputWrapper}>
              <Mail color="#6b7280" size={20} />
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="your@email.com"
                placeholderTextColor="#6b7280"
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Password</Text>
            <View style={styles.inputWrapper}>
              <Lock color="#6b7280" size={20} />
              <TextInput
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                placeholder="••••••••"
                placeholderTextColor="#6b7280"
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                {showPassword ? <EyeOff color="#6b7280" size={20} /> : <Eye color="#6b7280" size={20} />}
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity 
            style={[styles.primaryButton, loading && styles.buttonDisabled]} 
            onPress={handleLogin}
            disabled={loading}
          >
            <Text style={styles.primaryButtonText}>{loading ? 'Signing in...' : 'Sign In'}</Text>
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Don't have an account? </Text>
          <Link href="/(auth)/signup" asChild>
            <TouchableOpacity>
              <Text style={styles.footerLink}>Sign Up</Text>
            </TouchableOpacity>
          </Link>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a1a15' },
  content: { flex: 1, padding: 24, justifyContent: 'center' },
  
  // Header
  header: { alignItems: 'center', marginBottom: 48 },
  logoImage: { width: 80, height: 80, resizeMode: 'contain', marginBottom: 24 },
  title: { color: '#ffffff', fontSize: 28, fontWeight: 'bold', marginBottom: 8 },
  subtitle: { color: '#6b7280', fontSize: 16, textAlign: 'center' },
  
  // Form
  form: { marginBottom: 24 },
  inputGroup: { marginBottom: 20 },
  inputLabel: { color: '#9ca3af', marginBottom: 8, fontSize: 14 },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#0f2920', borderRadius: 12, paddingHorizontal: 16, borderWidth: 1, borderColor: '#1f3d32' },
  input: { flex: 1, color: '#ffffff', paddingVertical: 16, paddingHorizontal: 12, fontSize: 16 },
  
  // Buttons
  primaryButton: { backgroundColor: '#22c55e', paddingVertical: 18, borderRadius: 12, alignItems: 'center', marginTop: 8 },
  buttonDisabled: { opacity: 0.6 },
  primaryButtonText: { color: '#0a1a15', fontWeight: 'bold', fontSize: 16 },
  
  // Footer
  footer: { flexDirection: 'row', justifyContent: 'center' },
  footerText: { color: '#6b7280' },
  footerLink: { color: '#22c55e', fontWeight: '600' },
});
