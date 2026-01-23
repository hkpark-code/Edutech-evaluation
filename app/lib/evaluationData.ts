import { EvaluationCriteria } from './types';

// 기본 자격 검증 항목 (Pass/Fail)
export const basicQualificationCriteria = {
  legalCompliance: {
    name: '법규 준수',
    items: [
      {
        id: 'businessRegistration',
        name: '사업자 등록',
        description: '유효한 사업자 등록증 보유 여부',
        scales: [
          { score: 'P', description: '사업자등록증 유효 및 정상 영업 중인 경우' },
          { score: 'F', description: '휴업, 말소, 폐업 상태인 경우' },
        ],
      },
      {
        id: 'privacyPolicy',
        name: '개인정보 처리방침',
        description: '개인정보보호법에 따른 처리방침 공개 여부',
        scales: [
          { score: 'P', description: '개인정보 처리방침이 게시되어 있고 최신 내용으로 유지 중일 경우' },
          { score: 'F', description: '방침 미게시, 법정 항목 누락, 장기 미갱신(2년 이상) 시' },
        ],
      },
    ],
  },
  technicalStability: {
    name: '기술 안정성',
    items: [
      {
        id: 'serviceAvailability',
        name: '서비스 가용률',
        description: '서비스 안정성 및 가용률 기준 충족 여부 (99% 이상)',
        scales: [
          { score: 'P', description: '최근 6개월 간 정상 운영 및 가용률 99% 이상 유지' },
          { score: 'F', description: '최근 6개월 간 가용률 99% 미만' },
        ],
      },
    ],
  },
  ethicsStandard: {
    name: '윤리 기준 준수',
    items: [
      {
        id: 'educationEthics',
        name: '교육 윤리 준수',
        description: '교육 관련 윤리 기준 및 가이드라인 준수 여부',
        scales: [
          { score: 'P', description: '허위·과장 광고나 개인정보 불법 이용 등 윤리 위반 이력 없음' },
          { score: 'F', description: '허위·과장 광고나 개인정보 불법 이용 등 윤리 위반 이력 있음' },
        ],
      },
      {
        id: 'dataTransparency',
        name: '데이터 투명성',
        description: '데이터 수집 및 활용에 대한 투명성 확보 여부',
        scales: [
          { score: 'P', description: '데이터 처리방침 명확히 공개 및 이용자 열람 가능 시' },
          { score: 'F', description: '데이터 처리 절차 비공개 또는 불명확 시' },
        ],
      },
    ],
  },
  userSafety: {
    name: '사용자 안전성',
    description: '디바이스형 제품에만 해당',
    items: [
      {
        id: 'emcCompliance',
        name: '전자파 적합성',
        description: 'KC 인증 등 전자파 적합성 기준 충족 여부',
        scales: [
          { score: 'P', description: 'KC 인증 또는 동등 이상 국제 인증(CE, FCC등) 보유 시' },
          { score: 'F', description: '인증 미보유 또는 불합격 시' },
        ],
      },
      {
        id: 'hazardousSubstance',
        name: '유해물질 규제',
        description: 'RoHS, REACH 등 유해물질 규제 준수 여부',
        scales: [
          { score: 'P', description: 'RoHS, REACH 등 국제 인증서 또는 공인 시험성적서 결과 적합 시' },
          { score: 'F', description: '인증 미보유 또는 공인 시험 결과 부적합 시' },
        ],
      },
    ],
  },
};

// 점수 등급 기준
export const scoreLevels = [
  { score: 5, label: '5점', description: '최상 수준' },
  { score: 4, label: '4점', description: '우수 수준' },
  { score: 3, label: '3점', description: '양호 수준' },
  { score: 2, label: '2점', description: '보통 수준' },
  { score: 1, label: '1점', description: '미흡 수준' },
  { score: 0, label: '0점', description: '해당없음/미충족' },
];

