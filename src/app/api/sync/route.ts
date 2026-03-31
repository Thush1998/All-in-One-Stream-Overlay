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
    // Then merge on top of current state with DEFAULT_STATE as an ultimate fallback.
    const sanitised = Object.fromEntries(
      Object.entries(raw).filter(([, v]) => v !== undefined)
    ) as Partial<SyncState>;

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
