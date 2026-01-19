import { 
  EvaluationData, 
  EvaluationResult, 
  Grade,
  CompanyStage 
} from './types';
import { gradeThresholds } from './evaluationData';

// 기본 자격 검증 통과 여부 확인
// 하나라도 'fail'이면 전체 Fail, 모두 'pass'여야 Pass
export function checkBasicQualification(data: EvaluationData): boolean {
  const { basicQualification, companyInfo } = data;
  const hasDevice = companyInfo.hasDevice || companyInfo.businessModels.includes('device');
  
  // 필수 항목들 (모두 pass여야 함)
  const requiredItems = [
    basicQualification.businessRegistration,
    basicQualification.privacyPolicy,
    basicQualification.serviceAvailability,
    basicQualification.educationEthics,
    basicQualification.dataTransparency,
  ];
  
  // 필수 항목 중 하나라도 fail이면 전체 Fail
  if (requiredItems.some(item => item === 'fail')) {
    return false;
  }
  
  // 필수 항목 중 하나라도 미선택(null)이면 Pass 아님
  if (requiredItems.some(item => item === null)) {
    return false;
  }
  
  // 디바이스형인 경우 추가 항목 체크
  if (hasDevice) {
    const deviceItems = [
      basicQualification.emcCompliance,
      basicQualification.hazardousSubstance,
    ];
    
    // 디바이스 관련 항목 중 하나라도 fail이면 전체 Fail
    if (deviceItems.some(item => item === 'fail')) {
      return false;
    }
    
    // 디바이스 관련 항목 중 하나라도 미선택이면 Pass 아님
    if (deviceItems.some(item => item === null)) {
      return false;
    }
  }
  
  return true;
}

// 점수 값이 -1(미선택)인 경우 0으로 처리하는 헬퍼 함수
function safeScore(value: number): number {
  return value === -1 ? 0 : value;
}

/**
 * 체크 비율 기반 구간 점수 산정 (Option 2)
 * 체크 비율을 0~5 등급으로 환산하여 점수화
 * 
 * | 체크 비율 | 구간 등급(점수) |
 * |----------|----------------|
 * | ≥80%     | 5              |
 * | ≥60%     | 4              |
 * | ≥40%     | 3              |
 * | ≥20%     | 2              |
 * | ≥10%     | 1              |
 * | <10%     | 0              |
 * 
 * 지표점수 = 해당 구간 점수 / 5
 * 
 * @param checkedCount - 체크된 항목 수
 * @param totalItems - 전체 항목 수
 * @returns 0~1 사이의 점수 (구간점수/5)
 */
function calculateChecklistScore(checkedCount: number, totalItems: number): number {
  if (totalItems === 0) return 0;
  if (checkedCount === -1) return 0;
  
  const checkRatio = checkedCount / totalItems;
  let tierScore: number;
  
  if (checkRatio >= 0.8) {
    tierScore = 5;
  } else if (checkRatio >= 0.6) {
    tierScore = 4;
  } else if (checkRatio >= 0.4) {
    tierScore = 3;
  } else if (checkRatio >= 0.2) {
    tierScore = 2;
  } else if (checkRatio >= 0.1) {
    tierScore = 1;
  } else {
    tierScore = 0;
  }
  
  return tierScore / 5;
}

