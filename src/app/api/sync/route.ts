import { NextResponse } from 'next/server';

// This is an in-memory mock database.
// For a production deployment on Vercel, this state will reset whenever the serverless function cold-starts.
// To make this permanent, replace this `globalState` variable with a call to a real database (like Firebase, Supabase, Vercel KV, or MongoDB).

let globalState: any = {
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
  showFacecam: true,
  streamState: 'live',
  latestSubscriber: '',
  topDonor: '',
  latestSuperchat: '',
  latestGpaySupport: '',
  latestPaytmSupport: '',
  customChats: [
    { id: '1', text: 'GG' },
    { id: '2', text: 'Queen' },
  ],
  forceRefreshId: 0,
};

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
  'Pragma': 'no-cache',
  'Expires': '0',
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 200, headers: CORS_HEADERS });
}

export async function GET() {
  // Adding cache control headers and CORS to bypass Vercel edge caching and allow remote sync
  return NextResponse.json(globalState, {
    headers: CORS_HEADERS,
  });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    globalState = { ...globalState, ...body };
    return NextResponse.json(globalState, {
      headers: CORS_HEADERS,
    });
  } catch (error) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400, headers: CORS_HEADERS });
  }
}

