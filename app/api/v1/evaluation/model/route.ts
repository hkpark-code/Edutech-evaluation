import { NextRequest, NextResponse } from 'next/server';
import { 
  basicQualificationCriteria,
  companyCapabilityCriteria,
  publicEducationCriteria,
  gradeThresholds,
  businessModelInfo,
  companyStageInfo,
} from '@/app/lib/evaluationData';

/**
 * API Endpoint: GET /api/v1/evaluation/model
 * 
 * Purpose: 평가 모델의 구조와 기준을 반환
 * 
 * Authentication: 현재는 없음 (향후 역할 기반 접근 제어 추가 가능)
 * 
 * Response Schema:
 * {
 *   success: boolean,
 *   data: {
 *     version: string,
 *     basicQualification: object,
 *     companyCapability: object,
 *     publicEducationValue: object,
 *     gradeThresholds: object,
 *     businessModelInfo: object,
 *     companyStageInfo: object,
 *   },
 *   error?: {
 *     code: string,
 *     message: string,
 *     details?: object
 *   }
 * }
 * 
 * Error Responses:
 * - 500: Internal Server Error
 */

const MODEL_VERSION = '1.0.0';

export async function GET(request: NextRequest) {
  try {
    return NextResponse.json(
      {
        success: true,
        data: {
          version: MODEL_VERSION,
          basicQualification: basicQualificationCriteria,
          companyCapability: companyCapabilityCriteria,
          publicEducationValue: publicEducationCriteria,
          gradeThresholds,
          businessModelInfo,
          companyStageInfo,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Model retrieval error:', error);
    
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