// 1. 기업 역량 평가 (40점)
export const companyCapabilityCriteria = {
  category: '기업 역량 평가',
  totalScore: 40,
  weight: 0.4,
  subcategories: [
    {
      id: 'financialStability',
      name: '1-1. 재무 안전성',
      weight: 0.229,
      groups: [
        {
          name: '재무 건전성',
          selectionGroup: 'financialHealth', // 초기 기업: 현금흐름 안전성 vs 이자보상비율 택1
          items: [
            {
              id: 'cashFlowSafety',
              name: '현금흐름 안전성',
              weight: 0.217,
              description: '영업현금흐름/총지출 비율로 측정하는 현금창출 능력',
              forStage: 'early' as const,
              selectionOption: 'A', // 택1 옵션 A
              maxScore: 5,
              scales: [
                { score: 5, description: '영업활동 현금흐름이 총 지출의 300% 이상' },
                { score: 4, description: '영업활동 현금흐름이 총 지출의 200% 이상~300% 미만' },
                { score: 3, description: '영업활동 현금흐름이 총 지출의 100% 이상~200% 미만' },
                { score: 2, description: '영업활동 현금흐름이 총 지출의 50% 이상~100% 미만' },
                { score: 1, description: '영업활동 현금흐름이 총 지출의 0% 이상~50% 미만' },
                { score: 0, description: '영업활동 현금흐름이 총 지출의 0% 미만' },
              ],
            },
            {
              id: 'interestCoverageRatio',
              name: '이자보상비율',
              weight: 0.123,
              description: '영업이익/이자비용 비율로 측정하는 이자 지급 능력',
              forStage: 'all' as const,
              selectionOption: 'B', // 초기 기업에서 택1 옵션 B (성장/성숙에서는 필수)
              maxScore: 5,
              scales: [
                { score: 5, description: '영업이익이 이자비용의 15배 이상' },
                { score: 4, description: '영업이익이 이자비용의 8배 이상 ~ 15배 미만' },
                { score: 3, description: '영업이익이 이자비용의 4배 이상 ~ 8배 미만' },
                { score: 2, description: '영업이익이 이자비용의 2배 이상 ~ 4배 미만' },
                { score: 1, description: '영업이익이 이자비용의 1배 이상 ~ 2배 미만' },
                { score: 0, description: '영업이익이 이자비용의 1배 미만' },
              ],
            },
            {
              id: 'debtRatio',
              name: '부채비율',
              weight: 0.154,
              description: '총부채/자기자본 비율로 측정하는 재무 안정성',
              forStage: 'all' as const,
              maxScore: 4,
              scales: [
                { score: 4, description: '부채비율이 50% 이하' },
                { score: 3, description: '부채비율이 50% 이상~100% 미만' },
                { score: 2, description: '부채비율이 100% 이상~200% 미만' },
                { score: 1, description: '부채비율이 200% 이상~300% 미만' },
                { score: 0, description: '부채비율이 300% 이상' },
              ],
            },
            {
              id: 'currentRatio',
              name: '유동비율',
              weight: 0.126,
              description: '유동자산/유동부채 비율로 측정하는 단기 지급 능력',
              forStage: 'all' as const,
              maxScore: 4,
              scales: [
                { score: 4, description: '유동비율이 300% 이상' },
                { score: 3, description: '유동비율이 200% 이상~300% 미만' },
                { score: 2, description: '유동비율이 150% 이상~200% 미만' },
                { score: 1, description: '유동비율이 100% 이상~150% 미만' },
                { score: 0, description: '유동비율이 100% 미만' },
              ],
            },
          ],
        },
        {
          name: '자금 조달 능력',
          selectionGroup: 'fundingCapability', // 초기 기업: 투자 유치 실적 vs 영업이익률 택1
          items: [
            {
              id: 'investmentRecord',
              name: '투자 유치 실적 (투자금액 규모)',
              weight: 0.099,
              description: '최근 5년 이내 누적 투자금 규모',
              forStage: 'all' as const,
              selectionOption: 'A', // 초기 기업에서 택1 옵션 A
              optionalForStages: ['growth', 'mature'], // 성장/성숙 기업에서는 선택적
              maxScore: 4,
              scales: [
                { score: 4, description: '최근 5년 이내 누적 투자금이 100억 이상' },
                { score: 3, description: '최근 5년 이내 누적 투자금이 30억~100억 미만' },
                { score: 2, description: '최근 5년 이내 누적 투자금이 10억~30억 미만' },
                { score: 1, description: '최근 5년 이내 누적 투자금이 10억 미만 (Pre-seed~초기 엔젤)' },
                { score: 0, description: '최근 5년 이내 외부 투자 유치 실적이 없음' },
              ],
            },
            {
              id: 'investorReliability',
              name: '투자 유치 실적 (투자기관 신뢰성)',
              weight: 0.099,
              description: '투자 기관의 유형 및 신뢰도',
              forStage: 'all' as const,
              selectionOption: 'A', // 투자금액 규모와 동일한 택1 그룹
              optionalForStages: ['growth', 'mature'], // 성장/성숙 기업에서는 선택적
              maxScore: 4,
              scales: [
                { score: 4, description: '정부·공공기관, 모태펀드, TIPS 등 국가인증 VC로부터 투자 유치' },
                { score: 3, description: '등록된 일반 VC·AC 등 전문 투자기관의 투자 유치' },
                { score: 2, description: '법인·기관 단위 투자(비등록 기관 포함) 유치' },
                { score: 1, description: '개인 투자 또는 출자 확인서 수준의 비공식 투자 유치' },
                { score: 0, description: '외부 투자 유치 실적이 없음' },
              ],
            },
            {
              id: 'operatingProfitMargin',
              name: '영업 이익률',
              weight: 0.182,
              description: '영업이익/매출액 비율',
              forStage: 'all' as const,
              selectionOption: 'B', // 초기 기업에서 택1 옵션 B (성장/성숙에서는 필수)
              maxScore: 5,
              scales: [
                { score: 5, description: '영업이익률이 18% 이상' },
                { score: 4, description: '영업이익률이 13% 이상 ~ 18% 미만' },
                { score: 3, description: '영업이익률이 8% 이상 ~ 13% 미만' },
                { score: 2, description: '영업이익률이 3% 이상 ~ 8% 미만' },
                { score: 1, description: '영업이익률이 0% 이상 ~ 3% 미만' },
                { score: 0, description: '영업이익률이 0% 미만' },
              ],
            },
          ],
        },
      ],
    },
    {
      id: 'operationalContinuity',
      name: '1-2. 운영 지속성',
      weight: 0.333,
      groups: [
        {
          name: '운영 안정성',
          items: [
            {
              id: 'customerRetentionRate',
              name: '고객 유지율',
              weight: 0.583,
              description: '기존 고객의 서비스 재이용률',
              forStage: 'all' as const,
              maxScore: 5,
              scales: [
                { score: 5, description: '최근 연도 기준 고객 유지율 변화지수가 120% 이상' },
                { score: 4, description: '최근 연도 기준 고객 유지율 변화지수가 110% 이상 ~ 120% 미만' },
                { score: 3, description: '최근 연도 기준 고객 유지율 변화지수가 100% 이상 ~ 110% 미만' },
                { score: 2, description: '최근 연도 기준 고객 유지율 변화지수가 90% 이상 ~ 100% 미만' },
                { score: 1, description: '최근 연도 기준 고객 유지율 변화지수가 80% 이상 ~ 90% 미만' },
                { score: 0, description: '최근 연도 기준 고객 유지율 변화지수가 80% 미만' },
              ],
            },
            {
              id: 'revenueGrowthRate',
              name: '매출액 성장률',
              weight: 0.417,
              description: '전년 대비 매출액 증가율',
              forStage: 'all' as const,
              maxScore: 7,
              scales: [
                { score: 7, description: '최근 3년간 연평균 성장률이 100% 이상' },
                { score: 6, description: '최근 3년간 연평균 성장률이 50% 이상~100% 미만' },
                { score: 5, description: '최근 3년간 연평균 성장률이 30% 이상~50% 미만' },
                { score: 4, description: '최근 3년간 연평균 성장률이 15% 이상~30% 미만' },
                { score: 3, description: '최근 3년간 연평균 성장률이 10% 이상~15% 미만' },
                { score: 2, description: '최근 3년간 연평균 성장률이 5% 이상~10% 미만' },
                { score: 1, description: '최근 3년간 연평균 성장률이 0% 이상~5% 미만 수준' },
                { score: 0, description: '최근 3년간 연평균 성장률이 0% 미만' },
              ],
            },
          ],
        },
      ],
    },
    {
      id: 'technicalReliability',
      name: '1-3. 기술 신뢰성',
      weight: 0.438,
      groups: [
        {
          name: '품질 관리 역량',
          items: [
            {
              id: 'qualityMonitoring',
              name: '품질 모니터링 체계',
              weight: 0.228,
              description: '품질 모니터링 및 점검 시스템 운영',
              forStage: 'all' as const,
              maxScore: 3,
              scales: [
                { score: 3, description: '실시간 모니터링 체계를 구축하고 정기 점검 및 개선 시스템 운영' },
                { score: 2, description: '정기 점검과 품질조사 실시' },
                { score: 1, description: '기본적인 품질 점검은 수행하지만, 정기 점검 체계는 미비' },
                { score: 0, description: '체계적인 품질 점검 체계 미비' },
              ],
            },
            {
              id: 'improvementProcess',
              name: '개선 프로세스 운영',
              weight: 0.228,
              description: '피드백 수집 및 개선 체계 운영',
              forStage: 'all' as const,
              maxScore: 2,
              scales: [
                { score: 2, description: '고객센터를 상시 운영하여 피드백을 수집하며, 정기적인 서비스 업데이트 및 개선 체계를 구축하여 운영' },
                { score: 1, description: '피드백을 수집하나 정기적 개선, 이력관리는 체계화되어 있지 않음' },
                { score: 0, description: '정기적인 피드백 수집이나 개선 절차 미비' },
              ],
            },
          ],
        },
        {
          name: '장애 복구 역량',
          items: [
            {
              id: 'disasterResponse',
              name: '장애 대응 체계',
              weight: 0.111,
              description: '장애 발생 시 대응 및 복구 체계',
              forStage: 'all' as const,
              maxScore: 3,
              scales: [
                { score: 3, description: '24시간 대응 체계와 복구 매뉴얼을 갖추고, SLA(서비스 수준 협약) 운영' },
                { score: 2, description: '상시 대응팀을 두고, 장애 발생 시 즉시 복구 체계 가동' },
                { score: 1, description: '담당자를 지정해 장애 대응은 가능하나, 일부 절차 미비' },
                { score: 0, description: '장애 대응 프로세스가 부재하거나 체계적으로 운영되지 않음' },
              ],
            },
            {
              id: 'postIncidentManagement',
              name: '사후 관리 체계',
              weight: 0.111,
              description: '장애 원인 분석 및 재발 방지 체계',
              forStage: 'all' as const,
              maxScore: 2,
              scales: [
                { score: 2, description: '장애 원인을 분석하고, 재발 방지 대책과 점검 보고서를 정기적으로 작성' },
                { score: 1, description: '장애 원인은 기록하나, 개선이나 재발 방지 조치는 부분적으로만 시행' },
                { score: 0, description: '사후 분석이나 개선 조치가 거의 이루어지지 않음' },
              ],
            },
          ],
        },
        {
          name: '정보보호',
          items: [
            {
              id: 'securityCertification',
              name: '정보보호 인증',
              weight: 0.322,
              description: 'ISMS-P, CSAP 등 정보보호 인증 보유',
              forStage: 'all' as const,
              maxScore: 3,
              scales: [
                { score: 3, description: 'ISMS-P, CSAP 또는 ISO/IEC 27001 인증을 보유하고 있으며, 인증이 유효기간 내이고 현재 제공 중인 서비스 범위 전체에 적용됨' },
                { score: 2, description: 'ISMS-P, CSAP 또는 ISO/IEC 27001 인증 취득 절차를 진행 중이거나, 유효기간이 지나 갱신이 필요하거나, 인증이 일부 서비스에만 적용됨' },
                { score: 1, description: '정보보호 인증은 아직 없으나, 내부적으로 정보보호 규정·접근통제·개인정보 관리체계 등 수립·운영' },
                { score: 0, description: '정보보호 인증을 미보유, 내부 보안정책이나 개인정보 보호체계 미비' },
              ],
            },
          ],
        },
      ],
    },
  ],
};

