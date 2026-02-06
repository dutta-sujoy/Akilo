
import { View, Text, ScrollView, RefreshControl, TouchableOpacity, StyleSheet, Modal, TextInput, Dimensions, Image, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useEffect, useState, useCallback, useRef } from 'react';
import { api } from '../../core/api';
import { useRouter } from 'expo-router';
import { Plus, Droplets, Scale, X, Flame, Dumbbell, Wheat, Droplet } from 'lucide-react-native';
import { supabase } from '../../core/supabase';
import Svg, { Circle, G } from 'react-native-svg';
import { useToast } from '../../components/Toast';
import { BarChart } from 'react-native-gifted-charts';

const { width } = Dimensions.get('window');

// Circular Progress Component
const CircularProgress = ({ progress, size, strokeWidth, color }: { progress: number, size: number, strokeWidth: number, color: string }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (Math.min(progress, 1) * circumference);
  
  return (
    <Svg width={size} height={size}>
      <G rotation="-90" origin={`${size/2}, ${size/2}`}>
        {/* Background circle */}
        <Circle
          cx={size/2}
          cy={size/2}
          r={radius}
          stroke="#1f3d32"
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        {/* Progress circle */}
        <Circle
          cx={size/2}
          cy={size/2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
        />
      </G>
    </Svg>
  );
};

// Small Macro Card with circular progress
const MacroCard = ({ label, value, target, color, icon: IconComponent }: { label: string, value: number, target: number, color: string, icon: any }) => {
  const [showPercentage, setShowPercentage] = useState(false);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const progress = target > 0 ? value / target : 0;
  const percentage = Math.round(progress * 100);
  
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 0.8,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start(() => {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();
    });
  }, [showPercentage]);
  
  return (
    <TouchableOpacity style={styles.macroCard} onPress={() => setShowPercentage(!showPercentage)}>
      <View style={styles.macroCircleWrapper}>
        <CircularProgress progress={progress} size={60} strokeWidth={5} color={color} />
        <Animated.View style={[styles.macroIconWrapper, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>
          {showPercentage ? (
            <Text style={[styles.macroPercentage, { color }]}>{percentage}%</Text>
          ) : (
            <IconComponent color={color} size={16} />
          )}
        </Animated.View>
      </View>
      <Text style={[styles.macroValue, { color }]}>{Math.round(value)}g</Text>
      <Text style={styles.macroLabel}>{label}</Text>
    </TouchableOpacity>
  );
};

export default function Dashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [waterModalVisible, setWaterModalVisible] = useState(false);
  const [weightModalVisible, setWeightModalVisible] = useState(false);
  const [customWater, setCustomWater] = useState('');
  const [weight, setWeight] = useState('');
  const [streak, setStreak] = useState(0);
  const [latestWeight, setLatestWeight] = useState<number | null>(null);
  const [weightHistory, setWeightHistory] = useState<number[]>([]);
  const [showCaloriePercentage, setShowCaloriePercentage] = useState(false);
  const calorieFadeAnim = useRef(new Animated.Value(1)).current;
  const calorieScaleAnim = useRef(new Animated.Value(1)).current;
  const router = useRouter();
  const { showToast } = useToast();

  const fetchDashboard = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setLoading(false);
        return;
      }
      
      const today = new Date().toISOString().split('T')[0];
      const res = await api.get('/api/analytics/daily', { date: today });
      setData(res);
      
      try {
        const streakRes = await supabase.from('streaks').select('current_streak').single();
        if (streakRes.data) setStreak(streakRes.data.current_streak || 0);
      } catch (e) {}
      
      // Fetch latest weight
      try {
        const weightRes = await supabase
          .from('weight_logs')
          .select('weight_kg, date')
          .order('date', { ascending: false })
          .limit(7);
        
        if (weightRes.data && weightRes.data.length > 0) {
          console.log('Weight data fetched:', weightRes.data);
          setLatestWeight(weightRes.data[0].weight_kg);
          const history = weightRes.data.reverse().map(w => w.weight_kg);
          console.log('Weight history set:', history);
          setWeightHistory(history);
        } else {
          console.log('No weight data found');
        }
      } catch (e) {
        console.error('Weight fetch error:', e);
      }
    } catch (e) {
      console.error("Dashboard fetch error:", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchDashboard(); }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchDashboard();
  }, []);

  const handleAddWater = async (amount: number) => {
    try {
      await api.post('/api/water/', { date: new Date().toISOString().split('T')[0], amount_ml: amount });
      showToast(`Added ${amount}ml of water!`, 'success');
      setWaterModalVisible(false);
      setCustomWater('');
      fetchDashboard();
    } catch (e) {
      showToast('Failed to log water', 'error');
    }
  };

  useEffect(() => {
    Animated.parallel([
      Animated.timing(calorieFadeAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(calorieScaleAnim, {
        toValue: 0.8,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start(() => {
      Animated.parallel([
        Animated.timing(calorieFadeAnim, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(calorieScaleAnim, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();
    });
  }, [showCaloriePercentage]);


  const handleLogWeight = async () => {
    const weightNum = parseFloat(weight);
    if (!weightNum || weightNum <= 0) {
      showToast('Please enter a valid weight', 'error');
      return;
    }
    try {
      await api.post('/api/weight/', { date: new Date().toISOString().split('T')[0], weight_kg: weightNum });
      showToast(`Weight logged: ${weightNum}kg`, 'success');
      setWeightModalVisible(false);
      setWeight('');
    } catch (e) {
      showToast('Failed to log weight', 'error');
    }
  };

  if (loading && !data) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading...</Text>
      </SafeAreaView>
    );
  }

  const { summary, targets } = data || { 
    summary: { calories: 0, protein: 0, carbs: 0, fats: 0, water: 0 }, 
    targets: { calories_target: 2000, protein_target_g: 120, carbs_target_g: 250, fats_target_g: 60, water_target_ml: 3000 } 
  };
  
  const caloriesConsumed = Math.round(summary.calories || 0);
  const caloriesTarget = targets?.calories_target || 2000;
  const caloriesRemaining = Math.max(caloriesTarget - caloriesConsumed, 0);
  const calProgress = caloriesTarget > 0 ? caloriesConsumed / caloriesTarget : 0;
  const waterProgress = targets?.water_target_ml ? (summary.water || 0) / targets.water_target_ml : 0;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#22c55e" />}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Image source={require('../../assets/logo.png')} style={styles.logoImage} />
            <Text style={styles.appName}>Akilo</Text>
          </View>
          <View style={styles.headerRight}>
            <View style={styles.dateContainer}>
              <Text style={styles.dateLabel}>TODAY</Text>
              <Text style={styles.dateValue}>{new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</Text>
            </View>
            <View style={styles.streakBadge}>
              <Flame color="#f97316" size={16} />
              <Text style={styles.streakText}>{streak}</Text>
            </View>
          </View>
        </View>

        {/* Main Calorie Circle */}
        <View style={styles.calorieSection}>
          <TouchableOpacity style={styles.calorieCircleContainer} onPress={() => setShowCaloriePercentage(!showCaloriePercentage)}>
            <CircularProgress progress={calProgress} size={220} strokeWidth={16} color="#22c55e" />
            <Animated.View style={[styles.calorieCenter, { opacity: calorieFadeAnim, transform: [{ scale: calorieScaleAnim }] }]}>
              {showCaloriePercentage ? (
                <>
                  <Text style={styles.calorieLabel}>Progress</Text>
                  <Text style={styles.calorieValue}>{Math.round(calProgress * 100)}%</Text>
                  <Text style={styles.calorieUnit}>COMPLETE</Text>
                </>
              ) : (
                <>
                  <Text style={styles.calorieLabel}>Remaining</Text>
                  <Text style={styles.calorieValue}>{caloriesRemaining.toLocaleString()}</Text>
                  <Text style={styles.calorieUnit}>KCAL</Text>
                </>
              )}
            </Animated.View>
          </TouchableOpacity>
          
          <View style={styles.calorieStats}>
            <View style={styles.calorieStat}>
              <Text style={styles.calorieStatLabel}>Consumed</Text>
              <Text style={styles.calorieStatValue}>{caloriesConsumed.toLocaleString()}</Text>
            </View>
            <View style={styles.calorieStatDivider} />
            <View style={styles.calorieStat}>
              <Text style={styles.calorieStatLabel}>Target</Text>
              <Text style={styles.calorieStatValue}>{caloriesTarget.toLocaleString()}</Text>
            </View>
          </View>
        </View>

        {/* Macro Cards */}
        <View style={styles.macroRow}>
          <MacroCard label="Protein" value={summary.protein || 0} target={targets?.protein_target_g || 120} color="#3b82f6" icon={Dumbbell} />
          <MacroCard label="Carbs" value={summary.carbs || 0} target={targets?.carbs_target_g || 250} color="#22c55e" icon={Wheat} />
          <MacroCard label="Fats" value={summary.fats || 0} target={targets?.fats_target_g || 60} color="#f97316" icon={Droplet} />
        </View>

        {/* Hydration Section */}
        <View style={styles.sectionHeader}>
          <Droplets color="#06b6d4" size={20} />
          <Text style={styles.sectionTitle}>Hydration</Text>
        </View>
        <View style={styles.hydrationCard}>
          <View style={styles.hydrationLeft}>
            <Text style={styles.hydrationValue}>{Math.round(summary.water || 0).toLocaleString()}</Text>
            <Text style={styles.hydrationTarget}>/ {(targets?.water_target_ml || 3000).toLocaleString()}ml</Text>
          </View>
          <View style={styles.hydrationMiddle}>
            <View style={styles.hydrationBar}>
              <View style={[styles.hydrationProgress, { width: `${Math.min(waterProgress * 100, 100)}%` }]} />
            </View>
          </View>
          <View style={styles.hydrationRight}>
            <TouchableOpacity style={styles.quickWaterBtn} onPress={() => handleAddWater(250)}>
              <Plus color="#06b6d4" size={14} />
              <Text style={styles.quickWaterBtnText}>250</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickWaterBtn} onPress={() => handleAddWater(500)}>
              <Plus color="#06b6d4" size={14} />
              <Text style={styles.quickWaterBtnText}>500</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Weight Section */}
        <View style={styles.sectionHeader}>
          <Scale color="#a855f7" size={20} />
          <Text style={styles.sectionTitle}>Weight</Text>
        </View>
        <View style={styles.weightCard}>
          {latestWeight ? (
            <>
              <View style={styles.weightInfo}>
                <View style={styles.weightMain}>
                  <Text style={styles.weightValue}>{latestWeight.toFixed(1)}</Text>
                  <Text style={styles.weightUnit}>kg</Text>
                </View>
                {weightHistory.length >= 2 && (
                  <View style={styles.weightChange}>
                    <Text style={[styles.weightChangeIcon, { color: weightHistory[weightHistory.length - 1] < weightHistory[0] ? '#22c55e' : '#ef4444' }]}>
                      {weightHistory[weightHistory.length - 1] < weightHistory[0] ? '↓' : '↑'}
                    </Text>
                    <Text style={[styles.weightChangeText, { color: weightHistory[weightHistory.length - 1] < weightHistory[0] ? '#22c55e' : '#ef4444' }]}>
                      {Math.abs(weightHistory[weightHistory.length - 1] - weightHistory[0]).toFixed(1)} kg
                    </Text>
                    <Text style={styles.weightChangePeriod}>last 7 days</Text>
                  </View>
                )}
              </View>
              <View style={styles.weightChart}>
                {weightHistory.length >= 2 ? (
                  <BarChart
                    data={weightHistory.map((w, i) => ({ 
                      value: w,
                      frontColor: i === weightHistory.length - 1 ? '#22c55e' : '#374151'
                    }))}
                    width={120}
                    height={40}
                    barWidth={8}
                    spacing={6}
                    hideRules
                    hideYAxisText
                    hideAxesAndRules
                    noOfSections={3}
                    maxValue={Math.max(...weightHistory) * 1.1}
                  />
                ) : null}
              </View>
              <TouchableOpacity style={styles.weightUpdateBtn} onPress={() => setWeightModalVisible(true)}>
                <Plus color="#a855f7" size={18} />
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Text style={styles.weightPlaceholder}>No weight logged yet</Text>
              <TouchableOpacity style={styles.weightUpdateBtn} onPress={() => setWeightModalVisible(true)}>
                <Plus color="#a855f7" size={18} />
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActionsRow}>
          <TouchableOpacity style={styles.quickActionBtn} onPress={() => router.push('/(tabs)/food')}>
            <Plus color="#22c55e" size={24} />
            <Text style={styles.quickActionText}>Add Food</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickActionBtn} onPress={() => setWaterModalVisible(true)}>
            <Droplets color="#06b6d4" size={24} />
            <Text style={styles.quickActionText}>Add Water</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Water Modal */}
      <Modal visible={waterModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Water</Text>
              <TouchableOpacity onPress={() => setWaterModalVisible(false)}>
                <X color="#6b7280" size={24} />
              </TouchableOpacity>
            </View>

            <View style={styles.quickWaterGrid}>
              {[250, 500, 750, 1000].map((amt) => (
                <TouchableOpacity key={amt} style={styles.quickWaterButton} onPress={() => handleAddWater(amt)}>
                  <Text style={styles.quickWaterText}>{amt}ml</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.inputLabel}>Custom Amount (ml)</Text>
            <TextInput
              style={styles.input}
              value={customWater}
              onChangeText={setCustomWater}
              keyboardType="numeric"
              placeholder="Enter amount"
              placeholderTextColor="#6b7280"
            />
            <TouchableOpacity style={styles.primaryButton} onPress={() => {
              const amt = parseInt(customWater);
              if (amt > 0) handleAddWater(amt);
            }}>
              <Text style={styles.primaryButtonText}>Add Water</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Weight Modal */}
      <Modal visible={weightModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Log Weight</Text>
              <TouchableOpacity onPress={() => setWeightModalVisible(false)}>
                <X color="#6b7280" size={24} />
              </TouchableOpacity>
            </View>

            <Text style={styles.inputLabel}>Weight (kg)</Text>
            <TextInput
              style={styles.input}
              value={weight}
              onChangeText={setWeight}
              keyboardType="decimal-pad"
              placeholder="e.g. 75.5"
              placeholderTextColor="#6b7280"
            />
            <TouchableOpacity style={styles.primaryButton} onPress={handleLogWeight}>
              <Text style={styles.primaryButtonText}>Log Weight</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a1a15' },
  loadingContainer: { flex: 1, backgroundColor: '#0a1a15', justifyContent: 'center', alignItems: 'center' },
  loadingText: { color: '#6b7280' },
  scrollContent: { padding: 20, paddingBottom: 100 },
  
  // Header
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  logoImage: { width: 40, height: 40, resizeMode: 'contain' },
  appName: { color: '#ffffff', fontSize: 20, fontWeight: 'bold' },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  dateContainer: { alignItems: 'flex-end' },
  dateLabel: { color: '#6b7280', fontSize: 10, fontWeight: '600' },
  dateValue: { color: '#ffffff', fontSize: 14, fontWeight: 'bold' },
  streakBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1f3d32', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20, gap: 4 },
  streakText: { color: '#ffffff', fontWeight: 'bold' },
  
  // Calorie Section
  calorieSection: { alignItems: 'center', marginBottom: 24 },
  calorieCircleContainer: { position: 'relative', alignItems: 'center', justifyContent: 'center' },
  calorieCenter: { position: 'absolute', alignItems: 'center' },
  calorieLabel: { color: '#9ca3af', fontSize: 13 },
  calorieValue: { color: '#ffffff', fontSize: 48, fontWeight: 'bold' },
  calorieUnit: { color: '#22c55e', fontSize: 14, fontWeight: '600' },
  calorieStats: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 32, marginTop: 16 },
  calorieStat: { alignItems: 'center' },
  calorieStatLabel: { color: '#6b7280', fontSize: 12 },
  calorieStatValue: { color: '#ffffff', fontSize: 22, fontWeight: 'bold', marginTop: 4 },
  calorieStatDivider: { width: 1, height: 40, backgroundColor: '#1f3d32' },
  
  // Macro Cards
  macroRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 24, gap: 12 },
  macroCard: { flex: 1, backgroundColor: '#0f2920', borderRadius: 16, padding: 16, alignItems: 'center', borderWidth: 1, borderColor: '#1f3d32' },
  macroCircleWrapper: { position: 'relative', alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  macroIconWrapper: { position: 'absolute' },
  macroPercentage: { fontSize: 11, fontWeight: 'bold' },
  macroValue: { fontSize: 18, fontWeight: 'bold' },
  macroLabel: { color: '#6b7280', fontSize: 12 },
  
  // Section Header
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  sectionTitle: { color: '#ffffff', fontSize: 16, fontWeight: '600' },
  
  // Hydration
  hydrationCard: { 
    backgroundColor: '#0f2920', borderRadius: 16, padding: 16, marginBottom: 24,
    borderWidth: 1, borderColor: 'rgba(6, 182, 212, 0.2)',
    flexDirection: 'row', alignItems: 'center', gap: 12,
  },
  hydrationLeft: { minWidth: 80 },
  hydrationValue: { color: '#ffffff', fontSize: 24, fontWeight: 'bold' },
  hydrationTarget: { color: '#6b7280', fontSize: 12, marginTop: 2 },
  hydrationMiddle: { flex: 1 },
  hydrationBar: { height: 6, backgroundColor: '#1f3d32', borderRadius: 3, overflow: 'hidden' },
  hydrationProgress: { height: '100%', backgroundColor: '#06b6d4', borderRadius: 3 },
  hydrationRight: { flexDirection: 'row', gap: 8 },
  quickWaterBtn: { 
    backgroundColor: 'rgba(6, 182, 212, 0.15)', paddingHorizontal: 10, paddingVertical: 8, 
    borderRadius: 10, flexDirection: 'row', alignItems: 'center', gap: 4,
    borderWidth: 1, borderColor: 'rgba(6, 182, 212, 0.3)',
  },
  quickWaterBtnText: { color: '#06b6d4', fontWeight: 'bold', fontSize: 13 },
  
  // Weight
  weightCard: { 
    backgroundColor: '#0f2920', borderRadius: 16, padding: 16, marginBottom: 24, 
    borderWidth: 1, borderColor: '#1f3d32', flexDirection: 'row', alignItems: 'center', gap: 12, justifyContent: 'space-between',
  },
  weightInfo: { flexShrink: 0 },
  weightMain: { flexDirection: 'row', alignItems: 'baseline', marginBottom: 6 },
  weightValue: { color: '#ffffff', fontSize: 36, fontWeight: 'bold' },
  weightUnit: { color: '#9ca3af', fontSize: 16, marginLeft: 4 },
  weightChange: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  weightChangeIcon: { color: '#22c55e', fontSize: 14, fontWeight: 'bold' },
  weightChangeText: { color: '#22c55e', fontSize: 13, fontWeight: 'bold' },
  weightChangePeriod: { color: '#6b7280', fontSize: 12 },
  weightChart: { flex: 1, height: 40, maxWidth: 150 },
  weightPlaceholder: { color: '#9ca3af', fontSize: 15, textAlign: 'center', flex: 1 },
  weightUpdateBtn: { 
    backgroundColor: 'rgba(168, 85, 247, 0.15)', width: 40, height: 40, borderRadius: 12, 
    alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(168, 85, 247, 0.3)',
  },
  
  // Quick Actions
  quickActionsRow: { flexDirection: 'row', gap: 12 },
  quickActionBtn: { flex: 1, backgroundColor: '#0f2920', padding: 16, borderRadius: 16, alignItems: 'center', borderWidth: 1, borderColor: '#1f3d32', gap: 8 },
  quickActionText: { color: '#ffffff', fontWeight: '500' },
  
  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#0f2920', padding: 24, borderTopLeftRadius: 24, borderTopRightRadius: 24, borderTopWidth: 1, borderColor: '#1f3d32' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  modalTitle: { color: '#ffffff', fontSize: 20, fontWeight: 'bold' },
  inputLabel: { color: '#9ca3af', marginBottom: 8, marginTop: 16 },
  input: { backgroundColor: '#153528', borderRadius: 12, padding: 16, color: '#ffffff', fontSize: 16, borderWidth: 1, borderColor: '#1f3d32' },
  quickWaterGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  quickWaterButton: { flex: 1, minWidth: '45%', backgroundColor: '#153528', paddingVertical: 16, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: '#1f3d32' },
  quickWaterText: { color: '#ffffff', fontWeight: 'bold', fontSize: 16 },
  primaryButton: { backgroundColor: '#22c55e', paddingVertical: 16, borderRadius: 12, alignItems: 'center', marginTop: 16 },
  primaryButtonText: { color: '#0a1a15', fontWeight: 'bold', fontSize: 16 },
});
