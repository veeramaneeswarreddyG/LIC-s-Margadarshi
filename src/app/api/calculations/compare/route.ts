import { NextRequest, NextResponse } from 'next/server';
import { comparePlans } from '@/lib/calculationEngine';
import { verifyJWT } from '@/lib/auth';

/**
 * POST /api/calculations/compare
 * Compare multiple LIC plans for a user profile
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
    const { planIds, userProfile } = body;

    // Validate required fields
    if (!planIds || !Array.isArray(planIds) || planIds.length === 0) {
      return NextResponse.json(
        { error: 'Invalid planIds - must be a non-empty array' },
        { status: 400 }
      );
    }

    if (!userProfile || !userProfile.age || !userProfile.gender || !userProfile.sumAssured || !userProfile.policyTerm) {
      return NextResponse.json(
        { error: 'Missing required fields in userProfile' },
        { status: 400 }
      );
    }

    // Call calculation engine
    const result = await comparePlans(planIds, {
      age: parseInt(userProfile.age),
      gender: userProfile.gender,
      sumAssured: parseFloat(userProfile.sumAssured),
      policyTerm: parseInt(userProfile.policyTerm),
    });

    return NextResponse.json({
      success: true,
      data: result,
      message: 'Plans compared successfully',
    });
  } catch (error) {
    console.error('Plan comparison error:', error);
    return NextResponse.json(
      {
        success: false,
        error: String(error),
        message: 'Failed to compare plans',
      },
      { status: 500 }
    );
  }
}