// 체크리스트 지표별 전체 항목 수 정의
const checklistTotalItems = {
  // 교육 효과성
  learnerAutonomy: 6,       // 학습자 주도성 지원 (v3.0 기준 6개)
  teacherEfficiency: 9,     // 교사 업무 효율화 (v3.0 기준 9개)
  systemConvenience: 6,     // 시스템 편의성
  
  // 공교육 적합성
  curriculumAlignment: 4,   // 국가교육과정 연계성 (v3.0 기준 4개)
  policyAlignment: 6,       // 교육정책 부합도
  equityInclusion: 6,       // 교육 형평성 및 포용성
  
  // 교육 혁신성
  aiPersonalizedLearning: 6, // AI 기반 맞춤형 학습
  innovativeLearningEnv: 3,  // 혁신적 학습 환경
  learningMethodSupport: 7,  // 다양한 학습 형태 지원
  
  // 공통 기술 역량
  dataUtilization: 5,        // 학습데이터 활용 (BM별 5개)
  learningExperienceDesign: 18, // 학습경험 설계 (v3.0 기준 18개: 사용성6+접근성6+몰입형6)
  scalability: 8,            // 기술 확장성
  globalExpansion: 5,        // 해외시장 확장 가능성
  
  // BM 유형별 핵심 스킬셋
  coreSkillset: {
    platform: 6,
    content: 4,
    device: 6,
    service: 5,
    network: 5,
  },
  
  // 기술 성과물 체크리스트
  platformCoreFunction: 4,
  contentQualityLevel: 4,
  
  // 사회적 가치
  offlineModeSupport: 3,     // 오프라인 모드 지원
  dataSavingFeatures: 3,     // 데이터 절감 기능
  dataAiEthics: 8,           // 데이터 및 AI 윤리 (8개 체크리스트)
  educationPartnership: 10,  // 교육기관 파트너십 (10개 체크리스트)
};

