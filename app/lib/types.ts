// 비즈니스 모델 타입
export type BusinessModel = 'platform' | 'content' | 'device' | 'service' | 'network';

// 기업 단계
export type CompanyStage = 'early' | 'growth' | 'mature' | null;

// 평가 등급 (10등급 체계)
export type Grade = 'AAA' | 'AA' | 'A' | 'BBB' | 'BB' | 'B' | 'CCC' | 'CC' | 'C' | 'D';

// Pass/Fail 결과 타입
export type PassFailResult = 'pass' | 'fail' | null;

// Pass/Fail 평가 항목
export interface BasicQualification {
  // 법규 준수
  businessRegistration: PassFailResult; // 사업자 등록
  privacyPolicy: PassFailResult; // 개인정보 처리방침
  
  // 기술 안정성
  serviceAvailability: PassFailResult; // 서비스 가용률
  
  // 윤리 기준 준수
  educationEthics: PassFailResult; // 교육 윤리 준수
  dataTransparency: PassFailResult; // 데이터 투명성
  
  // 사용자 안전성 (디바이스형만 해당)
  emcCompliance: PassFailResult; // 전자파 적합성
  hazardousSubstance: PassFailResult; // 유해물질 규제
}

// 1. 기업 역량 평가 (40점)
export interface CompanyCapabilityEvaluation {
  // 1-1. 재무 안전성 (23.3%)
  financialStability: {
    // 재무 건전성
    cashFlowSafety: number; // 현금흐름 안전성 (0-5)
    interestCoverageRatio: number; // 이자보상비율 (0-5)
    debtRatio: number; // 부채비율 (0-5)
    currentRatio: number; // 유동비율 (0-5)
    // 자금 조달 능력
    investmentRecord: number; // 투자 유치 실적 (0-5)
    investorReliability: number; // 투자 기관 신뢰성 (0-4)
    operatingProfitMargin: number; // 영업 이익률 (0-5)
  };
  
  // 1-2. 운영 지속성 (33.3%)
  operationalContinuity: {
    customerRetentionRate: number; // 고객 유지율 (0-5)
    revenueGrowthRate: number; // 매출액 성장률 (0-5)
  };
  
  // 1-3. 기술 신뢰성 (43.4%)
  technicalReliability: {
    qualityMonitoring: number; // 품질 모니터링 체계 (0-3)
    improvementProcess: number; // 개선 프로세스 운영 (0-2)
    disasterResponse: number; // 장애 대응 체계 (0-3)
    postIncidentManagement: number; // 사후 관리 체계 (0-2)
    securityCertification: number; // 정보보호 인증 (0-3)
  };
}

// 2. 공교육 특화 가치 평가 (60점)
export interface PublicEducationValueEvaluation {
  // 2-1. 교육적 가치 (48.9%)
  educationalValue: {
    // 교육 효과성
    effectiveness: {
      userEngagement: number; // 사용자 참여도 (0-10)
      learningImprovement: number; // 학습 성과 개선 (0-3)
      learnerAutonomy: number; // 학습자 주도성 지원 (0-3)
      teacherEfficiency: number; // 교사 업무 효율화 (0-8)
      systemConvenience: number; // 시스템 편의성 (0-6)
    };
    // 공교육 적합성
    suitability: {
      curriculumAlignment: number; // 교육과정 연계 (0-9)
      policyAlignment: number; // 교육 정책 부합도 (0-8)
      institutionAdoption: number; // 기관 도입 수 (0-4)
      userCount: number; // 사용자 수 (0-3)
      renewalRate: number; // 재계약율 (0-5)
      equityInclusion: number; // 교육 형평성 및 포용성 (0-6)
    };
    // 교육 혁신성
    innovation: {
      aiPersonalizedLearning: number; // AI 기반 맞춤형 학습 (0-6)
      innovativeLearningEnv: number; // 혁신적 학습 환경 (0-3)
      learningMethodSupport: number; // 다양한 학습 형태 지원 (0-7)
    };
    // 교육 전문성
    expertise: {
      expertPersonnel: number; // 교육 전문 인력 확보 (0-3)
      expertRatio: number; // 교육 전문 인력 비율 (0-2)
    };
  };
  