// 2. 공교육 특화 가치 평가 (60점)
export const publicEducationCriteria = {
  category: '공교육 특화 가치 평가',
  totalScore: 60,
  weight: 0.6,
  subcategories: [
    {
      id: 'educationalValue',
      name: '2-1. 교육적 가치',
      weight: 0.489,
      groups: [
      {
        id: 'effectiveness',
        name: '교육 효과성',
        weight: 0.417,
          items: [
            {
              id: 'userEngagement',
              name: '사용자 참여도',
              weight: 0.217,
              description: '최근 3개월간 학습 참여율',
              maxScore: 9,
              scales: [
                { score: 9, description: '최근 3개월간 참여율이 90% 이상~100% 이하' },
                { score: 8, description: '최근 3개월간 참여율이 80% 이상~90% 미만' },
                { score: 7, description: '최근 3개월간 참여율이 70% 이상~80% 미만' },
                { score: 6, description: '최근 3개월간 참여율이 60% 이상~70% 미만' },
                { score: 5, description: '최근 3개월간 참여율이 50% 이상~60% 미만' },
                { score: 4, description: '최근 3개월간 참여율이 40% 이상~50% 미만' },
                { score: 3, description: '최근 3개월간 참여율이 30% 이상~40% 미만' },
                { score: 2, description: '최근 3개월간 참여율이 20% 이상~30% 미만' },
                { score: 1, description: '최근 3개월간 참여율이 10% 이상~20% 미만' },
                { score: 0, description: '최근 3개월간 참여율이 10% 미만, 참여율을 측정하거나 관리할 수 있는 데이터가 현재 없음' },
              ],
            },
            {
              id: 'learningImprovement',
              name: '학습 성과 개선',
              weight: 0.217,
              description: '학습 성취도 수집·분석 및 개선 효과',
              maxScore: 3,
              scales: [
                { score: 3, description: '학습 성취도를 정기적으로 수집·분석하고 있으며, 개선 효과가 명확하게 나타나고 있음' },
                { score: 2, description: '학습 성취도를 정기적으로 모니터링하고 있으나, 아직 뚜렷한 개선 효과는 확인되지 않음' },
                { score: 1, description: '학습 성취도 모니터링 시스템이 있으나, 운영이 원활하지 않아 데이터가 충분히 축적되지 않음' },
                { score: 0, description: '학습 성취도를 측정하거나 관리하는 체계 구축 미비' },
              ],
            },
            {
              id: 'learnerAutonomy',
              name: '학습자 주도성 지원',
              weight: 0.333,
              description: '자기주도학습 기능 및 개인화 학습 지원',
              maxScore: 6,
              isChecklist: true,
              checklistItems: [
                { description: '학습자가 학습 경로, 순서 또는 난이도를 스스로 선택할 수 있도록 기능 또는 사용 환경을 제공함', score: 1 },
                { description: '학습자가 자신의 학습 목표를 설정하고, 학습 진행 상황을 스스로 확인할 수 있도록 지원함', score: 1 },
                { description: '학습자의 선택이나 수행 결과에 따라 학습 흐름이나 제공되는 피드백이 달라지도록 설계됨', score: 1 },
                { description: '학습 과정이나 결과에 대한 피드백 또는 학습 요약 정보를 학습자에게 제공함', score: 1 },
                { description: '학습자가 과제 수행 결과, 포트폴리오 등 학습 결과물을 생성·저장·관리할 수 있도록 지원함', score: 1 },
                { description: '학습자가 학습 과정 중 반복, 중단, 재개 등 학습 진행 방식을 스스로 조절할 수 있도록 구성됨', score: 1 },
              ],
            },
            {
              id: 'teacherEfficiency',
              name: '교사 업무 효율화',
              weight: 0.117,
              description: '교사 업무 경감 및 수업 지원 기능',
              maxScore: 9,
              isChecklist: true,
              checklistItems: [
                { description: '수업 계획서 또는 학습 경로 자동 생성 기능(템플릿 또는 AI 기반)을 보유함', score: 1 },
                { description: '교육 자료를 업로드·분류·검색할 수 있는 통합 관리 기능을 제공함', score: 1 },
                { description: '객관식 또는 단답형 문항을 자동 출제 또는 채점하는 기능을 제공함', score: 1 },
                { description: '학습자별 또는 그룹별 학습 진도율을 실시간으로 확인할 수 있는 기능을 제공함', score: 1 },
                { description: '출결 정보를 자동으로 확인하거나 간편하게 관리할 수 있는 기능을 제공함', score: 1 },
                { description: '성적 데이터를 자동으로 분석하고 결과 리포트를 생성하는 기능을 제공함', score: 1 },
                { description: '학습 현황 공유 또는 메시지 전송 등 학부모와의 소통 기능을 제공함', score: 1 },
                { description: '교사의 긍정적 사용 후기 또는 추천서 등 만족도 증빙 자료를 보유함', score: 1 },
                { description: '교사를 대상으로 한 온라인 또는 오프라인 연수, 설명회, 오리엔테이션 등을 제공함', score: 1 },
              ],
            },
            {
              id: 'systemConvenience',
              name: '시스템 편의성',
              weight: 0.116,
              description: '사용자 편의성 및 시스템 접근성',
              maxScore: 6,
              isChecklist: true,
              checklistItems: [
                { description: '주요 기능을 별도의 교육 없이 사용할 수 있도록 화면이 설계됨', score: 1 },
                { description: '스마트폰·태블릿PC 등 모바일 환경에서도 사용이 가능하도록 설계됨', score: 1 },
                { description: '학교에서 사용하는 학습관리시스템(LMS) 또는 학교 홈페이지 등과 연계하여 사용할 수 있도록 구성됨', score: 1 },
                { description: '다수 사용자(500명 이상)가 동시에 접속하는 환경을 고려하여 시스템이 구성됨', score: 1 },
                { description: '전화·채팅·이메일 등 사용자 문의·답변 채널을 운영함', score: 1 },
                { description: '온라인 도움말, 튜토리얼, FAQ 등 사용자 매뉴얼을 제공함', score: 1 },
              ],
            },
          ],
        },
      {
        id: 'suitability',
        name: '공교육 적합성',
        weight: 0.385,
          items: [
            {
              id: 'curriculumAlignment',
              name: '국가교육과정 연계성',
              weight: 0.184,
              description: '국가 교육과정과의 연계성',
              maxScore: 4,
              isChecklist: true,
              checklistItems: [
                { description: '초·중·고등학교 중 1개 이상 해당 학교급의 국가교육과정 내용을 반영하여 콘텐츠 또는 기능을 구성함', score: 1 },
                { description: '교육부 고시 2022년 개정 교육과정의 성취기준을 기준으로 학습활동·평가를 구성함', score: 1 },
                { description: '국가교육과정 내용체계(핵심아이디어·지식·기능·태도 등) 또는 검정 교과서의 단원·내용 체계를 기반으로 콘텐츠 또는 기능을 구성함', score: 1 },
                { description: '국가교육과정 평가 체계를 반영한 평가 콘텐츠 또는 기능을 제공함', score: 1 },
              ],
            },
            {
              id: 'policyAlignment',
              name: '교육정책 부합도',
              weight: 0.183,
              description: '교육 정책과의 정합성',
              maxScore: 6,
              isChecklist: true,
              checklistItems: [
                { description: 'AI 기반 개인화, 적응형 학습, 학습 분석 등 디지털 기반 맞춤형 학습 기능을 제공함', score: 1 },
                { description: '기초문해력·수리력 보완, 수준별 학습 또는 진도 차이 조정 등을 지원하는 기능 또는 콘텐츠를 제공함', score: 1 },
                { description: '원격수업, 디지털 학습도구 활용 또는 수행평가 운영 등 학교의 디지털 수업·평가 체계 혁신을 지원함', score: 1 },
                { description: '학생의 정서, 안전 또는 복지와 관련된 지원 기능을 제공함', score: 1 },
                { description: '진로·진학 관련 콘텐츠 또는 기능을 제공함', score: 1 },
                { description: 'STEAM, 메이커교육 등 창의융합교육을 주제로 한 콘텐츠 또는 학습 활동을 제공함', score: 1 },
              ],
            },
            {
              id: 'institutionAdoption',
              name: '기관 도입 수',
              weight: 0.148,
              description: '공교육 기관 도입 현황',
              maxScore: 4,
              scales: [
                { score: 4, description: '100개 기관 이상' },
                { score: 3, description: '50-99개 기관' },
                { score: 2, description: '20-49개 기관' },
                { score: 1, description: '10-19개 기관' },
                { score: 0, description: '1-9개 기관' },
              ],
            },
            {
              id: 'userCount',
              name: '사용자 수',
              weight: 0.148,
              description: '누적 사용자 수',
              maxScore: 3,
              scales: [
                { score: 3, description: '50,000명 이상' },
                { score: 2, description: '20,000-49,999명' },
                { score: 1, description: '5,000-19,999명' },
                { score: 0, description: '1,000-4,999명' },
              ],
            },
            {
              id: 'renewalRate',
              name: '재계약율',
              weight: 0.148,
              description: '공교육 기관과의 재계약율',
              maxScore: 9,
              scales: [
                { score: 9, description: '공교육 기관과의 재계약율 90% 이상~100% 이하' },
                { score: 8, description: '공교육 기관과의 재계약율 80% 이상~90% 미만' },
                { score: 7, description: '공교육 기관과의 재계약율 70% 이상~80% 미만' },
                { score: 6, description: '공교육 기관과의 재계약율 60% 이상~70% 미만' },
                { score: 5, description: '공교육 기관과의 재계약율 50% 이상~60% 미만' },
                { score: 4, description: '공교육 기관과의 재계약율 40% 이상~50% 미만' },
                { score: 3, description: '공교육 기관과의 재계약율 30% 이상~40% 미만' },
                { score: 2, description: '공교육 기관과의 재계약율 20% 이상~30% 미만' },
                { score: 1, description: '공교육 기관과의 재계약율 10% 이상~20% 미만' },
                { score: 0, description: '공교육 기관과의 재계약율 10% 미만' },
              ],
            },
            {
              id: 'equityInclusion',
              name: '교육 형평성 및 포용성',
              weight: 0.189,
              description: '다양한 학습자를 위한 접근성 및 포용성',
              maxScore: 6,
              isChecklist: true,
              checklistItems: [
                { description: 'KWCAG 또는 국제 WCAG 기준에 따라 화면낭독기, 자막, 대체텍스트 등 웹 접근성 관련 기능을 제공함', score: 1 },
                { description: '한국어 외 다문화·외국인 학습자를 위한 다국어 UI 또는 콘텐츠를 제공함', score: 1 },
                { description: '난독증 친화 글꼴, 집중 모드, 읽기 도우미 등 학습장애 학습자를 고려한 기능을 제공함', score: 1 },
                { description: '저사양 기기 또는 제한된 인터넷 환경에서도 학습이 가능하도록 기능 또는 서비스 구조를 갖추고 있음', score: 1 },
                { description: '학습자의 수준·특성(예: 장애 유형 등)에 따라 화면, 콘텐츠 또는 학습 방식에 대한 맞춤 설정을 지원함', score: 1 },
                { description: '농산어촌·소규모 학교 등을 포함하여 다양한 교육 환경에서 활용을 전제로 한 서비스 구조를 갖추고 있음', score: 1 },
              ],
            },
          ],
        },
      {
        id: 'innovation',
        name: '교육 혁신성',
        weight: 0.095,
          items: [
            {
              id: 'aiPersonalizedLearning',
              name: 'AI 기반 맞춤형 학습',
              weight: 0.163,
              description: 'AI 및 데이터 기반 개인화 학습 기능',
              maxScore: 6,
              isChecklist: true,
              checklistItems: [
                { description: 'AI를 활용하여 학습자의 학습 패턴, 성취 수준 또는 취약 요소를 분석함', score: 1 },
                { description: '학습자의 수준 또는 특성에 따라 콘텐츠를 자동으로 추천하는 기능을 포함하고 있음', score: 1 },
                { description: '학습자의 반응 또는 학습 결과에 따라 학습 경로가 자동으로 조정되도록 구성됨', score: 1 },
                { description: '학습자별로 맞춤화된 진도 설정 및 관리 기능을 제공함', score: 1 },
                { description: '학습 수준 또는 유형에 따라 차별화된 평가 문제, 과제를 제공함', score: 1 },
                { description: '개인별 학습 성과 또는 학습 현황을 대시보드 형태로 시각화하여 제공함', score: 1 },
              ],
            },
            {
              id: 'innovativeLearningEnv',
              name: '혁신적 학습 환경',
              weight: 0.163,
              description: '첨단 기술 기반 학습 환경 제공',
              maxScore: 3,
              isChecklist: true,
              checklistItems: [
                { description: '포인트, 배지, 리더보드 등 게이미피케이션 요소를 학습에 적용함', score: 1 },
                { description: 'VR·XR·AR 기술을 활용한 학습 콘텐츠 또는 학습 환경을 제공함', score: 1 },
                { description: '3D 가상공간에서 학습이 가능한 메타버스 기반 학습 환경을 운영함', score: 1 },
              ],
            },
            {
              id: 'learningMethodSupport',
              name: '다양한 학습 형태 지원',
              weight: 0.163,
              description: '다양한 교수학습 방법론 지원',
              maxScore: 7,
              isChecklist: true,
              checklistItems: [
                { description: '학습자 간 실시간 그룹활동 또는 토론이 가능한 협력학습 기능을 제공함', score: 1 },
                { description: '프로젝트 수행 및 포트폴리오 제작이 가능하도록 프로젝트 기반 학습(PBL)을 지원함', score: 1 },
                { description: '사전학습과 수업활동이 연계되는 플립러닝 구조를 지원함', score: 1 },
                { description: '온·오프라인 학습을 연계한 블렌디드 러닝 설계를 지원함', score: 1 },
                { description: '5~10분 단위의 짧은 학습 콘텐츠로 구성된 마이크로러닝을 지원함', score: 1 },
                { description: '학습자 간 지식 공유 및 소통이 가능한 학습 커뮤니티를 운영함', score: 1 },
                { description: '학습 결과를 즉시 분석하고 피드백을 제공하는 기능을 지원함', score: 1 },
              ],
            },
          ],
        },
      {
        id: 'expertise',
        name: '교육 전문성',
        weight: 0.103,
          items: [
            {
              id: 'expertPersonnel',
              name: '교육 전문 인력 확보',
              weight: 0.5,
              description: '교육 관련 전문 인력 보유 여부',
              maxScore: 3,
              scales: [
                { score: 3, description: '교육 관련 전문 인력이 확보되어 있음' },
                { score: 2, description: '교육 관련 전문 인력이 내부에 없으나, 상시 외부 교육 전문가 검증 자문 회의 체계를 운영함' },
                { score: 1, description: '교육 관련 전문 인력이 내부에 없으나, 필요 시 외부 교육 전문가에게 검증을 의뢰함' },
                { score: 0, description: '교육 관련 전문 인력이 내부에 없으며, 외부 검증, 자문 체계도 미비함' },
              ],
            },
            {
              id: 'expertRatio',
              name: '교육 전문 인력 비율',
              weight: 0.5,
              description: '전체 인력 중 교육 전문가 비율',
              maxScore: 2,
              scales: [
                { score: 2, description: '전체 인력 중 교육 관련 전문 인력 비율 20% 이상' },
                { score: 1, description: '전체 인력 중 교육 전문가 비율 10~20% 미만' },
                { score: 0, description: '교육 관련 전문 인력 비율 10% 미만' },
              ],
            },
          ],
        },
      ],
    },
    {
      id: 'technicalValue',
      name: '2-2. 기술적 가치',
      weight: 0.25,
      groups: [
        {
          id: 'commonTech',
          name: '공통 기술 역량',
          weight: 0.6,
          items: [
            {
              id: 'rdCapability',
              name: 'R&D 역량',
              weight: 0.151,
              description: '연구개발 투자 및 기술 혁신 역량',
              maxScore: 4,
              scales: [
                { score: 4, description: '최근 3년간 R&D 투자 비율이 평균 10% 이상' },
                { score: 3, description: '최근 3년간 R&D 투자 비율이 평균 7% 이상~10% 미만' },
                { score: 2, description: '최근 3년간 R&D 투자 비율이 평균 5% 이상~7% 미만' },
                { score: 1, description: '최근 3년간 R&D 투자 비율이 평균 3% 이상~5% 미만' },
                { score: 0, description: '최근 3년간 R&D 투자 비율이 평균 3% 미만' },
              ],
            },
            {
              id: 'technicalDifferentiation',
              name: '기술적 차별성',
              weight: 0.173,
              description: '경쟁사 대비 기술적 우위 및 차별화 요소',
              maxScore: 3,
              scales: [
                { score: 3, description: 'AI 기반 독자 기술 또는 SW 저작권·특허/IP 2건 이상, 외부 인증·수상·논문 등 공식적인 기술 검증 실적 보유' },
                { score: 2, description: '자체 개발 기술 또는 AI·데이터 분석 기능 보유, SW 저작권·특허/IP 1건 이상 확보' },
                { score: 1, description: '외부 솔루션을 일부 활용하거나 일반 기술을 적용하고 있으며, 독자 IP는 없으나 기술 개선 활동을 지속하고 있음' },
                { score: 0, description: '독자 기술이나 IP를 보유하지 않으며, 외부 인증이나 기술 검증 실적도 없음' },
              ],
            },
            {
              id: 'dataUtilization',
              name: '학습데이터 활용',
              weight: 0.236,
              description: '학습 데이터 수집/분석/활용 역량 (BM 유형별 해당 항목 평가)',
              maxScore: 5,
              isChecklist: true,
              isBmLinked: true, // BM 유형과 연계됨
              checklistItems: [
                // 플랫폼형 (platform)
                { description: '학습분석(LA) 대시보드를 통해 학습 현황을 실시간으로 모니터링함', score: 1, bmTypes: ['platform'] },
                { description: '학습 행동 데이터를 분석·시각화하여 교사와 관리자에게 인사이트 제공', score: 1, bmTypes: ['platform'] },
                { description: '학습 성취도나 중도탈락 위험을 예측하는 모델 운영', score: 1, bmTypes: ['platform'] },
                { description: '교사가 학습자 지원 시 개입 시점을 파악할 수 있도록 액션 인사이트 제공', score: 1, bmTypes: ['platform'] },
                { description: '교육기관·정부와 데이터 협력을 통해 공교육 빅데이터 생태계 형성에 기여하고 있음', score: 1, bmTypes: ['platform'] },
                // 콘텐츠형 (content)
                { description: '학습자의 수준을 분석하고 진단할 수 있는 기능을 제공함', score: 1, bmTypes: ['content'] },
                { description: '학습 수준별 콘텐츠를 자동으로 매칭하는 개인화 추천 시스템을 운영함', score: 1, bmTypes: ['content'] },
                { description: '학습 이력(진도, 성취도, 참여도 등)을 추적·관리하여 학습 취약점 분석에 활용함', score: 1, bmTypes: ['content'] },
                { description: '학습 결과를 시각화한 리포트를 교사·학부모에게 제공함', score: 1, bmTypes: ['content'] },
                { description: '교육기관·정부와 데이터 연계를 통해 공교육 빅데이터 생태계 형성에 기여하고 있음', score: 1, bmTypes: ['content'] },
                // 디바이스형 (device)
                { description: '학습 데이터(사용 시간, 행동 패턴, 반응 등)를 수집·분석할 수 있는 센서 기능 지원', score: 1, bmTypes: ['device'] },
                { description: '디바이스 내에 탑재된 AI 알고리즘을 통해 학습자 반응을 분석하고, 실시간 피드백 제공', score: 1, bmTypes: ['device'] },
                { description: '장비 사용 데이터가 중앙 서버 또는 교사용 대시보드로 연동됨', score: 1, bmTypes: ['device'] },
                { description: '콘텐츠 또는 학습 플랫폼과 연동되어 성취도 데이터를 통합 관리함', score: 1, bmTypes: ['device'] },
                { description: '교육기관·정부와 데이터 연계를 통해 공교육 빅데이터 생태계 형성에 기여하고 있음', score: 1, bmTypes: ['device'] },
                // 서비스형 (service)
                { description: '학습자별 맞춤형 학습 리포트를 제공', score: 1, bmTypes: ['service'] },
                { description: '현재 학습 수준을 진단하는 평가 도구를 운영', score: 1, bmTypes: ['service'] },
                { description: '학습 계획 수립과 진행을 관리하는 진도 관리 시스템을 운영', score: 1, bmTypes: ['service'] },
                { description: '교사와 학습자에게 개선 방향을 제시하는 교육적 피드백을 제공', score: 1, bmTypes: ['service'] },
                { description: '교육기관·정부와 데이터 연계를 통해 공교육 빅데이터 생태계 형성에 기여하고 있음', score: 1, bmTypes: ['service'] },
                // 네트워크형 (network)
                { description: '학습데이터 저장·전송 과정에서 암호화 및 보안 프로토콜 적용', score: 1, bmTypes: ['network'] },
                { description: '학습데이터를 실시간으로 모니터링하며, 안정적 전송을 위한 네트워크 품질 관리 체계를 운영함', score: 1, bmTypes: ['network'] },
                { description: '학습데이터 처리 속도 향상과 장애 대응을 위한 클라우드·CDN 기반 인프라를 구축함', score: 1, bmTypes: ['network'] },
                { description: '학습데이터 백업 및 복구 체계를 갖추어 데이터 손실을 예방함', score: 1, bmTypes: ['network'] },
                { description: '교육기관·정부와 협력하여 안전하고 신뢰할 수 있는 데이터 유통 체계를 구축하고 있음', score: 1, bmTypes: ['network'] },
              ],
            },
            {
              id: 'learningExperienceDesign',
              name: '학습경험 설계',
              weight: 0.223,
              description: 'UX/UI 설계 및 학습 경험 최적화',
              maxScore: 18,
              isChecklist: true,
              hasSubGroups: true,
              checklistItems: [
                // 사용성 (6개)
                { description: '초·중·고등학교 학습자의 특성을 고려하여, 해당 학교급 수준에 적합한 인터페이스와 정보 제시 구조로 설계됨', score: 1, subGroup: 'usability' },
                { description: '주요 기능은 3클릭 이내로 접근 가능하도록 구성되어 있음', score: 1, subGroup: 'usability' },
                { description: '화면 간 네비게이션과 기능 배치가 일관되게 구성되어 있음', score: 1, subGroup: 'usability' },
                { description: '학습 활동 이후 학습 결과 또는 수행 내용에 대한 명확한 피드백 메시지를 제공함', score: 1, subGroup: 'usability' },
                { description: '학습 진도 또는 성취 수준을 시각적으로 확인할 수 있도록 제공함', score: 1, subGroup: 'usability' },
                { description: '학습자가 학습 목표를 설정하고 자신의 학습 진척도를 확인할 수 있는 기능을 제공함', score: 1, subGroup: 'usability' },
                // 접근성 (6개)
                { description: '키보드만으로 모든 기능을 사용할 수 있도록 설계되어 있음', score: 1, subGroup: 'accessibility' },
                { description: '고대비 모드 또는 색상 대비 조정 기능을 제공하여 시각 장애 학습자를 지원함', score: 1, subGroup: 'accessibility' },
                { description: '자막을 제공하여 청각 장애 학습자를 지원함', score: 1, subGroup: 'accessibility' },
                { description: '이미지에 대체 텍스트를 제공함', score: 1, subGroup: 'accessibility' },
                { description: '화면 확대·축소(최대 200%) 기능을 지원함', score: 1, subGroup: 'accessibility' },
                { description: '스크린리더와 호환되는 구조로 설계되어 있음', score: 1, subGroup: 'accessibility' },
                // 몰입형 설계 (6개)
                { description: '명확한 학습 목표를 제시함', score: 1, subGroup: 'immersive' },
                { description: '학습 중 즉각적인 피드백을 제공함', score: 1, subGroup: 'immersive' },
                { description: '학습자의 수준에 맞게 난이도를 조절할 수 있음', score: 1, subGroup: 'immersive' },
                { description: '학습 중 불필요한 알림, 화면 전환 등 학습 집중을 방해하는 요소를 최소화하도록 구성되어 있음', score: 1, subGroup: 'immersive' },
                { description: '포인트, 배지 등 게이미피케이션 요소를 학습에 적용함', score: 1, subGroup: 'immersive' },
                { description: '학습 진행 상황을 시각화하여 학습 몰입을 지원함', score: 1, subGroup: 'immersive' },
              ],
              subGroupInfo: {
                usability: { name: '사용성', icon: '🎯', color: '#2196F3' },
                accessibility: { name: '접근성', icon: '♿', color: '#4CAF50' },
                immersive: { name: '몰입형 설계', icon: '🎮', color: '#9C27B0' },
              },
            },
            {
              id: 'scalability',
              name: '기술 확장성',
              weight: 0.151,
              description: '시스템 확장성 및 유연성',
              maxScore: 8,
              isChecklist: true,
              hasSubGroups: true,
              checklistItems: [
                // 시스템 연계 능력 (4개)
                { description: 'REST API를 제공하여 외부 시스템과 데이터 연계가 가능함', score: 1, subGroup: 'systemIntegration' },
                { description: '표준 인증 체계(OAuth 2.0 등)를 적용하여 안전한 연동을 지원함', score: 1, subGroup: 'systemIntegration' },
                { description: '표준 데이터 포맷(JSON, XML 등)을 사용하여 상호운용성 확보가 가능함', score: 1, subGroup: 'systemIntegration' },
                { description: '학교 행정시스템(NEIS, LMS, 학교 홈페이지 등)과의 연동을 지원함', score: 1, subGroup: 'systemIntegration' },
                // 데이터 이관 기능 (4개)
                { description: '사용자 및 학습 데이터를 표준 포맷(CSV, Excel 등)으로 내보낼 수 있음', score: 1, subGroup: 'dataMigration' },
                { description: '데이터 백업 및 복원 기능을 제공하여 서비스 변경 시 정보 손실을 방지함', score: 1, subGroup: 'dataMigration' },
                { description: '시스템 변경이나 버전 업그레이드 시 데이터 이관 테스트 및 검증 절차를 수행함', score: 1, subGroup: 'dataMigration' },
                { description: '데이터 내보내기 화면 또는 모듈을 제공하여 사용자가 직접 이관이 가능함', score: 1, subGroup: 'dataMigration' },
              ],
              subGroupInfo: {
                systemIntegration: { name: '시스템 연계 능력', icon: '🔗', color: '#3B82F6' },
                dataMigration: { name: '데이터 이관 기능', icon: '📦', color: '#10B981' },
              },
            },
            {
              id: 'globalExpansion',
              name: '해외시장 확장 가능성',
              weight: 0.066,
              description: '글로벌 시장 진출 가능성',
              maxScore: 5,
              isChecklist: true,
              checklistItems: [
                { description: '최근 3년간 해외 매출 실적 있음', score: 1 },
                { description: '해외 파트너십 또는 협력 네트워크(MOU 등)를 구축함', score: 1 },
                { description: '글로벌 인증(ISO, CE, 현지 교육부 인증 등)을 보유함', score: 1 },
                { description: '다국어 지원 서비스 화면을 제공함', score: 1 },
                { description: '해외 전시회·박람회 참가 경험을 보유함', score: 1 },
              ],
            },
          ],
        },
        {
          id: 'bmCapability',
          name: 'BM 유형별 기본 역량',
          weight: 0.4,
          items: [
            {
              id: 'corePersonnel',
              name: '전문 인력 규모',
              weight: 0.3,
              description: 'BM 유형에 맞는 핵심 인력 보유 현황',
              maxScore: 4,
              scales: [
                { score: 4, description: '경력 10년 이상 인력 비율 30% 이상' },
                { score: 3, description: '경력 5년 이상 10년 미만 인력 비율 40% 이상' },
                { score: 2, description: '경력 3년 이상~5년 미만 인력 비율 40% 이상' },
                { score: 1, description: '경력 1년 이상~3년 미만 인력 비율 50% 이상' },
                { score: 0, description: '경력 1년 미만 인력 비율 50% 이상 및 외주 의존' },
              ],
            },
            {
              id: 'coreSkillset',
              name: '핵심 스킬셋 보유',
              weight: 0.4,
              description: 'BM 유형별 핵심 스킬셋 보유 현황 (선택된 BM에 따라 평가)',
              maxScore: 6,
              isChecklist: true,
              isBmLinked: true,
              checklistItems: [
                // 플랫폼형 (platform) - 5개
                { description: '데이터베이스 설계 및 관리 전문 인력을 보유함', score: 1, bmTypes: ['platform'] },
                { description: '클라우드 인프라(AWS, Azure 등) 관리 인력을 보유함', score: 1, bmTypes: ['platform'] },
                { description: 'UI/UX 디자인 및 사용자 환경 설계 전문 인력을 보유함', score: 1, bmTypes: ['platform'] },
                { description: '보안 관리(정보보호기사, ISMS 등) 전문 인력을 보유함', score: 1, bmTypes: ['platform'] },
                { description: '데이터 분석 및 AI 응용 역량을 보유한 인력을 보유함', score: 1, bmTypes: ['platform'] },
                // 콘텐츠형 (content) - 5개
                { description: '교육과정 분석 및 교수설계(ID) 역량을 가진 인력을 보유함', score: 1, bmTypes: ['content'] },
                { description: '멀티미디어 제작 및 영상 편집 전문 인력을 보유함', score: 1, bmTypes: ['content'] },
                { description: 'UI/UX 디자인 관련 전공 또는 자격을 보유한 인력을 보유함', score: 1, bmTypes: ['content'] },
                { description: '데이터 분석 및 학습효과 검증 인력을 보유함', score: 1, bmTypes: ['content'] },
                { description: '품질관리(QA) 및 검수 체계를 운영함', score: 1, bmTypes: ['content'] },
                // 디바이스형 (device) - 5개
                { description: 'HW 설계 및 회로 개발 인력을 보유함', score: 1, bmTypes: ['device'] },
                { description: 'SW·펌웨어 개발 인력을 보유함', score: 1, bmTypes: ['device'] },
                { description: '제조·공정 관리 인력을 보유함', score: 1, bmTypes: ['device'] },
                { description: '품질관리 및 테스트(QA) 인력을 보유함', score: 1, bmTypes: ['device'] },
                { description: '유지보수 및 AS 체계를 운영함', score: 1, bmTypes: ['device'] },
                // 서비스형 (service) - 5개
                { description: '교육 전문(교원자격 보유·교육학 전공) 인력을 보유함', score: 1, bmTypes: ['service'] },
                { description: '교육 운영 및 현장 관리 전담 인력을 보유함', score: 1, bmTypes: ['service'] },
                { description: '고객관리·소통 담당 인력을 보유함', score: 1, bmTypes: ['service'] },
                { description: '성과 분석 및 교육 평가 담당 인력을 보유함', score: 1, bmTypes: ['service'] },
                { description: '교육 컨설팅 및 환류 지원 인력을 보유함', score: 1, bmTypes: ['service'] },
                // 네트워크형 (network) - 5개
                { description: '네트워크 설계 및 구축 인력을 보유함', score: 1, bmTypes: ['network'] },
                { description: '보안 관리 전문 인력을 보유함', score: 1, bmTypes: ['network'] },
                { description: '시스템 모니터링 인력을 보유함', score: 1, bmTypes: ['network'] },
                { description: '클라우드 인프라 관리 인력을 보유함', score: 1, bmTypes: ['network'] },
                { description: '장애 대응 및 복구 체계를 운영함', score: 1, bmTypes: ['network'] },
              ],
            },
            {
              id: 'technicalOutput',
              name: '기술 성과물',
              weight: 0.3,
              description: 'BM 유형별 기술 성과물 평가 (선택된 BM에 따라 평가)',
              isBmLinked: true,
              hasBmSubItems: true,
              bmSubItems: {
                platform: {
                  name: '플랫폼형',
                  items: [
                    {
                      id: 'platformCoreFunction',
                      name: '핵심 기능(플랫폼형)',
                      type: 'checklist',
                      maxScore: 4,
                      checklistItems: [
                        { description: '학습관리, 분석, 평가, 피드백 기능을 모두 구현함', score: 1 },
                        { description: '교사·학생·학부모가 통합적으로 연계되는 서비스를 제공함', score: 1 },
                        { description: '학습관리·분석·소통 기능을 통합 운영할 수 있도록 설계함', score: 1 },
                        { description: '교사·학생 간 실시간 피드백 및 소통 기능을 제공함', score: 1 },
                      ],
                    },
                    {
                      id: 'platformSystemPerformance',
                      name: '시스템 성능(플랫폼형)',
                      type: 'scale',
                      maxScore: 3,
                      scales: [
                        { score: 3, description: '동시접속자 10,000명 이상 환경에서도 안정적으로 운영함' },
                        { score: 2, description: '동시접속자 5,000명 이상~9999명 환경에서 안정적으로 운영함' },
                        { score: 1, description: '동시접속자 1,000명 이상~4999명의 환경에서 안정적으로 운영함' },
                        { score: 0, description: '동시접속자 1000명 미만의 환경에서 기본적인 서비스 안정성을 유지함' },
                      ],
                    },
                  ],
                },
                content: {
                  name: '콘텐츠형',
                  items: [
                    {
                      id: 'contentProductionRecord',
                      name: '제작 실적(콘텐츠형)',
                      type: 'scale',
                      maxScore: 3,
                      scales: [
                        { score: 3, description: '최근 1년간 신규 콘텐츠 50개 이상 제작' },
                        { score: 2, description: '최근 1년간 신규 콘텐츠 30개 이상~49개 이하 제작' },
                        { score: 1, description: '최근 1년간 신규 콘텐츠 15개 이상~29개 이하 제작' },
                        { score: 0, description: '최근 1년간 신규 콘텐츠 14개 이하 제작' },
                      ],
                    },
                    {
                      id: 'contentQualityLevel',
                      name: '콘텐츠 수준(콘텐츠형)',
                      type: 'checklist',
                      maxScore: 4,
                      checklistItems: [
                        { description: 'XR·VR·AR 등 실감형 기술을 활용함', score: 1 },
                        { description: '게이미피케이션 요소 또는 학습자 수준 기반 개인화 학습 기능을 제공함', score: 1 },
                        { description: '국가교육과정에 기반하여 콘텐츠의 주제·구성·학습 흐름을 설계함', score: 1 },
                        { description: '텍스트 위주가 아닌 영상·이미지·인터랙션 등 멀티미디어 요소 중심으로 콘텐츠를 구성함', score: 1 },
                      ],
                    },
                  ],
                },
                device: {
                  name: '디바이스형',
                  items: [
                    {
                      id: 'deviceProductDevelopment',
                      name: '제품 개발 실적(디바이스형)',
                      type: 'scale',
                      maxScore: 3,
                      scales: [
                        { score: 3, description: '최근 3년간 자체 개발 제품 5종 이상을 보유함' },
                        { score: 2, description: '최근 3년간 자체 개발 제품 3~4종을 보유함' },
                        { score: 1, description: '최근 3년간 자체 개발 제품 1~2종을 보유함' },
                        { score: 0, description: 'OEM/ODM 제품 중심으로 운영함' },
                      ],
                    },
                    {
                      id: 'deviceTechLevel',
                      name: '기술 수준(디바이스형)',
                      type: 'scale',
                      maxScore: 3,
                      scales: [
                        { score: 3, description: '독자 기술을 적용하고, 공인 시험·인증을 통과함' },
                        { score: 2, description: '독자 기술을 적용하고, 시범학교·실증사업 등에서 검증 받음' },
                        { score: 1, description: '부분적으로 독자 기술을 적용함' },
                        { score: 0, description: '상용 기술을 활용함' },
                      ],
                    },
                  ],
                },
                service: {
                  name: '서비스형',
                  items: [
                    {
                      id: 'serviceOperationRecord',
                      name: '서비스 운영 실적(서비스형)',
                      type: 'scale',
                      maxScore: 3,
                      scales: [
                        { score: 3, description: '최근 1년간 교육 서비스 프로젝트를 15건 이상 운영함' },
                        { score: 2, description: '최근 1년간 프로젝트를 10~14건 운영함' },
                        { score: 1, description: '최근 1년간 프로젝트를 5~9건 운영함' },
                        { score: 0, description: '최근 1년간 프로젝트를 4건 이하 운영함' },
                      ],
                    },
                    {
                      id: 'serviceScope',
                      name: '서비스 범위(서비스형)',
                      type: 'scale',
                      maxScore: 3,
                      scales: [
                        { score: 3, description: '기획–실행–평가–환류 전 과정을 수행하고, 교사 연수·학생 지원까지 포함하고 있음' },
                        { score: 2, description: '기획–실행–평가 전 과정을 수행함' },
                        { score: 1, description: '기획–실행 중심으로 운영하고 있으며, 평가 체계는 부분적으로 운영함' },
                        { score: 0, description: '단발성 사업 수행 중심으로 운영함' },
                      ],
                    },
                  ],
                },
                network: {
                  name: '네트워크형',
                  items: [
                    {
                      id: 'networkServiceScale',
                      name: '서비스 규모(네트워크형)',
                      type: 'scale',
                      maxScore: 4,
                      scales: [
                        { score: 4, description: '전국 모든 시·도 단위에서 서비스를 운영함' },
                        { score: 3, description: '3개 이상 광역시·도 단위에서 서비스를 운영함' },
                        { score: 2, description: '1~2개 광역시·도 단위에서 서비스를 운영함' },
                        { score: 1, description: '시·군·구 등 기초 지자체 단위에서 서비스를 운영함' },
                        { score: 0, description: '단일 지역 또는 시범 운영 수준으로 운영함' },
                      ],
                    },
                    {
                      id: 'networkTechLevel',
                      name: '기술 수준(네트워크형)',
                      type: 'scale',
                      maxScore: 4,
                      scales: [
                        { score: 4, description: '클라우드 네이티브 아키텍처 기반으로 전국단위 CDN을 구축하여 운영함' },
                        { score: 3, description: '클라우드 기반 서비스에 CDN 일부를 구축하여 트래픽 분산을 지원함' },
                        { score: 2, description: '클라우드 기반 서비스에 부하 분산·자동 복구 체계를 운영함' },
                        { score: 1, description: '기본 IaaS/SaaS 수준에서 네트워크 서비스를 운영함' },
                        { score: 0, description: '온프레미스 기반이거나 제한적인 수준의 클라우드 환경을 병행하여 운영함' },
                      ],
                    },
                  ],
                },
              },
            },
          ],
        },
      ],
    },
    {
      id: 'socialValue',
      name: '2-3. 사회적 가치',
      weight: 0.2604,
      groups: [
      {
        id: 'socialResponsibility',
        name: '사회적 책임',
        weight: 0.271,
          items: [
            {
              id: 'lowSpecDeviceSupport',
              name: '저사양 기기 지원',
              weight: 0.4,
              description: '저사양 기기에서의 서비스 호환성',
              maxScore: 2,
              scales: [
                { score: 2, description: '5년 이상 된 기기(저사양 PC, 구형 태블릿 등)에서도 정상적으로 작동함' },
                { score: 1, description: '3년 이내 출시된 기기에서 원활하게 작동함' },
                { score: 0, description: '1년 이내 출시된 최신 기기에서만 정상적으로 작동함' },
              ],
            },
            {
              id: 'offlineModeSupport',
              name: '오프라인 모드 지원',
              weight: 0.3,
              description: '인터넷 연결 없이 학습 가능 여부',
              maxScore: 3,
              isChecklist: true,
              checklistItems: [
                { description: '학습 콘텐츠를 기기에 사전 다운로드할 수 있는 기능을 제공함', score: 1 },
                { description: '오프라인 환경에서도 학습이 가능하도록 지원함', score: 1 },
                { description: '온라인 연결 시 학습 데이터가 자동으로 동기화되도록 지원함', score: 1 },
              ],
            },
            {
              id: 'dataSavingFeatures',
              name: '데이터 절감 기능',
              weight: 0.3,
              description: '데이터 사용량 절감 기능 제공',
              maxScore: 3,
              isChecklist: true,
              checklistItems: [
                { description: '저화질 모드를 제공하여 데이터 사용량을 줄일 수 있음', score: 1 },
                { description: '이미지 압축 기능을 통해 데이터 사용량을 절감함', score: 1 },
                { description: '데이터 사용량을 사용자가 확인할 수 있도록 표시함', score: 1 },
              ],
            },
          ],
        },
      {
        id: 'ethicsCompliance',
        name: '윤리 준수',
        weight: 0.396,
          items: [
            {
              id: 'dataAiEthics',
              name: '데이터 및 AI 윤리 책임',
              weight: 1.0,
              description: 'AI 윤리 가이드라인 준수 및 책임있는 AI 활용',
              maxScore: 8,
              isChecklist: true,
              checklistItems: [
                { description: '데이터 최소 수집 원칙을 준수함', score: 1 },
                { description: '수집 목적 범위 내에서만 데이터를 활용하도록 규정을 명시함', score: 1 },
                { description: '학생 데이터의 제3자 제공을 금지하는 규정을 갖추고 있음', score: 1 },
                { description: '데이터 보유 기간에 대한 내부 기준을 갖추고 있음', score: 1 },
                { description: '사용자의 데이터 삭제 요청을 처리하기 위한 절차가 있음', score: 1 },
                { description: '직원 대상 데이터 윤리 교육을 연 1회 이상 실시함', score: 1 },
                { description: '데이터·AI 알고리즘의 공정성을 정기적으로 점검함', score: 1 },
                { description: '데이터 활용 결과를 사용자에게 설명하는 체계를 마련함', score: 1 },
              ],
            },
          ],
        },
        {
          id: 'ecosystemBuilding',
          name: '협력생태계 구축',
          weight: 0.333,
          items: [
            {
              id: 'educationPartnership',
              name: '교육기관 파트너십',
              weight: 1.0,
              description: '학교, 교육청 등과의 협력 관계 구축',
              maxScore: 10,
              isChecklist: true,
              checklistItems: [
                { description: '시·도교육청과 공식 협력 MOU 또는 협약을 체결함', score: 1 },
                { description: '지역 교육지원청과 공동 교육 프로그램을 운영함', score: 1 },
                { description: '초·중·고등학교와 공동 수업 또는 기자재 도입 사업을 수행함', score: 1 },
                { description: '특수학교·대안학교와 협력하여 교육을 지원함', score: 1 },
                { description: '대학(교대·사범대 등)과 연구 프로젝트 또는 부설학교 운영에 협력함', score: 1 },
                { description: 'KERIS 등 교육 관련 공공기관과 협력한 경험을 보유함', score: 1 },
                { description: '1년 이상 교육기관과 공식적인 협력 관계를 지속한 경험을 보유함', score: 1 },
                { description: '교재·교육자료를 교사와 공동으로 개발함', score: 1 },
                { description: '교사 연수 프로그램을 운영함', score: 1 },
                { description: '언론·학회 등을 통해 협력 성과를 공유한 이력이 있음', score: 1 },
              ],
            },
          ],
        },
      ],
    },
  ],
};

