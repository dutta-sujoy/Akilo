
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from './api';

const FOOD_DB_KEY = '@akilo_fooddb';
const FOOD_DB_TS_KEY = '@akilo_fooddb_ts';
const REFRESH_INTERVAL = 24 * 60 * 60 * 1000; // Refresh every 24 hours

interface CachedFood {
  id: string;
  name: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fats_g: number;
  base_qty: number;
  unit_type: string;
  source: 'master' | 'custom';
  user_id?: string;
}

// Pre-fetch all foods and store locally
export const refreshFoodDB = async (): Promise<boolean> => {
  try {
    const res = await api.get('/api/food/search', { q: '' });
    const masterFoods: CachedFood[] = (res.master || []).map((f: any) => ({
      id: f.id,
      name: f.name,
      calories: f.calories || 0,
      protein_g: f.protein_g || 0,
      carbs_g: f.carbs_g || 0,
      fats_g: f.fats_g || 0,
      base_qty: f.base_qty || 100,
      unit_type: f.unit_type || 'g',
      source: 'master' as const,
    }));
    const customFoods: CachedFood[] = (res.custom || []).map((f: any) => ({
      id: f.id,
      name: f.name,
      calories: f.calories || 0,
      protein_g: f.protein_g || 0,
      carbs_g: f.carbs_g || 0,
      fats_g: f.fats_g || 0,
      base_qty: f.base_qty || 100,
      unit_type: f.unit_type || 'g',
      source: 'custom' as const,
      user_id: f.user_id,
    }));

    const allFoods = [...masterFoods, ...customFoods];
    await AsyncStorage.setItem(FOOD_DB_KEY, JSON.stringify(allFoods));
    await AsyncStorage.setItem(FOOD_DB_TS_KEY, String(Date.now()));
    console.log(`[FoodDB] Cached ${allFoods.length} foods`);
    return true;
  } catch (e) {
    console.warn('[FoodDB] Refresh failed:', e);
    return false;
  }
};

// Check if DB needs refresh
export const ensureFoodDB = async () => {
  try {
    const ts = await AsyncStorage.getItem(FOOD_DB_TS_KEY);
    if (!ts || Date.now() - parseInt(ts) > REFRESH_INTERVAL) {
      await refreshFoodDB();
    }
  } catch {
    // Silent fail — will use API fallback
  }
};

// Search foods locally — case-insensitive substring match
export const searchFoodsLocal = async (query: string): Promise<CachedFood[]> => {
  try {
    const raw = await AsyncStorage.getItem(FOOD_DB_KEY);
    if (!raw) return [];
    const foods: CachedFood[] = JSON.parse(raw);
    if (!query.trim()) return foods.slice(0, 30);
    const q = query.toLowerCase();
    return foods.filter(f => f.name.toLowerCase().includes(q)).slice(0, 30);
  } catch {
    return [];
  }
};

// Get all cached foods count
export const getFoodDBSize = async (): Promise<number> => {
  try {
    const raw = await AsyncStorage.getItem(FOOD_DB_KEY);
    if (!raw) return 0;
    return JSON.parse(raw).length;
  } catch {
    return 0;
  }
};
