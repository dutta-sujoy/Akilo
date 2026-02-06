
import { View, Text, TouchableOpacity, StyleSheet, TextInput, ScrollView, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useRef } from 'react';
import { useRouter } from 'expo-router';
import { api } from '../../core/api';
import { supabase } from '../../core/supabase';
import { ChevronLeft, Dumbbell, TrendingDown, Heart, ArrowRight, Check } from 'lucide-react-native';
import { useToast } from '../../components/Toast';
import { markOnboardingComplete } from '../../core/onboarding';

type Goal = 'muscle_gain' | 'fat_loss' | 'maintain';
type ActivityLevel = 'low' | 'medium' | 'high';

export default function Onboarding() {
  const router = useRouter();
  const { showToast } = useToast();
  const [step, setStep] = useState(1);
  const [goal, setGoal] = useState<Goal | null>(null);
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [age, setAge] = useState('');
  const [activity, setActivity] = useState<ActivityLevel | null>(null);
  const [loading, setLoading] = useState(false);
  
  const [calculatedTargets, setCalculatedTargets] = useState({
    calories: 0,
    protein: 0,
    carbs: 0,
    fats: 0,
    water: 0
  });

  const calculateTargets = () => {
    const h = parseInt(height) || 170;
    const w = parseInt(weight) || 70;
    const a = parseInt(age) || 25;
    
    // BMR using Mifflin-St Jeor
    let bmr = 10 * w + 6.25 * h - 5 * a + 5;
    
    // Activity multiplier
    const multipliers = { low: 1.2, medium: 1.55, high: 1.9 };
    let tdee = bmr * (multipliers[activity || 'medium']);
    
    // Goal adjustment
    if (goal === 'fat_loss') tdee -= 500;
    if (goal === 'muscle_gain') tdee += 300;
    
    const protein = Math.round(w * 2.2);
    const fats = Math.round((tdee * 0.25) / 9);
    const carbs = Math.round((tdee - (protein * 4) - (fats * 9)) / 4);
    const water = Math.round(w * 35);
    
    setCalculatedTargets({
      calories: Math.round(tdee),
      protein,
      carbs,
      fats,
      water
    });
    
    setStep(3);
  };

  const handleComplete = async () => {
    setLoading(true);
    try {
      // Save profile data
      await api.put('/api/profile/', {
        age: parseInt(age),
        height_cm: parseInt(height),
        weight_kg: parseFloat(weight),
        activity_level: activity,
        goal_type: goal
      });
      
      // Save targets
      await api.put('/api/profile/targets', {
        calories_target: calculatedTargets.calories,
        protein_target_g: calculatedTargets.protein,
        carbs_target_g: calculatedTargets.carbs,
        fats_target_g: calculatedTargets.fats,
        water_target_ml: calculatedTargets.water
      });
      
      // Mark onboarding as complete
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.id) {
        await markOnboardingComplete(session.user.id);
        console.log('Onboarding marked complete for:', session.user.id);
      }
      
      showToast('Profile setup complete!', 'success');
      router.replace('/(tabs)');
    } catch (e) {
      console.error('Onboarding error:', e);
      showToast('Failed to save profile. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const goals = [
    { id: 'muscle_gain', title: 'Build Muscle', subtitle: 'Hypertrophy focus', icon: Dumbbell },
    { id: 'fat_loss', title: 'Lose Fat', subtitle: 'Deficit focus', icon: TrendingDown },
    { id: 'maintain', title: 'Maintain Fit', subtitle: 'Balance focus', icon: Heart },
  ];

  const activities = [
    { id: 'low', title: 'Light', desc: '1-2 days/week' },
    { id: 'medium', title: 'Moderate', desc: '3-5 days/week' },
    { id: 'high', title: 'Very Active', desc: '6-7 days/week' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        {step > 1 && (
          <TouchableOpacity onPress={() => setStep(step - 1)} style={styles.backBtn}>
            <ChevronLeft color="#ffffff" size={24} />
          </TouchableOpacity>
        )}
        <Text style={styles.stepText}>Step {step} of 3</Text>
        <View style={styles.progressDots}>
          {[1, 2, 3].map(s => (
            <View key={s} style={[styles.dot, s <= step && styles.dotActive]} />
          ))}
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Step 1: Goal Selection + Stats */}
        {step === 1 && (
          <>
            <Text style={styles.title}>What is your goal?</Text>
            <Text style={styles.subtitle}>Select one to personalize your plan.</Text>

            {goals.map((g) => (
              <TouchableOpacity
                key={g.id}
                style={[styles.goalCard, goal === g.id && styles.goalCardActive]}
                onPress={() => setGoal(g.id as Goal)}
              >
                <View style={[styles.goalIcon, goal === g.id && styles.goalIconActive]}>
                  <g.icon color={goal === g.id ? '#0a1a15' : '#22c55e'} size={24} />
                </View>
                <View style={styles.goalInfo}>
                  <Text style={styles.goalTitle}>{g.title}</Text>
                  <Text style={[styles.goalSubtitle, goal === g.id && styles.goalSubtitleActive]}>{g.subtitle}</Text>
                </View>
                <View style={[styles.radioOuter, goal === g.id && styles.radioOuterActive]}>
                  {goal === g.id && <Check color="#0a1a15" size={14} />}
                </View>
              </TouchableOpacity>
            ))}

            <Text style={styles.sectionTitle}>Your Stats</Text>

            <View style={styles.statsRow}>
              <View style={styles.statInput}>
                <Text style={styles.inputLabel}>Height</Text>
                <View style={styles.inputWithUnit}>
                  <TextInput
                    style={styles.input}
                    value={height}
                    onChangeText={setHeight}
                    keyboardType="numeric"
                    placeholder="0"
                    placeholderTextColor="#6b7280"
                  />
                  <Text style={styles.unitText}>cm</Text>
                </View>
              </View>
              <View style={styles.statInput}>
                <Text style={styles.inputLabel}>Weight</Text>
                <View style={styles.inputWithUnit}>
                  <TextInput
                    style={styles.input}
                    value={weight}
                    onChangeText={setWeight}
                    keyboardType="numeric"
                    placeholder="0"
                    placeholderTextColor="#6b7280"
                  />
                  <Text style={styles.unitText}>kg</Text>
                </View>
              </View>
            </View>

            <View style={styles.ageInput}>
              <Text style={styles.inputLabel}>Age</Text>
              <TextInput
                style={styles.input}
                value={age}
                onChangeText={setAge}
                keyboardType="numeric"
                placeholder="e.g. 24"
                placeholderTextColor="#6b7280"
              />
            </View>
          </>
        )}

        {/* Step 2: Activity Level */}
        {step === 2 && (
          <>
            <Text style={styles.title}>Activity Level</Text>
            <Text style={styles.subtitle}>How often do you exercise?</Text>

            {activities.map((a) => (
              <TouchableOpacity
                key={a.id}
                style={[styles.activityCard, activity === a.id && styles.activityCardActive]}
                onPress={() => setActivity(a.id as ActivityLevel)}
              >
                <View>
                  <Text style={styles.activityTitle}>{a.title}</Text>
                  <Text style={styles.activityDesc}>{a.desc}</Text>
                </View>
                <View style={[styles.radioOuter, activity === a.id && styles.radioOuterActive]}>
                  {activity === a.id && <Check color="#0a1a15" size={14} />}
                </View>
              </TouchableOpacity>
            ))}
          </>
        )}

        {/* Step 3: Results */}
        {step === 3 && (
          <>
            <Text style={styles.title}>Your Daily Targets</Text>
            <Text style={styles.subtitle}>Calculated based on your profile</Text>

            <View style={styles.resultsCard}>
              <View style={styles.resultRow}>
                <Text style={styles.resultLabel}>Calories</Text>
                <Text style={styles.resultValue}>{calculatedTargets.calories.toLocaleString()} kcal</Text>
              </View>
              <View style={styles.resultRow}>
                <Text style={styles.resultLabel}>Protein</Text>
                <Text style={styles.resultValue}>{calculatedTargets.protein}g</Text>
              </View>
              <View style={styles.resultRow}>
                <Text style={styles.resultLabel}>Carbs</Text>
                <Text style={styles.resultValue}>{calculatedTargets.carbs}g</Text>
              </View>
              <View style={styles.resultRow}>
                <Text style={styles.resultLabel}>Fats</Text>
                <Text style={styles.resultValue}>{calculatedTargets.fats}g</Text>
              </View>
              <View style={[styles.resultRow, { borderBottomWidth: 0 }]}>
                <Text style={styles.resultLabel}>Water</Text>
                <Text style={styles.resultValue}>{(calculatedTargets.water / 1000).toFixed(1)}L</Text>
              </View>
            </View>

            <Text style={styles.noteText}>You can adjust these later in Settings</Text>
          </>
        )}
      </ScrollView>

      {/* Bottom Button */}
      <View style={styles.bottomSection}>
        {step === 1 && (
          <TouchableOpacity 
            style={[styles.primaryButton, (!goal || !height || !weight || !age) && styles.buttonDisabled]}
            onPress={() => setStep(2)}
            disabled={!goal || !height || !weight || !age}
          >
            <Text style={styles.primaryButtonText}>Continue</Text>
            <ArrowRight color="#0a1a15" size={20} />
          </TouchableOpacity>
        )}
        
        {step === 2 && (
          <TouchableOpacity 
            style={[styles.primaryButton, !activity && styles.buttonDisabled]}
            onPress={calculateTargets}
            disabled={!activity}
          >
            <Text style={styles.primaryButtonText}>Calculate My Targets</Text>
            <ArrowRight color="#0a1a15" size={20} />
          </TouchableOpacity>
        )}
        
        {step === 3 && (
          <TouchableOpacity 
            style={[styles.primaryButton, loading && styles.buttonDisabled]}
            onPress={handleComplete}
            disabled={loading}
          >
            <Text style={styles.primaryButtonText}>{loading ? 'Saving...' : 'Start Tracking'}</Text>
            <ArrowRight color="#0a1a15" size={20} />
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a1a15' },
  
  // Header
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16, gap: 12 },
  backBtn: { padding: 4 },
  stepText: { color: '#22c55e', fontWeight: '600' },
  progressDots: { flexDirection: 'row', gap: 8, marginLeft: 'auto' },
  dot: { width: 40, height: 4, borderRadius: 2, backgroundColor: '#1f3d32' },
  dotActive: { backgroundColor: '#22c55e' },
  
  // Content
  content: { flex: 1, paddingHorizontal: 20 },
  title: { color: '#ffffff', fontSize: 28, fontWeight: 'bold', marginTop: 16, marginBottom: 8 },
  subtitle: { color: '#6b7280', fontSize: 16, marginBottom: 24 },
  sectionTitle: { color: '#ffffff', fontSize: 18, fontWeight: '600', marginTop: 32, marginBottom: 16 },
  
  // Goal Cards
  goalCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#0f2920', borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 2, borderColor: '#1f3d32', gap: 16 },
  goalCardActive: { borderColor: '#22c55e', backgroundColor: '#153528' },
  goalIcon: { width: 52, height: 52, borderRadius: 14, backgroundColor: '#1f3d32', justifyContent: 'center', alignItems: 'center' },
  goalIconActive: { backgroundColor: '#22c55e' },
  goalInfo: { flex: 1 },
  goalTitle: { color: '#ffffff', fontSize: 17, fontWeight: '600' },
  goalSubtitle: { color: '#6b7280', marginTop: 2 },
  goalSubtitleActive: { color: '#22c55e' },
  radioOuter: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: '#1f3d32', justifyContent: 'center', alignItems: 'center' },
  radioOuterActive: { backgroundColor: '#22c55e', borderColor: '#22c55e' },
  
  // Stats Input
  statsRow: { flexDirection: 'row', gap: 16 },
  statInput: { flex: 1 },
  ageInput: { marginTop: 16 },
  inputLabel: { color: '#6b7280', marginBottom: 8, fontSize: 14 },
  inputWithUnit: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#0f2920', borderRadius: 12, borderWidth: 1, borderColor: '#1f3d32' },
  input: { flex: 1, color: '#ffffff', padding: 16, fontSize: 16 },
  unitText: { color: '#6b7280', paddingRight: 16 },
  
  // Activity Cards
  activityCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#0f2920', borderRadius: 16, padding: 20, marginBottom: 12, borderWidth: 2, borderColor: '#1f3d32' },
  activityCardActive: { borderColor: '#22c55e', backgroundColor: '#153528' },
  activityTitle: { color: '#ffffff', fontSize: 17, fontWeight: '600' },
  activityDesc: { color: '#6b7280', marginTop: 2 },
  
  // Results
  resultsCard: { backgroundColor: '#0f2920', borderRadius: 20, padding: 20, borderWidth: 1, borderColor: '#1f3d32' },
  resultRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#1f3d32' },
  resultLabel: { color: '#6b7280', fontSize: 16 },
  resultValue: { color: '#ffffff', fontSize: 18, fontWeight: 'bold' },
  noteText: { color: '#6b7280', textAlign: 'center', marginTop: 24 },
  
  // Bottom
  bottomSection: { padding: 20 },
  primaryButton: { backgroundColor: '#22c55e', paddingVertical: 18, borderRadius: 16, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8 },
  buttonDisabled: { opacity: 0.5 },
  primaryButtonText: { color: '#0a1a15', fontSize: 17, fontWeight: 'bold' },
});
