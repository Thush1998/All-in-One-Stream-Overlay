'use client';
import { useState, useEffect, useCallback } from 'react';

export type ChatEvent = {
  id: number;
  text: string;
};

export type SyncState = {
  subscriberCount: number;
  subscriberGoal: number;
  triggerVictory: number; // Increment to trigger animation
  chatEvent: ChatEvent | null; // Latest chat event to trigger an alert
  isPortrait: boolean; // Responsive mode toggle
  socialHandles: {
    youtube: string;
    instagram: string;
    facebook: string;
  };
  logoDataUrl: string;
};

const DEFAULT_STATE: SyncState = {
  subscriberCount: 0,
  subscriberGoal: 100,
  triggerVictory: 0,
  chatEvent: null,
  isPortrait: false,
  socialHandles: {
    youtube: '/DragXQueen',
    instagram: '@DragXQueenIG',
    facebook: '/DragXQueenGaming',
  },
  logoDataUrl: '',
};

export function useSync() {
  const [state, setState] = useState<SyncState>(DEFAULT_STATE);
  const [channel, setChannel] = useState<BroadcastChannel | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const bc = new BroadcastChannel('stream_sync');
    setChannel(bc);

    // Load initial state
    const saved = localStorage.getItem('stream_state');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setState({
          ...DEFAULT_STATE,
          ...parsed,
          socialHandles: parsed.socialHandles || DEFAULT_STATE.socialHandles,
          logoDataUrl: parsed.logoDataUrl || DEFAULT_STATE.logoDataUrl
        });
      } catch (e) {
        console.error('Failed to parse stream_state', e);
      }
    }

    bc.onmessage = (event) => {
      setState(event.data);
      localStorage.setItem('stream_state', JSON.stringify(event.data));
    };

    return () => {
      bc.close();
    };
  }, []);

  const updateState = useCallback((updates: Partial<SyncState>) => {
    setState((prev) => {
      const updated = { ...prev, ...updates };
      
      // Update local storage
      localStorage.setItem('stream_state', JSON.stringify(updated));
      
      // Broadcast to other tabs
      if (channel) {
        channel.postMessage(updated);
      }
      return updated;
    });
  }, [channel]);

  return { state, updateState };
}