// 비즈니스 모델 정보
export const businessModelInfo = {
  platform: {
    name: '플랫폼형',
    definition: 'LMS를 기반으로, 학습 관리·분석, AI진단·리포트, 수업 운영 도구 지원 중심 BM',
    features: [
      '단순 수업 저작도구 지원 등의 단독 플랫폼 또는 학습 콘텐츠, 서비스와 결합하여 다양한 형태로 분화중임',
      '다수의 제품·서비스에서 기본 허브의 역할을 하는 형태로 나타남'
    ],
    icon: '🖥️',
  },
  content: {
    name: '콘텐츠형',
    definition: '교과·비교과 학습 콘텐츠(영상, XR, 게임형 등) 개발, 제공 중심 BM',
    features: [
      '교육과정 분석 및 교수설계, 멀티미디어 제작 기술력을 바탕으로 학습 콘텐츠, 실감형(몰입형) 콘텐츠 개발에 중점을 둠',
      '대부분 플랫폼 또는 디바이스와 연계하여 제공됨'
    ],
    icon: '📚',
  },
  device: {
    name: '디바이스형',
    definition: '코딩로봇 키트, XR·VR기기, 전자칠판 등 교구, 교육 기자재 하드웨어 제공 중심 BM',
    features: [
      '코딩로봇 키트, 전자칠판, 전자교탁, 스마트기기 충전함 등 HW 개발에 중점',
      'SW·콘텐츠·서비스와의 연동을 통해 실습형 수업활동 지원 및 스마트 교육 환경 조성'
    ],
    icon: '📱',
  },
  service: {
    name: '서비스형',
    definition: '출강 수업, 교사 연수, 원격 상담, 맞춤형 컨설팅 등 교육 서비스 제공 중심 BM',
    features: [
      '출강 수업, 실습·경진대회 위탁 운영, 원격 상담, 교사 연수, 컨설팅 제공',
      '공교육 현장에서의 교육 운영과 교사의 전문성 향상 지원'
    ],
    icon: '🎯',
  },
  network: {
    name: '네트워크형',
    definition: '공교육 환경에서의 안정적인 네트워크 인프라 구축 지원 중심 BM',
    features: [
      'CDN, DRM, SSO 등 고유 기술인프라 제공'
    ],
    icon: '🌐',
  },
};

