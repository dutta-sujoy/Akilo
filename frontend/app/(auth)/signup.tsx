
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, Image, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState } from 'react';
import { useRouter, Link } from 'expo-router';
import { supabase } from '../../core/supabase';
import { Mail, Lock, User, Eye, EyeOff, CheckCircle, ArrowLeft } from 'lucide-react-native';
import { useToast } from '../../components/Toast';

export default function Signup() {
  const router = useRouter();
  const { showToast } = useToast();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);

  const handleSignup = async () => {
    if (!name || !email || !password) {
      showToast('Please fill in all fields', 'error');
      return;
    }
    
    if (password.length < 6) {
      showToast('Password must be at least 6 characters', 'error');
      return;
    }
    
    setLoading(true);
    try {
      const { error, data } = await supabase.auth.signUp({
        email,
        password,
        options: { 
          data: { name },
          emailRedirectTo: undefined // Will use default Supabase redirect
        }
      });
      
      if (error) throw error;
      
      // Check if email confirmation is required
      if (data?.user?.identities?.length === 0) {
        // User already exists
        showToast('An account with this email already exists', 'error');
      } else {
        // Show confirmation screen
        setShowConfirmation(true);
      }
    } catch (e: any) {
      showToast(e.message || 'Signup failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleBackToLogin = () => {
    router.replace('/(auth)/login');
  };

  // Show email confirmation screen
  if (showConfirmation) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.confirmationContent}>
          <View style={styles.confirmationIcon}>
            <CheckCircle color="#22c55e" size={64} />
          </View>
          
          <Text style={styles.confirmationTitle}>Check Your Email</Text>
          
          <Text style={styles.confirmationText}>
            We've sent a confirmation link to:
          </Text>
          <Text style={styles.confirmationEmail}>{email}</Text>
          
          <View style={styles.instructionBox}>
            <Text style={styles.instructionTitle}>Next Steps:</Text>
            <Text style={styles.instructionText}>1. Open the email from Akilo</Text>
            <Text style={styles.instructionText}>2. Click the confirmation link</Text>
            <Text style={styles.instructionText}>3. You'll be redirected to complete your profile</Text>
          </View>

          <Text style={styles.spamNote}>
            Don't see the email? Check your spam folder.
          </Text>

          <TouchableOpacity style={styles.secondaryButton} onPress={handleBackToLogin}>
            <ArrowLeft color="#22c55e" size={20} />
            <Text style={styles.secondaryButtonText}>Back to Login</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.resendButton} 
            onPress={async () => {
              try {
                await supabase.auth.resend({ type: 'signup', email });
                showToast('Confirmation email resent!', 'success');
              } catch (e) {
                showToast('Failed to resend email', 'error');
              }
            }}
          >
            <Text style={styles.resendText}>Resend Confirmation Email</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.content}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          {/* Header */}
          <View style={styles.header}>
            <Image source={require('../../assets/logo.png')} style={styles.logoImage} />
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>Start your fitness journey today</Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Full Name</Text>
              <View style={styles.inputWrapper}>
                <User color="#6b7280" size={20} />
                <TextInput
                  style={styles.input}
                  value={name}
                  onChangeText={setName}
                  placeholder="John Doe"
                  placeholderTextColor="#6b7280"
                />
              </View>
            </View>

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
                  placeholder="At least 6 characters"
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
              onPress={handleSignup}
              disabled={loading}
            >
              <Text style={styles.primaryButtonText}>{loading ? 'Creating Account...' : 'Create Account'}</Text>
            </TouchableOpacity>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>Already have an account? </Text>
            <Link href="/(auth)/login" asChild>
              <TouchableOpacity>
                <Text style={styles.footerLink}>Sign In</Text>
              </TouchableOpacity>
            </Link>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a1a15' },
  content: { flex: 1 },
  scrollContent: { padding: 24, justifyContent: 'center', flexGrow: 1 },
  
  // Header
  header: { alignItems: 'center', marginBottom: 40 },
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
  
  // Confirmation Screen
  confirmationContent: { flex: 1, padding: 24, justifyContent: 'center', alignItems: 'center' },
  confirmationIcon: { width: 100, height: 100, borderRadius: 50, backgroundColor: 'rgba(34, 197, 94, 0.15)', justifyContent: 'center', alignItems: 'center', marginBottom: 24 },
  confirmationTitle: { color: '#ffffff', fontSize: 28, fontWeight: 'bold', marginBottom: 16, textAlign: 'center' },
  confirmationText: { color: '#9ca3af', fontSize: 16, textAlign: 'center' },
  confirmationEmail: { color: '#22c55e', fontSize: 18, fontWeight: '600', marginTop: 8, marginBottom: 32 },
  
  instructionBox: { backgroundColor: '#0f2920', borderRadius: 16, padding: 20, width: '100%', marginBottom: 24, borderWidth: 1, borderColor: '#1f3d32' },
  instructionTitle: { color: '#ffffff', fontSize: 16, fontWeight: '600', marginBottom: 12 },
  instructionText: { color: '#9ca3af', fontSize: 14, marginBottom: 8, paddingLeft: 8 },
  
  spamNote: { color: '#6b7280', fontSize: 13, textAlign: 'center', marginBottom: 32 },
  
  secondaryButton: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 16, paddingHorizontal: 24, borderRadius: 12, borderWidth: 1, borderColor: '#22c55e', marginBottom: 16 },
  secondaryButtonText: { color: '#22c55e', fontWeight: '600', fontSize: 16 },
  
  resendButton: { padding: 12 },
  resendText: { color: '#6b7280', fontSize: 14, textDecorationLine: 'underline' },
});
