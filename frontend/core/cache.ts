
import AsyncStorage from '@react-native-async-storage/async-storage';

const CACHE_PREFIX = '@akilo_cache:';
const QUEUE_KEY = '@akilo_queue';
const DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes

// ─── Response Cache ───

interface CacheEntry {
  data: any;
  expiresAt: number;
}

export const cacheGet = async (key: string): Promise<any | null> => {
  try {
    const raw = await AsyncStorage.getItem(CACHE_PREFIX + key);
    if (!raw) return null;
    const entry: CacheEntry = JSON.parse(raw);
    if (Date.now() > entry.expiresAt) {
      // Expired, but still return stale data for offline use
      // The caller decides whether to use it based on connectivity
      return entry.data;
    }
    return entry.data;
  } catch {
    return null;
  }
};

export const cacheSet = async (key: string, data: any, ttlMs: number = DEFAULT_TTL) => {
  try {
    const entry: CacheEntry = { data, expiresAt: Date.now() + ttlMs };
    await AsyncStorage.setItem(CACHE_PREFIX + key, JSON.stringify(entry));
  } catch (e) {
    console.warn('Cache write error:', e);
  }
};

export const cacheInvalidate = async (prefix: string) => {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const toRemove = keys.filter(k => k.startsWith(CACHE_PREFIX + prefix));
    if (toRemove.length > 0) await AsyncStorage.multiRemove(toRemove);
  } catch (e) {
    console.warn('Cache invalidate error:', e);
  }
};

export const cacheClear = async () => {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const cacheKeys = keys.filter(k => k.startsWith(CACHE_PREFIX));
    if (cacheKeys.length > 0) await AsyncStorage.multiRemove(cacheKeys);
  } catch (e) {
    console.warn('Cache clear error:', e);
  }
};

// ─── Offline Mutation Queue ───

export interface QueuedMutation {
  id: string;
  method: 'POST' | 'PUT' | 'DELETE';
  endpoint: string;
  body?: any;
  timestamp: number;
}

const generateId = () => `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

export const enqueue = async (mutation: Omit<QueuedMutation, 'id' | 'timestamp'>) => {
  try {
    const queue = await getQueue();
    queue.push({ ...mutation, id: generateId(), timestamp: Date.now() });
    await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
  } catch (e) {
    console.warn('Queue enqueue error:', e);
  }
};

export const getQueue = async (): Promise<QueuedMutation[]> => {
  try {
    const raw = await AsyncStorage.getItem(QUEUE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

export const dequeue = async (): Promise<QueuedMutation | null> => {
  try {
    const queue = await getQueue();
    if (queue.length === 0) return null;
    const [first, ...rest] = queue;
    await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(rest));
    return first;
  } catch {
    return null;
  }
};

export const clearQueue = async () => {
  await AsyncStorage.removeItem(QUEUE_KEY);
};

export const queueSize = async (): Promise<number> => {
  const queue = await getQueue();
  return queue.length;
};

// Build a cache key from endpoint + params
export const buildCacheKey = (endpoint: string, params?: any): string => {
  if (!params) return endpoint;
  const sorted = Object.keys(params).sort().map(k => `${k}=${params[k]}`).join('&');
  return `${endpoint}?${sorted}`;
};
