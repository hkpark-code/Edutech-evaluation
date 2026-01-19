import { NextRequest, NextResponse } from 'next/server';
import { EvaluationData } from '@/app/lib/types';
import { checkBasicQualification } from '@/app/lib/calculateScore';

/**
 * API Endpoint: POST /api/v1/evaluation/validate
 * 
 * Purpose: 평가 데이터의 유효성을 검증
 * 
 * Authentication: 현재는 없음
 * 
 * Request Schema:
 * {
 *   evaluationData: EvaluationData
 * }
 * 
 * Response Schema:
 * {
 *   success: boolean,
 *   data: {
 *     isValid: boolean,
 *     basicQualificationPassed: boolean,
 *     validationErrors?: string[]
 *   },
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
    const validationErrors: string[] = [];

    // Basic validation
    if (!evaluationData.companyInfo.name || evaluationData.companyInfo.name.trim() === '') {
      validationErrors.push('기업명은 필수입니다.');
    }

    if (!evaluationData.companyInfo.businessModels || evaluationData.companyInfo.businessModels.length === 0) {
      validationErrors.push('비즈니스 모델을 최소 1개 이상 선택해야 합니다.');
    }

    if (!evaluationData.companyInfo.stage) {
      validationErrors.push('기업 단계를 선택해야 합니다.');
    }

    // Check basic qualification
    const basicQualificationPassed = checkBasicQualification(evaluationData);

    return NextResponse.json(
      {
        success: true,
        data: {
          isValid: validationErrors.length === 0,
          basicQualificationPassed,
          validationErrors: validationErrors.length > 0 ? validationErrors : undefined,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Validation error:', error);
    
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





