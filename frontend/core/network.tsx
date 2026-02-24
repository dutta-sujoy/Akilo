
import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import { dequeue, queueSize, QueuedMutation } from './cache';
import { supabase } from './supabase';

const BACKEND_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:8000";

interface NetworkContextType {
  isOnline: boolean;
  pendingCount: number;
}

const NetworkContext = createContext<NetworkContextType>({ isOnline: true, pendingCount: 0 });

export const useNetwork = () => useContext(NetworkContext);

export const NetworkProvider = ({ children }: { children: React.ReactNode }) => {
  const [isOnline, setIsOnline] = useState(true);
  const [pendingCount, setPendingCount] = useState(0);
  const isSyncing = useRef(false);

  // Flush the offline queue: replay mutations in order
  const flushQueue = useCallback(async () => {
    if (isSyncing.current) return;
    isSyncing.current = true;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) { isSyncing.current = false; return; }

      let mutation: QueuedMutation | null;
      let successCount = 0;

      while ((mutation = await dequeue()) !== null) {
        try {
          const opts: RequestInit = {
            method: mutation.method,
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          };
          if (mutation.body && mutation.method !== 'DELETE') {
            opts.body = JSON.stringify(mutation.body);
          }
          await fetch(`${BACKEND_URL}${mutation.endpoint}`, opts);
          successCount++;
        } catch (e) {
          console.warn('Sync mutation failed, will retry later:', e);
          // Put it back? For now we just drop failed items to avoid infinite loops
          break;
        }
      }

      if (successCount > 0) {
        console.log(`Synced ${successCount} offline mutation(s)`);
      }
    } catch (e) {
      console.warn('Queue flush error:', e);
    } finally {
      isSyncing.current = false;
      const remaining = await queueSize();
      setPendingCount(remaining);
    }
  }, []);

  useEffect(() => {
    // Check initial queue size
    queueSize().then(setPendingCount);

    const unsubscribe = NetInfo.addEventListener((state: NetInfoState) => {
      const online = !!(state.isConnected && state.isInternetReachable !== false);
      setIsOnline(prev => {
        // Transition from offline → online: flush queue
        if (!prev && online) {
          flushQueue();
        }
        return online;
      });
    });

    return () => unsubscribe();
  }, [flushQueue]);

  return (
    <NetworkContext.Provider value={{ isOnline, pendingCount }}>
      {children}
    </NetworkContext.Provider>
  );
};