// 1. 기업 역량 평가 점수 계산 (40점 만점)
export function calculateCompanyCapabilityScore(
  data: EvaluationData
): { total: number; details: { financial: number; operational: number; technical: number } } {
  const { companyCapability, companyInfo } = data;
  const stage = companyInfo.stage;
  const selectionChoices = companyInfo.selectionChoices || { financialHealth: 'A', fundingCapability: 'A' };
  const includeInvestmentRecord = companyInfo.includeInvestmentRecord !== false; // 기본값 true
  
  // 1-1. 재무 안전성 (22.9%)
  const financialStability = companyCapability.financialStability;
  let financialScore = 0;
  
  // 기본 가중치
  const baseWeights = {
    cashFlowSafety: 0.217,      // 현금흐름 안전성 (초기 기업 전용)
    interestCoverageRatio: 0.123, // 이자보상비율
    debtRatio: 0.154,           // 부채비율
    currentRatio: 0.126,        // 유동비율
    investmentRecord: 0.099,    // 투자 유치 실적 (투자금액)
    investorReliability: 0.099, // 투자 유치 실적 (기관 신뢰성)
    operatingProfitMargin: 0.182, // 영업 이익률
  };
  
  // 조정된 가중치 계산 (택1 및 optional 적용)
  let adjustedWeights = { ...baseWeights };
  let totalWeight = 0;
  
  if (stage === 'early') {
    // 초기 기업: 재무 건전성에서 택1 적용
    if (selectionChoices.financialHealth === 'A') {
      // 현금흐름 안전성 선택 → 이자보상비율 제외, 가중치 재배분
      const excludedWeight = adjustedWeights.interestCoverageRatio;
      const remainingItems = ['cashFlowSafety', 'debtRatio', 'currentRatio'] as const;
      const remainingTotal = remainingItems.reduce((sum, k) => sum + adjustedWeights[k], 0);
      remainingItems.forEach(k => {
        adjustedWeights[k] += excludedWeight * (adjustedWeights[k] / remainingTotal);
      });
      adjustedWeights.interestCoverageRatio = 0;
    } else {
      // 이자보상비율 선택 → 현금흐름 안전성 제외, 가중치 재배분
      const excludedWeight = adjustedWeights.cashFlowSafety;
      const remainingItems = ['interestCoverageRatio', 'debtRatio', 'currentRatio'] as const;
      const remainingTotal = remainingItems.reduce((sum, k) => sum + adjustedWeights[k], 0);
      remainingItems.forEach(k => {
        adjustedWeights[k] += excludedWeight * (adjustedWeights[k] / remainingTotal);
      });
      adjustedWeights.cashFlowSafety = 0;
    }
    
    // 초기 기업: 자금 조달 능력에서 택1 적용
    if (selectionChoices.fundingCapability === 'A') {
      // 투자 유치 실적 선택 → 영업이익률 제외, 가중치 재배분
      const excludedWeight = adjustedWeights.operatingProfitMargin;
      const remainingItems = ['investmentRecord', 'investorReliability'] as const;
      const remainingTotal = remainingItems.reduce((sum, k) => sum + adjustedWeights[k], 0);
      remainingItems.forEach(k => {
        adjustedWeights[k] += excludedWeight * (adjustedWeights[k] / remainingTotal);
      });
      adjustedWeights.operatingProfitMargin = 0;
    } else {
      // 영업이익률 선택 → 투자 유치 실적 제외, 가중치 재배분
      const excludedWeight = adjustedWeights.investmentRecord + adjustedWeights.investorReliability;
      adjustedWeights.operatingProfitMargin += excludedWeight;
      adjustedWeights.investmentRecord = 0;
      adjustedWeights.investorReliability = 0;
    }
  } else {
    // 성장/성숙 기업: 현금흐름 안전성 제외 (X)
    const excludedWeight = adjustedWeights.cashFlowSafety;
    const remainingItems = ['interestCoverageRatio', 'debtRatio', 'currentRatio'] as const;
    const remainingTotal = remainingItems.reduce((sum, k) => sum + adjustedWeights[k], 0);
    remainingItems.forEach(k => {
      adjustedWeights[k] += excludedWeight * (adjustedWeights[k] / remainingTotal);
    });
    adjustedWeights.cashFlowSafety = 0;
    
    // 성장/성숙 기업: 투자 유치 실적 포함 여부 (Optional)
    if (!includeInvestmentRecord) {
      const excludedWeight = adjustedWeights.investmentRecord + adjustedWeights.investorReliability;
      adjustedWeights.operatingProfitMargin += excludedWeight;
      adjustedWeights.investmentRecord = 0;
      adjustedWeights.investorReliability = 0;
    }
  }
  
  // 총 가중치 계산 (정규화용)
  totalWeight = Object.values(adjustedWeights).reduce((sum, w) => sum + w, 0);
  
  // 점수 계산
  if (adjustedWeights.cashFlowSafety > 0) {
    financialScore += (safeScore(financialStability.cashFlowSafety) / 5) * adjustedWeights.cashFlowSafety;
  }
  if (adjustedWeights.interestCoverageRatio > 0) {
    financialScore += (safeScore(financialStability.interestCoverageRatio) / 5) * adjustedWeights.interestCoverageRatio;
  }
  financialScore += (safeScore(financialStability.debtRatio) / 4) * adjustedWeights.debtRatio;
  financialScore += (safeScore(financialStability.currentRatio) / 4) * adjustedWeights.currentRatio;
  
  if (adjustedWeights.investmentRecord > 0) {
    financialScore += (safeScore(financialStability.investmentRecord) / 4) * adjustedWeights.investmentRecord;
    financialScore += (safeScore(financialStability.investorReliability) / 4) * adjustedWeights.investorReliability;
  }
  if (adjustedWeights.operatingProfitMargin > 0) {
    financialScore += (safeScore(financialStability.operatingProfitMargin) / 5) * adjustedWeights.operatingProfitMargin;
  }
  
  // 가중치 정규화
  if (totalWeight > 0) {
    financialScore = financialScore / totalWeight;
  }
  
  const financialTotal = financialScore * 0.229 * 40;
  
  // 1-2. 운영 지속성 (33.3%)
  const operationalContinuity = companyCapability.operationalContinuity;
  const operationalScore = 
    (safeScore(operationalContinuity.customerRetentionRate) / 5) * 0.583 +
    (safeScore(operationalContinuity.revenueGrowthRate) / 7) * 0.417; // maxScore 7로 변경
  const operationalTotal = operationalScore * 0.333 * 40;
  
  // 1-3. 기술 신뢰성 (43.4%)
  const technicalReliability = companyCapability.technicalReliability;
  // 품질 관리 역량 = 품질 모니터링 체계 + 개선 프로세스 운영
  const qualityScore = 
    (safeScore(technicalReliability.qualityMonitoring) / 3) * 0.228 +
    (safeScore(technicalReliability.improvementProcess) / 2) * 0.228;
  // 장애 복구 역량 = 장애 대응 체계 + 사후 관리 체계
  const disasterScore = 
    (safeScore(technicalReliability.disasterResponse) / 3) * 0.111 +
    (safeScore(technicalReliability.postIncidentManagement) / 2) * 0.111;
  // 정보보호 인증
  const securityScore = (safeScore(technicalReliability.securityCertification) / 3) * 0.322;
  
  const technicalScore = qualityScore + disasterScore + securityScore;
  const technicalTotal = technicalScore * 0.438 * 40;
  
  return {
    total: financialTotal + operationalTotal + technicalTotal,
    details: {
      financial: financialTotal,
      operational: operationalTotal,
      technical: technicalTotal,
    },
  };
}

