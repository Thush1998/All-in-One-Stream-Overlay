'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from './supabase';

import { SyncState, DEFAULT_STATE, NUMERIC_FIELDS } from './syncTypes';
import type { ChatEvent, SupporterSpotlight, PlatformKey, SocialSlot, Corner, BgmiAlertKey, ThemeColors } from './syncTypes';
export type { ChatEvent, SupporterSpotlight, PlatformKey, SocialSlot, Corner, BgmiAlertKey, ThemeColors, SyncState };
export { DEFAULT_STATE, NUMERIC_FIELDS };

function sanitiseState(raw: Partial<SyncState>): Partial<SyncState> {
  const out: Partial<SyncState> = { ...raw };
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
  const [isLoaded, setIsLoaded] = useState(false);

  const pendingUpdates = useRef<Partial<SyncState>>({});
  const pushTimeout = useRef<NodeJS.Timeout | null>(null);
  const isPushing = useRef(false);
  const initialFetchDone = useRef(false);
  const stateRef = useRef<SyncState>(DEFAULT_STATE);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const fetchState = async () => {
      // Suspend fetch if there are pending/active database POSTs
      if (isPushing.current || Object.keys(pendingUpdates.current).length > 0 || pushTimeout.current !== null) {
        return; 
      }

      try {
        const { data, error } = await supabase
          .from('settings')
          .select('data')
          .eq('id', 1)
          .single();

        if (error) {
          if (error.code === 'PGRST116') {
             // No rows returned
             setIsLoaded(true);
             return;
          }
          throw error;
        }

        if (data && data.data) {
          const merged = { ...DEFAULT_STATE, ...sanitiseState(data.data) } as SyncState;
          if (mode === 'admin') {
            if (!initialFetchDone.current) {
               setState(merged);
               initialFetchDone.current = true;
            }
          } else {
            // Overlay Mode syncing
            setState((prev) => {
              if (prev.syncId !== merged.syncId) {
                return merged;
              }
              return { ...prev, ...merged };
            });
          }
        }
        setIsLoaded(true);
      } catch (err) {
        console.error('Failed to fetch sync state', err);
        setIsLoaded(true); // Don't block indefinitely on error
      }
    };

    // Initial fetch
    fetchState();

    let channel: ReturnType<typeof supabase.channel> | null = null;

    if (mode === 'overlay') {
      // Subscribe to real-time changes
      channel = supabase
        .channel('schema-db-changes')
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'settings',
          },
          (payload) => {
            console.log('Real-time update received!', payload.new);
            if (payload.new && payload.new.data) {
               const merged = { ...DEFAULT_STATE, ...sanitiseState(payload.new.data) } as SyncState;
               setState(merged);
            }
          }
        )
        .subscribe();
    }

    // Also listen to postMessage from same-page scripts to force a re-render
    const handleMessage = (event: MessageEvent) => {
      if (event.data === 'FORCE_RERENDER') {
        fetchState();
      }
    };
    window.addEventListener('message', handleMessage);

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
      window.removeEventListener('message', handleMessage);
      if (pushTimeout.current) clearTimeout(pushTimeout.current);
    };
  }, [mode]);

  const updateState = useCallback((updates: Partial<SyncState>) => {
    const syncId = String(Date.now());
    const finalUpdates = { ...updates, syncId };

    // Optimistic UI update immediately
    setState((prev) => {
      const updated = { ...prev, ...finalUpdates };
      return updated;
    });

    // Accumulate updates for debounced database write
    pendingUpdates.current = { ...pendingUpdates.current, ...finalUpdates };

    if (pushTimeout.current) clearTimeout(pushTimeout.current);
    
    pushTimeout.current = setTimeout(async () => {
      const payloadToPush = { ...stateRef.current, ...pendingUpdates.current };
      pendingUpdates.current = {};
      pushTimeout.current = null;
      isPushing.current = true;
      
      try {
        const { data, error } = await supabase
          .from('settings')
          .upsert({ id: 1, data: payloadToPush })
          .select();
          
        if (error) throw error;
        
        console.log('Data Saved:', data);
      } catch (err) {
        console.error('Failed to push state update', err);
      } finally {
        isPushing.current = false;
      }
    }, 500); // 500ms debounce
  }, []);

  return { state, updateState, isLoaded };
}
