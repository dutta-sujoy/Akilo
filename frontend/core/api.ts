
import { supabase } from './supabase';
import { cacheGet, cacheSet, cacheInvalidate, buildCacheKey, enqueue } from './cache';
import NetInfo from '@react-native-community/netinfo';
import { dataEvents } from './dataEvents';

const BACKEND_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:8000";

// Check connectivity quickly
const checkOnline = async (): Promise<boolean> => {
  try {
    const state = await NetInfo.fetch();
    return !!(state.isConnected && state.isInternetReachable !== false);
  } catch {
    return false;
  }
};

// Map endpoints to their cache group for invalidation
const INVALIDATION_MAP: Record<string, string[]> = {
  '/api/food/log': ['/api/food/log', '/api/analytics/daily', '/api/analytics/weekly', '/api/food/recent'],
  '/api/water/': ['/api/water/', '/api/analytics/daily', '/api/analytics/weekly'],
  '/api/weight/': ['/api/weight/', '/api/analytics/daily', '/api/analytics/weekly'],
  '/api/food/favorites': ['/api/food/favorites'],
  '/api/food/custom': ['/api/food/custom', '/api/food/search'],
  '/api/profile/': ['/api/profile/', '/api/analytics/daily'],
  '/api/profile/targets': ['/api/profile/targets', '/api/analytics/daily', '/api/analytics/weekly'],
};

// Map endpoints to events for auto-refresh
const EVENT_MAP: Record<string, string[]> = {
  '/api/food/log': ['food_logged'],
  '/api/water/': ['water_logged'],
  '/api/weight/': ['weight_logged'],
  '/api/food/custom': ['food_logged'],
  '/api/food/favorites': ['food_logged'],
  '/api/profile/': ['profile_updated'],
  '/api/profile/targets': ['targets_updated'],
};

const emitEvents = (endpoint: string, method: string) => {
  // For DELETE on food log, emit food_deleted
  if (endpoint.startsWith('/api/food/log/') && method === 'DELETE') {
    dataEvents.emit('food_deleted');
    return;
  }
  if (endpoint.startsWith('/api/food/log/') && method === 'PUT') {
    dataEvents.emit('food_edited');
    return;
  }
  for (const [prefix, events] of Object.entries(EVENT_MAP)) {
    if (endpoint.startsWith(prefix)) {
      events.forEach(e => dataEvents.emit(e as any));
      return;
    }
  }
};

const getInvalidationKeys = (endpoint: string): string[] => {
  // Find matching prefix
  for (const [prefix, keys] of Object.entries(INVALIDATION_MAP)) {
    if (endpoint.startsWith(prefix)) return keys;
  }
  return [];
};

const getToken = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token;
};

export const api = {
  // GET: cache-first — try network, fall back to cache
  get: async (endpoint: string, params?: any) => {
    const cacheKey = buildCacheKey(endpoint, params);
    const token = await getToken();

    // Build URL
    const url = new URL(`${BACKEND_URL}${endpoint}`);
    if (params) {
      Object.keys(params).forEach(key => url.searchParams.append(key, params[key]));
    }

    try {
      const res = await fetch(url.toString(), {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();

      // Cache the fresh response
      await cacheSet(cacheKey, data);
      return data;
    } catch (e) {
      // Network failed — try cache
      const cached = await cacheGet(cacheKey);
      if (cached !== null) {
        console.log(`[Offline] Serving cached: ${cacheKey}`);
        return cached;
      }
      // No cache available
      throw e;
    }
  },

  // POST: queue-on-fail
  post: async (endpoint: string, body: any) => {
    const token = await getToken();

    try {
      const res = await fetch(`${BACKEND_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) throw new Error(await res.text());
      
      // Invalidate related caches
      const keys = getInvalidationKeys(endpoint);
      for (const k of keys) await cacheInvalidate(k);

      const data = await res.json();
      emitEvents(endpoint, 'POST');
      return data;
    } catch (e) {
      const online = await checkOnline();
      if (!online) {
        await enqueue({ method: 'POST', endpoint, body });
        console.log(`[Offline] Queued POST ${endpoint}`);
        emitEvents(endpoint, 'POST');
        return { _offline: true, _queued: true };
      }
      throw e;
    }
  },

  // PUT: queue-on-fail
  put: async (endpoint: string, body: any) => {
    const token = await getToken();

    try {
      const res = await fetch(`${BACKEND_URL}${endpoint}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) throw new Error(await res.text());

      const keys = getInvalidationKeys(endpoint);
      for (const k of keys) await cacheInvalidate(k);

      const data = await res.json();
      emitEvents(endpoint, 'PUT');
      return data;
    } catch (e) {
      const online = await checkOnline();
      if (!online) {
        await enqueue({ method: 'PUT', endpoint, body });
        console.log(`[Offline] Queued PUT ${endpoint}`);
        emitEvents(endpoint, 'PUT');
        return { _offline: true, _queued: true };
      }
      throw e;
    }
  },

  // DELETE: queue-on-fail
  delete: async (endpoint: string) => {
    const token = await getToken();

    try {
      const res = await fetch(`${BACKEND_URL}${endpoint}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!res.ok) throw new Error(await res.text());

      const keys = getInvalidationKeys(endpoint);
      for (const k of keys) await cacheInvalidate(k);

      const data = await res.json();
      emitEvents(endpoint, 'DELETE');
      return data;
    } catch (e) {
      const online = await checkOnline();
      if (!online) {
        await enqueue({ method: 'DELETE', endpoint });
        console.log(`[Offline] Queued DELETE ${endpoint}`);
        emitEvents(endpoint, 'DELETE');
        return { _offline: true, _queued: true };
      }
      throw e;
    }
  },
};
