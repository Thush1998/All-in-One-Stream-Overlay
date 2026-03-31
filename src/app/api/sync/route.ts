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
    const data = await req.json();
    globalState = { ...globalState, ...data };
    
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
