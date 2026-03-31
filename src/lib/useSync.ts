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
};

export const DEFAULT_STATE: SyncState = {
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
};

// ── Numeric sanitiser ─────────────────────────────────────────
// Applied to every value received from the API so NaN / undefined / null
// never enters React state and corrupts arithmetic or comparisons.
const NUMERIC_FIELDS: (keyof SyncState)[] = [
  'subscriberCount', 'subscriberGoal',
  'triggerVictory',  'triggerHighlight',
  'killCount',       'finishes',        'dayWins',
];

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

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const fetchState = async () => {
      // Suspend fetch if there are pending/active database POSTs
      if (isPushing.current || Object.keys(pendingUpdates.current).length > 0 || pushTimeout.current !== null) {
        return; 
      }

      try {
        const res = await fetch('/api/sync', {
          cache: 'no-store',
        });
        if (res.ok) {
          const data = await res.json();
          
          if (mode === 'admin') {
            if (!initialFetchDone.current) {
               setState(sanitiseState(data) as SyncState);
               initialFetchDone.current = true;
            } else {
               setState((prev) => ({
                  ...prev,
                  chatEvent:          data.chatEvent,
                  bgmiAlert:          data.bgmiAlert,
                  triggerHighlight:   Number(data.triggerHighlight) || 0,
                  supporterSpotlight: data.supporterSpotlight,
                  latestSubscriber:   data.latestSubscriber,
                  topDonor:           data.topDonor,
                  latestSuperchat:    data.latestSuperchat,
                  latestGpaySupport:  data.latestGpaySupport,
                  latestPaytmSupport: data.latestPaytmSupport,
               }));
            }
          } else {
            // Overlay Mode syncing
            setState((prev) => ({ ...prev, ...sanitiseState(data) }));
          }
        }
      } catch (err) {
        console.error('Failed to fetch sync state', err);
      }
    };

    // Initial fetch
    fetchState();

    // Polling interval: fetch latest state every 2 seconds
    const intervalId = setInterval(fetchState, 2000);

    // Also listen to postMessage from same-page scripts to force a re-render
    const handleMessage = (event: MessageEvent) => {
      if (event.data === 'FORCE_RERENDER') {
        fetchState();
      }
    };
    window.addEventListener('message', handleMessage);

    return () => {
      clearInterval(intervalId);
      window.removeEventListener('message', handleMessage);
    };
  }, []);

  const updateState = useCallback((updates: Partial<SyncState>) => {
    // Optimistic UI update immediately
    setState((prev) => {
      const updated = { ...prev, ...updates };
      return updated;
    });

    // Accumulate updates for debounced database write
    pendingUpdates.current = { ...pendingUpdates.current, ...updates };

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
