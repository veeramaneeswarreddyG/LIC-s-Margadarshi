import { NextRequest, NextResponse } from 'next/server';
import { calculatePremium, calculateMaturity, comparePlans } from '@/lib/calculationEngine';
import { verifyJWT } from '@/lib/auth';

/**
 * POST /api/calculations/premium
 * Calculate premium for a given plan
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
    const {
      planId,
      age,
      gender,
      sumAssured,
      policyTerm,
      premiumFrequency = 'annual',
    } = body;

    // Validate required fields
    if (!planId || !age || !gender || !sumAssured || !policyTerm) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Call calculation engine
    const result = await calculatePremium({
      planId,
      age: parseInt(age),
      gender: gender.toLowerCase(),
      sumAssured: parseFloat(sumAssured),
      policyTerm: parseInt(policyTerm),
      premiumFrequency,
    });

    return NextResponse.json({
      success: true,
      data: result,
      message: 'Premium calculated successfully',
    });
  } catch (error) {
    console.error('Premium calculation error:', error);
    return NextResponse.json(
      {
        success: false,
        error: String(error),
        message: 'Failed to calculate premium',
      },
      { status: 500 }
    );
  }
}
