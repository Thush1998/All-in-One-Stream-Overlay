// ─────────────────────────────────────────────────────────────────────────────
// syncTypes.ts  —  Shared types and DEFAULT_STATE
//
// NO 'use client' directive here — this file is intentionally isomorphic so it
// can be imported safely by:
//   • Server-side API routes  (app/api/sync/route.ts)
//   • Client-side React hooks (lib/useSync.ts)
//
// DO NOT add React imports, hooks, or browser-only APIs to this file.
// ─────────────────────────────────────────────────────────────────────────────

// ── Types ─────────────────────────────────────────────────────────────────────

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
  // Stream State
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

// ── Defaults ───────────────────────────────────────────────────────────────────
// All numeric fields are explicitly `number` literals.
// All array fields are explicitly initialised as arrays — never undefined.
// This is the single source of truth for cold-start and fallback values.

export const DEFAULT_STATE: SyncState = {
  subscriberCount:    0,
  subscriberGoal:     100,
  triggerVictory:     0,
  triggerHighlight:   0,
  bgmiAlert:          null,
  chatEvent:          null,
  killCount:          0,
  finishes:           0,
  dayWins:            0,
  showBgmiStats:      true,
  supporterSpotlight: null,
  socialSlots: [
    { id: 'yt', platform: 'youtube',  handle: '/DragXQueen'        },
    { id: 'ig', platform: 'twitter',  handle: '@DragXQueenIG'      },
    { id: 'fb', platform: 'discord',  handle: '/DragXQueenGaming'  },
  ],
  donationDetails: {
    gpay:      '',
    paytm:     '',
    superchat: '',
  },
  themeColors:       { primary: '#00f3ff', secondary: '#ff0055' },
  fontFamily:        'Rajdhani',
  facecamCorner:     'br',
  newsTickerText:    '',
  logoDataUrl:       '',
  qrCodeUrl:         '',
  showQrCode:        true,
  latestSubscriber:  '',
  topDonor:          '',
  latestSuperchat:   '',
  latestGpaySupport: '',
  latestPaytmSupport:'',
  showFacecam:       true,
  streamState:       'live',
  customChats: [
    { id: '1', text: 'GG'    },
    { id: '2', text: 'Queen' },
  ],
};

// ── Numeric field keys (used by sanitiser on both client and server) ───────────
export const NUMERIC_FIELDS: (keyof SyncState)[] = [
  'subscriberCount', 'subscriberGoal',
  'triggerVictory',  'triggerHighlight',
  'killCount',       'finishes',        'dayWins',
];