  // 2-2. 기술적 가치 (24.4%)
  technicalValue: {
    // 공통 기술 역량
    commonTech: {
      rdCapability: number; // R&D 역량 (0-5)
      technicalDifferentiation: number; // 기술적 차별성 (0-5)
      dataUtilization: number; // 학습데이터 활용 (0-5)
      learningExperienceDesign: number; // 학습경험 설계 (0-5)
      scalability: number; // 기술 확장성 (0-5)
      globalExpansion: number; // 해외시장 확장 가능성 (0-5)
    };
    // BM 유형별 기본 역량
    bmCapability: {
      corePersonnel: number; // 전문 인력 규모 (0-4)
      coreSkillset: number; // 핵심 스킬셋 보유 (BM 연동)
      technicalOutput: {
        // BM별 기술 성과물 (각 BM별 하위 항목)
        platform: {
          coreFunction: number; // 핵심 기능 (체크리스트)
          systemPerformance: number; // 시스템 성능 (스케일)
        };
        content: {
          productionRecord: number; // 제작 실적 (스케일)
          qualityLevel: number; // 콘텐츠 수준 (체크리스트)
        };
        device: {
          productDevelopment: number; // 제품 개발 실적 (스케일)
          techLevel: number; // 기술 수준 (스케일)
        };
        service: {
          operationRecord: number; // 서비스 운영 실적 (스케일)
          serviceScope: number; // 서비스 범위 (스케일)
        };
        network: {
          serviceScale: number; // 서비스 규모 (스케일)
          techLevel: number; // 기술 수준 (스케일)
        };
      };
    };
  };
  
  // 2-3. 사회적 가치 (26.7%)
  socialValue: {
    // 사회적 책임 - 디지털 격차 완화
    socialResponsibility: {
      lowSpecDeviceSupport: number; // 저사양 기기 지원 (0-2)
      offlineModeSupport: number; // 오프라인 모드 지원 (0-3)
      dataSavingFeatures: number; // 데이터 절감 기능 (0-3)
    };
    // 윤리 준수
    ethicsCompliance: {
      dataAiEthics: number; // 데이터 및 AI 윤리 책임 (0-5)
    };
    // 협력생태계 구축
    ecosystemBuilding: {
      educationPartnership: number; // 교육기관 파트너십 (0-5)
    };
  };
}

// 비즈니스 모델별 비중
export interface BusinessModelRatio {
  model: BusinessModel;
  revenueRatio: number; // 매출액 비중 (%)
  employeeRatio: number; // 정규직원 비중 (%)
}

// 교육현장 활용도 지표 선택 타입
export type FieldUtilizationMetric = 'institutionAdoption' | 'userCount';

// 택1 선택 상태
export interface SelectionChoices {
  financialHealth: 'A' | 'B'; // A: 현금흐름 안전성, B: 이자보상비율
  fundingCapability: 'A' | 'B'; // A: 투자 유치 실적, B: 영업이익률
}

// 전체 평가 데이터
export interface EvaluationData {
  companyInfo: {
    name: string;
    businessModels: BusinessModel[];
    businessModelRatios: BusinessModelRatio[]; // BM별 비중
    ratioType: 'revenue' | 'employee'; // 비중 기준 선택
    stage: CompanyStage;
    hasDevice: boolean; // 디바이스형 포함 여부
    fieldUtilizationMetric: FieldUtilizationMetric; // 교육현장 활용도 지표 선택 (기관수/사용자수)
    selectionChoices?: SelectionChoices; // 초기 기업 택1 선택 (재무 건전성, 자금 조달 능력)
    includeInvestmentRecord?: boolean; // 성장/성숙 기업의 투자 유치 실적 포함 여부
  };
  basicQualification: BasicQualification;
  companyCapability: CompanyCapabilityEvaluation;
  publicEducationValue: PublicEducationValueEvaluation;
}

// 평가 결과
export interface EvaluationResult {
  passed: boolean; // 기본 자격 통과 여부
  totalScore: number; // 총점 (100점 만점)
  companyCapabilityScore: number; // 기업 역량 점수 (40점)
  publicEducationScore: number; // 공교육 특화 점수 (60점)
  grade: Grade;
  details: {
    financialStabilityScore: number;
    operationalContinuityScore: number;
    technicalReliabilityScore: number;
    educationalValueScore: number;
    technicalValueScore: number;
    socialValueScore: number;
  };
}

// 평가 항목 설명
export interface EvaluationCriteria {
  id: string;
  name: string;
  description: string;
  weight: number;
  maxScore: number;
  levels: {
    score: number;
    description: string;
  }[];
}

