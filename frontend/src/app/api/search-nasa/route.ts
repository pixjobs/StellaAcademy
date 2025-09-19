// /app/api/search-nasa/route.ts

import { NextRequest, NextResponse } from 'next/server';

// Values (runtime):
import { searchNIVL } from '@/lib/nasa';

// Types only:
import type { NivlItem } from '@/lib/nasa';

type RequestPayload = {
  query: string;
  page?: number;
  limit?: number;
  expandAssets?: boolean;
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

  } catch (error: unknown) { // Step 1: Catch the error as 'unknown' for type safety.
    
    // Step 2: Log the original, raw error to the server console for full debugging context.
    // It is safe to log the 'unknown' type directly.
    console.error('[search-nasa] API Error:', error);

    // Step 3: Safely determine the specific error message to send back to the client.
    let errorMessage = 'An unexpected error occurred.'; // Provide a safe default message.

    if (error instanceof Error) {
      // If the caught value is a standard Error object, we can now safely access its `message` property.
      errorMessage = error.message;
    } else if (typeof error === 'string') {
      // Handle the less common case where a plain string was thrown.
      errorMessage = error;
    }

    // Step 4: Return a structured, type-safe JSON response to the client.
    return NextResponse.json(
      {
        error: 'Failed to fetch data from NASA Image Library.',
        details: errorMessage, // Use the safely-derived message.
      },
      { status: 500 }
    );
  }
}