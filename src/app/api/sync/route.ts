import { NextResponse } from 'next/server';
import { SyncState, DEFAULT_STATE } from '@/lib/useSync';

export const dynamic = 'force-dynamic';

// In-memory global state to sync between Admin panel and OBS overlay on Vercel Edge.
// Note: On Vercel this is isolated to the specific lambda instance, which works 
// mostly fine for single-streamer low-traffic setups but Supabase/Firebase is recommended for guaranteed persistence.
let globalState: SyncState = { ...DEFAULT_STATE };

export async function GET() {
  return NextResponse.json(globalState, {
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
    },
  });
}

export async function POST(req: Request) {
  try {
    const raw = await req.json();

    // Strip any undefined values so a partial POST never corrupts globalState.
    const sanitised = Object.fromEntries(
      Object.entries(raw).filter(([, v]) => v !== undefined)
    ) as Partial<SyncState>;

    // Deep-merge nested objects — never allow a partial write to set them to null/undefined.
    if (sanitised.themeColors) {
      sanitised.themeColors = {
        ...DEFAULT_STATE.themeColors,
        ...globalState.themeColors,
        ...sanitised.themeColors,
      };
    }
    if (sanitised.donationDetails) {
      sanitised.donationDetails = {
        ...DEFAULT_STATE.donationDetails,
        ...globalState.donationDetails,
        ...sanitised.donationDetails,
      };
    }
    if (sanitised.socialSlots && !Array.isArray(sanitised.socialSlots)) {
      delete sanitised.socialSlots; // reject malformed array
    }

    // Layer: DEFAULT_STATE → current globalState → incoming patch
    globalState = { ...DEFAULT_STATE, ...globalState, ...sanitised };

    return NextResponse.json(globalState, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update state' }, { status: 400 });
  }
}
