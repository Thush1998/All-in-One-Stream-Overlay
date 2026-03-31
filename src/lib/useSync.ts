'use client';
import { useState, useEffect, useCallback } from 'react';

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
};

export function useSync() {
  const [state, setState] = useState<SyncState>(DEFAULT_STATE);
  const [channel, setChannel] = useState<BroadcastChannel | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const bc = new BroadcastChannel('stream_sync');
    setChannel(bc);

    const saved = localStorage.getItem('stream_state');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setState({
          ...DEFAULT_STATE,
          ...parsed,
          // Guard array/object fields
          socialSlots: parsed.socialSlots?.length ? parsed.socialSlots : DEFAULT_STATE.socialSlots,
          donationDetails: parsed.donationDetails || DEFAULT_STATE.donationDetails,
          themeColors: parsed.themeColors || DEFAULT_STATE.themeColors,
          logoDataUrl: parsed.logoDataUrl || DEFAULT_STATE.logoDataUrl,
          qrCodeUrl: parsed.qrCodeUrl || DEFAULT_STATE.qrCodeUrl,
          showBgmiStats: parsed.showBgmiStats !== undefined ? parsed.showBgmiStats : DEFAULT_STATE.showBgmiStats,
          showQrCode: parsed.showQrCode !== undefined ? parsed.showQrCode : DEFAULT_STATE.showQrCode,
          showFacecam: parsed.showFacecam !== undefined ? parsed.showFacecam : DEFAULT_STATE.showFacecam,
          streamState: parsed.streamState || DEFAULT_STATE.streamState,
          customChats: parsed.customChats || DEFAULT_STATE.customChats,
          latestSuperchat: parsed.latestSuperchat || '',
          latestGpaySupport: parsed.latestGpaySupport || '',
          latestPaytmSupport: parsed.latestPaytmSupport || '',
        });
      } catch (e) {
        console.error('Failed to parse stream_state', e);
      }
    }

    bc.onmessage = (event) => {
      setState(event.data);
      localStorage.setItem('stream_state', JSON.stringify(event.data));
    };

    return () => bc.close();
  }, []);

  const updateState = useCallback((updates: Partial<SyncState>) => {
    setState((prev) => {
      const updated = { ...prev, ...updates };
      localStorage.setItem('stream_state', JSON.stringify(updated));
      if (channel) channel.postMessage(updated);
      return updated;
    });
  }, [channel]);

  return { state, updateState };
}
