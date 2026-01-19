import { NextRequest, NextResponse } from 'next/server';
import { EvaluationData, EvaluationResult } from '@/app/lib/types';
import { calculateTotalScore } from '@/app/lib/calculateScore';

/**
 * API Endpoint: POST /api/v1/evaluation/calculate
 * 
 * Purpose: 평가 데이터를 받아 점수를 계산하고 결과를 반환
 * 
 * Authentication: 현재는 없음 (향후 JWT 또는 API Key 추가 가능)
 * 
 * Request Schema:
 * {
 *   evaluationData: EvaluationData
 * }
 * 
 * Response Schema:
 * {
 *   success: boolean,
 *   data: EvaluationResult,
 *   error?: {
 *     code: string,
 *     message: string,
 *     details?: object
 *   }
 * }
 * 
 * Error Responses:
 * - 400: Validation Error
 * - 500: Internal Server Error
 */

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Request validation
    if (!body.evaluationData) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'evaluationData is required',
            details: {},
          },
        },
        { status: 400 }
      );
    }

    const evaluationData: EvaluationData = body.evaluationData;

    // Calculate score (server-side)
    const result: EvaluationResult = calculateTotalScore(evaluationData);

    return NextResponse.json(
      {
        success: true,
        data: result,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Evaluation calculation error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: error instanceof Error ? error.message : 'An unexpected error occurred',
          details: {},
        },
      },
      { status: 500 }
    );
  }
}





