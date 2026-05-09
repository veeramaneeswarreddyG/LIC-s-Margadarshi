import { NextRequest, NextResponse } from 'next/server';
import { processVaaniQuery, initializeVaani } from '@/lib/vaani';

/**
 * POST /api/vaani/chat
 * Send message to LIC's Vaani (Gemini-powered)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, conversationId, userId, userData } = body;

    if (!message) {
      return NextResponse.json(
        { error: 'Missing message' },
        { status: 400 }
      );
    }

    const cId = conversationId || `vaani-${userId || 'guest'}-${Date.now()}`;

    const response = await processVaaniQuery(
      userId || 'guest',
      message,
      cId,
      userData
    );

    return NextResponse.json({
      success: true,
      data: response,
      conversationId: cId,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Vaani chat error:', error);
    return NextResponse.json(
      {
        success: false,
        error: String(error),
        message: 'Failed to process message',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/vaani/init
 * Initialize Vaani conversation for a user
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || 'guest';
    const userName = searchParams.get('userName') || 'Valued Customer';

    const context = initializeVaani(userId, userName);

    return NextResponse.json({
      success: true,
      data: context,
      message: "LIC's Vaani initialized successfully! 🌟",
    });
  } catch (error) {
    console.error('Vaani init error:', error);
    return NextResponse.json(
      {
        success: false,
        error: String(error),
        message: 'Failed to initialize Vaani',
      },
      { status: 500 }
    );
  }
}
