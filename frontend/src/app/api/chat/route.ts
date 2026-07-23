import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const { messages } = await request.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: 'Invalid messages array' }, { status: 400 });
    }

    // Call local vLLM server running on port 8000
    const response = await fetch('http://localhost:8000/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'glm-4.7-flash',
        messages: messages,
        temperature: 0.7,
        max_tokens: 300,
      }),
    });

    if (!response.ok) {
      throw new Error(`vLLM response error: ${response.status}`);
    }

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content || 'Unable to generate response.';

    return NextResponse.json({ reply });
  } catch (error) {
    console.error('[chat-api] vLLM fetch failed:', error);
    return NextResponse.json(
      { error: 'Failed to communicate with local Socratic tutor engine.' },
      { status: 500 }
    );
  }
}
