
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, RefreshControl, Dimensions, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useEffect, useState, useCallback } from 'react';
import { api } from '../../core/api';
import { BarChart, LineChart } from 'react-native-gifted-charts';
import { Flame, Droplets, TrendingUp, TrendingDown, Scale, Activity } from 'lucide-react-native';

const { width } = Dimensions.get('window');

export default function Analytics() {
  const [period, setPeriod] = useState<'weekly' | 'monthly'>('weekly');
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [target, setTarget] = useState(2000);
  const [waterTarget, setWaterTarget] = useState(2500);
  const [streak, setStreak] = useState({ current_streak: 0, best_streak: 0 });
  const [weightTrend, setWeightTrend] = useState(0);
  const [weightLogs, setWeightLogs] = useState<any[]>([]);

  const fetchAnalytics = async () => {
    try {
      const days = period === 'weekly' ? 7 : 30;
      const res = await api.get('/api/analytics/weekly', { days });
      
      if (res) {
        const dailyData = Array.isArray(res) ? res : (res.data || []);
        setData(dailyData);
        
        if (res.targets?.calories_target) setTarget(res.targets.calories_target);
        else if (dailyData.length > 0 && dailyData[0].targets?.calories_target) setTarget(dailyData[0].targets.calories_target);
        
        if (res.targets?.water_target_ml) setWaterTarget(res.targets.water_target_ml);
        if (res.streak) setStreak(res.streak);
        if (res.weight_trend !== undefined) setWeightTrend(res.weight_trend);
        if (res.weight_logs) setWeightLogs(res.weight_logs);
      }
    } catch (e) {
      console.error('Analytics fetch error:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { setLoading(true); fetchAnalytics(); }, [period]);

  const onRefresh = useCallback(() => { setRefreshing(true); fetchAnalytics(); }, [period]);

  // Chart data with tap-to-show values
  const chartData = data.slice(-7).map((d) => {
    const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const dayOfWeek = new Date(d.date).getDay();
    const calories = d.summary?.calories || d.calories || 0;
    const isToday = new Date(d.date).toDateString() === new Date().toDateString();
    const calValue = Math.round(calories);
    return {
      value: calValue,
      label: isToday ? '●' : dayLabels[dayOfWeek],
      labelTextStyle: isToday ? { color: '#22c55e', fontSize: 14, fontWeight: 'bold' as const } : { color: '#9ca3af', fontSize: 12 },
      frontColor: isToday ? '#22c55e' : (calories >= target * 0.8 ? '#16a34a' : '#134e38'),
    };
  });

  const waterChartData = data.slice(-7).map((d) => {
    const dayLabels = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
    const dayOfWeek = new Date(d.date).getDay();
    const water = d.summary?.water || d.water || 0;
    const isToday = new Date(d.date).toDateString() === new Date().toDateString();
    const waterValue = Math.round(water);
    return {
      value: waterValue,
      label: isToday ? '●' : dayLabels[dayOfWeek],
      labelTextStyle: isToday ? { color: '#0ea5e9', fontSize: 12, fontWeight: 'bold' as const } : { color: '#9ca3af', fontSize: 11 },
      frontColor: isToday ? '#0ea5e9' : (water >= waterTarget * 0.8 ? '#0891b2' : '#0c4a6e'),
    };
  });

  const weightChartData = weightLogs.slice(0, 7).reverse().map((w) => ({
    value: parseFloat(w.weight_kg) || 0,
  }));

  // Stats calculations
  const getVal = (d: any, key: string) => d.summary?.[key] || d[key] || 0;
  const avgCalories = data.length > 0 ? Math.round(data.reduce((s, d) => s + getVal(d, 'calories'), 0) / data.length) : 0;
  const avgProtein = data.length > 0 ? Math.round(data.reduce((s, d) => s + getVal(d, 'protein'), 0) / data.length) : 0;
  const avgWater = data.length > 0 ? Math.round(data.reduce((s, d) => s + getVal(d, 'water'), 0) / data.length) : 0;
  const isOnTrack = avgCalories >= target * 0.8;
  const maxChartValue = Math.max(...chartData.map(d => d.value), target);
  const currentWeight = weightLogs.length > 0 ? parseFloat(weightLogs[0].weight_kg) : 0;

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#22c55e" />
          <Text style={styles.loadingText}>Loading your progress...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#22c55e" />}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Your Progress</Text>
          <Text style={styles.headerSubtitle}>Track your health journey</Text>
        </View>

        {/* Period Toggle */}
        <View style={styles.toggleContainer}>
          <TouchableOpacity 
            style={[styles.toggleButton, period === 'weekly' && styles.toggleButtonActive]}
            onPress={() => setPeriod('weekly')}
          >
            <Text style={[styles.toggleText, period === 'weekly' && styles.toggleTextActive]}>Weekly</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.toggleButton, period === 'monthly' && styles.toggleButtonActive]}
            onPress={() => setPeriod('monthly')}
          >
            <Text style={[styles.toggleText, period === 'monthly' && styles.toggleTextActive]}>Monthly</Text>
          </TouchableOpacity>
        </View>

        {/* Main Calorie Card */}
        <View style={styles.mainCard}>
          <View style={styles.mainCardHeader}>
            <View>
              <Text style={styles.mainCardLabel}>Daily Calories</Text>
              <Text style={styles.mainCardValue}>
                {avgCalories.toLocaleString()}
                <Text style={styles.mainCardUnit}> avg kcal</Text>
              </Text>
            </View>
            <View style={[styles.statusBadge, isOnTrack ? styles.statusGreen : styles.statusOrange]}>
              {isOnTrack ? <TrendingUp color="#22c55e" size={16} /> : <Activity color="#f97316" size={16} />}
              <Text style={[styles.statusText, { color: isOnTrack ? '#22c55e' : '#f97316' }]}>
                {isOnTrack ? 'On Track' : 'Below Goal'}
              </Text>
            </View>
          </View>

          {/* Chart with goal line */}
          <View style={styles.chartArea}>
            {chartData.some(d => d.value > 0) ? (
              <View style={{ position: 'relative' }}>
                <BarChart
                  data={chartData}
                  width={width - 80}
                  height={140}
                  barWidth={26}
                  spacing={14}
                  barBorderRadius={6}
                  backgroundColor="transparent"
                  yAxisThickness={0}
                  xAxisThickness={0}
                  hideRules
                  hideYAxisText
                  noOfSections={4}
                  maxValue={maxChartValue * 1.1}
                  initialSpacing={10}
                  showReferenceLine1
                  referenceLine1Position={target}
                  referenceLine1Config={{ 
                    color: 'rgba(255,255,255,0.3)', 
                    dashWidth: 5, 
                    dashGap: 3,
                    labelText: `${target} kcal`,
                    labelTextStyle: { color: '#9ca3af', fontSize: 11, fontWeight: '500' }
                  }}
                  focusBarOnPress
                  focusedBarConfig={{ color: '#4ade80' }}
                  renderTooltip={(item: any) => (
                    <View style={styles.tooltip}>
                      <Text style={styles.tooltipText}>{item.value} kcal</Text>
                    </View>
                  )}
                />
              </View>
            ) : (
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>No data yet</Text>
                <Text style={styles.emptySubtext}>Start logging food to see your progress</Text>
              </View>
            )}
          </View>
        </View>

        {/* Quick Stats Row */}
        <View style={styles.quickStats}>
          <View style={styles.quickStatItem}>
            <View style={[styles.quickStatIcon, { backgroundColor: 'rgba(249, 115, 22, 0.15)' }]}>
              <Flame color="#f97316" size={22} />
            </View>
            <View>
              <Text style={styles.quickStatValue}>{streak.best_streak}</Text>
              <Text style={styles.quickStatLabel}>Day Streak</Text>
            </View>
          </View>
          
          <View style={styles.quickStatDivider} />
          
          <View style={styles.quickStatItem}>
            <View style={[styles.quickStatIcon, { backgroundColor: 'rgba(34, 197, 94, 0.15)' }]}>
              <Activity color="#22c55e" size={22} />
            </View>
            <View>
              <Text style={styles.quickStatValue}>{avgProtein}g</Text>
              <Text style={styles.quickStatLabel}>Avg Protein</Text>
            </View>
          </View>
        </View>

        {/* Water Intake Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.cardTitleGroup}>
              <View style={[styles.cardIcon, { backgroundColor: 'rgba(14, 165, 233, 0.15)' }]}>
                <Droplets color="#0ea5e9" size={20} />
              </View>
              <View>
                <Text style={styles.cardTitle}>Hydration</Text>
                <Text style={styles.cardSubtitle}>
                  {(avgWater / 1000).toFixed(1)}L avg / {(waterTarget / 1000).toFixed(1)}L goal
                </Text>
              </View>
            </View>
            <Text style={[styles.cardPercent, { color: '#0ea5e9' }]}>
              {Math.round((avgWater / waterTarget) * 100)}%
            </Text>
          </View>

          <View style={styles.chartAreaSmall}>
            {waterChartData.some(d => d.value > 0) ? (
              <BarChart
                data={waterChartData}
                width={width - 80}
                height={80}
                barWidth={24}
                spacing={16}
                barBorderRadius={4}
                backgroundColor="transparent"
                yAxisThickness={0}
                xAxisThickness={0}
                hideRules
                hideYAxisText
                noOfSections={2}
                initialSpacing={8}
                focusBarOnPress
                focusedBarConfig={{ color: '#38bdf8' }}
                renderTooltip={(item: any) => (
                  <View style={styles.tooltipSmall}>
                    <Text style={styles.tooltipTextSmall}>{(item.value / 1000).toFixed(1)}L</Text>
                  </View>
                )}
              />
            ) : (
              <Text style={styles.emptyTextSmall}>No water logs yet</Text>
            )}
          </View>
        </View>

        {/* Weight Trend Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.cardTitleGroup}>
              <View style={[styles.cardIcon, { backgroundColor: 'rgba(168, 85, 247, 0.15)' }]}>
                <Scale color="#a855f7" size={20} />
              </View>
              <View>
                <Text style={styles.cardTitle}>Weight Trend</Text>
                {currentWeight > 0 && (
                  <Text style={styles.cardSubtitle}>Current: {currentWeight} kg</Text>
                )}
              </View>
            </View>
            {weightTrend !== 0 && (
              <View style={[styles.trendBadge, { backgroundColor: weightTrend < 0 ? 'rgba(34, 197, 94, 0.15)' : 'rgba(249, 115, 22, 0.15)' }]}>
                {weightTrend < 0 ? <TrendingDown color="#22c55e" size={14} /> : <TrendingUp color="#f97316" size={14} />}
                <Text style={[styles.trendText, { color: weightTrend < 0 ? '#22c55e' : '#f97316' }]}>
                  {weightTrend > 0 ? '+' : ''}{weightTrend}kg
                </Text>
              </View>
            )}
          </View>

          <View style={styles.weightChartArea}>
            {weightChartData.length >= 2 ? (
              <LineChart
                data={weightChartData}
                width={width - 70}
                height={70}
                color="#a855f7"
                thickness={3}
                hideDataPoints={false}
                dataPointsColor="#a855f7"
                dataPointsRadius={4}
                curved
                hideRules
                hideYAxisText
                hideAxesAndRules
                areaChart
                startFillColor="rgba(168, 85, 247, 0.25)"
                endFillColor="rgba(168, 85, 247, 0.02)"
                startOpacity={0.25}
                endOpacity={0.02}
              />
            ) : (
              <View style={styles.emptyStateSmall}>
                <Text style={styles.emptyTextSmall}>Log your weight to see trends</Text>
              </View>
            )}
          </View>
        </View>

        {/* Summary Footer */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Weekly Summary</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Average intake</Text>
            <Text style={styles.summaryValue}>{avgCalories.toLocaleString()} kcal</Text>
          </View>
          <View style={styles.progressContainer}>
            <View style={styles.progressTrack}>
              <View style={[styles.progressBar, { width: `${Math.min((avgCalories / target) * 100, 100)}%` }]} />
            </View>
          </View>
          <Text style={styles.summaryFooter}>
            {avgCalories > 0 
              ? `${Math.round((avgCalories / target) * 100)}% of your daily goal`
              : 'Start logging to track progress'
            }
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a1a15' },
  scrollContent: { padding: 20, paddingBottom: 120 },
  
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 16 },
  loadingText: { color: '#6b7280', fontSize: 16 },
  
  // Header
  header: { marginBottom: 24 },
  headerTitle: { color: '#ffffff', fontSize: 28, fontWeight: 'bold' },
  headerSubtitle: { color: '#6b7280', fontSize: 16, marginTop: 4 },
  
  // Toggle
  toggleContainer: { flexDirection: 'row', backgroundColor: '#0f2920', borderRadius: 14, padding: 4, marginBottom: 24 },
  toggleButton: { flex: 1, paddingVertical: 12, borderRadius: 12, alignItems: 'center' },
  toggleButtonActive: { backgroundColor: '#22c55e' },
  toggleText: { color: '#6b7280', fontSize: 15, fontWeight: '600' },
  toggleTextActive: { color: '#0a1a15', fontWeight: '700' },
  
  // Main Card
  mainCard: { backgroundColor: '#0f2920', borderRadius: 24, padding: 20, marginBottom: 16, borderWidth: 1, borderColor: 'rgba(34, 197, 94, 0.2)' },
  mainCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  mainCardLabel: { color: '#9ca3af', fontSize: 14, marginBottom: 4 },
  mainCardValue: { color: '#ffffff', fontSize: 36, fontWeight: 'bold' },
  mainCardUnit: { color: '#6b7280', fontSize: 16, fontWeight: 'normal' },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20 },
  statusGreen: { backgroundColor: 'rgba(34, 197, 94, 0.15)' },
  statusOrange: { backgroundColor: 'rgba(249, 115, 22, 0.15)' },
  statusText: { fontSize: 13, fontWeight: '600' },
  chartArea: { alignItems: 'center', marginBottom: 16, minHeight: 140 },
  chartLabel: { color: '#9ca3af', fontSize: 12, fontWeight: '500' },
  targetRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  targetDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.3)' },
  targetText: { color: '#9ca3af', fontSize: 13 },
  
  emptyState: { justifyContent: 'center', alignItems: 'center', paddingVertical: 40 },
  emptyText: { color: '#6b7280', fontSize: 16, fontWeight: '600' },
  emptySubtext: { color: '#4b5563', fontSize: 14, marginTop: 4 },
  emptyStateSmall: { justifyContent: 'center', alignItems: 'center', paddingVertical: 24 },
  emptyTextSmall: { color: '#6b7280', fontSize: 14 },
  
  // Quick Stats
  quickStats: { flexDirection: 'row', backgroundColor: '#0f2920', borderRadius: 20, padding: 16, marginBottom: 16, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  quickStatItem: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 },
  quickStatIcon: { width: 48, height: 48, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  quickStatValue: { color: '#ffffff', fontSize: 22, fontWeight: 'bold' },
  quickStatLabel: { color: '#9ca3af', fontSize: 13 },
  quickStatDivider: { width: 1, height: 40, backgroundColor: 'rgba(255,255,255,0.1)', marginHorizontal: 16 },
  
  // Cards
  card: { backgroundColor: '#0f2920', borderRadius: 20, padding: 18, marginBottom: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  cardTitleGroup: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  cardIcon: { width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  cardTitle: { color: '#ffffff', fontSize: 17, fontWeight: '600' },
  cardSubtitle: { color: '#9ca3af', fontSize: 13, marginTop: 2 },
  cardPercent: { fontSize: 20, fontWeight: 'bold' },
  chartAreaSmall: { alignItems: 'center', minHeight: 80 },
  chartLabelSmall: { color: '#9ca3af', fontSize: 11 },
  
  trendBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 16 },
  trendText: { fontSize: 14, fontWeight: '600' },
  weightChartArea: { alignItems: 'center', minHeight: 70, marginTop: 8 },
  
  // Summary
  summaryCard: { backgroundColor: '#0f2920', borderRadius: 20, padding: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  summaryTitle: { color: '#ffffff', fontSize: 18, fontWeight: '600', marginBottom: 16 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  summaryLabel: { color: '#9ca3af', fontSize: 15 },
  summaryValue: { color: '#ffffff', fontSize: 18, fontWeight: '600' },
  progressContainer: { marginBottom: 12 },
  progressTrack: { height: 8, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 4 },
  progressBar: { height: '100%', backgroundColor: '#22c55e', borderRadius: 4 },
  summaryFooter: { color: '#6b7280', fontSize: 14 },
  
  // Tooltips
  tooltip: { backgroundColor: '#1f2937', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, marginBottom: 4 },
  tooltipText: { color: '#ffffff', fontSize: 12, fontWeight: '600' },
  tooltipSmall: { backgroundColor: '#0c4a6e', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, marginBottom: 4 },
  tooltipTextSmall: { color: '#ffffff', fontSize: 11, fontWeight: '500' },
});
