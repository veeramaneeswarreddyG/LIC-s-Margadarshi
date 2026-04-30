import { NextRequest, NextResponse } from 'next/server';
import { processVaaniQuery, initializeVaani } from '@/lib/vaani';
import { verifyJWT } from '@/lib/auth';

/**
 * POST /api/vaani/chat
 * Send message to LIC's Vaani assistant
 */
export async function POST(request: NextRequest) {
  try {
    // Verify JWT token
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized: Missing or invalid token' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const decoded = await verifyJWT(token);
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const body = await request.json();
    const { message, conversationId } = body;

    if (!message || !conversationId) {
      return NextResponse.json(
        { error: 'Missing message or conversationId' },
        { status: 400 }
      );
    }

    // Process with Vaani
    const response = await processVaaniQuery(
      decoded.uid,
      message,
      conversationId
    );

    return NextResponse.json({
      success: true,
      data: response,
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
    // Verify JWT token
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized: Missing or invalid token' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const decoded = await verifyJWT(token);
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Initialize Vaani
    const context = await initializeVaani(decoded.uid);

    return NextResponse.json({
      success: true,
      data: context,
      message: 'LIC\'s Vaani initialized successfully! 🌟',
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
