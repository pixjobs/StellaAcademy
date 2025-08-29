// /app/api/search-nasa/route.ts

import { NextRequest, NextResponse } from 'next/server';
// We can safely import from nasa.ts here because this route ONLY runs on the server.
import { searchNIVL, NivlItem } from '@/lib/nasa';

type RequestPayload = {
  query: string;
};

/**
 * This route acts as a secure proxy to the searchNIVL function.
 * It allows client components to fetch NASA image data without
 * ever accessing server-only code or secrets.
 */
export async function POST(req: NextRequest) {
  try {
    const { query } = (await req.json()) as RequestPayload;

    if (!query) {
      return NextResponse.json({ error: 'Search query is required' }, { status: 400 });
    }

    // Call the server-only function from our server-side API route.
    const items: NivlItem[] = await searchNIVL(query, {
      expandAssets: true,
      limit: 6 // We can set a consistent limit here
    });

    // Return the successful result to the client.
    return NextResponse.json(items);

  } catch (error: any) {
    console.error('[search-nasa] API Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch data from NASA Image Library.', details: error.message },
      { status: 500 }
    );
  }
}