'use client';
import { useState, useEffect, useCallback, useRef } from 'react';

// ── Types ──────────────────────────────────────────────────────
export type ChatEvent = {
  id: number;
  text: string;
};

export type SupporterSpotlight = {
  id: number;
  name: string;
};

export type PlatformKey = 'youtube' | 'twitch' | 'discord' | 'twitter' | 'tiktok' | 'gameid';

export type SocialSlot = {
  id: string;
  platform: PlatformKey;
  handle: string;
};

export type Corner = 'tl' | 'tr' | 'bl' | 'br';

export type BgmiAlertKey = 'squadwipe' | 'clutch' | 'reflexes' | 'chicken';

export type ThemeColors = {
  primary: string;   // neon-cyan equivalent
  secondary: string; // neon-pink equivalent
};

export type SyncState = {
  subscriberCount: number;
  subscriberGoal: number;
  triggerVictory: number;
  triggerHighlight: number;
  bgmiAlert: BgmiAlertKey | null;
  chatEvent: ChatEvent | null;
  killCount: number;
  finishes: number;
  dayWins: number;
  showBgmiStats: boolean;
  supporterSpotlight: SupporterSpotlight | null;
  // Social Ticker & Donations
  socialSlots: SocialSlot[];
  donationDetails: {
    gpay: string;
    paytm: string;
    superchat: string;
  };
  // Theme
  themeColors: ThemeColors;
  fontFamily: string;
  facecamCorner: Corner;
  newsTickerText: string;
  // Logo & QR
  logoDataUrl: string;
  qrCodeUrl: string;
  showQrCode: boolean;
  // New Professional Stream State
  showFacecam: boolean;
  streamState: 'starting' | 'live' | 'paused' | 'ending';
  // Latest Events
  latestSubscriber: string;
  topDonor: string;
  latestSuperchat: string;
  latestGpaySupport: string;
  latestPaytmSupport: string;
  // Custom Chat Messages
  customChats: { id: string; text: string }[];
  // Re-Render Trigger
  forceRefreshId: number;
};

const DEFAULT_STATE: SyncState = {
  subscriberCount: 0,
  subscriberGoal: 100,
  triggerVictory: 0,
  triggerHighlight: 0,
  bgmiAlert: null,
  chatEvent: null,
  killCount: 0,
  finishes: 0,
  dayWins: 0,
  showBgmiStats: true,
  supporterSpotlight: null,
  socialSlots: [
    { id: 'yt', platform: 'youtube', handle: '/DragXQueen' },
    { id: 'ig', platform: 'twitter', handle: '@DragXQueenIG' },
    { id: 'fb', platform: 'discord', handle: '/DragXQueenGaming' },
  ],
  donationDetails: {
    gpay: '',
    paytm: '',
    superchat: ''
  },
  themeColors: { primary: '#00f3ff', secondary: '#ff0055' },
  fontFamily: 'Rajdhani',
  facecamCorner: 'br',
  newsTickerText: '',
  logoDataUrl: '',
  qrCodeUrl: '',
  showQrCode: true,
  latestSubscriber: '',
  topDonor: '',
  latestSuperchat: '',
  latestGpaySupport: '',
  latestPaytmSupport: '',
  showFacecam: true,
  streamState: 'live',
  customChats: [
    { id: '1', text: 'GG' },
    { id: '2', text: 'Queen' },
  ],
  forceRefreshId: 0,
};

export function useSync() {
  const [state, setState] = useState<SyncState>(DEFAULT_STATE);
  const refreshRef = useRef<number>(0);

  const fetchState = useCallback(async () => {
    try {
      // Fetch latest state from PRODUCTION API (via ENV) or relative local URL
      // Bypasses Vercel edge caching via ?t=timestamp and cache: 'no-store'
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || '';
      const res = await fetch(`${baseUrl}/api/sync?t=${Date.now()}`, {
        cache: 'no-store',
      });
      if (res.ok) {
        const data = await res.json();
        
        // Force refresh from Admin
        if (data.forceRefreshId && data.forceRefreshId > refreshRef.current) {
          refreshRef.current = data.forceRefreshId;
          if (typeof window !== 'undefined') {
            window.location.reload();
            return;
          }
        }
        
        setState((prev) => ({ ...prev, ...data }));
      }
    } catch (e) {
      console.error('Failed to fetch stream state', e);
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Initial fetch
    // eslint-disable-next-line
    fetchState();

    // REAL-TIME POLLING: fetch data every 1 second
    const intervalId = setInterval(fetchState, 1000);

    // Listen to visibilitychange or messages to force re-render/fetch
    const handleMessage = () => fetchState();
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') fetchState();
    };

    window.addEventListener('message', handleMessage);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(intervalId);
      window.removeEventListener('message', handleMessage);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [fetchState]);

  const updateState = useCallback(async (updates: Partial<SyncState>) => {
    // Optimistic UI update
    setState((prev) => ({ ...prev, ...updates }));

    try {
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || '';
      await fetch(`${baseUrl}/api/sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
        cache: 'no-store',
      });
    } catch (e) {
      console.error('Failed to update stream state', e);
    }
  }, []);

  return { state, updateState };
}