// 2. 공교육 특화 가치 평가 점수 계산 (60점 만점)
export function calculatePublicEducationScore(
  data: EvaluationData
): { total: number; details: { educational: number; technical: number; social: number } } {
  const { publicEducationValue } = data;
  
  // 2-1. 교육적 가치 (48.9%)
  const educationalValue = publicEducationValue.educationalValue;
  
  // 교육 효과성 (41.7%)
  // 체크리스트 지표는 체크 비율 기반 구간 점수 적용
  const effectivenessScore = 
    (safeScore(educationalValue.effectiveness.userEngagement) / 9) * 0.217 +  // 척도형 (maxScore 9로 변경)
    (safeScore(educationalValue.effectiveness.learningImprovement) / 3) * 0.217 +  // 척도형
    calculateChecklistScore(safeScore(educationalValue.effectiveness.learnerAutonomy), checklistTotalItems.learnerAutonomy) * 0.333 +
    calculateChecklistScore(safeScore(educationalValue.effectiveness.teacherEfficiency), checklistTotalItems.teacherEfficiency) * 0.117 +
    calculateChecklistScore(safeScore(educationalValue.effectiveness.systemConvenience), checklistTotalItems.systemConvenience) * 0.116;
  
  // 공교육 적합성 (37.8%)
  // 기관 도입 수 또는 사용자 수 중 선택된 지표만 사용
  const fieldUtilizationMetric = data.companyInfo.fieldUtilizationMetric;
  const fieldUtilizationScore = fieldUtilizationMetric === 'institutionAdoption'
    ? (safeScore(educationalValue.suitability.institutionAdoption) / 4) * 0.296  // 척도형
    : (safeScore(educationalValue.suitability.userCount) / 3) * 0.296;  // 척도형
  
  const suitabilityScore = 
    calculateChecklistScore(safeScore(educationalValue.suitability.curriculumAlignment), checklistTotalItems.curriculumAlignment) * 0.184 +
    calculateChecklistScore(safeScore(educationalValue.suitability.policyAlignment), checklistTotalItems.policyAlignment) * 0.183 +
    fieldUtilizationScore +
    (safeScore(educationalValue.suitability.renewalRate) / 9) * 0.148 +  // 척도형 (maxScore 9로 변경)
    calculateChecklistScore(safeScore(educationalValue.suitability.equityInclusion), checklistTotalItems.equityInclusion) * 0.189;
  
  // 교육 혁신성 (20%)
  const innovationScore = 
    calculateChecklistScore(safeScore(educationalValue.innovation.aiPersonalizedLearning), checklistTotalItems.aiPersonalizedLearning) * 0.333 +
    calculateChecklistScore(safeScore(educationalValue.innovation.innovativeLearningEnv), checklistTotalItems.innovativeLearningEnv) * 0.333 +
    calculateChecklistScore(safeScore(educationalValue.innovation.learningMethodSupport), checklistTotalItems.learningMethodSupport) * 0.334;
  
  // 교육 전문성 (20%)
  const expertiseScore = 
    (safeScore(educationalValue.expertise.expertPersonnel) / 3) * 0.5 +
    (safeScore(educationalValue.expertise.expertRatio) / 2) * 0.5;
  
  const educationalTotal = (
    effectivenessScore * 0.417 +
    suitabilityScore * 0.385 +
    innovationScore * 0.095 +
    expertiseScore * 0.103
  ) * 0.489 * 60;
  
  // 2-2. 기술적 가치 (24.4%)
  const technicalValue = publicEducationValue.technicalValue;
  
  // 공통 기술 역량 (60%)
  // 체크리스트 지표는 체크 비율 기반 구간 점수 적용
  const commonTechScore = 
    (safeScore(technicalValue.commonTech.rdCapability) / 4) * 0.151 +  // 척도형 (0-4)
    (safeScore(technicalValue.commonTech.technicalDifferentiation) / 3) * 0.173 +  // 척도형 (0-3)
    calculateChecklistScore(safeScore(technicalValue.commonTech.dataUtilization), checklistTotalItems.dataUtilization) * 0.236 +
    calculateChecklistScore(safeScore(technicalValue.commonTech.learningExperienceDesign), checklistTotalItems.learningExperienceDesign) * 0.223 +
    calculateChecklistScore(safeScore(technicalValue.commonTech.scalability), checklistTotalItems.scalability) * 0.151 +
    calculateChecklistScore(safeScore(technicalValue.commonTech.globalExpansion), checklistTotalItems.globalExpansion) * 0.066;
  
  // BM 유형별 기본 역량 (40%)
  // 기술 성과물은 선택된 BM 유형에 따라 해당 BM의 점수만 계산
  const selectedBMs = data.companyInfo.businessModels;
  const bmRatios = data.companyInfo.businessModelRatios || {};
  
  // 각 BM별 기술 성과물 점수 계산
  let technicalOutputScore = 0;
  let totalBmWeight = 0;

  const techOutput = technicalValue.bmCapability.technicalOutput;

  // bmRatios를 객체로 변환
  const bmRatiosMap = Array.isArray(bmRatios)
    ? bmRatios.reduce((acc, item) => ({ ...acc, [item.model]: item.revenueRatio / 100 }), {} as Record<string, number>)
    : bmRatios;

  selectedBMs.forEach((bm: string) => {
    const ratio = bmRatiosMap[bm] || (1 / selectedBMs.length);
    let bmScore = 0;
    
    switch (bm) {
      case 'platform':
        // 핵심 기능: 체크리스트(4개), 시스템 성능: 척도형(0-3)
        bmScore = (
          calculateChecklistScore(safeScore(techOutput.platform.coreFunction), checklistTotalItems.platformCoreFunction) +
          safeScore(techOutput.platform.systemPerformance) / 3
        ) / 2;
        break;
      case 'content':
        // 제작 실적: 척도형(0-3), 콘텐츠 수준: 체크리스트(4개)
        bmScore = (
          safeScore(techOutput.content.productionRecord) / 3 +
          calculateChecklistScore(safeScore(techOutput.content.qualityLevel), checklistTotalItems.contentQualityLevel)
        ) / 2;
        break;
      case 'device':
        // 제품 개발 실적: 척도형(0-3), 기술 수준: 척도형(0-3)
        bmScore = (safeScore(techOutput.device.productDevelopment) / 3 + safeScore(techOutput.device.techLevel) / 3) / 2;
        break;
      case 'service':
        // 서비스 운영 실적: 척도형(0-3), 서비스 범위: 척도형(0-3)
        bmScore = (safeScore(techOutput.service.operationRecord) / 3 + safeScore(techOutput.service.serviceScope) / 3) / 2;
        break;
      case 'network':
        // 서비스 규모: 척도형(0-4), 기술 수준: 척도형(0-4)
        bmScore = (safeScore(techOutput.network.serviceScale) / 4 + safeScore(techOutput.network.techLevel) / 4) / 2;
        break;
    }
    
    technicalOutputScore += bmScore * ratio;
    totalBmWeight += ratio;
  });
  
  if (totalBmWeight > 0) {
    technicalOutputScore = technicalOutputScore / totalBmWeight;
  }
  
  // 핵심 스킬셋은 BM별로 다른 총 항목 수 적용
  // 선택된 BM들의 평균 총 항목 수 계산
  let avgSkillsetTotalItems = 6; // 기본값
  if (selectedBMs.length > 0) {
    let totalSkillsetItems = 0;
    selectedBMs.forEach((bm: string) => {
      const bmKey = bm as keyof typeof checklistTotalItems.coreSkillset;
      totalSkillsetItems += checklistTotalItems.coreSkillset[bmKey] || 6;
    });
    avgSkillsetTotalItems = totalSkillsetItems / selectedBMs.length;
  }
  
  const bmCapabilityScore = 
    (safeScore(technicalValue.bmCapability.corePersonnel) / 4) * 0.3 +  // 척도형
    calculateChecklistScore(safeScore(technicalValue.bmCapability.coreSkillset), avgSkillsetTotalItems) * 0.4 +
    technicalOutputScore * 0.3;
  
  const technicalTotal = (
    commonTechScore * 0.6 +
    bmCapabilityScore * 0.4
  ) * 0.25 * 60;
  
  // 2-3. 사회적 가치 (26.7%)
  const socialValue = publicEducationValue.socialValue;
  
  // 사회적 책임 (디지털 격차 완화) 점수 계산
  // 체크리스트 지표는 체크 비율 기반 구간 점수 적용
  const socialResponsibilityScore = 
    (safeScore(socialValue.socialResponsibility.lowSpecDeviceSupport) / 2) * 0.4 +  // 척도형
    calculateChecklistScore(safeScore(socialValue.socialResponsibility.offlineModeSupport), checklistTotalItems.offlineModeSupport) * 0.3 +
    calculateChecklistScore(safeScore(socialValue.socialResponsibility.dataSavingFeatures), checklistTotalItems.dataSavingFeatures) * 0.3;
  
  const socialScore = 
    socialResponsibilityScore * 0.271 +
    calculateChecklistScore(safeScore(socialValue.ethicsCompliance.dataAiEthics), checklistTotalItems.dataAiEthics) * 0.396 +
    calculateChecklistScore(safeScore(socialValue.ecosystemBuilding.educationPartnership), checklistTotalItems.educationPartnership) * 0.333;
  
  const socialTotal = socialScore * 0.2604 * 60;
  
  return {
    total: educationalTotal + technicalTotal + socialTotal,
    details: {
      educational: educationalTotal,
      technical: technicalTotal,
      social: socialTotal,
    },
  };
}

