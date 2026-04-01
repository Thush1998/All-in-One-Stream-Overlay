'use client';
import { useState, useEffect, useCallback, useRef } from 'react';

import { SyncState, DEFAULT_STATE, NUMERIC_FIELDS } from './syncTypes';
import type { ChatEvent, SupporterSpotlight, PlatformKey, SocialSlot, Corner, BgmiAlertKey, ThemeColors } from './syncTypes';
export type { ChatEvent, SupporterSpotlight, PlatformKey, SocialSlot, Corner, BgmiAlertKey, ThemeColors, SyncState };
export { DEFAULT_STATE, NUMERIC_FIELDS };

function sanitiseState(data: Partial<SyncState>): Partial<SyncState> {
  const out: Partial<SyncState> = { ...data };
  for (const key of NUMERIC_FIELDS) {
    if (key in out) {
      (out as any)[key] = Number((out as any)[key]) || 0;
    }
  }
  // Guard nested objects
  if (out.themeColors && (typeof out.themeColors !== 'object')) {
    delete out.themeColors;
  }
  if (out.donationDetails && (typeof out.donationDetails !== 'object')) {
    delete out.donationDetails;
  }
  if (out.socialSlots !== undefined && !Array.isArray(out.socialSlots)) {
    delete out.socialSlots;
  }
  if (out.customChats !== undefined && !Array.isArray(out.customChats)) {
    delete out.customChats;
  }
  return out;
}

export function useSync(mode: 'admin' | 'overlay' = 'overlay') {
  const [state, setState] = useState<SyncState>(DEFAULT_STATE);

  const pendingUpdates = useRef<Partial<SyncState>>({});
  const pushTimeout = useRef<NodeJS.Timeout | null>(null);
  const isPushing = useRef(false);
  const initialFetchDone = useRef(false);
  const lastInteraction = useRef<number>(0);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const fetchState = async () => {
      // Suspend fetch if there are pending/active database POSTs
      if (isPushing.current || Object.keys(pendingUpdates.current).length > 0 || pushTimeout.current !== null) {
        return; 
      }

      try {
        const res = await fetch(`/api/sync?t=${Date.now()}`, {
          cache: 'no-store',
        });
        if (res.ok) {
          const data = await res.json();
          
          if (mode === 'admin') {
            if (!initialFetchDone.current) {
               setState(sanitiseState(data) as SyncState);
               initialFetchDone.current = true;
            }
          } else {
            // Overlay Mode syncing
            // Fully replace state if syncId changes to perfectly match the Admin snapshot
            setState((prev) => {
              if (prev.syncId !== data.syncId) {
                return sanitiseState(data) as SyncState;
              }
              return { ...prev, ...sanitiseState(data) };
            });
          }
        }
      } catch (err) {
        console.error('Failed to fetch sync state', err);
      }
    };

    // Initial fetch
    fetchState();

    // Polling interval: fetch latest state every 2 seconds ONLY for overlay
    let intervalId: NodeJS.Timeout | null = null;
    if (mode !== 'admin') {
      intervalId = setInterval(fetchState, 2000);
    }

    // Also listen to postMessage from same-page scripts to force a re-render
    const handleMessage = (event: MessageEvent) => {
      if (event.data === 'FORCE_RERENDER') {
        fetchState();
      }
    };
    window.addEventListener('message', handleMessage);

    return () => {
      if (intervalId) clearInterval(intervalId);
      window.removeEventListener('message', handleMessage);
    };
  }, []);

  const updateState = useCallback((updates: Partial<SyncState>) => {
    const syncId = String(Date.now());
    const finalUpdates = { ...updates, syncId };

    // Optimistic UI update immediately
    setState((prev) => {
      lastInteraction.current = Date.now();
      const updated = { ...prev, ...finalUpdates };
      return updated;
    });

    // Accumulate updates for debounced database write
    pendingUpdates.current = { ...pendingUpdates.current, ...finalUpdates };

    if (pushTimeout.current) clearTimeout(pushTimeout.current);
    
    pushTimeout.current = setTimeout(async () => {
      const payload = { ...pendingUpdates.current };
      pendingUpdates.current = {};
      pushTimeout.current = null;
      isPushing.current = true;
      
      try {
        await fetch('/api/sync', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
          cache: 'no-store',
        });
      } catch (err) {
        console.error('Failed to push state update', err);
      } finally {
        isPushing.current = false;
      }
    }, 500); // 500ms debounce
  }, []);

  return { state, updateState };
}