// 기업 단계 정보
export const companyStageInfo = {
  early: {
    name: '초기 기업',
    description: '창업 3년 이내 또는 매출 10억 미만',
  },
  growth: {
    name: '성장 기업',
    description: '창업 3~7년 또는 매출 10억~100억',
  },
  mature: {
    name: '성숙 기업',
    description: '창업 7년 이상 또는 매출 100억 이상',
  },
};

// 등급 기준 (10등급 체계)
export const gradeThresholds = {
  // A 구간: 전반적 요건 충족, 공교육 활용 시 안정성이 높은 기업군
  AAA: { min: 95, max: 100, label: 'AAA', zone: 'A', range: '95~100', description: '매우 높은 수준', zoneDescription: '전반적 요건 충족, 공교육 활용 시 안정성이 높은 기업군' },
  AA: { min: 90, max: 95, label: 'AA', zone: 'A', range: '90~95 미만', description: '높은 수준', zoneDescription: '전반적 요건 충족, 공교육 활용 시 안정성이 높은 기업군' },
  A: { min: 85, max: 90, label: 'A', zone: 'A', range: '85~90 미만', description: '우수한 수준', zoneDescription: '전반적 요건 충족, 공교육 활용 시 안정성이 높은 기업군' },
  // B 구간: 핵심 요건을 대체로 충족하며, 일부 보완 시 공교육 활용이 가능한 기업군
  BBB: { min: 80, max: 85, label: 'BBB', zone: 'B', range: '80~85 미만', description: '비교적 양호', zoneDescription: '핵심 요건을 대체로 충족하며, 일부 보완 시 공교육 활용이 가능한 기업군' },
  BB: { min: 70, max: 80, label: 'BB', zone: 'B', range: '70~80 미만', description: '보통 수준', zoneDescription: '핵심 요건을 대체로 충족하며, 일부 보완 시 공교육 활용이 가능한 기업군' },
  B: { min: 65, max: 70, label: 'B', zone: 'B', range: '65~70 미만', description: '일부 미흡', zoneDescription: '핵심 요건을 대체로 충족하며, 일부 보완 시 공교육 활용이 가능한 기업군' },
  // C 구간: 공교육 활용을 위해 보완이 필요한 기업군
  CCC: { min: 60, max: 65, label: 'CCC', zone: 'C', range: '60~65 미만', description: '일부 개선 필요', zoneDescription: '공교육 활용을 위해 보완이 필요한 기업군' },
  CC: { min: 55, max: 60, label: 'CC', zone: 'C', range: '55~60 미만', description: '주요 항목 개선 필요', zoneDescription: '공교육 활용을 위해 보완이 필요한 기업군' },
  C: { min: 50, max: 55, label: 'C', zone: 'C', range: '50~55 미만', description: '전반적 개선 필요', zoneDescription: '공교육 활용을 위해 보완이 필요한 기업군' },
  // D 구간: 공교육 환경에 적용이 어려운 기업군
  D: { min: 0, max: 50, label: 'D', zone: 'D', range: '< 50', description: '낮은 수준', zoneDescription: '공교육 환경에 적용이 어려운 기업군' },
};

// 등급 구간 정보
export const gradeZones = {
  A: { name: 'A 구간', range: '85~100점', description: '전반적 요건 충족, 공교육 활용 시 안정성이 높은 기업군', color: '#2563eb' },
  B: { name: 'B 구간', range: '65~85점 미만', description: '핵심 요건을 대체로 충족하며, 일부 보완 시 공교육 활용이 가능한 기업군', color: '#059669' },
  C: { name: 'C 구간', range: '50~65점 미만', description: '공교육 활용을 위해 보완이 필요한 기업군', color: '#d97706' },
  D: { name: 'D 구간', range: '50점 미만', description: '공교육 환경에 적용이 어려운 기업군', color: '#dc2626' },
};