// 등급 결정 (10등급 체계)
export function determineGrade(score: number, passed: boolean): Grade {
  if (!passed) return 'D';
  
  if (score >= gradeThresholds.AAA.min) return 'AAA';
  if (score >= gradeThresholds.AA.min) return 'AA';
  if (score >= gradeThresholds.A.min) return 'A';
  if (score >= gradeThresholds.BBB.min) return 'BBB';
  if (score >= gradeThresholds.BB.min) return 'BB';
  if (score >= gradeThresholds.B.min) return 'B';
  if (score >= gradeThresholds.CCC.min) return 'CCC';
  if (score >= gradeThresholds.CC.min) return 'CC';
  if (score >= gradeThresholds.C.min) return 'C';
  return 'D';
}

// 전체 평가 점수 계산
export function calculateTotalScore(data: EvaluationData): EvaluationResult {
  const passed = checkBasicQualification(data);
  
  const companyCapability = calculateCompanyCapabilityScore(data);
  const publicEducation = calculatePublicEducationScore(data);
  
  const totalScore = passed 
    ? companyCapability.total + publicEducation.total 
    : 0;
  
  const grade = determineGrade(totalScore, passed);
  
  // 세부 점수 먼저 반올림
  const financialRounded = Math.round(companyCapability.details.financial * 10) / 10;
  const operationalRounded = Math.round(companyCapability.details.operational * 10) / 10;
  const technicalRounded = Math.round(companyCapability.details.technical * 10) / 10;
  
  const educationalRounded = Math.round(publicEducation.details.educational * 10) / 10;
  const technicalValueRounded = Math.round(publicEducation.details.technical * 10) / 10;
  const socialRounded = Math.round(publicEducation.details.social * 10) / 10;
  
  // 종합 점수는 세부 점수의 합계로 계산 (일치성 보장)
  const companyCapabilityTotal = Math.round((financialRounded + operationalRounded + technicalRounded) * 10) / 10;
  const publicEducationTotal = Math.round((educationalRounded + technicalValueRounded + socialRounded) * 10) / 10;
  const calculatedTotalScore = passed ? Math.round((companyCapabilityTotal + publicEducationTotal) * 10) / 10 : 0;
  
  return {
    passed,
    totalScore: calculatedTotalScore,
    companyCapabilityScore: companyCapabilityTotal,
    publicEducationScore: publicEducationTotal,
    grade,
    details: {
      financialStabilityScore: financialRounded,
      operationalContinuityScore: operationalRounded,
      technicalReliabilityScore: technicalRounded,
      educationalValueScore: educationalRounded,
      technicalValueScore: technicalValueRounded,
      socialValueScore: socialRounded,
    },
  };
}

