
// Simple pub/sub event bus for cross-page data refresh

type EventName =
  | 'food_logged'
  | 'food_deleted'
  | 'food_edited'
  | 'water_logged'
  | 'weight_logged'
  | 'profile_updated'
  | 'targets_updated';

type Listener = () => void;

const listeners: Map<EventName, Set<Listener>> = new Map();

export const dataEvents = {
  on(event: EventName, callback: Listener): () => void {
    if (!listeners.has(event)) listeners.set(event, new Set());
    listeners.get(event)!.add(callback);
    // Return unsubscribe function
    return () => { listeners.get(event)?.delete(callback); };
  },

  emit(event: EventName) {
    listeners.get(event)?.forEach(cb => {
      try { cb(); } catch (e) { console.warn(`Event handler error [${event}]:`, e); }
    });
  },
};
