import { NextRequest, NextResponse } from 'next/server';
import { calculateMaturity } from '@/lib/calculationEngine';
import { verifyJWT } from '@/lib/auth';

/**
 * POST /api/calculations/maturity
 * Calculate maturity value for a policy
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
    const { policyId, premiumAmount, policyTerm, sumAssured, planType } = body;

    // Validate required fields
    if (!policyId || !premiumAmount || !policyTerm || !sumAssured || !planType) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Call calculation engine
    const result = await calculateMaturity(
      {
        policyId,
        premiumAmount: parseFloat(premiumAmount),
        policyTerm: parseInt(policyTerm),
        sumAssured: parseFloat(sumAssured),
      },
      planType
    );

    return NextResponse.json({
      success: true,
      data: result,
      message: 'Maturity value calculated successfully',
    });
  } catch (error) {
    console.error('Maturity calculation error:', error);
    return NextResponse.json(
      {
        success: false,
        error: String(error),
        message: 'Failed to calculate maturity value',
      },
      { status: 500 }
    );
  }
}