// 초기 평가 데이터 생성
export function createInitialEvaluationData(): EvaluationData {
  return {
    companyInfo: {
      name: '',
      businessModels: [],
      businessModelRatios: [],
      ratioType: 'revenue',
      stage: null,
      hasDevice: false,
      fieldUtilizationMetric: 'institutionAdoption',
      selectionChoices: { financialHealth: 'A', fundingCapability: 'A' },
      includeInvestmentRecord: true,
    },
    basicQualification: {
      businessRegistration: null,
      privacyPolicy: null,
      serviceAvailability: null,
      educationEthics: null,
      dataTransparency: null,
      emcCompliance: null,
      hazardousSubstance: null,
    },
    companyCapability: {
      financialStability: {
        cashFlowSafety: -1,
        interestCoverageRatio: -1,
        debtRatio: -1,
        currentRatio: -1,
        investmentRecord: -1,
        investorReliability: -1,
        operatingProfitMargin: -1,
      },
      operationalContinuity: {
        customerRetentionRate: -1,
        revenueGrowthRate: -1,
      },
      technicalReliability: {
        qualityMonitoring: -1,
        improvementProcess: -1,
        disasterResponse: -1,
        postIncidentManagement: -1,
        securityCertification: -1,
      },
    },
    publicEducationValue: {
      educationalValue: {
        effectiveness: {
          userEngagement: -1,
          learningImprovement: -1,
          learnerAutonomy: -1,
          teacherEfficiency: -1,
          systemConvenience: -1,
        },
        suitability: {
          curriculumAlignment: -1,
          policyAlignment: -1,
          institutionAdoption: -1,
          userCount: -1,
          renewalRate: -1,
          equityInclusion: -1,
        },
        innovation: {
          aiPersonalizedLearning: -1,
          innovativeLearningEnv: -1,
          learningMethodSupport: -1,
        },
        expertise: {
          expertPersonnel: -1,
          expertRatio: -1,
        },
      },
      technicalValue: {
        commonTech: {
          rdCapability: -1,
          technicalDifferentiation: -1,
          dataUtilization: -1,
          learningExperienceDesign: -1,
          scalability: -1,
          globalExpansion: -1,
        },
        bmCapability: {
          corePersonnel: -1,
          coreSkillset: -1,
          technicalOutput: {
            platform: {
              coreFunction: -1,
              systemPerformance: -1,
            },
            content: {
              productionRecord: -1,
              qualityLevel: -1,
            },
            device: {
              productDevelopment: -1,
              techLevel: -1,
            },
            service: {
              operationRecord: -1,
              serviceScope: -1,
            },
            network: {
              serviceScale: -1,
              techLevel: -1,
            },
          },
        },
      },
      socialValue: {
        socialResponsibility: {
          lowSpecDeviceSupport: -1,
          offlineModeSupport: -1,
          dataSavingFeatures: -1,
        },
        ethicsCompliance: {
          dataAiEthics: -1,
        },
        ecosystemBuilding: {
          educationPartnership: -1,
        },
      },
    },
  };
}

