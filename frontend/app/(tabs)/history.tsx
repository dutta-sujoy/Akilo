
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, RefreshControl, Alert, ActivityIndicator, Modal, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'expo-router';
import { api } from '../../core/api';
import { Trash2, Plus, Coffee, Sun, Moon, Utensils, X, Search, Edit3 } from 'lucide-react-native';
import { useToast } from '../../components/Toast';

type MealType = 'breakfast' | 'lunch' | 'snacks' | 'dinner';

interface FoodLog {
  id: string;
  food_name: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fats_g: number;
  qty: number;
  meal_type: MealType;
  date: string;
  created_at: string;
}

interface FoodItem {
  id: string;
  name: string;
  source: 'master' | 'custom';
  calories_per_100g: number;
  protein_per_100g: number;
  carbs_per_100g: number;
  fats_per_100g: number;
}

const mealIcons: Record<MealType, any> = {
  breakfast: Coffee,
  lunch: Sun,
  snacks: Utensils,
  dinner: Moon,
};

const mealColors: Record<MealType, string> = {
  breakfast: '#f97316',
  lunch: '#22c55e',
  snacks: '#a855f7',
  dinner: '#3b82f6',
};

export default function History() {
  const router = useRouter();
  const [logs, setLogs] = useState<FoodLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const { showToast } = useToast();
  
  // Add food modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<FoodItem[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedMeal, setSelectedMeal] = useState<MealType>('breakfast');
  const [selectedFood, setSelectedFood] = useState<FoodItem | null>(null);
  const [quantity, setQuantity] = useState('100');
  const [addingFood, setAddingFood] = useState(false);
  
  // Delete confirmation modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{ id: string; name: string } | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Edit modal
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingLog, setEditingLog] = useState<FoodLog | null>(null);
  const [editQuantity, setEditQuantity] = useState('');
  const [editMeal, setEditMeal] = useState<MealType>('breakfast');
  const [updating, setUpdating] = useState(false);

  const fetchLogs = async () => {
    try {
      const res = await api.get('/api/food/log', { date: selectedDate });
      if (res && Array.isArray(res)) {
        setLogs(res);
      } else {
        setLogs([]);
      }
    } catch (e) {
      console.error('Error fetching food logs:', e);
      setLogs([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    fetchLogs();
  }, [selectedDate]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchLogs();
  }, [selectedDate]);

  const handleDelete = (id: string, foodName: string) => {
    setItemToDelete({ id, name: foodName });
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!itemToDelete) return;
    
    setDeleting(true);
    try {
      console.log('Deleting food log:', itemToDelete.id);
      await api.delete(`/api/food/log/${itemToDelete.id}`);
      setLogs(prev => prev.filter(log => log.id !== itemToDelete.id));
      showToast('Entry deleted', 'success');
      setShowDeleteModal(false);
      setItemToDelete(null);
    } catch (e: any) {
      console.error('Delete error:', e);
      showToast(e?.message || 'Failed to delete', 'error');
    } finally {
      setDeleting(false);
    }
  };

  const handleEdit = (log: FoodLog) => {
    setEditingLog(log);
    setEditQuantity(String(log.qty || 100));
    setEditMeal(log.meal_type);
    setShowEditModal(true);
  };

  const confirmEdit = async () => {
    if (!editingLog) return;
    
    setUpdating(true);
    try {
      const newQty = parseFloat(editQuantity) || 100;
      const oldQty = editingLog.qty || 100;
      const multiplier = newQty / oldQty;
      
      const updatedData = {
        food_name: editingLog.food_name,
        food_source: (editingLog as any).food_source || 'master',
        food_master_id: (editingLog as any).food_master_id || null,
        food_custom_id: (editingLog as any).food_custom_id || null,
        calories: Math.round(editingLog.calories * multiplier),
        protein_g: Math.round(editingLog.protein_g * multiplier * 10) / 10,
        carbs_g: Math.round(editingLog.carbs_g * multiplier * 10) / 10,
        fats_g: Math.round(editingLog.fats_g * multiplier * 10) / 10,
        qty: newQty,
        meal_type: editMeal,
        date: editingLog.date,
      };
      
      await api.put(`/api/food/log/${editingLog.id}`, updatedData);
      
      // Update local state
      setLogs(prev => prev.map(log => 
        log.id === editingLog.id 
          ? { ...log, ...updatedData, qty: newQty, meal_type: editMeal }
          : log
      ));
      
      showToast('Entry updated', 'success');
      setShowEditModal(false);
      setEditingLog(null);
    } catch (e: any) {
      console.error('Update error:', e);
      showToast(e?.message || 'Failed to update', 'error');
    } finally {
      setUpdating(false);
    }
  };

  // Search foods
  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }
    
    setSearching(true);
    try {
      const res = await api.get('/api/food/search', { q: query });
      // Map fields from foods_master (calories, protein_g, etc.) to our interface format
      const mapFood = (food: any, source: 'master' | 'custom'): FoodItem => ({
        id: food.id,
        name: food.name,
        source,
        // foods_master uses 'calories' per base_qty (usually 100g)
        calories_per_100g: food.calories_per_100g || food.calories || 0,
        protein_per_100g: food.protein_per_100g || food.protein_g || 0,
        carbs_per_100g: food.carbs_per_100g || food.carbs_g || 0,
        fats_per_100g: food.fats_per_100g || food.fats_g || 0,
      });
      
      const masterFoods = (res.master || []).map((f: any) => mapFood(f, 'master'));
      const customFoods = (res.custom || []).map((f: any) => mapFood(f, 'custom'));
      setSearchResults([...masterFoods, ...customFoods]);
    } catch (e) {
      console.error('Search error:', e);
    } finally {
      setSearching(false);
    }
  };

  // Add food to selected date
  const handleAddFood = async () => {
    if (!selectedFood) return;
    
    setAddingFood(true);
    try {
      const qty = parseFloat(quantity) || 100;
      const multiplier = qty / 100;
      
      await api.post('/api/food/log', {
        food_name: selectedFood.name,
        food_source: selectedFood.source || 'master',
        food_master_id: selectedFood.source === 'master' ? selectedFood.id : null,
        food_custom_id: selectedFood.source === 'custom' ? selectedFood.id : null,
        calories: Math.round(selectedFood.calories_per_100g * multiplier),
        protein_g: Math.round(selectedFood.protein_per_100g * multiplier * 10) / 10,
        carbs_g: Math.round(selectedFood.carbs_per_100g * multiplier * 10) / 10,
        fats_g: Math.round(selectedFood.fats_per_100g * multiplier * 10) / 10,
        qty: qty,
        meal_type: selectedMeal,
        date: selectedDate,
      });
      
      showToast('Food added successfully', 'success');
      setShowAddModal(false);
      setSelectedFood(null);
      setSearchQuery('');
      setSearchResults([]);
      setQuantity('100');
      fetchLogs();
    } catch (e) {
      console.error('Add food error:', e);
      showToast('Failed to add food', 'error');
    } finally {
      setAddingFood(false);
    }
  };

  // Group logs by meal type
  const groupedLogs = logs.reduce((acc, log) => {
    const mealType = log.meal_type || 'snacks';
    if (!acc[mealType]) acc[mealType] = [];
    acc[mealType].push(log);
    return acc;
  }, {} as Record<MealType, FoodLog[]>);

  // Get dates for the week (use local dates, not UTC)
  const getDates = () => {
    const dates = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset time to midnight
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      
      // Format date manually to avoid timezone issues
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      
      dates.push({
        date: `${year}-${month}-${day}`,
        day: date.toLocaleDateString('en', { weekday: 'short' }),
        dayNum: date.getDate(),
        isToday: i === 0,
      });
    }
    return dates;
  };

  const dates = getDates();

  // Calculate totals
  const totalCalories = logs.reduce((sum, log) => sum + (log.calories || 0), 0);
  const totalProtein = logs.reduce((sum, log) => sum + (log.protein_g || 0), 0);

  // Format selected date for display
  const formatDate = (dateStr: string) => {
    // Parse date manually to avoid timezone issues
    const [year, month, day] = dateStr.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString('en', { weekday: 'long', month: 'short', day: 'numeric' });
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#22c55e" />
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
          <View>
            <Text style={styles.headerTitle}>Food Log</Text>
            <Text style={styles.headerSubtitle}>{formatDate(selectedDate)}</Text>
          </View>
          <TouchableOpacity 
            style={styles.addButton}
            onPress={() => setShowAddModal(true)}
          >
            <Plus color="#0a1a15" size={22} />
          </TouchableOpacity>
        </View>

        {/* Date Selector */}
        <View style={styles.dateSelector}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {dates.map((d) => (
              <TouchableOpacity
                key={d.date}
                style={[styles.dateItem, selectedDate === d.date && styles.dateItemActive]}
                onPress={() => setSelectedDate(d.date)}
              >
                <Text style={[styles.dateDay, selectedDate === d.date && styles.dateDayActive]}>
                  {d.day}
                </Text>
                <Text style={[styles.dateNum, selectedDate === d.date && styles.dateNumActive]}>
                  {d.dayNum}
                </Text>
                {d.isToday && <View style={[styles.todayDot, selectedDate === d.date && styles.todayDotActive]} />}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Summary Card */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{Math.round(totalCalories)}</Text>
            <Text style={styles.summaryLabel}>Calories</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{Math.round(totalProtein)}g</Text>
            <Text style={styles.summaryLabel}>Protein</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{logs.length}</Text>
            <Text style={styles.summaryLabel}>Items</Text>
          </View>
        </View>

        {/* Food Logs by Meal */}
        {logs.length === 0 ? (
          <View style={styles.emptyState}>
            <Utensils color="#4b5563" size={48} />
            <Text style={styles.emptyTitle}>No entries for this day</Text>
            <Text style={styles.emptySubtitle}>Tap + to add food items</Text>
            <TouchableOpacity 
              style={styles.emptyAddButton}
              onPress={() => setShowAddModal(true)}
            >
              <Plus color="#0a1a15" size={18} />
              <Text style={styles.emptyAddText}>Add Food</Text>
            </TouchableOpacity>
          </View>
        ) : (
          Object.entries(groupedLogs).map(([mealType, mealLogs]) => {
            const MealIcon = mealIcons[mealType as MealType];
            const mealColor = mealColors[mealType as MealType];
            const mealCalories = mealLogs.reduce((sum, log) => sum + (log.calories || 0), 0);

            return (
              <View key={mealType} style={styles.mealSection}>
                <View style={styles.mealHeader}>
                  <View style={[styles.mealIconWrapper, { backgroundColor: `${mealColor}20` }]}>
                    <MealIcon color={mealColor} size={18} />
                  </View>
                  <Text style={styles.mealTitle}>
                    {mealType.charAt(0).toUpperCase() + mealType.slice(1)}
                  </Text>
                  <Text style={styles.mealCalories}>{Math.round(mealCalories)} kcal</Text>
                </View>

                {mealLogs.map((log) => (
                  <View key={log.id} style={styles.logItem}>
                    <View style={styles.logInfo}>
                      <Text style={styles.logName} numberOfLines={1}>{log.food_name}</Text>
                      <Text style={styles.logMacros}>
                        {Math.round(log.calories)} kcal • {Math.round(log.protein_g || 0)}g P • {Math.round(log.carbs_g || 0)}g C • {Math.round(log.fats_g || 0)}g F
                      </Text>
                    </View>
                    <View style={styles.logActions}>
                      <TouchableOpacity 
                        style={styles.editButton}
                        onPress={() => handleEdit(log)}
                      >
                        <Edit3 color="#22c55e" size={18} />
                      </TouchableOpacity>
                      <TouchableOpacity 
                        style={styles.deleteButton}
                        onPress={() => handleDelete(log.id, log.food_name)}
                      >
                        <Trash2 color="#ef4444" size={18} />
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </View>
            );
          })
        )}
      </ScrollView>

      {/* Add Food Modal */}
      <Modal visible={showAddModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Food</Text>
              <Text style={styles.modalSubtitle}>{formatDate(selectedDate)}</Text>
              <TouchableOpacity style={styles.modalClose} onPress={() => {
                setShowAddModal(false);
                setSelectedFood(null);
                setSearchQuery('');
                setSearchResults([]);
              }}>
                <X color="#6b7280" size={24} />
              </TouchableOpacity>
            </View>

            {/* Meal Type Selector */}
            <View style={styles.mealSelector}>
              {(['breakfast', 'lunch', 'snacks', 'dinner'] as MealType[]).map((meal) => {
                const Icon = mealIcons[meal];
                const color = mealColors[meal];
                return (
                  <TouchableOpacity
                    key={meal}
                    style={[styles.mealOption, selectedMeal === meal && { backgroundColor: `${color}20`, borderColor: color }]}
                    onPress={() => setSelectedMeal(meal)}
                  >
                    <Icon color={selectedMeal === meal ? color : '#6b7280'} size={18} />
                    <Text style={[styles.mealOptionText, selectedMeal === meal && { color }]}>
                      {meal.charAt(0).toUpperCase() + meal.slice(1)}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Search */}
            <View style={styles.searchContainer}>
              <Search color="#6b7280" size={20} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search foods..."
                placeholderTextColor="#6b7280"
                value={searchQuery}
                onChangeText={handleSearch}
              />
            </View>

            {/* Search Results */}
            <ScrollView style={styles.searchResults}>
              {searching && <ActivityIndicator color="#22c55e" style={{ marginTop: 20 }} />}
              {searchResults.map((food) => (
                <TouchableOpacity
                  key={food.id}
                  style={[styles.searchItem, selectedFood?.id === food.id && styles.searchItemSelected]}
                  onPress={() => setSelectedFood(food)}
                >
                  <Text style={styles.searchItemName}>{food.name}</Text>
                  <Text style={styles.searchItemCal}>{food.calories_per_100g} kcal/100g</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Quantity & Add */}
            {selectedFood && (
              <View style={styles.addSection}>
                <View style={styles.quantityRow}>
                  <Text style={styles.quantityLabel}>Quantity (g):</Text>
                  <TextInput
                    style={styles.quantityInput}
                    value={quantity}
                    onChangeText={setQuantity}
                    keyboardType="numeric"
                  />
                </View>
                <TouchableOpacity 
                  style={styles.confirmButton}
                  onPress={handleAddFood}
                  disabled={addingFood}
                >
                  {addingFood ? (
                    <ActivityIndicator color="#0a1a15" />
                  ) : (
                    <Text style={styles.confirmButtonText}>Add {selectedFood.name}</Text>
                  )}
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal visible={showDeleteModal} animationType="fade" transparent>
        <View style={styles.deleteModalOverlay}>
          <View style={styles.deleteModalContent}>
            <Text style={styles.deleteModalTitle}>Delete Entry?</Text>
            <Text style={styles.deleteModalText}>
              Are you sure you want to delete "{itemToDelete?.name}"?
            </Text>
            <View style={styles.deleteModalButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => {
                  setShowDeleteModal(false);
                  setItemToDelete(null);
                }}
                disabled={deleting}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.deleteConfirmButton}
                onPress={confirmDelete}
                disabled={deleting}
              >
                {deleting ? (
                  <ActivityIndicator color="#ffffff" size="small" />
                ) : (
                  <Text style={styles.deleteButtonText}>Delete</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Edit Modal */}
      <Modal visible={showEditModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Entry</Text>
              <Text style={styles.modalSubtitle}>{editingLog?.food_name}</Text>
              <TouchableOpacity style={styles.modalClose} onPress={() => {
                setShowEditModal(false);
                setEditingLog(null);
              }}>
                <X color="#6b7280" size={24} />
              </TouchableOpacity>
            </View>

            {/* Meal Type Selector */}
            <View style={styles.mealSelector}>
              {(['breakfast', 'lunch', 'snacks', 'dinner'] as MealType[]).map((meal) => {
                const Icon = mealIcons[meal];
                const color = mealColors[meal];
                return (
                  <TouchableOpacity
                    key={meal}
                    style={[styles.mealOption, editMeal === meal && { backgroundColor: `${color}20`, borderColor: color }]}
                    onPress={() => setEditMeal(meal)}
                  >
                    <Icon color={editMeal === meal ? color : '#6b7280'} size={18} />
                    <Text style={[styles.mealOptionText, editMeal === meal && { color }]}>
                      {meal.charAt(0).toUpperCase() + meal.slice(1)}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Quantity Input */}
            <View style={styles.editSection}>
              <View style={styles.quantityRow}>
                <Text style={styles.quantityLabel}>Quantity (g):</Text>
                <TextInput
                  style={styles.quantityInput}
                  value={editQuantity}
                  onChangeText={setEditQuantity}
                  keyboardType="numeric"
                />
              </View>
              
              <TouchableOpacity 
                style={styles.confirmButton}
                onPress={confirmEdit}
                disabled={updating}
              >
                {updating ? (
                  <ActivityIndicator color="#0a1a15" />
                ) : (
                  <Text style={styles.confirmButtonText}>Update Entry</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a1a15' },
  scrollContent: { padding: 20, paddingBottom: 120 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  // Header
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  headerTitle: { color: '#ffffff', fontSize: 28, fontWeight: 'bold' },
  headerSubtitle: { color: '#6b7280', fontSize: 14, marginTop: 2 },
  addButton: { 
    width: 44, height: 44, borderRadius: 14, backgroundColor: '#22c55e', 
    justifyContent: 'center', alignItems: 'center' 
  },

  // Date Selector
  dateSelector: { marginBottom: 20 },
  dateItem: { 
    alignItems: 'center', paddingVertical: 12, paddingHorizontal: 14, marginRight: 8, 
    borderRadius: 16, backgroundColor: '#0f2920', minWidth: 52,
  },
  dateItemActive: { backgroundColor: '#22c55e' },
  dateDay: { color: '#6b7280', fontSize: 11, fontWeight: '500' },
  dateDayActive: { color: '#0a1a15' },
  dateNum: { color: '#ffffff', fontSize: 18, fontWeight: 'bold', marginTop: 4 },
  dateNumActive: { color: '#0a1a15' },
  todayDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: '#22c55e', marginTop: 4 },
  todayDotActive: { backgroundColor: '#0a1a15' },

  // Summary
  summaryCard: { 
    flexDirection: 'row', backgroundColor: '#0f2920', borderRadius: 20, padding: 20, marginBottom: 24,
    borderWidth: 1, borderColor: 'rgba(34, 197, 94, 0.2)',
  },
  summaryItem: { flex: 1, alignItems: 'center' },
  summaryValue: { color: '#ffffff', fontSize: 24, fontWeight: 'bold' },
  summaryLabel: { color: '#6b7280', fontSize: 13, marginTop: 4 },
  summaryDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.1)' },

  // Empty State
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 50, backgroundColor: '#0f2920', borderRadius: 20 },
  emptyTitle: { color: '#6b7280', fontSize: 18, fontWeight: '600', marginTop: 16 },
  emptySubtitle: { color: '#4b5563', fontSize: 14, marginTop: 4 },
  emptyAddButton: { 
    flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#22c55e', 
    paddingHorizontal: 20, paddingVertical: 12, borderRadius: 12, marginTop: 20 
  },
  emptyAddText: { color: '#0a1a15', fontSize: 15, fontWeight: '600' },

  // Meal Section
  mealSection: { marginBottom: 20 },
  mealHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 10 },
  mealIconWrapper: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  mealTitle: { color: '#ffffff', fontSize: 16, fontWeight: '600', flex: 1 },
  mealCalories: { color: '#6b7280', fontSize: 14 },

  // Log Item
  logItem: { 
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#0f2920', borderRadius: 14, 
    padding: 14, marginBottom: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)',
  },
  logInfo: { flex: 1 },
  logName: { color: '#ffffff', fontSize: 15, fontWeight: '500' },
  logMacros: { color: '#6b7280', fontSize: 12, marginTop: 4 },
  logActions: { flexDirection: 'row', gap: 8 },
  editButton: { 
    width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(34, 197, 94, 0.15)', 
    justifyContent: 'center', alignItems: 'center',
  },
  deleteButton: { 
    width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(239, 68, 68, 0.15)', 
    justifyContent: 'center', alignItems: 'center',
  },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modalContent: { 
    backgroundColor: '#0f2920', borderTopLeftRadius: 24, borderTopRightRadius: 24, 
    padding: 20, maxHeight: '85%',
  },
  modalHeader: { marginBottom: 20 },
  modalTitle: { color: '#ffffff', fontSize: 22, fontWeight: 'bold' },
  modalSubtitle: { color: '#22c55e', fontSize: 14, marginTop: 4 },
  modalClose: { position: 'absolute', right: 0, top: 0, padding: 4 },

  // Meal Selector
  mealSelector: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  mealOption: { 
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    paddingVertical: 10, borderRadius: 12, backgroundColor: '#0a1a15', 
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
  },
  mealOptionText: { color: '#6b7280', fontSize: 12, fontWeight: '500' },

  // Search
  searchContainer: { 
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#0a1a15', 
    borderRadius: 12, paddingHorizontal: 14, gap: 10, marginBottom: 16,
  },
  searchInput: { flex: 1, color: '#ffffff', fontSize: 16, paddingVertical: 14 },
  searchResults: { maxHeight: 200 },
  searchItem: { 
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 14, paddingHorizontal: 16, backgroundColor: '#0a1a15', 
    borderRadius: 12, marginBottom: 8,
  },
  searchItemSelected: { backgroundColor: 'rgba(34, 197, 94, 0.2)', borderWidth: 1, borderColor: '#22c55e' },
  searchItemName: { color: '#ffffff', fontSize: 15, flex: 1 },
  searchItemCal: { color: '#6b7280', fontSize: 13 },

  // Add Section
  addSection: { marginTop: 16, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.1)', paddingTop: 16 },
  quantityRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  quantityLabel: { color: '#9ca3af', fontSize: 15 },
  quantityInput: { 
    flex: 1, backgroundColor: '#0a1a15', borderRadius: 10, paddingHorizontal: 14, 
    paddingVertical: 12, color: '#ffffff', fontSize: 16, textAlign: 'center',
  },
  confirmButton: { 
    backgroundColor: '#22c55e', borderRadius: 14, paddingVertical: 16, alignItems: 'center' 
  },
  confirmButtonText: { color: '#0a1a15', fontSize: 16, fontWeight: '600' },
  
  // Edit Section
  editSection: { marginTop: 16, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.1)', paddingTop: 16 },

  // Delete Modal
  deleteModalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center' },
  deleteModalContent: { 
    backgroundColor: '#0f2920', borderRadius: 20, padding: 24, marginHorizontal: 20, maxWidth: 400, width: '90%',
    borderWidth: 1, borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  deleteModalTitle: { color: '#ffffff', fontSize: 20, fontWeight: 'bold', marginBottom: 12 },
  deleteModalText: { color: '#9ca3af', fontSize: 15, lineHeight: 22, marginBottom: 24 },
  deleteModalButtons: { flexDirection: 'row', gap: 12 },
  cancelButton: { 
    flex: 1, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 12, paddingVertical: 14, alignItems: 'center',
  },
  cancelButtonText: { color: '#ffffff', fontSize: 15, fontWeight: '600' },
  deleteConfirmButton: { 
    flex: 1, backgroundColor: '#ef4444', borderRadius: 12, paddingVertical: 14, alignItems: 'center',
  },
  deleteButtonText: { color: '#ffffff', fontSize: 15, fontWeight: '600' },
});
