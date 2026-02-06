
import { useState, useCallback, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, Modal, ActivityIndicator, StyleSheet, TextInput, Dimensions, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Slider from '@react-native-community/slider';
import { api } from '../../core/api';
import { Plus, X, Search, Heart, SlidersHorizontal } from 'lucide-react-native';
import { useToast } from '../../components/Toast';

const { width } = Dimensions.get('window');

interface Food {
  id: string;
  name: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fats_g: number;
  base_qty: number;
  unit_type: string;
  user_id?: string;
  is_custom?: boolean;
  is_favorite?: boolean;
}

export default function FoodSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<{master: Food[], custom: Food[]}>({ master: [], custom: [] });
  const [loading, setLoading] = useState(false);
  const [selectedFood, setSelectedFood] = useState<Food | null>(null);
  const [qty, setQty] = useState(100);
  const [mealType, setMealType] = useState('breakfast');
  const [activeTab, setActiveTab] = useState('recent');
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [loggingFood, setLoggingFood] = useState(false);
  
  // Tab data
  const [recentFoods, setRecentFoods] = useState<Food[]>([]);
  const [favoriteFoods, setFavoriteFoods] = useState<Food[]>([]);
  const [customFoods, setCustomFoods] = useState<Food[]>([]);
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  
  // Custom food form
  const [customName, setCustomName] = useState('');
  const [customCalories, setCustomCalories] = useState('');
  const [customProtein, setCustomProtein] = useState('');
  const [customCarbs, setCustomCarbs] = useState('');
  const [customFats, setCustomFats] = useState('');
  const [customBaseQty, setCustomBaseQty] = useState('100');
  const [customUnit, setCustomUnit] = useState('g');
  const [savingCustom, setSavingCustom] = useState(false);
  const { showToast } = useToast();

  const searchFood = async () => {
    if (!query) return;
    setLoading(true);
    try {
      const res = await api.get('/api/food/search', { q: query });
      // Mark custom foods with is_custom flag
      const customWithFlag = (res.custom || []).map((f: Food) => ({ ...f, is_custom: true }));
      setResults({ master: res.master || [], custom: customWithFlag });
    } catch (e) {
      console.error("Search error:", e);
      showToast('Failed to search food', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleLogFood = async () => {
    if (!selectedFood) return;
    
    setLoggingFood(true);
    const factor = qty / selectedFood.base_qty;
    
    try {
      const payload = {
        date: new Date().toISOString().split('T')[0],
        meal_type: mealType,
        food_source: selectedFood.user_id ? 'custom' : 'master',
        food_master_id: selectedFood.user_id ? null : selectedFood.id,
        food_custom_id: selectedFood.user_id ? selectedFood.id : null,
        food_name: selectedFood.name,
        qty: qty,
        calories: Math.round(selectedFood.calories * factor),
        protein_g: Math.round(selectedFood.protein_g * factor * 10) / 10,
        carbs_g: Math.round(selectedFood.carbs_g * factor * 10) / 10,
        fats_g: Math.round(selectedFood.fats_g * factor * 10) / 10
      };
      
      console.log("Logging food:", payload);
      await api.post('/api/food/log', payload);
      showToast(`${selectedFood.name} added to ${mealType}!`, 'success');
      setSelectedFood(null);
      setQty(100);
    } catch (e) {
      console.error("Log food error:", e);
      showToast('Failed to log food. Please try again.', 'error');
    } finally {
      setLoggingFood(false);
    }
  };

  const handleSaveCustomFood = async () => {
    if (!customName || !customCalories) {
      showToast('Please enter at least name and calories', 'error');
      return;
    }

    setSavingCustom(true);
    try {
      await api.post('/api/food/custom', {
        name: customName,
        calories: parseFloat(customCalories) || 0,
        protein_g: parseFloat(customProtein) || 0,
        carbs_g: parseFloat(customCarbs) || 0,
        fats_g: parseFloat(customFats) || 0,
        base_qty: parseFloat(customBaseQty) || 100,
        unit_type: customUnit
      });
      showToast('Custom food saved!', 'success');
      resetCustomForm();
      setShowCustomModal(false);
    } catch (e) {
      showToast('Failed to save custom food', 'error');
    } finally {
      setSavingCustom(false);
    }
  };

  const resetCustomForm = () => {
    setCustomName('');
    setCustomCalories('');
    setCustomProtein('');
    setCustomCarbs('');
    setCustomFats('');
    setCustomBaseQty('100');
    setCustomUnit('g');
  };

  // Load favorites
  const loadFavorites = async () => {
    setLoading(true);
    try {
      const faves = await api.get('/api/food/favorites');
      setFavoriteFoods(faves || []);
      const ids = new Set<string>((faves || []).map((f: Food) => f.id));
      setFavoriteIds(ids);
    } catch (e) {
      console.error('Load favorites error:', e);
    } finally {
      setLoading(false);
    }
  };

  // Load recent foods
  const loadRecent = async () => {
    setLoading(true);
    try {
      const recent = await api.get('/api/food/recent');
      setRecentFoods(recent || []);
    } catch (e) {
      console.error('Load recent error:', e);
    } finally {
      setLoading(false);
    }
  };

  // Load custom foods
  const loadCustom = async () => {
    setLoading(true);
    try {
      const custom = await api.get('/api/food/search', { q: '' });
      // Mark custom foods with is_custom flag
      const customWithFlag = (custom.custom || []).map((f: Food) => ({ ...f, is_custom: true }));
      setCustomFoods(customWithFlag);
    } catch (e) {
      console.error('Load custom error:', e);
    } finally {
      setLoading(false);
    }
  };

  // Toggle favorite
  const toggleFavorite = async (food: Food) => {
    const isFavorite = favoriteIds.has(food.id);
    // Custom foods have user_id field, master foods don't
    const isCustomFood = !!food.user_id || food.is_custom || false;
    
    try {
      if (isFavorite) {
        await api.delete(`/api/food/favorites/${food.id}`);
        setFavoriteIds(prev => {
          const newSet = new Set(prev);
          newSet.delete(food.id);
          return newSet;
        });
        showToast('Removed from favorites', 'success');
      } else {
        console.log('Adding to favorites:', { food_id: food.id, is_custom: isCustomFood, has_user_id: !!food.user_id });
        await api.post(`/api/food/favorites/${food.id}`, { is_custom: isCustomFood });
        setFavoriteIds(prev => new Set(prev).add(food.id));
        showToast('Added to favorites', 'success');
      }
      
      // Reload favorites if on favorites tab
      if (activeTab === 'favorites') {
        loadFavorites();
      }
    } catch (e) {
      console.error('Toggle favorite error:', e);
      showToast('Failed to update favorites', 'error');
    }
  };

  // Load data when tab changes
  useEffect(() => {
    if (activeTab === 'recent') {
      loadRecent();
    } else if (activeTab === 'favorites') {
      loadFavorites();
    } else if (activeTab === 'custom') {
      loadCustom();
    }
  }, [activeTab]);

  const getMacroColor = (type: string) => {
    switch(type) {
      case 'protein': return '#22c55e';
      case 'carbs': return '#6b7280';
      case 'fats': return '#6b7280';
      default: return '#6b7280';
    }
  };

  const renderFoodItem = ({ item }: { item: Food }) => (
    <TouchableOpacity 
      onPress={() => { setSelectedFood(item); setQty(item.base_qty); }}
      style={styles.foodCard}
    >
      <View style={styles.foodImagePlaceholder}>
        <Text style={styles.foodEmoji}>🍽️</Text>
      </View>
      <View style={styles.foodInfo}>
        <Text style={styles.foodName}>{item.name}</Text>
        <Text style={styles.foodServing}>{item.base_qty}{item.unit_type} serving</Text>
        <Text style={styles.foodMacros}>
          <Text style={styles.foodCalories}>{item.calories} kcal</Text>
          <Text style={styles.foodMacroDetail}> • {item.protein_g}g P  {item.carbs_g}g C  {item.fats_g}g F</Text>
        </Text>
      </View>
      <TouchableOpacity style={styles.addFoodBtn}>
        <Plus color="#22c55e" size={20} />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  const calcMacros = (food: Food) => {
    const factor = qty / food.base_qty;
    return {
      calories: Math.round(food.calories * factor),
      protein: Math.round(food.protein_g * factor * 10) / 10,
      carbs: Math.round(food.carbs_g * factor * 10) / 10,
      fats: Math.round(food.fats_g * factor * 10) / 10
    };
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputWrapper}>
          <Search color="#6b7280" size={20} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search for food (e.g., Avocado)"
            placeholderTextColor="#6b7280"
            value={query}
            onChangeText={setQuery}
            onSubmitEditing={searchFood}
            returnKeyType="search"
          />
        </View>
        <TouchableOpacity style={styles.filterButton}>
          <SlidersHorizontal color="#ffffff" size={20} />
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsScroll}>
          {['Recent', 'Favorites', 'Custom'].map((tab) => (
            <TouchableOpacity 
              key={tab}
              onPress={() => setActiveTab(tab.toLowerCase())}
              style={[styles.tab, activeTab === tab.toLowerCase() && styles.tabActive]}
            >
              <Text style={[styles.tabText, activeTab === tab.toLowerCase() && styles.tabTextActive]}>{tab}</Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity style={styles.createCustomBtn} onPress={() => setShowCustomModal(true)}>
            <Plus color="#22c55e" size={16} />
            <Text style={styles.createCustomText}>New</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* Results */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator color="#22c55e" size="large" />
        </View>
      ) : (
        <FlatList
          data={query ? [...results.custom, ...results.master] : 
                activeTab === 'recent' ? recentFoods :
                activeTab === 'favorites' ? favoriteFoods :
                activeTab === 'custom' ? customFoods : []}
          keyExtractor={(item) => item.id}
          renderItem={renderFoodItem}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyEmoji}>
                {activeTab === 'recent' && '⏰'}
                {activeTab === 'favorites' && '❤️'}
                {activeTab === 'custom' && '✏️'}
                {!activeTab && '🔍'}
              </Text>
              <Text style={styles.emptyText}>
                {activeTab === 'recent' && 'No recent foods yet'}
                {activeTab === 'favorites' && 'No favorites yet'}
                {activeTab === 'custom' && 'No custom foods yet'}
                {!activeTab && 'Search for food to get started'}
              </Text>
              <Text style={styles.emptySubtext}>
                {activeTab === 'recent' && 'Start logging food to see it here'}
                {activeTab === 'favorites' && 'Tap the heart to add favorites'}
                {activeTab === 'custom' && 'Create custom foods with the + button'}
                {!activeTab && 'Try "chicken", "rice", or "banana"'}
              </Text>
            </View>
          }
        />
      )}

      {/* Food Detail Modal with Slider */}
      <Modal visible={!!selectedFood} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Handle bar */}
            <View style={styles.modalHandle} />
            
            {/* Header */}
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>{selectedFood?.name}</Text>
                <Text style={styles.modalSubtitle}>
                  {selectedFood?.base_qty}{selectedFood?.unit_type} serving • 
                  <Text style={styles.highProtein}> High Protein</Text>
                </Text>
              </View>
              <TouchableOpacity 
                style={styles.favoriteBtn}
                onPress={() => selectedFood && toggleFavorite(selectedFood)}
              >
                <Heart 
                  color={selectedFood && favoriteIds.has(selectedFood.id) ? "#ef4444" : "#6b7280"}
                  fill={selectedFood && favoriteIds.has(selectedFood.id) ? "#ef4444" : "transparent"}
                  size={24} 
                />
              </TouchableOpacity>
            </View>

            {/* Macro Cards */}
            {selectedFood && (
              <View style={styles.macroRow}>
                <View style={styles.macroBox}>
                  <Text style={styles.macroBoxValue}>{calcMacros(selectedFood).calories}</Text>
                  <Text style={styles.macroBoxLabel}>KCAL</Text>
                </View>
                <View style={[styles.macroBox, styles.macroBoxHighlight]}>
                  <Text style={[styles.macroBoxValue, styles.macroBoxValueHighlight]}>{calcMacros(selectedFood).protein}g</Text>
                  <Text style={[styles.macroBoxLabel, styles.macroBoxLabelHighlight]}>PROT</Text>
                </View>
                <View style={styles.macroBox}>
                  <Text style={styles.macroBoxValue}>{calcMacros(selectedFood).carbs}g</Text>
                  <Text style={styles.macroBoxLabel}>CARB</Text>
                </View>
                <View style={styles.macroBox}>
                  <Text style={styles.macroBoxValue}>{calcMacros(selectedFood).fats}g</Text>
                  <Text style={styles.macroBoxLabel}>FAT</Text>
                </View>
              </View>
            )}

            {/* Quantity Slider */}
            <View style={styles.sliderSection}>
              <View style={styles.sliderHeader}>
                <Text style={styles.sliderLabel}>Quantity</Text>
                <Text style={styles.sliderValue}>{qty}<Text style={styles.sliderUnit}>g</Text></Text>
              </View>
              <Slider
                style={styles.slider}
                minimumValue={0}
                maximumValue={500}
                step={5}
                value={qty}
                onValueChange={setQty}
                minimumTrackTintColor="#22c55e"
                maximumTrackTintColor="#1f3d32"
                thumbTintColor="#22c55e"
              />
              <View style={styles.sliderRange}>
                <Text style={styles.sliderRangeText}>0g</Text>
                <Text style={styles.sliderRangeText}>250g</Text>
                <Text style={styles.sliderRangeText}>500g</Text>
              </View>
            </View>

            {/* Meal Type Selection */}
            <Text style={styles.mealLabel}>Meal</Text>
            <View style={styles.mealButtons}>
              {['breakfast', 'lunch', 'snacks', 'dinner'].map(m => (
                <TouchableOpacity 
                  key={m}
                  onPress={() => setMealType(m)}
                  style={[styles.mealButton, mealType === m && styles.mealButtonActive]}
                >
                  <Text style={[styles.mealButtonText, mealType === m && styles.mealButtonTextActive]}>
                    {m.charAt(0).toUpperCase() + m.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Action Buttons */}
            <TouchableOpacity 
              style={[styles.addButton, loggingFood && styles.addButtonDisabled]} 
              onPress={handleLogFood}
              disabled={loggingFood}
            >
              <Text style={styles.addButtonText}>
                {loggingFood ? 'Adding...' : 'Add to Diary'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelButton} onPress={() => setSelectedFood(null)}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Custom Food Modal */}
      <Modal visible={showCustomModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { maxHeight: '85%' }]}>
            <View style={styles.modalHandle} />
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Create Custom Food</Text>
              <TouchableOpacity onPress={() => { resetCustomForm(); setShowCustomModal(false); }}>
                <X color="#6b7280" size={24} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.inputLabel}>Food Name *</Text>
              <TextInput
                style={styles.input}
                value={customName}
                onChangeText={setCustomName}
                placeholder="e.g. Homemade Dal"
                placeholderTextColor="#6b7280"
              />

              <View style={styles.rowInputs}>
                <View style={styles.halfInput}>
                  <Text style={styles.inputLabel}>Calories *</Text>
                  <TextInput
                    style={styles.input}
                    value={customCalories}
                    onChangeText={setCustomCalories}
                    keyboardType="numeric"
                    placeholder="0"
                    placeholderTextColor="#6b7280"
                  />
                </View>
                <View style={styles.halfInput}>
                  <Text style={styles.inputLabel}>Base Qty (g)</Text>
                  <TextInput
                    style={styles.input}
                    value={customBaseQty}
                    onChangeText={setCustomBaseQty}
                    keyboardType="numeric"
                    placeholder="100"
                    placeholderTextColor="#6b7280"
                  />
                </View>
              </View>

              <View style={styles.rowInputs}>
                <View style={styles.thirdInput}>
                  <Text style={styles.inputLabel}>Protein (g)</Text>
                  <TextInput
                    style={styles.input}
                    value={customProtein}
                    onChangeText={setCustomProtein}
                    keyboardType="numeric"
                    placeholder="0"
                    placeholderTextColor="#6b7280"
                  />
                </View>
                <View style={styles.thirdInput}>
                  <Text style={styles.inputLabel}>Carbs (g)</Text>
                  <TextInput
                    style={styles.input}
                    value={customCarbs}
                    onChangeText={setCustomCarbs}
                    keyboardType="numeric"
                    placeholder="0"
                    placeholderTextColor="#6b7280"
                  />
                </View>
                <View style={styles.thirdInput}>
                  <Text style={styles.inputLabel}>Fats (g)</Text>
                  <TextInput
                    style={styles.input}
                    value={customFats}
                    onChangeText={setCustomFats}
                    keyboardType="numeric"
                    placeholder="0"
                    placeholderTextColor="#6b7280"
                  />
                </View>
              </View>

              <TouchableOpacity 
                style={[styles.addButton, savingCustom && styles.addButtonDisabled]} 
                onPress={handleSaveCustomFood}
                disabled={savingCustom}
              >
                <Text style={styles.addButtonText}>
                  {savingCustom ? 'Saving...' : 'Save Custom Food'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.cancelButton} onPress={() => { resetCustomForm(); setShowCustomModal(false); }}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a1a15' },
  
  // Search
  searchContainer: { flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 12, gap: 12 },
  searchInputWrapper: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#0f2920', borderRadius: 12, paddingHorizontal: 16, borderWidth: 1, borderColor: '#1f3d32' },
  searchInput: { flex: 1, color: '#ffffff', paddingVertical: 14, paddingHorizontal: 10, fontSize: 15 },
  filterButton: { backgroundColor: '#0f2920', padding: 14, borderRadius: 12, borderWidth: 1, borderColor: '#1f3d32' },
  
  // Tabs
  tabsContainer: { paddingHorizontal: 16, marginBottom: 12 },
  tabsScroll: { gap: 10 },
  tab: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20, backgroundColor: 'transparent', borderWidth: 1, borderColor: '#1f3d32' },
  tabActive: { backgroundColor: '#22c55e', borderColor: '#22c55e' },
  tabText: { color: '#6b7280', fontWeight: '600' },
  tabTextActive: { color: '#0a1a15' },
  createCustomBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, backgroundColor: '#153528', borderWidth: 1, borderColor: '#22c55e', gap: 4 },
  createCustomText: { color: '#22c55e', fontWeight: '600' },
  
  // Loading
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  
  // List
  listContent: { paddingHorizontal: 16, paddingBottom: 100 },
  
  // Food Card
  foodCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#0f2920', padding: 12, borderRadius: 16, marginBottom: 12, borderWidth: 1, borderColor: '#1f3d32' },
  foodImagePlaceholder: { width: 60, height: 60, borderRadius: 12, backgroundColor: '#153528', justifyContent: 'center', alignItems: 'center' },
  foodEmoji: { fontSize: 28 },
  foodInfo: { flex: 1, marginLeft: 12 },
  foodName: { color: '#ffffff', fontSize: 16, fontWeight: '600' },
  foodServing: { color: '#6b7280', fontSize: 13, marginTop: 2 },
  foodMacros: { marginTop: 4 },
  foodCalories: { color: '#ffffff', fontWeight: '600' },
  foodMacroDetail: { color: '#22c55e', fontSize: 12 },
  addFoodBtn: { padding: 8 },
  
  // Empty
  emptyContainer: { alignItems: 'center', paddingTop: 60 },
  emptyEmoji: { fontSize: 48, marginBottom: 16 },
  emptyText: { color: '#ffffff', fontSize: 18, fontWeight: '600' },
  emptySubtext: { color: '#6b7280', fontSize: 14, marginTop: 8 },
  
  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#0f2920', padding: 24, borderTopLeftRadius: 24, borderTopRightRadius: 24, borderTopWidth: 1, borderColor: '#1f3d32' },
  modalHandle: { width: 40, height: 4, backgroundColor: '#1f3d32', borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  modalTitle: { color: '#ffffff', fontSize: 24, fontWeight: 'bold' },
  modalSubtitle: { color: '#6b7280', marginTop: 4 },
  highProtein: { color: '#22c55e' },
  favoriteBtn: { padding: 8, backgroundColor: '#153528', borderRadius: 12, borderWidth: 1, borderColor: '#1f3d32' },
  
  // Macro Row
  macroRow: { flexDirection: 'row', gap: 10, marginBottom: 24 },
  macroBox: { flex: 1, backgroundColor: '#153528', padding: 14, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: '#1f3d32' },
  macroBoxHighlight: { backgroundColor: '#22c55e', borderColor: '#22c55e' },
  macroBoxValue: { color: '#ffffff', fontSize: 18, fontWeight: 'bold' },
  macroBoxValueHighlight: { color: '#0a1a15' },
  macroBoxLabel: { color: '#6b7280', fontSize: 11, marginTop: 2 },
  macroBoxLabelHighlight: { color: '#0a1a15' },
  
  // Slider
  sliderSection: { marginBottom: 24 },
  sliderHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sliderLabel: { color: '#ffffff', fontSize: 16 },
  sliderValue: { color: '#ffffff', fontSize: 32, fontWeight: 'bold' },
  sliderUnit: { fontSize: 16, fontWeight: 'normal' },
  slider: { width: '100%', height: 40 },
  sliderRange: { flexDirection: 'row', justifyContent: 'space-between' },
  sliderRangeText: { color: '#6b7280', fontSize: 12 },
  
  // Meal Selection
  mealLabel: { color: '#ffffff', fontSize: 16, marginBottom: 12 },
  mealButtons: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 24 },
  mealButton: { paddingHorizontal: 18, paddingVertical: 12, borderRadius: 24, borderWidth: 1, borderColor: '#1f3d32', backgroundColor: '#153528' },
  mealButtonActive: { backgroundColor: '#22c55e', borderColor: '#22c55e' },
  mealButtonText: { color: '#6b7280', fontWeight: '600' },
  mealButtonTextActive: { color: '#0a1a15' },
  
  // Buttons
  addButton: { backgroundColor: '#22c55e', paddingVertical: 18, borderRadius: 16, alignItems: 'center' },
  addButtonDisabled: { opacity: 0.6 },
  addButtonText: { color: '#0a1a15', fontWeight: 'bold', fontSize: 16 },
  cancelButton: { paddingVertical: 16, alignItems: 'center' },
  cancelButtonText: { color: '#6b7280', fontWeight: '600' },
  
  // Form inputs
  inputLabel: { color: '#9ca3af', marginBottom: 8, marginTop: 12 },
  input: { backgroundColor: '#153528', borderRadius: 12, padding: 16, color: '#ffffff', fontSize: 16, borderWidth: 1, borderColor: '#1f3d32' },
  rowInputs: { flexDirection: 'row', gap: 12 },
  halfInput: { flex: 1 },
  thirdInput: { flex: 1 },
});
