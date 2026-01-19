'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { EvaluationData, BusinessModel, CompanyStage, BusinessModelRatio, PassFailResult, FieldUtilizationMetric } from '../lib/types';
import { 
  createInitialEvaluationData, 
  calculateTotalScore, 
  checkBasicQualification 
} from '../lib/calculateScore';
import { 
  businessModelInfo, 
  companyStageInfo, 
  basicQualificationCriteria,
  scoreLevels,
  companyCapabilityCriteria,
  publicEducationCriteria,
  gradeThresholds,
  gradeZones,
} from '../lib/evaluationData';

type Step = 'info' | 'bmRatio' | 'qualification' | 'company' | 'education' | 'result';

// 체크리스트 선택 상태 타입
type ChecklistSelections = {
  [itemId: string]: boolean[];
};

// 택1 선택 상태 타입
type SelectionChoices = {
  [groupId: string]: 'A' | 'B';
};

export default function EvaluatePage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<Step>('info');
  const [data, setData] = useState<EvaluationData>(createInitialEvaluationData());
  const [qualificationPassed, setQualificationPassed] = useState<boolean | null>(null);
  const [checklistSelections, setChecklistSelections] = useState<ChecklistSelections>({});
  const [collapsedChecklists, setCollapsedChecklists] = useState<{[key: string]: boolean}>({});
  // 초기 기업의 택1 선택 상태 (재무건전성: A=현금흐름, B=이자보상, 자금조달: A=투자유치, B=영업이익률)
  const [selectionChoices, setSelectionChoices] = useState<SelectionChoices>({
    financialHealth: 'A', // 기본값: 현금흐름 안전성
    fundingCapability: 'A', // 기본값: 투자 유치 실적
  });
  // 성장/성숙 기업의 투자 유치 실적 포함 여부
  const [includeInvestmentRecord, setIncludeInvestmentRecord] = useState<boolean>(true);

  // 체크리스트 그룹 접기/펼치기 토글
  const toggleChecklistCollapse = (groupKey: string) => {
    setCollapsedChecklists(prev => ({
      ...prev,
      [groupKey]: !prev[groupKey]
    }));
  };

  // 택1 선택 변경 핸들러
  const handleSelectionChoice = (groupId: string, choice: 'A' | 'B') => {
    setSelectionChoices(prev => ({
      ...prev,
      [groupId]: choice
    }));
    // 데이터에도 반영
    setData(prev => ({
      ...prev,
      companyInfo: {
        ...prev.companyInfo,
        selectionChoices: {
          ...prev.companyInfo.selectionChoices,
          [groupId]: choice
        } as any
      }
    }));
  };
  
  // 투자 유치 실적 포함 여부 변경 핸들러
  const handleIncludeInvestmentRecordChange = (include: boolean) => {
    setIncludeInvestmentRecord(include);
    setData(prev => ({
      ...prev,
      companyInfo: {
        ...prev.companyInfo,
        includeInvestmentRecord: include
      }
    }));
  };

  // 항목이 현재 선택된 택1 옵션에 해당하는지 확인
  const isItemSelectedInGroup = (item: any, groupSelectionGroup: string | undefined) => {
    // 택1 그룹이 아니면 항상 표시
    if (!groupSelectionGroup || !item.selectionOption) return true;
    
    // 초기 기업이 아니면 택1 로직 적용 안 함
    if (data.companyInfo.stage !== 'early') {
      // 성장/성숙 기업에서 현금흐름 안전성은 제외 (forStage가 early일 때)
      if (item.forStage === 'early') return false;
      // 성장/성숙 기업에서 투자 유치 실적은 optional
      if (item.optionalForStages?.includes(data.companyInfo.stage)) {
        return includeInvestmentRecord;
      }
      return true;
    }
    
    // 초기 기업: 선택된 옵션만 표시
    const currentChoice = selectionChoices[groupSelectionGroup];
    return item.selectionOption === currentChoice;
  };

  // 그룹 내 가중치 재배분 계산 (택1에서 제외된 항목의 가중치를 나머지 항목에 배분)
  const getAdjustedWeight = (item: any, groupItems: any[], groupSelectionGroup: string | undefined) => {
    const baseWeight = item.weight;
    
    // 택1 그룹이 아니면 원래 가중치 사용
    if (!groupSelectionGroup) return baseWeight;
    
    // 초기 기업이 아니면 다른 로직 적용
    if (data.companyInfo.stage !== 'early') {
      // 현금흐름 안전성은 이미 제외됨 (forStage='early')
      // 성장/성숙 기업에서 투자 유치 실적을 제외하면 가중치 재배분
      const optionalItems = groupItems.filter(i => i.optionalForStages?.includes(data.companyInfo.stage));
      if (!includeInvestmentRecord && optionalItems.length > 0) {
        const excludedWeight = optionalItems.reduce((sum, i) => sum + i.weight, 0);
        const remainingItems = groupItems.filter(i => 
          !i.optionalForStages?.includes(data.companyInfo.stage) && 
          i.forStage !== 'early'
        );
        const remainingTotalWeight = remainingItems.reduce((sum, i) => sum + i.weight, 0);
        if (remainingTotalWeight > 0 && remainingItems.some(i => i.id === item.id)) {
          return baseWeight + (excludedWeight * (baseWeight / remainingTotalWeight));
        }
      }
      return baseWeight;
    }
    
    // 초기 기업: 택1에서 제외된 항목의 가중치를 선택된 항목들에 배분
    const currentChoice = selectionChoices[groupSelectionGroup];
    const selectedItems = groupItems.filter(i => 
      !i.selectionOption || i.selectionOption === currentChoice
    );
    const excludedItems = groupItems.filter(i => 
      i.selectionOption && i.selectionOption !== currentChoice
    );
    
    if (excludedItems.length === 0) return baseWeight;
    
    const excludedWeight = excludedItems.reduce((sum, i) => sum + i.weight, 0);
    const selectedTotalWeight = selectedItems.reduce((sum, i) => sum + i.weight, 0);
    
    if (selectedTotalWeight > 0 && selectedItems.some(i => i.id === item.id)) {
      // 선택된 항목들에 비례 배분
      return baseWeight + (excludedWeight * (baseWeight / selectedTotalWeight));
    }
    
    return baseWeight;
  };

  // 복수 BM 선택 여부에 따라 스텝 동적 구성
  const needsBmRatio = data.companyInfo.businessModels.length >= 2;

  const steps = useMemo(() => {
    const allSteps: { id: Step; label: string; icon: string }[] = [
      { id: 'info', label: '기업 정보', icon: '📝' },
    ];
    
    // 복수 BM 선택 시에만 BM 비중 스텝 추가
    if (needsBmRatio) {
      allSteps.push({ id: 'bmRatio', label: 'BM 비중', icon: '📊' });
    }
    
    allSteps.push(
      { id: 'qualification', label: '기본 자격', icon: '✅' },
      { id: 'company', label: '기업 역량', icon: '🏢' },
      { id: 'education', label: '공교육 가치', icon: '🎓' },
      { id: 'result', label: '평가 결과', icon: '🏆' }
    );
    
    return allSteps;
  }, [needsBmRatio]);

  const stepIndex = steps.findIndex(s => s.id === currentStep);

  const updateCompanyInfo = (field: string, value: any) => {
    setData(prev => {
      const newData = {
        ...prev,
        companyInfo: { ...prev.companyInfo, [field]: value }
      };
      
      // BM 선택 변경 시 비중 배열 초기화/업데이트
      if (field === 'businessModels') {
        const models = value as BusinessModel[];
        const existingRatios = prev.companyInfo.businessModelRatios;
        const newRatios: BusinessModelRatio[] = models.map(model => {
          const existing = existingRatios.find(r => r.model === model);
          if (existing) return existing;
          // 균등 비중으로 초기화
          const equalRatio = Math.floor(100 / models.length);
          return { model, revenueRatio: equalRatio, employeeRatio: equalRatio };
        });
        // 마지막 모델에 나머지 비중 할당
        if (newRatios.length > 0) {
          const totalRevenue = newRatios.slice(0, -1).reduce((sum, r) => sum + r.revenueRatio, 0);
          const totalEmployee = newRatios.slice(0, -1).reduce((sum, r) => sum + r.employeeRatio, 0);
          newRatios[newRatios.length - 1].revenueRatio = 100 - totalRevenue;
          newRatios[newRatios.length - 1].employeeRatio = 100 - totalEmployee;
        }
        newData.companyInfo.businessModelRatios = newRatios;
      }
      
      return newData;
    });
  };

  const updateBmRatio = (model: BusinessModel, ratioType: 'revenueRatio' | 'employeeRatio', value: number) => {
    setData(prev => {
      const newRatios = prev.companyInfo.businessModelRatios.map(r => 
        r.model === model ? { ...r, [ratioType]: value } : r
      );
      return {
        ...prev,
        companyInfo: { ...prev.companyInfo, businessModelRatios: newRatios }
      };
    });
  };

  const setRatioType = (type: 'revenue' | 'employee') => {
    setData(prev => ({
      ...prev,
      companyInfo: { ...prev.companyInfo, ratioType: type }
    }));
  };

  const updateBasicQualification = (field: string, value: PassFailResult) => {
    setData(prev => ({
      ...prev,
      basicQualification: { ...prev.basicQualification, [field]: value }
    }));
  };

  const updateCompanyCapability = (category: string, subCategory: string, field: string, value: number) => {
    setData(prev => ({
      ...prev,
      companyCapability: {
        ...prev.companyCapability,
        [category]: {
          ...(prev.companyCapability as any)[category],
          [field]: value
        }
      }
    }));
  };

  const updateEducationValue = (
    category: 'educationalValue' | 'technicalValue' | 'socialValue',
    subCategory: string,
    field: string,
    value: number
  ) => {
    setData(prev => ({
      ...prev,
      publicEducationValue: {
        ...prev.publicEducationValue,
        [category]: {
          ...prev.publicEducationValue[category],
          [subCategory]: {
            ...(prev.publicEducationValue[category] as any)[subCategory],
            [field]: value
          }
        }
      }
    }));
  };

  // 체크리스트 항목 토글
  const toggleChecklistItem = (
    itemId: string,
    checklistLength: number,
    index: number,
    category: 'educationalValue' | 'technicalValue' | 'socialValue',
    subCategory: string,
    field: string
  ) => {
    setChecklistSelections(prev => {
      const currentSelections = prev[itemId] || new Array(checklistLength).fill(false);
      const newSelections = [...currentSelections];
      newSelections[index] = !newSelections[index];
      
      // 선택된 개수 계산하여 점수 업데이트 (최대 5점)
      const selectedCount = newSelections.filter(Boolean).length;
      const score = Math.min(selectedCount, 5);
      
      // 점수 업데이트
      updateEducationValue(category, subCategory, field, score);
      
      return { ...prev, [itemId]: newSelections };
    });
  };

  // 체크리스트 선택 개수 가져오기
  const getChecklistSelectedCount = (itemId: string): number => {
    const selections = checklistSelections[itemId];
    if (!selections) return 0;
    return selections.filter(Boolean).length;
  };

  const goToNext = () => {
    // 현재 스텝이 'info'이고 복수 BM이면 'bmRatio'로, 아니면 'qualification'으로
    if (currentStep === 'info') {
      if (data.companyInfo.businessModels.length >= 2) {
        setCurrentStep('bmRatio');
      } else {
        setCurrentStep('qualification');
      }
      window.scrollTo(0, 0);
      return;
    }
    
    if (currentStep === 'qualification') {
      const passed = checkBasicQualification(data);
      setQualificationPassed(passed);
    }
    
    const currentIndex = steps.findIndex(s => s.id === currentStep);
    if (currentIndex < steps.length - 1) {
      setCurrentStep(steps[currentIndex + 1].id);
    }
    window.scrollTo(0, 0);
  };

  const goToPrevious = () => {
    // 첫 번째 스텝에서는 홈으로 이동
    if (currentStep === 'info') {
      router.push('/');
      return;
    }
    
    // 현재 스텝이 'qualification'이고 복수 BM이면 'bmRatio'로, 아니면 'info'로
    if (currentStep === 'qualification') {
      if (data.companyInfo.businessModels.length >= 2) {
        setCurrentStep('bmRatio');
      } else {
        setCurrentStep('info');
      }
      window.scrollTo(0, 0);
      return;
    }
    
    const currentIndex = steps.findIndex(s => s.id === currentStep);
    if (currentIndex > 0) {
      setCurrentStep(steps[currentIndex - 1].id);
    }
    window.scrollTo(0, 0);
  };

  // BM 비중 합계 검증
  const getRatioSum = () => {
    const ratioKey = data.companyInfo.ratioType === 'revenue' ? 'revenueRatio' : 'employeeRatio';
    return data.companyInfo.businessModelRatios.reduce((sum, r) => sum + r[ratioKey], 0);
  };

  const canProceed = () => {
    switch (currentStep) {
      case 'info':
        return data.companyInfo.name.trim() !== '' && 
               data.companyInfo.businessModels.length > 0 && 
               data.companyInfo.stage !== null;
      case 'bmRatio':
        return getRatioSum() === 100;
      case 'qualification':
        return true;
      case 'company':
        return true;
      case 'education':
        return true;
      default:
        return false;
    }
  };

  const result = currentStep === 'result' ? calculateTotalScore(data) : null;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--gray-50)' }}>
      {/* Header */}
      <header className="print-hide" style={{
        background: 'white',
        borderBottom: '1px solid var(--gray-200)',
        padding: '1rem 0',
        position: 'sticky',
        top: 0,
        zIndex: 50,
      }}>
        <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '1.5rem' }}>📊</span>
            <span style={{ fontWeight: 700, fontSize: '1.125rem', color: 'var(--gray-900)' }}>
              에듀테크 기업 가치평가
            </span>
          </Link>
          <Link href="/" className="btn btn-secondary" style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}>
            ← 홈으로
          </Link>
        </div>
      </header>

      {/* Progress */}
      <div className="print-hide" style={{ background: 'white', borderBottom: '1px solid var(--gray-200)', padding: '1.5rem 0' }}>
        <div className="container">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', maxWidth: '800px', margin: '0 auto' }}>
            {steps.map((step, index) => (
              <div
                key={step.id}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '0.5rem',
                  flex: 1,
                  position: 'relative',
                }}
              >
                {index > 0 && (
                  <div style={{
                    position: 'absolute',
                    top: '20px',
                    right: '50%',
                    width: '100%',
                    height: '2px',
                    background: index <= stepIndex ? 'var(--primary-500)' : 'var(--gray-200)',
                    zIndex: 0,
                  }} />
                )}
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  background: index <= stepIndex ? 'var(--primary-500)' : 'var(--gray-200)',
                  color: index <= stepIndex ? 'white' : 'var(--gray-500)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.125rem',
                  fontWeight: 600,
                  zIndex: 1,
                  transition: 'all 0.3s ease',
                }}>
                  {step.icon}
                </div>
                <span style={{
                  fontSize: '0.75rem',
                  fontWeight: index === stepIndex ? 600 : 400,
                  color: index === stepIndex ? 'var(--primary-600)' : 'var(--gray-500)',
                }}>
                  {step.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container" style={{ padding: '2rem 1.5rem', maxWidth: '900px' }}>
        {/* Step 1: Company Info */}
        {currentStep === 'info' && (
          <div className="card" style={{ padding: '2rem' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--gray-900)' }}>
              기업 정보 입력
            </h2>
            <p style={{ color: 'var(--gray-600)', marginBottom: '2rem' }}>
              평가 대상 기업의 기본 정보를 입력해주세요.
            </p>

            {/* Company Name */}
            <div className="form-group">
              <label className="form-label">기업명 *</label>
              <input
                type="text"
                className="form-input"
                placeholder="기업명을 입력하세요"
                value={data.companyInfo.name}
                onChange={(e) => updateCompanyInfo('name', e.target.value)}
              />
            </div>

            {/* Business Model */}
            <div className="form-group">
              <label className="form-label">비즈니스 모델 (복수 선택 가능) *</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                {(Object.entries(businessModelInfo) as [BusinessModel, typeof businessModelInfo.platform][]).map(([key, info]) => (
                  <label
                    key={key}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '0.75rem',
                      padding: '1rem',
                      border: data.companyInfo.businessModels.includes(key)
                        ? '2px solid var(--primary-500)'
                        : '1px solid var(--gray-200)',
                      borderRadius: 'var(--radius)',
                      cursor: 'pointer',
                      background: data.companyInfo.businessModels.includes(key)
                        ? 'var(--primary-50)'
                        : 'white',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={data.companyInfo.businessModels.includes(key)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          updateCompanyInfo('businessModels', [...data.companyInfo.businessModels, key]);
                          if (key === 'device') {
                            updateCompanyInfo('hasDevice', true);
                          }
                        } else {
                          updateCompanyInfo('businessModels', data.companyInfo.businessModels.filter(m => m !== key));
                          if (key === 'device') {
                            updateCompanyInfo('hasDevice', false);
                          }
                        }
                      }}
                      style={{ marginTop: '2px' }}
                    />
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                        <span>{info.icon}</span>
                        <span style={{ fontWeight: 600, color: 'var(--gray-900)' }}>{info.name}</span>
                      </div>
                      <p style={{ fontSize: '0.8125rem', color: 'var(--gray-600)', lineHeight: 1.6, margin: 0 }}>
                        {info.definition}
                      </p>
                      {data.companyInfo.businessModels.includes(key) && (
                        <div style={{ 
                          marginTop: '0.75rem', 
                          padding: '0.75rem', 
                          background: 'rgba(0, 145, 200, 0.05)', 
                          borderRadius: 'var(--radius-sm)',
                          borderLeft: '3px solid var(--primary-400)'
                        }}>
                          <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--primary-600)', marginBottom: '0.5rem' }}>
                            특징
                          </div>
                          <ul style={{ margin: 0, paddingLeft: '1rem', fontSize: '0.75rem', color: 'var(--gray-600)', lineHeight: 1.7 }}>
                            {info.features.map((feature, idx) => (
                              <li key={idx} style={{ marginBottom: idx < info.features.length - 1 ? '0.25rem' : 0 }}>
                                {feature}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Company Stage */}
            <div className="form-group">
              <label className="form-label">기업 단계 *</label>
              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                {(Object.entries(companyStageInfo) as [CompanyStage, typeof companyStageInfo.early][]).map(([key, info]) => (
                  <label
                    key={key}
                    style={{
                      flex: 1,
                      minWidth: '180px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      padding: '1rem',
                      border: data.companyInfo.stage === key
                        ? '2px solid var(--primary-500)'
                        : '1px solid var(--gray-200)',
                      borderRadius: 'var(--radius)',
                      cursor: 'pointer',
                      background: data.companyInfo.stage === key
                        ? 'var(--primary-50)'
                        : 'white',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    <input
                      type="radio"
                      name="stage"
                      checked={data.companyInfo.stage === key}
                      onChange={() => updateCompanyInfo('stage', key)}
                    />
                    <div>
                      <div style={{ fontWeight: 600, color: 'var(--gray-900)' }}>{info.name}</div>
                      <span style={{ fontSize: '0.8125rem', color: 'var(--gray-500)' }}>{info.description}</span>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Step: BM Ratio (복수 선택 시에만) */}
        {currentStep === 'bmRatio' && (
          <div className="card" style={{ padding: '2rem' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--gray-900)' }}>
              비즈니스 모델별 비중 입력
            </h2>
            <p style={{ color: 'var(--gray-600)', marginBottom: '2rem' }}>
              선택하신 비즈니스 모델별 비중을 입력해주세요. 이 비중은 기술적 가치 평가 시 반영됩니다.
            </p>

            {/* 비중 기준 선택 */}
            <div className="form-group">
              <label className="form-label">비중 산정 기준 선택 *</label>
              <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
                <label
                  style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    padding: '1rem',
                    border: data.companyInfo.ratioType === 'revenue'
                      ? '2px solid var(--primary-500)'
                      : '1px solid var(--gray-200)',
                    borderRadius: 'var(--radius)',
                    cursor: 'pointer',
                    background: data.companyInfo.ratioType === 'revenue'
                      ? 'var(--primary-50)'
                      : 'white',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <input
                    type="radio"
                    name="ratioType"
                    checked={data.companyInfo.ratioType === 'revenue'}
                    onChange={() => setRatioType('revenue')}
                  />
                  <div>
                    <div style={{ fontWeight: 600, color: 'var(--gray-900)' }}>💰 매출액 비중</div>
                    <span style={{ fontSize: '0.8125rem', color: 'var(--gray-500)' }}>각 BM별 매출액 비중 기준</span>
                  </div>
                </label>
                <label
                  style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    padding: '1rem',
                    border: data.companyInfo.ratioType === 'employee'
                      ? '2px solid var(--primary-500)'
                      : '1px solid var(--gray-200)',
                    borderRadius: 'var(--radius)',
                    cursor: 'pointer',
                    background: data.companyInfo.ratioType === 'employee'
                      ? 'var(--primary-50)'
                      : 'white',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <input
                    type="radio"
                    name="ratioType"
                    checked={data.companyInfo.ratioType === 'employee'}
                    onChange={() => setRatioType('employee')}
                  />
                  <div>
                    <div style={{ fontWeight: 600, color: 'var(--gray-900)' }}>👥 정규직원 비중</div>
                    <span style={{ fontSize: '0.8125rem', color: 'var(--gray-500)' }}>각 BM별 인력 비중 기준</span>
                  </div>
                </label>
              </div>
            </div>

            {/* BM별 비중 입력 */}
            <div className="form-group">
              <label className="form-label">
                {data.companyInfo.ratioType === 'revenue' ? '매출액' : '정규직원'} 비중 입력 (합계 100%) *
              </label>
              <div style={{ 
                background: 'var(--gray-50)', 
                padding: '1.5rem', 
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--gray-200)',
              }}>
                {data.companyInfo.businessModelRatios.map((ratio, index) => {
                  const bmInfo = businessModelInfo[ratio.model];
                  const ratioValue = data.companyInfo.ratioType === 'revenue' 
                    ? ratio.revenueRatio 
                    : ratio.employeeRatio;
                  const ratioKey = data.companyInfo.ratioType === 'revenue' ? 'revenueRatio' : 'employeeRatio';
                  
                  return (
                    <div 
                      key={ratio.model} 
                      style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '1rem',
                        padding: '1rem',
                        background: 'white',
                        borderRadius: 'var(--radius)',
                        marginBottom: index < data.companyInfo.businessModelRatios.length - 1 ? '0.75rem' : 0,
                      }}
                    >
                      <div style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '0.5rem',
                        minWidth: '150px',
                      }}>
                        <span style={{ fontSize: '1.25rem' }}>{bmInfo.icon}</span>
                        <span style={{ fontWeight: 600, color: 'var(--gray-800)' }}>{bmInfo.name}</span>
                      </div>
                      <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={ratioValue}
                          onChange={(e) => updateBmRatio(ratio.model, ratioKey as 'revenueRatio' | 'employeeRatio', parseInt(e.target.value))}
                          style={{ flex: 1, cursor: 'pointer' }}
                        />
                        <div style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: '0.25rem',
                          minWidth: '80px',
                        }}>
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={ratioValue}
                            onChange={(e) => updateBmRatio(ratio.model, ratioKey as 'revenueRatio' | 'employeeRatio', Math.min(100, Math.max(0, parseInt(e.target.value) || 0)))}
                            style={{
                              width: '60px',
                              padding: '0.5rem',
                              border: '1px solid var(--gray-300)',
                              borderRadius: 'var(--radius-sm)',
                              textAlign: 'center',
                              fontWeight: 600,
                            }}
                          />
                          <span style={{ color: 'var(--gray-500)', fontWeight: 500 }}>%</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
                
                {/* 합계 표시 */}
                <div style={{ 
                  marginTop: '1rem',
                  paddingTop: '1rem',
                  borderTop: '2px solid var(--gray-200)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}>
                  <span style={{ fontWeight: 600, color: 'var(--gray-700)' }}>합계</span>
                  <span style={{ 
                    fontSize: '1.25rem',
                    fontWeight: 700,
                    color: getRatioSum() === 100 ? 'var(--success)' : 'var(--error)',
                  }}>
                    {getRatioSum()}%
                    {getRatioSum() !== 100 && (
                      <span style={{ fontSize: '0.875rem', marginLeft: '0.5rem', fontWeight: 500 }}>
                        ({getRatioSum() < 100 ? `${100 - getRatioSum()}% 부족` : `${getRatioSum() - 100}% 초과`})
                      </span>
                    )}
                  </span>
                </div>
              </div>
              {getRatioSum() !== 100 && (
                <p style={{ 
                  color: 'var(--error)', 
                  fontSize: '0.875rem', 
                  marginTop: '0.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                }}>
                  ⚠️ 비중 합계가 100%가 되어야 합니다.
                </p>
              )}
            </div>

            {/* 안내 메시지 */}
            <div style={{
              background: 'var(--primary-50)',
              border: '1px solid var(--primary-200)',
              borderRadius: 'var(--radius)',
              padding: '1rem',
              marginTop: '1rem',
            }}>
              <p style={{ 
                color: 'var(--primary-700)', 
                fontSize: '0.875rem',
                margin: 0,
                display: 'flex',
                alignItems: 'flex-start',
                gap: '0.5rem',
              }}>
                <span>💡</span>
                <span>
                  입력하신 비중은 <strong>기술적 가치 평가</strong>의 BM 유형별 항목(학습데이터 활용, 핵심 인력 역량, 기술 성과물) 점수 계산 시 가중치로 적용됩니다.
                </span>
              </p>
            </div>
          </div>
        )}

        {/* Step 2: Basic Qualification */}
        {currentStep === 'qualification' && (
          <div className="card" style={{ padding: '2rem' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--gray-900)' }}>
              기본 자격 검증
            </h2>
            <p style={{ color: 'var(--gray-600)', marginBottom: '1rem' }}>
              다음 필수 요건 충족 여부를 확인해주세요. Fail 항목이 있어도 평가는 진행되지만, 최종 결과에 반영됩니다.
            </p>
            <div style={{
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid var(--error)',
              borderRadius: 'var(--radius)',
              padding: '0.75rem 1rem',
              marginBottom: '2rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}>
              <span style={{ fontSize: '1.25rem' }}>⚠️</span>
              <span style={{ fontSize: '0.875rem', color: 'var(--error)', fontWeight: 500 }}>
                한 항목에서라도 Fail일 경우, 다음 단계로 평가는 진행되지만, 최종 결과는 <strong>Fail</strong>로 표시됩니다.
              </span>
            </div>

            {Object.entries(basicQualificationCriteria).map(([categoryKey, category]) => {
              // 디바이스형이 아닌 경우 사용자 안전성 스킵
              const hasDevice = data.companyInfo.businessModels.includes('device');
              if (categoryKey === 'userSafety' && !hasDevice) {
                return null;
              }

              return (
                <div key={categoryKey} style={{ marginBottom: '2rem' }}>
                  <h3 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--gray-800)' }}>
                    {category.name}
                  </h3>
                  {'description' in category && (
                    <p style={{ fontSize: '0.875rem', color: 'var(--warning)', marginBottom: '1rem' }}>
                      ⚠️ {category.description}
                    </p>
                  )}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {category.items.map((item: any) => {
                      const currentValue = (data.basicQualification as any)[item.id] as PassFailResult;
                      
                      return (
                        <div
                          key={item.id}
                          style={{
                            padding: '1rem',
                            background: currentValue === 'pass'
                              ? 'rgba(16, 185, 129, 0.05)'
                              : currentValue === 'fail'
                              ? 'rgba(239, 68, 68, 0.05)'
                              : 'var(--gray-50)',
                            border: currentValue === 'pass'
                              ? '2px solid var(--success)'
                              : currentValue === 'fail'
                              ? '2px solid var(--error)'
                              : '1px solid var(--gray-200)',
                            borderRadius: 'var(--radius)',
                            transition: 'all 0.2s ease',
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                            <div style={{ flex: 1 }}>
                              <div style={{ fontWeight: 600, color: 'var(--gray-900)', marginBottom: '0.25rem' }}>
                                {item.name}
                              </div>
                              <div style={{ fontSize: '0.875rem', color: 'var(--gray-600)' }}>
                                {item.description}
                              </div>
                            </div>
                            {/* 현재 상태 표시 */}
                            {currentValue && (
                              <div style={{
                                padding: '0.25rem 0.75rem',
                                borderRadius: 'var(--radius-full)',
                                fontSize: '0.75rem',
                                fontWeight: 700,
                                background: currentValue === 'pass' ? 'var(--success)' : 'var(--error)',
                                color: 'white',
                              }}>
                                {currentValue === 'pass' ? 'PASS' : 'FAIL'}
                              </div>
                            )}
                          </div>
                          
                          {/* 상세 평가 척도 및 선택 버튼 */}
                          {item.scales && (
                            <div style={{ 
                              padding: '0.75rem',
                              background: 'white',
                              borderRadius: 'var(--radius-sm)',
                              border: '1px solid var(--gray-200)',
                            }}>
                              <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--gray-500)', marginBottom: '0.75rem' }}>
                                📋 평가 척도 (해당하는 항목을 선택하세요)
                              </div>
                              {item.scales.map((scale: any, idx: number) => {
                                const scaleValue = scale.score === 'P' ? 'pass' : 'fail';
                                const isSelected = currentValue === scaleValue;
                                
                                return (
                                  <div
                                    key={idx}
                                    onClick={() => updateBasicQualification(item.id, scaleValue as PassFailResult)}
                                    style={{
                                      display: 'flex',
                                      alignItems: 'flex-start',
                                      gap: '0.75rem',
                                      padding: '0.75rem',
                                      marginBottom: '0.5rem',
                                      borderRadius: 'var(--radius-sm)',
                                      background: isSelected 
                                        ? scale.score === 'P' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)'
                                        : 'var(--gray-50)',
                                      border: isSelected 
                                        ? scale.score === 'P' ? '2px solid var(--success)' : '2px solid var(--error)'
                                        : '1px solid var(--gray-200)',
                                      cursor: 'pointer',
                                      transition: 'all 0.2s ease',
                                    }}
                                  >
                                    <div style={{
                                      width: '20px',
                                      height: '20px',
                                      borderRadius: '50%',
                                      border: isSelected 
                                        ? `2px solid ${scale.score === 'P' ? 'var(--success)' : 'var(--error)'}` 
                                        : '2px solid var(--gray-300)',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      background: isSelected 
                                        ? scale.score === 'P' ? 'var(--success)' : 'var(--error)'
                                        : 'white',
                                      flexShrink: 0,
                                    }}>
                                      {isSelected && (
                                        <div style={{
                                          width: '8px',
                                          height: '8px',
                                          borderRadius: '50%',
                                          background: 'white',
                                        }} />
                                      )}
                                    </div>
                                    <div style={{ flex: 1 }}>
                                      <div style={{ 
                                        display: 'flex', 
                                        alignItems: 'center', 
                                        gap: '0.5rem',
                                        marginBottom: '0.25rem',
                                      }}>
                                        <span style={{
                                          padding: '0.125rem 0.5rem',
                                          borderRadius: '4px',
                                          fontSize: '0.6875rem',
                                          fontWeight: 700,
                                          background: scale.score === 'P' ? 'var(--success)' : 'var(--error)',
                                          color: 'white',
                                        }}>
                                          {scale.score === 'P' ? 'PASS' : 'FAIL'}
                                        </span>
                                      </div>
                                      <span style={{ 
                                        fontSize: '0.8125rem', 
                                        color: 'var(--gray-700)', 
                                        lineHeight: 1.4,
                                        fontWeight: isSelected ? 500 : 400,
                                      }}>
                                        {scale.description}
                                      </span>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
            
            {/* 현재 상태 요약 */}
            {(() => {
              const hasDevice = data.companyInfo.businessModels.includes('device');
              const allItems = [
                { id: 'businessRegistration', name: '사업자 등록' },
                { id: 'privacyPolicy', name: '개인정보 처리방침' },
                { id: 'serviceAvailability', name: '서비스 가용률' },
                { id: 'educationEthics', name: '교육 윤리 준수' },
                { id: 'dataTransparency', name: '데이터 투명성' },
                ...(hasDevice ? [
                  { id: 'emcCompliance', name: '전자파 적합성' },
                  { id: 'hazardousSubstance', name: '유해물질 규제' },
                ] : []),
              ];
              
              const passCount = allItems.filter(item => (data.basicQualification as any)[item.id] === 'pass').length;
              const failCount = allItems.filter(item => (data.basicQualification as any)[item.id] === 'fail').length;
              const pendingCount = allItems.filter(item => (data.basicQualification as any)[item.id] === null).length;
              
              return (
                <div style={{
                  marginTop: '1.5rem',
                  padding: '1rem',
                  background: failCount > 0 ? 'rgba(239, 68, 68, 0.1)' : pendingCount > 0 ? 'var(--gray-100)' : 'rgba(16, 185, 129, 0.1)',
                  border: failCount > 0 ? '1px solid var(--error)' : pendingCount > 0 ? '1px solid var(--gray-300)' : '1px solid var(--success)',
                  borderRadius: 'var(--radius)',
                }}>
                  <div style={{ fontWeight: 600, marginBottom: '0.5rem', color: 'var(--gray-800)' }}>
                    📊 현재 상태
                  </div>
                  <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                    <span style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '0.25rem',
                      color: 'var(--success)',
                      fontWeight: 500,
                    }}>
                      ✅ Pass: {passCount}개
                    </span>
                    <span style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '0.25rem',
                      color: 'var(--error)',
                      fontWeight: 500,
                    }}>
                      ❌ Fail: {failCount}개
                    </span>
                    <span style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '0.25rem',
                      color: 'var(--gray-500)',
                      fontWeight: 500,
                    }}>
                      ⏳ 미선택: {pendingCount}개
                    </span>
                  </div>
                  {failCount > 0 && (
                    <div style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: 'var(--error)', fontWeight: 500 }}>
                      ⚠️ Fail 항목이 있어 최종 결과는 <strong>Fail</strong>이 됩니다.
                    </div>
                  )}
                  {failCount === 0 && pendingCount > 0 && (
                    <div style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: 'var(--gray-600)' }}>
                      모든 항목을 선택해주세요.
                    </div>
                  )}
                  {failCount === 0 && pendingCount === 0 && (
                    <div style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: 'var(--success)', fontWeight: 500 }}>
                      ✅ 모든 기본 자격 요건이 충족되었습니다!
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        )}

        {/* Step 3: Company Capability */}
        {currentStep === 'company' && (
          <div className="card" style={{ padding: '2rem' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--gray-900)' }}>
              1. 기업 역량 평가
            </h2>
            <p style={{ color: 'var(--gray-600)', marginBottom: '0.5rem' }}>
              기업의 재무 안전성, 운영 지속성, 기술 신뢰성을 평가합니다.
            </p>
            <div className="badge badge-success" style={{ marginBottom: '2rem' }}>
              배점: 40점 / 100점
            </div>

            {companyCapabilityCriteria.subcategories.map((subcat) => (
              <div key={subcat.id} style={{ marginBottom: '2.5rem' }}>
                <h3 style={{
                  fontSize: '1.125rem',
                  fontWeight: 700,
                  color: 'var(--gray-800)',
                  marginBottom: '1rem',
                  paddingBottom: '0.5rem',
                  borderBottom: '2px solid var(--primary-500)',
                }}>
                  {subcat.name}
                </h3>

                {subcat.groups.map((group: any) => {
                  const groupSelectionGroup = group.selectionGroup;
                  const hasSelectionGroup = !!groupSelectionGroup && data.companyInfo.stage === 'early';
                  const hasOptionalItems = group.items.some((i: any) => 
                    i.optionalForStages?.includes(data.companyInfo.stage)
                  );
                  
                  return (
                  <div key={group.name} style={{ marginBottom: '1.5rem' }}>
                    <h4 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--gray-700)', marginBottom: '0.5rem' }}>
                      📌 {group.name}
                    </h4>
                    
                    {/* 초기 기업 택1 선택 UI */}
                    {hasSelectionGroup && (
                      <div style={{
                        padding: '0.75rem 1rem',
                        background: 'var(--warning-50)',
                        border: '1px solid var(--warning-200)',
                        borderRadius: 'var(--radius)',
                        marginBottom: '1rem',
                      }}>
                        <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--warning-700)', marginBottom: '0.5rem' }}>
                          ⚡ 초기 기업 평가 지표 선택 (택1)
                        </div>
                        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                          {groupSelectionGroup === 'financialHealth' && (
                            <>
                              <label style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                padding: '0.5rem 1rem',
                                background: selectionChoices.financialHealth === 'A' ? 'var(--primary-100)' : 'white',
                                border: selectionChoices.financialHealth === 'A' ? '2px solid var(--primary-500)' : '1px solid var(--gray-300)',
                                borderRadius: 'var(--radius)',
                                cursor: 'pointer',
                                fontSize: '0.875rem',
                                fontWeight: selectionChoices.financialHealth === 'A' ? 600 : 400,
                              }}>
                                <input
                                  type="radio"
                                  name="financialHealth"
                                  checked={selectionChoices.financialHealth === 'A'}
                                  onChange={() => handleSelectionChoice('financialHealth', 'A')}
                                />
                                현금흐름 안전성
                              </label>
                              <label style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                padding: '0.5rem 1rem',
                                background: selectionChoices.financialHealth === 'B' ? 'var(--primary-100)' : 'white',
                                border: selectionChoices.financialHealth === 'B' ? '2px solid var(--primary-500)' : '1px solid var(--gray-300)',
                                borderRadius: 'var(--radius)',
                                cursor: 'pointer',
                                fontSize: '0.875rem',
                                fontWeight: selectionChoices.financialHealth === 'B' ? 600 : 400,
                              }}>
                                <input
                                  type="radio"
                                  name="financialHealth"
                                  checked={selectionChoices.financialHealth === 'B'}
                                  onChange={() => handleSelectionChoice('financialHealth', 'B')}
                                />
                                이자보상비율
                              </label>
                            </>
                          )}
                          {groupSelectionGroup === 'fundingCapability' && (
                            <>
                              <label style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                padding: '0.5rem 1rem',
                                background: selectionChoices.fundingCapability === 'A' ? 'var(--primary-100)' : 'white',
                                border: selectionChoices.fundingCapability === 'A' ? '2px solid var(--primary-500)' : '1px solid var(--gray-300)',
                                borderRadius: 'var(--radius)',
                                cursor: 'pointer',
                                fontSize: '0.875rem',
                                fontWeight: selectionChoices.fundingCapability === 'A' ? 600 : 400,
                              }}>
                                <input
                                  type="radio"
                                  name="fundingCapability"
                                  checked={selectionChoices.fundingCapability === 'A'}
                                  onChange={() => handleSelectionChoice('fundingCapability', 'A')}
                                />
                                투자 유치 실적
                              </label>
                              <label style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                padding: '0.5rem 1rem',
                                background: selectionChoices.fundingCapability === 'B' ? 'var(--primary-100)' : 'white',
                                border: selectionChoices.fundingCapability === 'B' ? '2px solid var(--primary-500)' : '1px solid var(--gray-300)',
                                borderRadius: 'var(--radius)',
                                cursor: 'pointer',
                                fontSize: '0.875rem',
                                fontWeight: selectionChoices.fundingCapability === 'B' ? 600 : 400,
                              }}>
                                <input
                                  type="radio"
                                  name="fundingCapability"
                                  checked={selectionChoices.fundingCapability === 'B'}
                                  onChange={() => handleSelectionChoice('fundingCapability', 'B')}
                                />
                                영업이익률
                              </label>
                            </>
                          )}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--gray-600)', marginTop: '0.5rem' }}>
                          * 선택하지 않은 지표의 가중치는 나머지 지표에 비례 배분됩니다.
                        </div>
                      </div>
                    )}

                    {/* 성장/성숙 기업 투자 유치 실적 선택 옵션 */}
                    {hasOptionalItems && data.companyInfo.stage !== 'early' && groupSelectionGroup === 'fundingCapability' && (
                      <div style={{
                        padding: '0.75rem 1rem',
                        background: 'var(--info-50)',
                        border: '1px solid var(--info-200)',
                        borderRadius: 'var(--radius)',
                        marginBottom: '1rem',
                      }}>
                        <label style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          cursor: 'pointer',
                        }}>
                          <input
                            type="checkbox"
                            checked={includeInvestmentRecord}
                            onChange={(e) => handleIncludeInvestmentRecordChange(e.target.checked)}
                          />
                          <span style={{ fontSize: '0.875rem', color: 'var(--gray-700)' }}>
                            <strong>투자 유치 실적</strong> 평가 포함 (선택사항)
                          </span>
                        </label>
                        <div style={{ fontSize: '0.75rem', color: 'var(--gray-600)', marginTop: '0.25rem', marginLeft: '1.5rem' }}>
                          * 성장/성숙 단계 기업에서는 투자 유치 실적 평가가 선택 사항입니다. 제외 시 가중치가 영업이익률로 재배분됩니다.
                        </div>
                      </div>
                    )}
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      {group.items.map((item: any) => {
                        // 택1 선택 및 기업 단계에 따른 필터링
                        if (!isItemSelectedInGroup(item, groupSelectionGroup)) {
                          return null;
                        }

                        const categoryMap: Record<string, string> = {
                          'financialStability': 'financialStability',
                          'operationalContinuity': 'operationalContinuity',
                          'technicalReliability': 'technicalReliability',
                        };

                        const category = categoryMap[subcat.id];
                        const rawValue = (data.companyCapability as any)[category]?.[item.id];
                        const currentValue = rawValue !== undefined && rawValue !== -1 ? rawValue : -1;
                        const scales = item.scales || [];
                        
                        // 조정된 가중치 계산
                        const adjustedWeight = getAdjustedWeight(item, group.items, groupSelectionGroup);
                        const weightChanged = Math.abs(adjustedWeight - item.weight) > 0.001;

                        return (
                          <div
                            key={item.id}
                            style={{
                              padding: '1rem',
                              background: 'var(--gray-50)',
                              borderRadius: 'var(--radius)',
                              border: '1px solid var(--gray-200)',
                            }}
                          >
                            <div style={{ marginBottom: '0.75rem' }}>
                              <div style={{ fontWeight: 600, color: 'var(--gray-900)', marginBottom: '0.25rem' }}>
                                {item.name}
                                {item.forStage === 'early' && (
                                  <span className="badge badge-info" style={{ marginLeft: '0.5rem', fontSize: '0.625rem' }}>
                                    초기기업
                                  </span>
                                )}
                                {item.optionalForStages?.includes(data.companyInfo.stage) && (
                                  <span className="badge badge-warning" style={{ marginLeft: '0.5rem', fontSize: '0.625rem' }}>
                                    선택사항
                                  </span>
                                )}
                              </div>
                              <div style={{ fontSize: '0.8125rem', color: 'var(--gray-500)' }}>
                                {item.description}
                              </div>
                            </div>
                            
                            {/* 상세 평가 척도 표시 */}
                            {scales.length > 0 && (
                              <div style={{ 
                                padding: '0.75rem',
                                background: 'white',
                                borderRadius: 'var(--radius-sm)',
                                border: '1px solid var(--gray-200)',
                              }}>
                                <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--gray-500)', marginBottom: '0.5rem' }}>
                                  📋 평가 척도 (해당하는 항목을 선택하세요)
                                </div>
                                {scales.map((scale: any, idx: number) => {
                                  const isSelected = currentValue === scale.score;
                                  const isOptional = item.optionalForStages?.includes(data.companyInfo.stage);
                                  return (
                                    <div
                                      key={idx}
                                      onClick={() => {
                                        if (isOptional && isSelected) {
                                          // 선택사항인 경우 같은 항목 클릭 시 선택 취소
                                          updateCompanyCapability(category, '', item.id, -1);
                                        } else {
                                          updateCompanyCapability(category, '', item.id, scale.score);
                                        }
                                      }}
                                      style={{
                                        display: 'flex',
                                        alignItems: 'flex-start',
                                        gap: '0.75rem',
                                        padding: '0.625rem 0.75rem',
                                        marginBottom: '0.375rem',
                                        borderRadius: 'var(--radius-sm)',
                                        background: isSelected ? 'var(--primary-50)' : 'var(--gray-50)',
                                        border: isSelected ? '2px solid var(--primary-400)' : '1px solid var(--gray-200)',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s ease',
                                      }}
                                    >
                                      <div style={{
                                        width: '18px',
                                        height: '18px',
                                        borderRadius: '50%',
                                        border: isSelected ? '2px solid var(--primary-500)' : '2px solid var(--gray-300)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        background: isSelected ? 'var(--primary-500)' : 'white',
                                        flexShrink: 0,
                                        marginTop: '2px',
                                      }}>
                                        {isSelected && (
                                          <div style={{
                                            width: '6px',
                                            height: '6px',
                                            borderRadius: '50%',
                                            background: 'white',
                                          }} />
                                        )}
                                      </div>
                                      <span style={{ 
                                        fontSize: '0.8125rem', 
                                        color: isSelected ? 'var(--primary-700)' : 'var(--gray-700)', 
                                        lineHeight: 1.5,
                                        fontWeight: isSelected ? 500 : 400,
                                      }}>
                                        {scale.description}
                                      </span>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                            
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
                })}
              </div>
            ))}
          </div>
        )}

        {/* Step 4: Public Education Value */}
        {currentStep === 'education' && (
          <div className="card" style={{ padding: '2rem' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--gray-900)' }}>
              2. 공교육 특화 가치 평가
            </h2>
            <p style={{ color: 'var(--gray-600)', marginBottom: '0.5rem' }}>
              공교육 환경에서의 교육적, 기술적, 사회적 가치를 평가합니다.
            </p>
            <div className="badge badge-warning" style={{ marginBottom: '2rem' }}>
              배점: 60점 / 100점
            </div>

            {publicEducationCriteria.subcategories.map((subcat) => (
              <div key={subcat.id} style={{ marginBottom: '2.5rem' }}>
                <h3 style={{
                  fontSize: '1.125rem',
                  fontWeight: 700,
                  color: 'var(--gray-800)',
                  marginBottom: '1rem',
                  paddingBottom: '0.5rem',
                  borderBottom: '2px solid var(--accent-500)',
                }}>
                  {subcat.name}
                </h3>

                {subcat.groups.map((group) => (
                  <div key={group.id} style={{ marginBottom: '1.5rem' }}>
                    <h4 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--gray-700)', marginBottom: '1rem' }}>
                      📌 {group.name}
                    </h4>
                    
                    {/* 교육현장 활용도 지표 선택 (기관 도입 수 vs 사용자 수) */}
                    {group.id === 'suitability' && (() => {
                      // 선택된 지표 항목 찾기
                      const selectedMetricItem = group.items.find((item: any) => 
                        item.id === data.companyInfo.fieldUtilizationMetric
                      );
                      const metricCategory = 'educationalValue';
                      const metricSubCategoryData = (data.publicEducationValue[metricCategory] as any)[group.id];
                      const metricRawVal = metricSubCategoryData?.[data.companyInfo.fieldUtilizationMetric];
                      const metricCurrentValue = metricRawVal !== undefined && metricRawVal !== -1 ? metricRawVal : -1;
                      const metricScales = selectedMetricItem?.scales || [];

                      return (
                        <div style={{
                          padding: '1rem',
                          marginBottom: '1rem',
                          background: 'var(--accent-50)',
                          borderRadius: 'var(--radius)',
                          border: '2px solid var(--accent-200)',
                        }}>
                          <div style={{ fontWeight: 600, color: 'var(--gray-800)', marginBottom: '0.75rem' }}>
                            📊 교육현장 활용도 평가 지표 선택
                          </div>
                          <div style={{ fontSize: '0.8125rem', color: 'var(--gray-600)', marginBottom: '0.75rem' }}>
                            기관 도입 수 또는 사용자 수 중 하나를 선택하여 평가하세요.
                          </div>
                          <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem' }}>
                            <button
                              type="button"
                              onClick={() => setData(prev => ({
                                ...prev,
                                companyInfo: { ...prev.companyInfo, fieldUtilizationMetric: 'institutionAdoption' }
                              }))}
                              style={{
                                flex: 1,
                                padding: '0.75rem 1rem',
                                borderRadius: 'var(--radius)',
                                border: data.companyInfo.fieldUtilizationMetric === 'institutionAdoption' 
                                  ? '2px solid var(--accent-500)' 
                                  : '1px solid var(--gray-300)',
                                background: data.companyInfo.fieldUtilizationMetric === 'institutionAdoption' 
                                  ? 'var(--accent-100)' 
                                  : 'white',
                                color: data.companyInfo.fieldUtilizationMetric === 'institutionAdoption' 
                                  ? 'var(--accent-700)' 
                                  : 'var(--gray-600)',
                                fontWeight: data.companyInfo.fieldUtilizationMetric === 'institutionAdoption' ? 600 : 400,
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                              }}
                            >
                              🏫 기관 도입 수
                            </button>
                            <button
                              type="button"
                              onClick={() => setData(prev => ({
                                ...prev,
                                companyInfo: { ...prev.companyInfo, fieldUtilizationMetric: 'userCount' }
                              }))}
                              style={{
                                flex: 1,
                                padding: '0.75rem 1rem',
                                borderRadius: 'var(--radius)',
                                border: data.companyInfo.fieldUtilizationMetric === 'userCount' 
                                  ? '2px solid var(--accent-500)' 
                                  : '1px solid var(--gray-300)',
                                background: data.companyInfo.fieldUtilizationMetric === 'userCount' 
                                  ? 'var(--accent-100)' 
                                  : 'white',
                                color: data.companyInfo.fieldUtilizationMetric === 'userCount' 
                                  ? 'var(--accent-700)' 
                                  : 'var(--gray-600)',
                                fontWeight: data.companyInfo.fieldUtilizationMetric === 'userCount' ? 600 : 400,
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                              }}
                            >
                              👥 사용자 수
                            </button>
                          </div>
                          
                          {/* 선택된 지표의 상세 척도 바로 표시 */}
                          {selectedMetricItem && metricScales.length > 0 && (
                            <div style={{
                              padding: '1rem',
                              background: 'white',
                              borderRadius: 'var(--radius)',
                              border: '1px solid var(--accent-200)',
                            }}>
                              <div style={{ fontWeight: 600, color: 'var(--gray-900)', marginBottom: '0.25rem' }}>
                                {selectedMetricItem.name}
                              </div>
                              <div style={{ fontSize: '0.8125rem', color: 'var(--gray-500)', marginBottom: '0.75rem' }}>
                                {selectedMetricItem.description}
                              </div>
                              <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--gray-500)', marginBottom: '0.5rem' }}>
                                📋 평가 척도 (해당하는 항목을 선택하세요)
                              </div>
                              {metricScales.map((scale: any, idx: number) => {
                                const isSelected = metricCurrentValue === scale.score;
                                return (
                                  <div
                                    key={idx}
                                    onClick={() => updateEducationValue('educationalValue', group.id, data.companyInfo.fieldUtilizationMetric, scale.score)}
                                    style={{
                                      display: 'flex',
                                      alignItems: 'flex-start',
                                      gap: '0.75rem',
                                      padding: '0.625rem 0.75rem',
                                      marginBottom: '0.375rem',
                                      borderRadius: 'var(--radius-sm)',
                                      background: isSelected ? 'var(--accent-50)' : 'var(--gray-50)',
                                      border: isSelected ? '2px solid var(--accent-400)' : '1px solid var(--gray-200)',
                                      cursor: 'pointer',
                                      transition: 'all 0.2s ease',
                                    }}
                                  >
                                    <div style={{
                                      width: '18px',
                                      height: '18px',
                                      borderRadius: '50%',
                                      border: isSelected ? '2px solid var(--accent-500)' : '2px solid var(--gray-300)',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      background: isSelected ? 'var(--accent-500)' : 'white',
                                      flexShrink: 0,
                                      marginTop: '2px',
                                    }}>
                                      {isSelected && (
                                        <div style={{
                                          width: '6px',
                                          height: '6px',
                                          borderRadius: '50%',
                                          background: 'white',
                                        }} />
                                      )}
                                    </div>
                                    <span style={{ 
                                      fontSize: '0.8125rem', 
                                      color: isSelected ? 'var(--accent-700)' : 'var(--gray-700)', 
                                      lineHeight: 1.5,
                                      fontWeight: isSelected ? 500 : 400,
                                    }}>
                                      {scale.description}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })()}
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      {group.items.map((item: any) => {
                        // 기관 도입 수/사용자 수는 위에서 별도로 표시하므로 여기서 제외
                        if (item.id === 'institutionAdoption' || item.id === 'userCount') {
                          return null;
                        }
                        
                        const categoryMap: Record<string, 'educationalValue' | 'technicalValue' | 'socialValue'> = {
                          'educationalValue': 'educationalValue',
                          'technicalValue': 'technicalValue',
                          'socialValue': 'socialValue',
                        };

                        const category = categoryMap[subcat.id];
                        const subCategoryData = (data.publicEducationValue[category] as any)[group.id];
                        const rawVal = subCategoryData?.[item.id];
                        const currentValue = rawVal !== undefined && rawVal !== -1 ? rawVal : -1;
                        const scales = item.scales || [];
                        const isChecklist = item.isChecklist || false;
                        const checklistItems = item.checklistItems || [];

                        return (
                          <div
                            key={item.id}
                            style={{
                              padding: '1rem',
                              background: 'var(--gray-50)',
                              borderRadius: 'var(--radius)',
                              border: '1px solid var(--gray-200)',
                            }}
                          >
                            <div style={{ marginBottom: '0.75rem' }}>
                              <div style={{ fontWeight: 600, color: 'var(--gray-900)', marginBottom: '0.25rem' }}>
                                {item.name}
                              </div>
                              <div style={{ fontSize: '0.8125rem', color: 'var(--gray-500)' }}>
                                {item.description}
                              </div>
                            </div>

                            {/* BM별 하위 항목이 있는 경우 (기술 성과물) */}
                            {item.hasBmSubItems && item.bmSubItems && (() => {
                              const selectedBMs = data.companyInfo.businessModels;
                              const bmNameMap: Record<string, string> = {
                                'platform': '플랫폼형',
                                'content': '콘텐츠형',
                                'device': '디바이스형',
                                'service': '서비스형',
                                'network': '네트워크형',
                              };
                              const bmIconMap: Record<string, string> = {
                                'platform': '🖥️',
                                'content': '📚',
                                'device': '📱',
                                'service': '🎯',
                                'network': '🌐',
                              };
                              const bmColorMap: Record<string, string> = {
                                'platform': '#2196F3',
                                'content': '#4CAF50',
                                'device': '#FF9800',
                                'service': '#9C27B0',
                                'network': '#00BCD4',
                              };

                              if (selectedBMs.length === 0) {
                                return (
                                  <div style={{
                                    padding: '1rem',
                                    background: 'var(--gray-100)',
                                    borderRadius: 'var(--radius-sm)',
                                    textAlign: 'center',
                                    color: 'var(--gray-500)',
                                    fontSize: '0.875rem',
                                  }}>
                                    선택된 BM 유형이 없습니다. 기업 정보에서 BM을 선택해주세요.
                                  </div>
                                );
                              }

                              return (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                  {selectedBMs.map((bm: string) => {
                                    const bmData = item.bmSubItems[bm];
                                    if (!bmData) return null;

                                    return (
                                      <div key={bm} style={{
                                        border: `2px solid ${bmColorMap[bm]}`,
                                        borderRadius: 'var(--radius)',
                                        overflow: 'hidden',
                                      }}>
                                        {/* BM 헤더 */}
                                        <div style={{
                                          display: 'flex',
                                          alignItems: 'center',
                                          gap: '0.5rem',
                                          padding: '0.75rem 1rem',
                                          background: bmColorMap[bm],
                                          color: 'white',
                                          fontWeight: 600,
                                        }}>
                                          <span style={{ fontSize: '1.25rem' }}>{bmIconMap[bm]}</span>
                                          <span>{bmNameMap[bm]}</span>
                                        </div>

                                        {/* BM별 하위 항목들 */}
                                        <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                          {bmData.items.map((subItem: any) => {
                                            const subItemKey = `technicalOutput-${bm}-${subItem.id}`;
                                            const techOutputData = (data.publicEducationValue.technicalValue.bmCapability.technicalOutput as any)[bm];
                                            
                                            // subItem.id에서 BM prefix 제거하고 실제 필드명 추출
                                            const fieldMap: Record<string, string> = {
                                              'platformCoreFunction': 'coreFunction',
                                              'platformSystemPerformance': 'systemPerformance',
                                              'contentProductionRecord': 'productionRecord',
                                              'contentQualityLevel': 'qualityLevel',
                                              'deviceProductDevelopment': 'productDevelopment',
                                              'deviceTechLevel': 'techLevel',
                                              'serviceOperationRecord': 'operationRecord',
                                              'serviceScope': 'serviceScope',
                                              'networkServiceScale': 'serviceScale',
                                              'networkTechLevel': 'techLevel',
                                            };
                                            const fieldName = fieldMap[subItem.id] || subItem.id;
                                            const currentSubValue = techOutputData?.[fieldName] ?? -1;

                                            return (
                                              <div key={subItem.id} style={{
                                                padding: '0.75rem',
                                                background: 'var(--gray-50)',
                                                borderRadius: 'var(--radius-sm)',
                                                border: '1px solid var(--gray-200)',
                                              }}>
                                                <div style={{ fontWeight: 600, fontSize: '0.875rem', marginBottom: '0.5rem', color: 'var(--gray-800)' }}>
                                                  {subItem.name}
                                                </div>

                                                {/* 체크리스트형 */}
                                                {subItem.type === 'checklist' && subItem.checklistItems && (() => {
                                                  const selections = checklistSelections[subItemKey] || [];
                                                  const selectedCount = selections.filter(Boolean).length;

                                                  return (
                                                    <div>
                                                      <div style={{
                                                        display: 'flex',
                                                        justifyContent: 'space-between',
                                                        alignItems: 'center',
                                                        marginBottom: '0.5rem',
                                                        padding: '0.375rem 0.5rem',
                                                        background: selectedCount > 0 ? 'var(--accent-50)' : 'white',
                                                        borderRadius: 'var(--radius-sm)',
                                                        border: selectedCount > 0 ? '1px solid var(--accent-200)' : '1px solid var(--gray-200)',
                                                      }}>
                                                        <span style={{ fontSize: '0.75rem', color: 'var(--gray-600)' }}>
                                                          귀사에 해당되는 항목을 모두 선택하세요
                                                        </span>
                                                        <span style={{
                                                          fontSize: '0.75rem',
                                                          fontWeight: 600,
                                                          color: selectedCount > 0 ? 'var(--accent-600)' : 'var(--gray-500)',
                                                        }}>
                                                          {selectedCount}/{subItem.checklistItems.length}개 선택
                                                        </span>
                                                      </div>
                                                      {subItem.checklistItems.map((checkItem: any, checkIdx: number) => {
                                                        const isChecked = selections[checkIdx] || false;
                                                        return (
                                                          <div
                                                            key={checkIdx}
                                                            onClick={() => {
                                                              const newSelections = [...selections];
                                                              newSelections[checkIdx] = !isChecked;
                                                              setChecklistSelections(prev => ({
                                                                ...prev,
                                                                [subItemKey]: newSelections,
                                                              }));
                                                              const newScore = newSelections.filter(Boolean).length;
                                                              setData(prev => ({
                                                                ...prev,
                                                                publicEducationValue: {
                                                                  ...prev.publicEducationValue,
                                                                  technicalValue: {
                                                                    ...prev.publicEducationValue.technicalValue,
                                                                    bmCapability: {
                                                                      ...prev.publicEducationValue.technicalValue.bmCapability,
                                                                      technicalOutput: {
                                                                        ...(prev.publicEducationValue.technicalValue.bmCapability.technicalOutput as any),
                                                                        [bm]: {
                                                                          ...((prev.publicEducationValue.technicalValue.bmCapability.technicalOutput as any)[bm]),
                                                                          [fieldName]: newScore,
                                                                        },
                                                                      },
                                                                    },
                                                                  },
                                                                },
                                                              }));
                                                            }}
                                                            style={{
                                                              display: 'flex',
                                                              alignItems: 'flex-start',
                                                              gap: '0.5rem',
                                                              padding: '0.5rem',
                                                              marginBottom: '0.25rem',
                                                              borderRadius: 'var(--radius-sm)',
                                                              background: isChecked ? 'var(--accent-50)' : 'white',
                                                              border: isChecked ? '1px solid var(--accent-300)' : '1px solid var(--gray-200)',
                                                              cursor: 'pointer',
                                                            }}
                                                          >
                                                            <div style={{
                                                              width: '16px',
                                                              height: '16px',
                                                              borderRadius: '3px',
                                                              border: isChecked ? '2px solid var(--accent-500)' : '2px solid var(--gray-300)',
                                                              background: isChecked ? 'var(--accent-500)' : 'white',
                                                              display: 'flex',
                                                              alignItems: 'center',
                                                              justifyContent: 'center',
                                                              flexShrink: 0,
                                                              marginTop: '1px',
                                                            }}>
                                                              {isChecked && (
                                                                <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                                                                  <path d="M2.5 6L5 8.5L9.5 3.5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                                                </svg>
                                                              )}
                                                            </div>
                                                            <span style={{
                                                              fontSize: '0.8125rem',
                                                              color: isChecked ? 'var(--accent-700)' : 'var(--gray-700)',
                                                              fontWeight: isChecked ? 500 : 400,
                                                            }}>
                                                              {checkItem.description}
                                                            </span>
                                                          </div>
                                                        );
                                                      })}
                                                    </div>
                                                  );
                                                })()}

                                                {/* 스케일형 */}
                                                {subItem.type === 'scale' && subItem.scales && (
                                                  <div>
                                                    <div style={{ fontSize: '0.75rem', color: 'var(--gray-600)', marginBottom: '0.375rem' }}>
                                                      해당하는 항목을 선택하세요
                                                    </div>
                                                    {subItem.scales.map((scale: any, scaleIdx: number) => {
                                                      const isSelected = currentSubValue === scale.score;
                                                      return (
                                                        <div
                                                          key={scaleIdx}
                                                          onClick={() => {
                                                            setData(prev => ({
                                                              ...prev,
                                                              publicEducationValue: {
                                                                ...prev.publicEducationValue,
                                                                technicalValue: {
                                                                  ...prev.publicEducationValue.technicalValue,
                                                                  bmCapability: {
                                                                    ...prev.publicEducationValue.technicalValue.bmCapability,
                                                                    technicalOutput: {
                                                                      ...(prev.publicEducationValue.technicalValue.bmCapability.technicalOutput as any),
                                                                      [bm]: {
                                                                        ...((prev.publicEducationValue.technicalValue.bmCapability.technicalOutput as any)[bm]),
                                                                        [fieldName]: scale.score,
                                                                      },
                                                                    },
                                                                  },
                                                                },
                                                              },
                                                            }));
                                                          }}
                                                          style={{
                                                            display: 'flex',
                                                            alignItems: 'flex-start',
                                                            gap: '0.5rem',
                                                            padding: '0.5rem',
                                                            marginBottom: '0.25rem',
                                                            borderRadius: 'var(--radius-sm)',
                                                            background: isSelected ? 'var(--accent-50)' : 'white',
                                                            border: isSelected ? '1px solid var(--accent-300)' : '1px solid var(--gray-200)',
                                                            cursor: 'pointer',
                                                          }}
                                                        >
                                                          <div style={{
                                                            width: '16px',
                                                            height: '16px',
                                                            borderRadius: '50%',
                                                            border: isSelected ? '2px solid var(--accent-500)' : '2px solid var(--gray-300)',
                                                            background: isSelected ? 'var(--accent-500)' : 'white',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            flexShrink: 0,
                                                            marginTop: '2px',
                                                          }}>
                                                            {isSelected && (
                                                              <div style={{
                                                                width: '6px',
                                                                height: '6px',
                                                                borderRadius: '50%',
                                                                background: 'white',
                                                              }} />
                                                            )}
                                                          </div>
                                                          <span style={{
                                                            fontSize: '0.8125rem',
                                                            color: isSelected ? 'var(--accent-700)' : 'var(--gray-700)',
                                                            fontWeight: isSelected ? 500 : 400,
                                                          }}>
                                                            {scale.description}
                                                          </span>
                                                        </div>
                                                      );
                                                    })}
                                                  </div>
                                                )}
                                              </div>
                                            );
                                          })}
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              );
                            })()}
                            
                            {/* 체크리스트형 평가 척도 */}
                            {!item.hasBmSubItems && isChecklist && checklistItems.length > 0 && (() => {
                              const itemKey = `${category}-${group.id}-${item.id}`;
                              const selectedCount = getChecklistSelectedCount(itemKey);
                              const selections = checklistSelections[itemKey] || [];
                              
                              // BM 연계 항목인 경우 선택된 BM에 맞는 항목만 필터링
                              const isBmLinked = item.isBmLinked || false;
                              const selectedBMs = data.companyInfo.businessModels; // 이미 영문 값: 'platform', 'content', etc.
                              
                              // BM 이름 매핑 (영문 -> 한글, 표시용)
                              const bmNameMap: Record<string, string> = {
                                'platform': '플랫폼',
                                'content': '콘텐츠',
                                'device': '디바이스',
                                'service': '서비스',
                                'network': '네트워크',
                              };
                              
                              const filteredChecklistItems = isBmLinked
                                ? checklistItems.filter((checkItem: any) => {
                                    if (!checkItem.bmTypes) return true;
                                    // selectedBMs는 이미 영문('platform' 등)이므로 직접 비교
                                    return selectedBMs.some((bm: string) => checkItem.bmTypes.includes(bm));
                                  })
                                : checklistItems;
                              
                              // 필터링된 항목이 없으면 표시하지 않음
                              if (isBmLinked && filteredChecklistItems.length === 0) {
                                return (
                                  <div style={{
                                    padding: '1rem',
                                    background: 'var(--gray-100)',
                                    borderRadius: 'var(--radius-sm)',
                                    textAlign: 'center',
                                    color: 'var(--gray-500)',
                                    fontSize: '0.875rem',
                                  }}>
                                    선택된 BM 유형에 해당하는 평가 항목이 없습니다.
                                  </div>
                                );
                              }
                              
                              // 필터링된 항목들의 원본 인덱스 매핑
                              const filteredItemIndices = checklistItems
                                .map((checkItem: any, idx: number) => ({ checkItem, idx }))
                                .filter(({ checkItem }: any) => {
                                  if (!isBmLinked || !checkItem.bmTypes) return true;
                                  return selectedBMs.some((bm: string) => checkItem.bmTypes.includes(bm));
                                })
                                .map(({ idx }: any) => idx);
                              
                              const filteredSelectedCount = filteredItemIndices.filter((idx: number) => selections[idx]).length;
                              
                              // 선택된 BM 이름 (한글)
                              const selectedBMNames = selectedBMs.map((bm: string) => bmNameMap[bm] || bm).join(', ');
                              
                              // BM 연계 항목인 경우 BM별로 그룹화
                              const bmIconMap: Record<string, string> = {
                                'platform': '🖥️',
                                'content': '📚',
                                'device': '📱',
                                'service': '🎯',
                                'network': '🌐',
                              };
                              
                              // BM별로 항목 그룹화
                              const groupedByBM: Record<string, { items: any[], indices: number[] }> = {};
                              
                              if (isBmLinked) {
                                selectedBMs.forEach((bm: string) => {
                                  groupedByBM[bm] = { items: [], indices: [] };
                                });
                                
                                checklistItems.forEach((checkItem: any, idx: number) => {
                                  if (checkItem.bmTypes) {
                                    checkItem.bmTypes.forEach((bmType: string) => {
                                      if (selectedBMs.includes(bmType as BusinessModel) && groupedByBM[bmType]) {
                                        groupedByBM[bmType].items.push(checkItem);
                                        groupedByBM[bmType].indices.push(idx);
                                      }
                                    });
                                  }
                                });
                              }
                              
                              return (
                                <div style={{ 
                                  padding: '0.75rem',
                                  background: 'white',
                                  borderRadius: 'var(--radius-sm)',
                                  border: '1px solid var(--gray-200)',
                                }}>
                                  {/* 헤더: 선택 개수 표시 */}
                                  <div style={{ 
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    marginBottom: '0.75rem',
                                    padding: '0.5rem 0.75rem',
                                    background: filteredSelectedCount > 0 ? 'var(--accent-50)' : 'var(--gray-50)',
                                    borderRadius: 'var(--radius-sm)',
                                    border: filteredSelectedCount > 0 ? '1px solid var(--accent-200)' : '1px solid var(--gray-200)',
                                  }}>
                                    <span style={{ 
                                      fontSize: '0.8125rem', 
                                      fontWeight: 600, 
                                      color: filteredSelectedCount > 0 ? 'var(--accent-700)' : 'var(--gray-600)',
                                    }}>
                                      📋 귀사에 해당되는 항목을 모두 선택하세요
                                    </span>
                                    <span style={{ 
                                      fontSize: '0.875rem', 
                                      fontWeight: 700, 
                                      color: filteredSelectedCount > 0 ? 'var(--accent-600)' : 'var(--gray-500)',
                                      background: filteredSelectedCount > 0 ? 'var(--accent-100)' : 'var(--gray-200)',
                                      padding: '0.25rem 0.75rem',
                                      borderRadius: 'var(--radius-full)',
                                    }}>
                                      {filteredSelectedCount} / {filteredChecklistItems.length}개 선택
                                    </span>
                                  </div>
                                  
                                  {/* BM별 그룹화된 체크리스트 또는 일반 체크리스트 */}
                                  <div>
                                    {isBmLinked ? (
                                      // BM별로 그룹화하여 표시 (아코디언 스타일)
                                      selectedBMs.map((bm: string) => {
                                        const bmGroup = groupedByBM[bm];
                                        if (!bmGroup || bmGroup.items.length === 0) return null;
                                        
                                        const bmSelectedCount = bmGroup.indices.filter((idx: number) => selections[idx]).length;
                                        const collapseKey = `${itemKey}_${bm}`;
                                        const isCollapsed = collapsedChecklists[collapseKey];
                                        const isComplete = bmSelectedCount === bmGroup.items.length;
                                        
                                        return (
                                          <div key={bm} style={{ marginBottom: '0.5rem' }}>
                                            {/* BM 유형 헤더 - 클릭 가능한 아코디언 */}
                                            <div 
                                              onClick={() => toggleChecklistCollapse(collapseKey)}
                                              style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '0.5rem',
                                                padding: '0.75rem 1rem',
                                                background: isComplete ? 'linear-gradient(135deg, #10B981 0%, #059669 100%)' :
                                                            bm === 'platform' ? 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)' : 
                                                            bm === 'content' ? 'linear-gradient(135deg, #22C55E 0%, #16A34A 100%)' : 
                                                            bm === 'device' ? 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)' : 
                                                            bm === 'service' ? 'linear-gradient(135deg, #A855F7 0%, #9333EA 100%)' : 'linear-gradient(135deg, #06B6D4 0%, #0891B2 100%)',
                                                borderRadius: isCollapsed ? 'var(--radius-md)' : 'var(--radius-md) var(--radius-md) 0 0',
                                                cursor: 'pointer',
                                                transition: 'all 0.2s ease',
                                              }}
                                            >
                                              <span style={{ 
                                                fontSize: '1rem',
                                                transform: isCollapsed ? 'rotate(-90deg)' : 'rotate(0deg)',
                                                transition: 'transform 0.2s ease',
                                                color: 'white',
                                              }}>
                                                ▼
                                              </span>
                                              <span style={{ fontSize: '1.125rem' }}>{bmIconMap[bm]}</span>
                                              <span style={{ 
                                                fontSize: '0.9375rem', 
                                                fontWeight: 700, 
                                                color: 'white',
                                              }}>
                                                {bmNameMap[bm]}형
                                              </span>
                                              <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                {isComplete && (
                                                  <span style={{ fontSize: '0.875rem' }}>✓</span>
                                                )}
                                                <span style={{
                                                  fontSize: '0.8125rem',
                                                  fontWeight: 600,
                                                  color: 'white',
                                                  background: 'rgba(255,255,255,0.25)',
                                                  padding: '0.25rem 0.625rem',
                                                  borderRadius: 'var(--radius-full)',
                                                }}>
                                                  {bmSelectedCount} / {bmGroup.items.length}개
                                                </span>
                                              </div>
                                            </div>
                                            
                                            {/* 해당 BM의 체크리스트 항목들 - 접기/펼치기 */}
                                            {!isCollapsed && (
                                              <div style={{
                                                background: 'var(--gray-50)',
                                                border: '1px solid var(--gray-200)',
                                                borderTop: 'none',
                                                borderRadius: '0 0 var(--radius-md) var(--radius-md)',
                                                padding: '0.5rem',
                                                display: 'grid',
                                                gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                                                gap: '0.375rem',
                                              }}>
                                                {bmGroup.items.map((checkItem: any, groupIdx: number) => {
                                                  const originalIdx = bmGroup.indices[groupIdx];
                                                  const isChecked = selections[originalIdx] || false;
                                                  return (
                                                    <div
                                                      key={originalIdx}
                                                      onClick={(e) => {
                                                        e.stopPropagation();
                                                        toggleChecklistItem(
                                                          itemKey,
                                                          checklistItems.length,
                                                          originalIdx,
                                                          category,
                                                          group.id,
                                                          item.id
                                                        );
                                                      }}
                                                      style={{
                                                        display: 'flex',
                                                        alignItems: 'flex-start',
                                                        gap: '0.5rem',
                                                        padding: '0.5rem 0.625rem',
                                                        borderRadius: 'var(--radius-sm)',
                                                        background: isChecked ? 'var(--accent-100)' : 'white',
                                                        border: isChecked ? '1px solid var(--accent-400)' : '1px solid var(--gray-200)',
                                                        cursor: 'pointer',
                                                        transition: 'all 0.15s ease',
                                                      }}
                                                    >
                                                      <div style={{
                                                        width: '16px',
                                                        height: '16px',
                                                        borderRadius: '3px',
                                                        border: isChecked ? 'none' : '2px solid var(--gray-300)',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        background: isChecked ? 'var(--accent-500)' : 'white',
                                                        flexShrink: 0,
                                                        marginTop: '2px',
                                                      }}>
                                                        {isChecked && (
                                                          <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                                                            <path d="M2.5 6L5 8.5L9.5 3.5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                                          </svg>
                                                        )}
                                                      </div>
                                                      <span style={{ 
                                                        fontSize: '0.75rem', 
                                                        color: isChecked ? 'var(--accent-700)' : 'var(--gray-600)', 
                                                        lineHeight: 1.4,
                                                        fontWeight: isChecked ? 500 : 400,
                                                      }}>
                                                        {checkItem.description}
                                                      </span>
                                                    </div>
                                                  );
                                                })}
                                              </div>
                                            )}
                                          </div>
                                        );
                                      })
                                    ) : item.hasSubGroups && item.subGroupInfo ? (
                                      // 하위 영역이 있는 체크리스트 (아코디언 스타일)
                                      (() => {
                                        const subGroupOrder = Object.keys(item.subGroupInfo);
                                        return subGroupOrder.map((subGroupKey: string) => {
                                          const subGroupItems = checklistItems
                                            .map((checkItem: any, idx: number) => ({ checkItem, idx }))
                                            .filter(({ checkItem }: any) => checkItem.subGroup === subGroupKey);
                                          
                                          if (subGroupItems.length === 0) return null;
                                          
                                          const subGroupInfo = item.subGroupInfo[subGroupKey];
                                          const subGroupSelectedCount = subGroupItems.filter(({ idx }: any) => selections[idx]).length;
                                          const collapseKey = `${itemKey}_subGroup_${subGroupKey}`;
                                          const isCollapsed = collapsedChecklists[collapseKey];
                                          const isComplete = subGroupSelectedCount === subGroupItems.length;
                                          
                                          return (
                                            <div key={subGroupKey} style={{ marginBottom: '0.5rem' }}>
                                              {/* 하위 영역 헤더 - 클릭 가능한 아코디언 */}
                                              <div 
                                                onClick={() => toggleChecklistCollapse(collapseKey)}
                                                style={{
                                                  display: 'flex',
                                                  alignItems: 'center',
                                                  gap: '0.5rem',
                                                  padding: '0.75rem 1rem',
                                                  background: isComplete ? 'linear-gradient(135deg, #10B981 0%, #059669 100%)' : subGroupInfo.color,
                                                  borderRadius: isCollapsed ? 'var(--radius-md)' : 'var(--radius-md) var(--radius-md) 0 0',
                                                  cursor: 'pointer',
                                                  transition: 'all 0.2s ease',
                                                }}
                                              >
                                                <span style={{ 
                                                  fontSize: '1rem',
                                                  transform: isCollapsed ? 'rotate(-90deg)' : 'rotate(0deg)',
                                                  transition: 'transform 0.2s ease',
                                                  color: 'white',
                                                }}>
                                                  ▼
                                                </span>
                                                <span style={{ fontSize: '1.125rem' }}>{subGroupInfo.icon}</span>
                                                <span style={{ 
                                                  fontSize: '0.9375rem', 
                                                  fontWeight: 700, 
                                                  color: 'white',
                                                }}>
                                                  {subGroupInfo.name}
                                                </span>
                                                <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                  {isComplete && (
                                                    <span style={{ fontSize: '0.875rem', color: 'white' }}>✓</span>
                                                  )}
                                                  <span style={{
                                                    fontSize: '0.8125rem',
                                                    fontWeight: 600,
                                                    color: 'white',
                                                    background: 'rgba(255,255,255,0.25)',
                                                    padding: '0.25rem 0.625rem',
                                                    borderRadius: 'var(--radius-full)',
                                                  }}>
                                                    {subGroupSelectedCount} / {subGroupItems.length}개
                                                  </span>
                                                </div>
                                              </div>
                                              
                                              {/* 하위 영역 체크리스트 항목들 - 접기/펼치기 */}
                                              {!isCollapsed && (
                                                <div style={{
                                                  background: 'var(--gray-50)',
                                                  border: '1px solid var(--gray-200)',
                                                  borderTop: 'none',
                                                  borderRadius: '0 0 var(--radius-md) var(--radius-md)',
                                                  padding: '0.5rem',
                                                  display: 'grid',
                                                  gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                                                  gap: '0.375rem',
                                                }}>
                                                  {subGroupItems.map(({ checkItem, idx }: any) => {
                                                    const isChecked = selections[idx] || false;
                                                    return (
                                                      <div
                                                        key={idx}
                                                        onClick={(e) => {
                                                          e.stopPropagation();
                                                          toggleChecklistItem(
                                                            itemKey,
                                                            checklistItems.length,
                                                            idx,
                                                            category,
                                                            group.id,
                                                            item.id
                                                          );
                                                        }}
                                                        style={{
                                                          display: 'flex',
                                                          alignItems: 'flex-start',
                                                          gap: '0.5rem',
                                                          padding: '0.5rem 0.625rem',
                                                          borderRadius: 'var(--radius-sm)',
                                                          background: isChecked ? `${subGroupInfo.color}20` : 'white',
                                                          border: isChecked ? `1px solid ${subGroupInfo.color}` : '1px solid var(--gray-200)',
                                                          cursor: 'pointer',
                                                          transition: 'all 0.15s ease',
                                                        }}
                                                      >
                                                        <div style={{
                                                          width: '16px',
                                                          height: '16px',
                                                          borderRadius: '3px',
                                                          border: isChecked ? 'none' : '2px solid var(--gray-300)',
                                                          display: 'flex',
                                                          alignItems: 'center',
                                                          justifyContent: 'center',
                                                          background: isChecked ? subGroupInfo.color : 'white',
                                                          flexShrink: 0,
                                                          marginTop: '2px',
                                                        }}>
                                                          {isChecked && (
                                                            <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                                                              <path d="M2.5 6L5 8.5L9.5 3.5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                                            </svg>
                                                          )}
                                                        </div>
                                                        <span style={{ 
                                                          fontSize: '0.75rem', 
                                                          color: isChecked ? subGroupInfo.color : 'var(--gray-600)', 
                                                          lineHeight: 1.4,
                                                          fontWeight: isChecked ? 500 : 400,
                                                        }}>
                                                          {checkItem.description}
                                                        </span>
                                                      </div>
                                                    );
                                                  })}
                                                </div>
                                              )}
                                            </div>
                                          );
                                        });
                                      })()
                                    ) : (
                                      // 일반 체크리스트 (BM 연계 아닌 경우, 하위 영역 없음) - 그리드 레이아웃
                                      <div style={{
                                        display: 'grid',
                                        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                                        gap: '0.375rem',
                                      }}>
                                        {filteredChecklistItems.map((checkItem: any, filteredIdx: number) => {
                                          const originalIdx = filteredItemIndices[filteredIdx];
                                          const isChecked = selections[originalIdx] || false;
                                          return (
                                            <div
                                              key={originalIdx}
                                              onClick={() => toggleChecklistItem(
                                                itemKey,
                                                checklistItems.length,
                                                originalIdx,
                                                category,
                                                group.id,
                                                item.id
                                              )}
                                              style={{
                                                display: 'flex',
                                                alignItems: 'flex-start',
                                                gap: '0.5rem',
                                                padding: '0.5rem 0.625rem',
                                                borderRadius: 'var(--radius-sm)',
                                                background: isChecked ? 'var(--accent-100)' : 'white',
                                                border: isChecked ? '1px solid var(--accent-400)' : '1px solid var(--gray-200)',
                                                cursor: 'pointer',
                                                transition: 'all 0.15s ease',
                                              }}
                                            >
                                              <div style={{
                                                width: '16px',
                                                height: '16px',
                                                borderRadius: '3px',
                                                border: isChecked ? 'none' : '2px solid var(--gray-300)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                background: isChecked ? 'var(--accent-500)' : 'white',
                                                flexShrink: 0,
                                                marginTop: '2px',
                                              }}>
                                                {isChecked && (
                                                  <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                                                    <path d="M2.5 6L5 8.5L9.5 3.5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                                  </svg>
                                                )}
                                              </div>
                                              <span style={{ 
                                                fontSize: '0.75rem', 
                                                color: isChecked ? 'var(--accent-700)' : 'var(--gray-600)', 
                                                lineHeight: 1.4,
                                                fontWeight: isChecked ? 500 : 400,
                                              }}>
                                                {checkItem.description}
                                              </span>
                                            </div>
                                          );
                                        })}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              );
                            })()}

                            {/* 일반 점수형 평가 척도 */}
                            {!item.hasBmSubItems && !isChecklist && scales.length > 0 && (
                              <div style={{ 
                                padding: '0.75rem',
                                background: 'white',
                                borderRadius: 'var(--radius-sm)',
                                border: '1px solid var(--gray-200)',
                              }}>
                                <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--gray-500)', marginBottom: '0.5rem' }}>
                                  📋 평가 척도 (해당하는 항목을 선택하세요)
                                </div>
                                {scales.map((scale: any, idx: number) => {
                                  const isSelected = currentValue === scale.score;
                                  return (
                                    <div
                                      key={idx}
                                      onClick={() => updateEducationValue(category, group.id, item.id, scale.score)}
                                      style={{
                                        display: 'flex',
                                        alignItems: 'flex-start',
                                        gap: '0.75rem',
                                        padding: '0.625rem 0.75rem',
                                        marginBottom: '0.375rem',
                                        borderRadius: 'var(--radius-sm)',
                                        background: isSelected ? 'var(--accent-50)' : 'var(--gray-50)',
                                        border: isSelected ? '2px solid var(--accent-400)' : '1px solid var(--gray-200)',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s ease',
                                      }}
                                    >
                                      <div style={{
                                        width: '18px',
                                        height: '18px',
                                        borderRadius: '50%',
                                        border: isSelected ? '2px solid var(--accent-500)' : '2px solid var(--gray-300)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        background: isSelected ? 'var(--accent-500)' : 'white',
                                        flexShrink: 0,
                                        marginTop: '2px',
                                      }}>
                                        {isSelected && (
                                          <div style={{
                                            width: '6px',
                                            height: '6px',
                                            borderRadius: '50%',
                                            background: 'white',
                                          }} />
                                        )}
                                      </div>
                                      <span style={{ 
                                        fontSize: '0.8125rem', 
                                        color: isSelected ? 'var(--accent-700)' : 'var(--gray-700)', 
                                        lineHeight: 1.5,
                                        fontWeight: isSelected ? 500 : 400,
                                      }}>
                                        {scale.description}
                                      </span>
                                    </div>
                                  );
                                })}
                              </div>
                            )}

                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}

        {/* Step 5: Result */}
        {currentStep === 'result' && result && (() => {
          // 종합 제언 생성 함수 - 영역별 구분 및 BM별 상세 분석
          type RecommendationCategory = 'critical' | 'companyCapability' | 'publicEducationCommon' | 'bmSpecific' | 'overall';
          
          interface Recommendation {
            type: 'strength' | 'weakness' | 'suggestion' | 'critical';
            category: RecommendationCategory;
            title: string;
            text: string;
          }
          
          const generateRecommendations = (): Recommendation[] => {
            const recommendations: Recommendation[] = [];
            
            // === 0. 기본 자격 검증 실패 시 최우선 경고 ===
            if (!result.passed) {
              const failedItems = [];
              if (data.basicQualification.businessRegistration === 'fail') failedItems.push('사업자 등록');
              if (data.basicQualification.privacyPolicy === 'fail') failedItems.push('개인정보 처리방침');
              if (data.basicQualification.serviceAvailability === 'fail') failedItems.push('서비스 가용률');
              if (data.basicQualification.educationEthics === 'fail') failedItems.push('교육 윤리 준수');
              if (data.basicQualification.dataTransparency === 'fail') failedItems.push('데이터 투명성');
              if (data.companyInfo.businessModels.includes('device')) {
                if (data.basicQualification.emcCompliance === 'fail') failedItems.push('전자파 적합성');
                if (data.basicQualification.hazardousSubstance === 'fail') failedItems.push('유해물질 규제');
              }
              
              recommendations.push({
                type: 'critical',
                category: 'critical',
                title: '⚠️ 기본 자격 요건 미충족',
                text: `기본 자격 검증에서 ${failedItems.length > 0 ? `'${failedItems.join("', '")}'` : '일부'} 항목이 Fail로 판정되었습니다. 기본 자격 요건은 공교육 시장 진입을 위한 최소 필수 조건으로, 해당 항목들을 먼저 충족해야 합니다. 현재 상태로는 공교육 도입이 어려우며, 미충족 항목을 최우선으로 보완하시기 바랍니다.`
              });
              
              recommendations.push({
                type: 'suggestion',
                category: 'critical',
                title: '기본 자격 보완 후 재평가 권장',
                text: '기본 자격 요건 충족 후 재평가를 진행하시면, 기업 역량 및 공교육 특화 가치에 대한 상세한 분석 결과를 확인하실 수 있습니다.'
              });
              
              return recommendations;
            }
            
            // 점수 퍼센트 계산
            const capabilityPercent = (result.companyCapabilityScore / 40) * 100;
            const financialPercent = (result.details.financialStabilityScore / (40 * 0.233)) * 100;
            const operationalPercent = (result.details.operationalContinuityScore / (40 * 0.333)) * 100;
            const technicalPercent = (result.details.technicalReliabilityScore / (40 * 0.434)) * 100;
            const eduPercent = (result.publicEducationScore / 60) * 100;
            const educationalPercent = (result.details.educationalValueScore / (60 * 0.489)) * 100;
            const techValuePercent = (result.details.technicalValueScore / (60 * 0.244)) * 100;
            const socialPercent = (result.details.socialValueScore / (60 * 0.267)) * 100;
            
            // ========================================
            // === 1. 기업 역량 부분 ===
            // ========================================
            const financial = data.companyCapability.financialStability;
            const operational = data.companyCapability.operationalContinuity;
            const technical = data.companyCapability.technicalReliability;
            
            // 재무 안정성 분석
            const financialStrengths: string[] = [];
            const financialWeaknesses: string[] = [];
            
            if ((financial.cashFlowSafety ?? 0) >= 4) financialStrengths.push('현금흐름 안전성');
            else if ((financial.cashFlowSafety ?? 0) <= 1) financialWeaknesses.push('현금흐름 안전성');
            if ((financial.debtRatio ?? 0) >= 4) financialStrengths.push('부채비율');
            else if ((financial.debtRatio ?? 0) <= 1) financialWeaknesses.push('부채비율 관리');
            if ((financial.currentRatio ?? 0) >= 4) financialStrengths.push('유동비율');
            else if ((financial.currentRatio ?? 0) <= 1) financialWeaknesses.push('유동성 확보');
            if ((financial.investmentRecord ?? 0) >= 3) financialStrengths.push('투자유치 실적');
            else if ((financial.investmentRecord ?? 0) <= 1) financialWeaknesses.push('투자 유치');
            
            if (financialPercent >= 70) {
              recommendations.push({
                type: 'strength',
                category: 'companyCapability',
                title: '재무 안정성 우수',
                text: `재무 구조가 안정적입니다. ${financialStrengths.length > 0 ? `특히 ${financialStrengths.join(', ')} 지표가 우수합니다. ` : ''}이는 공교육 시장 진출 시 지속적인 서비스 제공 능력을 보장합니다.`
              });
            } else if (financialPercent < 40) {
              recommendations.push({
                type: 'weakness',
                category: 'companyCapability',
                title: '재무 안정성 개선 필요',
                text: `재무 지표가 취약한 상태입니다. ${financialWeaknesses.length > 0 ? `${financialWeaknesses.join(', ')} 등의 영역에서 개선이 필요합니다. ` : ''}공교육 사업의 지속성을 위해 재무 건전성 확보가 우선되어야 합니다.`
              });
            } else {
              recommendations.push({
                type: 'suggestion',
                category: 'companyCapability',
                title: '재무 안정성 보통',
                text: `${financialStrengths.length > 0 ? `[강점] ${financialStrengths.join(', ')}.` : ''}${financialStrengths.length > 0 && financialWeaknesses.length > 0 ? '\n' : ''}${financialWeaknesses.length > 0 ? `[개선필요] ${financialWeaknesses.join(', ')}.` : ''}${(financialStrengths.length > 0 || financialWeaknesses.length > 0) ? '\n' : ''}재무 구조가 보통 수준입니다. 현금흐름 안전성 등의 개선이 권장됩니다.`
              });
            }
            
            // 운영 지속성 분석
            if (operationalPercent >= 70) {
              recommendations.push({
                type: 'strength',
                category: 'companyCapability',
                title: '운영 지속성 우수',
                text: `고객 유지율(${(operational.customerRetentionRate ?? 0) * 20}%)과 매출 성장세가 우수하여 시장 경쟁력이 입증되었습니다. 공교육 기관과의 장기적 파트너십 구축에 유리합니다.`
              });
            } else if (operationalPercent < 40) {
              recommendations.push({
                type: 'weakness',
                category: 'companyCapability',
                title: '운영 지속성 개선 필요',
                text: '고객 유지율 또는 매출 성장세가 낮습니다. 기존 고객 만족도 향상과 재계약률 제고를 위한 서비스 품질 개선 및 고객 관리 체계 구축이 시급합니다.'
              });
            } else {
              // 운영 지속성 강점/약점 분석
              const opStrengths: string[] = [];
              const opWeaknesses: string[] = [];
              if ((operational.customerRetentionRate ?? 0) >= 3) opStrengths.push('고객 유지율');
              else if ((operational.customerRetentionRate ?? 0) <= 1) opWeaknesses.push('고객 유지율 향상');
              if ((operational.revenueGrowthRate ?? 0) >= 4) opStrengths.push('매출 성장률');
              else if ((operational.revenueGrowthRate ?? 0) <= 2) opWeaknesses.push('매출 성장률 개선');
              
              recommendations.push({
                type: 'suggestion',
                category: 'companyCapability',
                title: '운영 지속성 보통',
                text: `${opStrengths.length > 0 ? `[강점] ${opStrengths.join(', ')}.` : ''}${opStrengths.length > 0 && opWeaknesses.length > 0 ? '\n' : ''}${opWeaknesses.length > 0 ? `[개선필요] ${opWeaknesses.join(', ')}.` : ''}${(opStrengths.length > 0 || opWeaknesses.length > 0) ? '\n' : ''}고객 유지율과 매출 성장률이 보통 수준입니다. 공교육 시장에서의 안정적인 사업 운영을 위해 고객 관계 관리 강화를 권장합니다.`
              });
            }
            
            // 기술 신뢰성 분석
            const techStrengths: string[] = [];
            const techWeaknesses: string[] = [];
            
            if ((technical.qualityMonitoring ?? 0) >= 2) techStrengths.push('품질 모니터링');
            else if ((technical.qualityMonitoring ?? 0) <= 1) techWeaknesses.push('품질 모니터링 체계 구축');
            if ((technical.securityCertification ?? 0) >= 2) techStrengths.push('정보보호 인증');
            else if ((technical.securityCertification ?? 0) <= 1) techWeaknesses.push('ISMS-P/CSAP 인증 취득');
            if ((technical.disasterResponse ?? 0) >= 2) techStrengths.push('장애 대응 체계');
            else if ((technical.disasterResponse ?? 0) <= 1) techWeaknesses.push('장애 대응 프로세스 정립');
            
            if (technicalPercent >= 70) {
              recommendations.push({
                type: 'strength',
                category: 'companyCapability',
                title: '기술 신뢰성 확보',
                text: `${techStrengths.length > 0 ? `${techStrengths.join(', ')} 등 ` : ''}기술적 신뢰성이 우수합니다. 공교육 현장의 안정적인 서비스 운영에 적합한 기술 역량을 갖추고 있습니다.`
              });
            } else if (technicalPercent < 40) {
              recommendations.push({
                type: 'weakness',
                category: 'companyCapability',
                title: '기술 신뢰성 강화 필요',
                text: `기술 신뢰성이 취약합니다. ${techWeaknesses.length > 0 ? `${techWeaknesses.join(', ')} 등을 우선적으로 검토하시기 바랍니다. ` : ''}공교육 기관은 서비스 안정성을 중요시합니다.`
              });
            } else {
              recommendations.push({
                type: 'suggestion',
                category: 'companyCapability',
                title: '기술 신뢰성 보통',
                text: `${techStrengths.length > 0 ? `[강점] ${techStrengths.join(', ')}.` : ''}${techStrengths.length > 0 && techWeaknesses.length > 0 ? '\n' : ''}${techWeaknesses.length > 0 ? `[개선필요] ${techWeaknesses.join(', ')}.` : ''}${(techStrengths.length > 0 || techWeaknesses.length > 0) ? '\n' : ''}기술 신뢰성이 보통 수준입니다. 품질 모니터링, 정보보호 인증, 장애 대응 체계(는) 양호하나, 지속적인 기술 역량 강화가 필요합니다.`
              });
            }
            
            // ========================================
            // === 2. 공교육 가치 부분 - 공통 영역 ===
            // ========================================
            const educationalValue = data.publicEducationValue.educationalValue;
            const socialValue = data.publicEducationValue.socialValue;
            const technicalValue = data.publicEducationValue.technicalValue;
            
            // 교육 효과성 분석
            const effectivenessStrengths: string[] = [];
            const effectivenessWeaknesses: string[] = [];
            
            if ((educationalValue.effectiveness?.userEngagement ?? 0) >= 7) effectivenessStrengths.push('학습자 참여도');
            else if ((educationalValue.effectiveness?.userEngagement ?? 0) <= 3) effectivenessWeaknesses.push('학습자 참여도 향상');
            if ((educationalValue.effectiveness?.teacherEfficiency ?? 0) >= 6) effectivenessStrengths.push('교사 업무 효율화');
            else if ((educationalValue.effectiveness?.teacherEfficiency ?? 0) <= 2) effectivenessWeaknesses.push('교사 업무 효율화 기능');
            if ((educationalValue.effectiveness?.learnerAutonomy ?? 0) >= 2) effectivenessStrengths.push('자기주도학습 지원');
            else if ((educationalValue.effectiveness?.learnerAutonomy ?? 0) <= 1) effectivenessWeaknesses.push('자기주도학습 지원 기능');
            
            // 공교육 적합성 분석
            const suitabilityStrengths: string[] = [];
            const suitabilityWeaknesses: string[] = [];
            
            if ((educationalValue.suitability?.curriculumAlignment ?? 0) >= 7) suitabilityStrengths.push('교육과정 연계');
            else if ((educationalValue.suitability?.curriculumAlignment ?? 0) <= 3) suitabilityWeaknesses.push('교육과정 연계 강화');
            if ((educationalValue.suitability?.policyAlignment ?? 0) >= 6) suitabilityStrengths.push('교육 정책 부합');
            else if ((educationalValue.suitability?.policyAlignment ?? 0) <= 2) suitabilityWeaknesses.push('교육 정책 부합도 개선');
            if ((educationalValue.suitability?.institutionAdoption ?? 0) >= 3) suitabilityStrengths.push('기관 도입 실적');
            else if ((educationalValue.suitability?.institutionAdoption ?? 0) <= 1) suitabilityWeaknesses.push('기관 도입 확대');
            
            // 교육 혁신성 분석
            const innovationStrengths: string[] = [];
            const innovationWeaknesses: string[] = [];
            
            if ((educationalValue.innovation?.aiPersonalizedLearning ?? 0) >= 4) innovationStrengths.push('AI 맞춤형 학습');
            else if ((educationalValue.innovation?.aiPersonalizedLearning ?? 0) <= 2) innovationWeaknesses.push('AI 기반 개인화 학습');
            if ((educationalValue.innovation?.learningMethodSupport ?? 0) >= 5) innovationStrengths.push('다양한 학습 형태 지원');
            else if ((educationalValue.innovation?.learningMethodSupport ?? 0) <= 2) innovationWeaknesses.push('학습 형태 다양화');
            
            // 공통 영역 종합 분석
            if (educationalPercent >= 70) {
              recommendations.push({
                type: 'strength',
                category: 'publicEducationCommon',
                title: '교육적 가치 우수',
                text: `학습 효과성, 공교육 적합성, 교육 혁신성 측면에서 우수합니다. ${[...effectivenessStrengths, ...suitabilityStrengths, ...innovationStrengths].slice(0, 3).join(', ')} 등이 강점입니다. 교육과정 연계와 현장 활용성이 뛰어나 학교 도입에 적합합니다.`
              });
            } else if (educationalPercent < 40) {
              recommendations.push({
                type: 'weakness',
                category: 'publicEducationCommon',
                title: '교육적 가치 개선 필요',
                text: `교육적 가치 영역이 취약합니다. ${[...effectivenessWeaknesses, ...suitabilityWeaknesses, ...innovationWeaknesses].slice(0, 3).join(', ')} 등의 기능 보완이 시급합니다. 교육부 정책 방향과 학교 현장의 니즈를 반영한 기능 개선이 필요합니다.`
              });
            } else {
              const allWeaknesses = [...effectivenessWeaknesses, ...suitabilityWeaknesses, ...innovationWeaknesses];
              const allStrengths = [...effectivenessStrengths, ...suitabilityStrengths, ...innovationStrengths];
              recommendations.push({
                type: 'suggestion',
                category: 'publicEducationCommon',
                title: '교육적 가치 보통',
                text: `${allStrengths.length > 0 ? `[강점] ${allStrengths.slice(0, 3).join(', ')}.` : ''}${allStrengths.length > 0 && allWeaknesses.length > 0 ? '\n' : ''}${allWeaknesses.length > 0 ? `[개선필요] ${allWeaknesses.slice(0, 3).join(', ')}.` : ''}${(allStrengths.length > 0 || allWeaknesses.length > 0) ? '\n' : ''}교육적 가치가 보통 수준입니다. 학습자 참여도, 기관 도입 실적(는) 양호하나, 자기주도학습 지원 기능 등의 기능 보완을 권장합니다.`
              });
            }
            
            // 기술적 가치 분석 (공통 영역)
            const techValueStrengths: string[] = [];
            const techValueWeaknesses: string[] = [];
            if ((technicalValue.commonTech?.rndCapability ?? 0) >= 3) techValueStrengths.push('R&D 역량');
            else if ((technicalValue.commonTech?.rndCapability ?? 0) <= 1) techValueWeaknesses.push('R&D 역량 강화');
            if ((technicalValue.commonTech?.technicalDifferentiation ?? 0) >= 3) techValueStrengths.push('기술적 차별성');
            else if ((technicalValue.commonTech?.technicalDifferentiation ?? 0) <= 1) techValueWeaknesses.push('기술적 차별성 확보');
            if ((technicalValue.commonTech?.systemIntegration ?? 0) >= 3) techValueStrengths.push('시스템 연계 능력');
            else if ((technicalValue.commonTech?.systemIntegration ?? 0) <= 1) techValueWeaknesses.push('시스템 연계 능력 강화');
            
            if (techValuePercent >= 70) {
              recommendations.push({
                type: 'strength',
                category: 'publicEducationCommon',
                title: '기술적 가치 우수',
                text: 'R&D 역량, 기술적 차별성, 학습데이터 활용 등 기술적 역량이 우수합니다. 학습경험 설계와 기술 확장성 측면에서 공교육 시스템 연동에 적합합니다.'
              });
            } else if (techValuePercent < 40) {
              recommendations.push({
                type: 'weakness',
                category: 'publicEducationCommon',
                title: '기술적 가치 개선 필요',
                text: '기술적 역량이 취약합니다. R&D 투자, 학습데이터 분석 역량, 시스템 연계 능력 등의 기술적 기반 강화가 필요합니다. 공교육 LMS 연동과 데이터 호환성 확보가 시급합니다.'
              });
            } else {
              recommendations.push({
                type: 'suggestion',
                category: 'publicEducationCommon',
                title: '기술적 가치 보통',
                text: `${techValueStrengths.length > 0 ? `[강점] ${techValueStrengths.join(', ')}.` : ''}${techValueStrengths.length > 0 && techValueWeaknesses.length > 0 ? '\n' : ''}${techValueWeaknesses.length > 0 ? `[개선필요] ${techValueWeaknesses.join(', ')}.` : ''}${(techValueStrengths.length > 0 || techValueWeaknesses.length > 0) ? '\n' : ''}기술적 역량이 보통 수준입니다. R&D 역량, 학습데이터 활용, 시스템 연계 능력 등 핵심 기술 역량을 지속적으로 강화하시기 바랍니다.`
              });
            }
            
            // 사회적 가치 분석
            const socialStrengths: string[] = [];
            const socialWeaknesses: string[] = [];
            if ((socialValue.socialResponsibility?.lowSpecSupport ?? 0) >= 2) socialStrengths.push('저사양 기기 지원');
            else if ((socialValue.socialResponsibility?.lowSpecSupport ?? 0) <= 1) socialWeaknesses.push('저사양 기기 지원 강화');
            if ((socialValue.socialResponsibility?.offlineSupport ?? 0) >= 2) socialStrengths.push('오프라인 모드 지원');
            else if ((socialValue.socialResponsibility?.offlineSupport ?? 0) <= 1) socialWeaknesses.push('오프라인 모드 지원');
            if ((socialValue.ethicsCompliance?.dataEthics ?? 0) >= 3) socialStrengths.push('데이터 윤리');
            else if ((socialValue.ethicsCompliance?.dataEthics ?? 0) <= 1) socialWeaknesses.push('데이터 윤리 강화');
            if ((socialValue.ecosystemBuilding?.educationPartnership ?? 0) >= 2) socialStrengths.push('교육 파트너십');
            else if ((socialValue.ecosystemBuilding?.educationPartnership ?? 0) <= 1) socialWeaknesses.push('교육 파트너십 확대');
            
            if (socialPercent >= 70) {
              recommendations.push({
                type: 'strength',
                category: 'publicEducationCommon',
                title: '사회적 가치 우수',
                text: '디지털 격차 해소, 데이터 윤리, 교육 파트너십 등 사회적 가치 실현에 기여하고 있습니다. 공교육의 형평성과 포용성 가치에 부합합니다.'
              });
            } else if (socialPercent < 40) {
              recommendations.push({
                type: 'weakness',
                category: 'publicEducationCommon',
                title: '사회적 가치 개선 필요',
                text: '디지털 소외 계층 지원, 저사양 기기 호환성, 오프라인 학습 지원 등 사회적 책임 영역이 취약합니다. 공교육은 모든 학생의 접근성을 중요시합니다.'
              });
            } else {
              recommendations.push({
                type: 'suggestion',
                category: 'publicEducationCommon',
                title: '사회적 가치 보통',
                text: `${socialStrengths.length > 0 ? `[강점] ${socialStrengths.join(', ')}.` : ''}${socialStrengths.length > 0 && socialWeaknesses.length > 0 ? '\n' : ''}${socialWeaknesses.length > 0 ? `[개선필요] ${socialWeaknesses.join(', ')}.` : ''}${(socialStrengths.length > 0 || socialWeaknesses.length > 0) ? '\n' : ''}사회적 책임 이행이 보통 수준입니다. 디지털 격차 해소, 저사양 기기 지원, 교육 파트너십 확대 등을 통해 공교육 형평성 가치에 더욱 기여할 수 있습니다.`
              });
            }
            
            // ========================================
            // === 3. 공교육 가치 부분 - BM별 차별화 영역 ===
            // ========================================
            const selectedBMs = data.companyInfo.businessModels;
            const bmNameMap: Record<string, string> = {
              'platform': '플랫폼형', 'content': '콘텐츠형', 'device': '디바이스형',
              'service': '서비스형', 'network': '네트워크형'
            };
            
            const technicalOutput = technicalValue.bmCapability?.technicalOutput as any;
            
            // 각 BM별 분석
            selectedBMs.forEach((bm: string) => {
              const bmName = bmNameMap[bm] || bm;
              const bmStrengths: string[] = [];
              const bmWeaknesses: string[] = [];
              
              if (bm === 'platform' && technicalOutput?.platform) {
                const platformData = technicalOutput.platform;
                // 핵심 기능 분석 (0-4점)
                if ((platformData.coreFunction ?? 0) >= 3) bmStrengths.push('학습관리·분석·피드백 기능 통합 구현');
                else if ((platformData.coreFunction ?? 0) <= 2) bmWeaknesses.push('플랫폼 핵심 기능(학습관리, 분석, 피드백) 보완');
                // 시스템 성능 분석 (0-4점)
                if ((platformData.systemPerformance ?? 0) >= 3) bmStrengths.push('시스템 안정성 및 동시접속 처리 성능');
                else if ((platformData.systemPerformance ?? 0) <= 2) bmWeaknesses.push('시스템 성능 및 안정성 개선');
                
                // 플랫폼형 전략 제언
                recommendations.push({
                  type: bmStrengths.length > bmWeaknesses.length ? 'strength' : bmWeaknesses.length > bmStrengths.length ? 'weakness' : 'suggestion',
                  category: 'bmSpecific',
                  title: `${bmName} BM 분석`,
                  text: `${bmStrengths.length > 0 ? `[강점] ${bmStrengths.join(', ')}.` : ''}${bmStrengths.length > 0 && bmWeaknesses.length > 0 ? '\n' : ''}${bmWeaknesses.length > 0 ? `[개선필요] ${bmWeaknesses.join(', ')}.` : ''}${(bmStrengths.length > 0 || bmWeaknesses.length > 0) ? '\n' : ''}플랫폼 사업은 학교 LMS 연동, 데이터 호환성, 교사·학생·학부모 통합 서비스가 핵심 경쟁력입니다.`
                });
              }
              
              if (bm === 'content' && technicalOutput?.content) {
                const contentData = technicalOutput.content;
                // 제작 실적 분석 (0-3점)
                if ((contentData.productionRecord ?? 0) >= 2) bmStrengths.push('신규 콘텐츠 제작 실적');
                else if ((contentData.productionRecord ?? 0) <= 1) bmWeaknesses.push('콘텐츠 제작 역량 강화');
                // 콘텐츠 수준 분석 (0-5점)
                if ((contentData.qualityLevel ?? 0) >= 4) bmStrengths.push('콘텐츠 품질 수준');
                else if ((contentData.qualityLevel ?? 0) <= 3) bmWeaknesses.push('콘텐츠 품질 개선(멀티미디어, 상호작용)');
                
                recommendations.push({
                  type: bmStrengths.length > bmWeaknesses.length ? 'strength' : bmWeaknesses.length > bmStrengths.length ? 'weakness' : 'suggestion',
                  category: 'bmSpecific',
                  title: `${bmName} BM 분석`,
                  text: `${bmStrengths.length > 0 ? `[강점] ${bmStrengths.join(', ')}.` : ''}${bmStrengths.length > 0 && bmWeaknesses.length > 0 ? '\n' : ''}${bmWeaknesses.length > 0 ? `[개선필요] ${bmWeaknesses.join(', ')}.` : ''}${(bmStrengths.length > 0 || bmWeaknesses.length > 0) ? '\n' : ''}콘텐츠 사업은 교육과정 정합성, 멀티미디어 품질, 다양한 학습 유형 지원이 핵심입니다.`
                });
              }
              
              if (bm === 'device' && technicalOutput?.device) {
                const deviceData = technicalOutput.device;
                // 제품 개발 실적 분석 (0-3점)
                if ((deviceData.productDevelopment ?? 0) >= 2) bmStrengths.push('자체 개발 제품 보유');
                else if ((deviceData.productDevelopment ?? 0) <= 1) bmWeaknesses.push('자체 개발 제품 확대');
                // 기술 수준 분석 (0-5점)
                if ((deviceData.techLevel ?? 0) >= 4) bmStrengths.push('하드웨어 기술 수준');
                else if ((deviceData.techLevel ?? 0) <= 3) bmWeaknesses.push('하드웨어 기술력 강화');
                
                recommendations.push({
                  type: bmStrengths.length > bmWeaknesses.length ? 'strength' : bmWeaknesses.length > bmStrengths.length ? 'weakness' : 'suggestion',
                  category: 'bmSpecific',
                  title: `${bmName} BM 분석`,
                  text: `${bmStrengths.length > 0 ? `[강점] ${bmStrengths.join(', ')}.` : ''}${bmStrengths.length > 0 && bmWeaknesses.length > 0 ? '\n' : ''}${bmWeaknesses.length > 0 ? `[개선필요] ${bmWeaknesses.join(', ')}.` : ''}${(bmStrengths.length > 0 || bmWeaknesses.length > 0) ? '\n' : ''}디바이스 사업은 제품 내구성, A/S 체계, SW·콘텐츠 연동이 핵심 경쟁력입니다.`
                });
              }
              
              if (bm === 'service' && technicalOutput?.service) {
                const serviceData = technicalOutput.service;
                // 서비스 운영 실적 분석 (0-3점)
                if ((serviceData.operationRecord ?? 0) >= 2) bmStrengths.push('서비스 운영 실적');
                else if ((serviceData.operationRecord ?? 0) <= 1) bmWeaknesses.push('서비스 운영 경험 확대');
                // 서비스 범위 분석 (0-5점)
                if ((serviceData.serviceScope ?? 0) >= 4) bmStrengths.push('서비스 범위 및 다양성');
                else if ((serviceData.serviceScope ?? 0) <= 3) bmWeaknesses.push('서비스 범위 확대');
                
                recommendations.push({
                  type: bmStrengths.length > bmWeaknesses.length ? 'strength' : bmWeaknesses.length > bmStrengths.length ? 'weakness' : 'suggestion',
                  category: 'bmSpecific',
                  title: `${bmName} BM 분석`,
                  text: `${bmStrengths.length > 0 ? `[강점] ${bmStrengths.join(', ')}.` : ''}${bmStrengths.length > 0 && bmWeaknesses.length > 0 ? '\n' : ''}${bmWeaknesses.length > 0 ? `[개선필요] ${bmWeaknesses.join(', ')}.` : ''}${(bmStrengths.length > 0 || bmWeaknesses.length > 0) ? '\n' : ''}서비스 사업은 출강 수업, 교사 연수, 컨설팅 등 교육 운영 전문성이 핵심입니다.`
                });
              }
              
              if (bm === 'network' && technicalOutput?.network) {
                const networkData = technicalOutput.network;
                // 서비스 규모 분석 (0-3점)
                if ((networkData.serviceScale ?? 0) >= 2) bmStrengths.push('네트워크 서비스 규모');
                else if ((networkData.serviceScale ?? 0) <= 1) bmWeaknesses.push('네트워크 서비스 확대');
                // 기술 수준 분석 (0-5점)
                if ((networkData.techLevel ?? 0) >= 4) bmStrengths.push('네트워크 기술 수준');
                else if ((networkData.techLevel ?? 0) <= 3) bmWeaknesses.push('네트워크 기술력 강화');
                
                recommendations.push({
                  type: bmStrengths.length > bmWeaknesses.length ? 'strength' : bmWeaknesses.length > bmStrengths.length ? 'weakness' : 'suggestion',
                  category: 'bmSpecific',
                  title: `${bmName} BM 분석`,
                  text: `${bmStrengths.length > 0 ? `[강점] ${bmStrengths.join(', ')}.` : ''}${bmStrengths.length > 0 && bmWeaknesses.length > 0 ? '\n' : ''}${bmWeaknesses.length > 0 ? `[개선필요] ${bmWeaknesses.join(', ')}.` : ''}${(bmStrengths.length > 0 || bmWeaknesses.length > 0) ? '\n' : ''}네트워크 사업은 커뮤니티 활성화, 학습 데이터 활용, 전문가 네트워크 구축이 핵심입니다.`
                });
              }
            });
            
            // ========================================
            // === 4. 종합 전략 제언 ===
            // ========================================
            const strongAreas: string[] = [];
            const weakAreas: string[] = [];
            
            if (financialPercent >= 60) strongAreas.push('재무 안정성');
            else if (financialPercent < 40) weakAreas.push('재무 안정성');
            if (operationalPercent >= 60) strongAreas.push('운영 지속성');
            else if (operationalPercent < 40) weakAreas.push('운영 지속성');
            if (technicalPercent >= 60) strongAreas.push('기술 신뢰성');
            else if (technicalPercent < 40) weakAreas.push('기술 신뢰성');
            if (educationalPercent >= 60) strongAreas.push('교육적 가치');
            else if (educationalPercent < 40) weakAreas.push('교육적 가치');
            if (techValuePercent >= 60) strongAreas.push('기술적 가치');
            else if (techValuePercent < 40) weakAreas.push('기술적 가치');
            if (socialPercent >= 60) strongAreas.push('사회적 가치');
            else if (socialPercent < 40) weakAreas.push('사회적 가치');

            const gradeZone = gradeThresholds[result.grade].zone;
            const totalScore = result.totalScore;
            
            if (gradeZone === 'A') {
              recommendations.push({
                type: 'strength',
                category: 'overall',
                title: '종합 판정: 공교육 시장 진출 적합',
                text: `종합 평가 결과 ${result.grade}등급(${totalScore.toFixed(1)}점)으로, 공교육 시장 진출에 적합한 수준입니다. ${strongAreas.length > 0 ? `특히 ${strongAreas.slice(0, 3).join(', ')} 영역이 우수합니다. ` : ''}시·도교육청 및 학교 대상 영업 활동을 적극 추진하시기 바랍니다.`
              });
            } else if (gradeZone === 'B') {
              recommendations.push({
                type: 'suggestion',
                category: 'overall',
                title: '종합 판정: 일부 보완 후 진출 가능',
                text: `종합 평가 결과 ${result.grade}등급(${totalScore.toFixed(1)}점)으로, 핵심 요건을 대체로 충족하고 있습니다. ${strongAreas.length > 0 ? `${strongAreas.slice(0, 2).join(', ')} 영역이 강점이며, ` : ''}${weakAreas.length > 0 ? `${weakAreas.slice(0, 2).join(', ')} 영역 보완 시 ` : ''}공교육 시장 진출이 유망합니다.`
              });
            } else if (gradeZone === 'C') {
              recommendations.push({
                type: 'weakness',
                category: 'overall',
                title: '종합 판정: 전반적 보완 필요',
                text: `종합 평가 결과 ${result.grade}등급(${totalScore.toFixed(1)}점)으로, 공교육 활용을 위해 보완이 필요합니다. ${weakAreas.length > 0 ? `특히 ${weakAreas.slice(0, 2).join(', ')} 영역의 개선이 시급합니다. ` : ''}${strongAreas.length > 0 ? `${strongAreas.slice(0, 2).join(', ')} 영역은 강점으로 유지하시고, ` : ''}단계적 개선 로드맵 수립을 권장합니다.`
              });
            } else {
              recommendations.push({
                type: 'weakness',
                category: 'overall',
                title: '종합 판정: 공교육 진입 준비 필요',
                text: `종합 평가 결과 ${result.grade}등급(${totalScore.toFixed(1)}점)으로, 현재 상태로는 공교육 환경 적용이 어렵습니다. ${weakAreas.length > 0 ? `${weakAreas.slice(0, 3).join(', ')} 영역을 포함한 ` : ''}전반적인 역량 강화가 필요합니다. 기본적인 기업 역량과 서비스 품질 확보 후 재검토하시기 바랍니다.`
              });
            }

            return recommendations;
          };

          const recommendations = generateRecommendations();
          const gradeColor = gradeZones[gradeThresholds[result.grade].zone as keyof typeof gradeZones].color;

          // 파이 차트 데이터 계산
          const capabilityData = [
            { name: '재무 안전성', value: result.details.financialStabilityScore, color: '#3B82F6' },
            { name: '운영 지속성', value: result.details.operationalContinuityScore, color: '#10B981' },
            { name: '기술 신뢰성', value: result.details.technicalReliabilityScore, color: '#8B5CF6' },
          ];
          const educationData = [
            { name: '교육적 가치', value: result.details.educationalValueScore, color: '#F59E0B' },
            { name: '기술적 가치', value: result.details.technicalValueScore, color: '#EC4899' },
            { name: '사회적 가치', value: result.details.socialValueScore, color: '#06B6D4' },
          ];

          // 기본 자격 항목 리스트
          const qualificationItems = [
            { id: 'businessRegistration', name: '사업자 등록' },
            { id: 'privacyPolicy', name: '개인정보 처리방침' },
            { id: 'serviceAvailability', name: '서비스 가용률' },
            { id: 'educationEthics', name: '교육 윤리 준수' },
            { id: 'dataTransparency', name: '데이터 투명성' },
            ...(data.companyInfo.businessModels.includes('device') ? [
              { id: 'emcCompliance', name: '전자파 적합성' },
              { id: 'hazardousSubstance', name: '유해물질 규제' },
            ] : []),
          ];

          const passItems = qualificationItems.filter(item => (data.basicQualification as any)[item.id] === 'pass');
          const failItems = qualificationItems.filter(item => {
            const value = (data.basicQualification as any)[item.id];
            return value === 'fail' || value === null;
          });

          return (
            <div style={{ maxWidth: '1200px', margin: '0 auto' }} className="print-container">
              {/* ===== 인쇄 페이지 1: 기본자격검증 + 종합등급 ===== */}
              <div className="print-page">
                {/* 인쇄용 헤더 */}
                <div className="print-header" style={{ display: 'none' }}>
                  <div>
                    <h1 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--gray-900)', margin: 0 }}>
                      에듀테크 기업 가치평가 결과 보고서
                    </h1>
                    <p style={{ fontSize: '0.875rem', color: 'var(--gray-500)', margin: '0.25rem 0 0 0' }}>
                      {data.companyInfo.name || '기업명 미입력'} | 평가일: {new Date().toLocaleDateString('ko-KR')}
                    </p>
                  </div>
                  <div style={{ textAlign: 'right', fontSize: '0.75rem', color: 'var(--gray-400)' }}>
                    기본자격 · 종합등급
                  </div>
                </div>

                {/* 1. 기본 자격 검증 박스 - 맨 먼저 표시 */}
                <div className="print-avoid-break print-compact-box" style={{
                  background: result.passed 
                  ? 'linear-gradient(135deg, #ECFDF5 0%, #D1FAE5 100%)' 
                  : 'linear-gradient(135deg, #FEF2F2 0%, #FEE2E2 100%)',
                borderRadius: '20px',
                padding: '2rem',
                marginBottom: '1.5rem',
                border: result.passed ? '2px solid #10B981' : '2px solid #EF4444',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{
                      width: '56px',
                      height: '56px',
                      borderRadius: '16px',
                      background: result.passed ? '#10B981' : '#EF4444',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.75rem',
                      boxShadow: result.passed ? '0 4px 14px rgba(16, 185, 129, 0.4)' : '0 4px 14px rgba(239, 68, 68, 0.4)',
                    }}>
                      {result.passed ? '✓' : '✕'}
                    </div>
                    <div>
                      <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: result.passed ? '#065F46' : '#991B1B', margin: 0 }}>
                        기본 자격 검증
                      </h3>
                      <p style={{ fontSize: '0.9375rem', color: result.passed ? '#047857' : '#DC2626', margin: '0.25rem 0 0 0', fontWeight: 600 }}>
                        {result.passed ? '모든 기본 자격 요건을 충족하였습니다' : '일부 기본 자격 요건이 충족되지 않았습니다'}
                      </p>
                    </div>
                  </div>
                  <div style={{
                    padding: '0.625rem 1.25rem',
                    background: result.passed ? '#10B981' : '#EF4444',
                    color: 'white',
                    borderRadius: '50px',
                    fontWeight: 700,
                    fontSize: '1rem',
                  }}>
                    {result.passed ? 'PASS' : 'FAIL'}
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
                  {/* Pass 항목 */}
                  <div style={{
                    background: 'white',
                    borderRadius: '12px',
                    padding: '1.25rem',
                    border: '1px solid #D1FAE5',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                      <div style={{
                        width: '24px',
                        height: '24px',
                        borderRadius: '50%',
                        background: '#10B981',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.75rem',
                        color: 'white',
                      }}>✓</div>
                      <span style={{ fontWeight: 700, color: '#065F46', fontSize: '0.9375rem' }}>
                        Pass 항목 ({passItems.length}개)
                      </span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      {passItems.length > 0 ? passItems.map(item => (
                        <div key={item.id} style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          padding: '0.5rem 0.75rem',
                          background: '#ECFDF5',
                          borderRadius: '8px',
                          fontSize: '0.875rem',
                          color: '#047857',
                        }}>
                          <span style={{ color: '#10B981' }}>✓</span>
                          {item.name}
                        </div>
                      )) : (
                        <div style={{ color: '#9CA3AF', fontSize: '0.875rem', padding: '0.5rem' }}>
                          Pass 항목이 없습니다
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Fail 항목 */}
                  <div style={{
                    background: 'white',
                    borderRadius: '12px',
                    padding: '1.25rem',
                    border: '1px solid #FEE2E2',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                      <div style={{
                        width: '24px',
                        height: '24px',
                        borderRadius: '50%',
                        background: '#EF4444',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.75rem',
                        color: 'white',
                      }}>✕</div>
                      <span style={{ fontWeight: 700, color: '#991B1B', fontSize: '0.9375rem' }}>
                        Fail / 미선택 항목 ({failItems.length}개)
                      </span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      {failItems.length > 0 ? failItems.map(item => {
                        const value = (data.basicQualification as any)[item.id];
                        return (
                          <div key={item.id} style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            padding: '0.5rem 0.75rem',
                            background: '#FEF2F2',
                            borderRadius: '8px',
                            fontSize: '0.875rem',
                            color: '#DC2626',
                          }}>
                            <span style={{
                              padding: '0.125rem 0.375rem',
                              background: value === 'fail' ? '#EF4444' : '#9CA3AF',
                              color: 'white',
                              borderRadius: '4px',
                              fontSize: '0.6875rem',
                              fontWeight: 700,
                            }}>
                              {value === 'fail' ? 'FAIL' : '미선택'}
                            </span>
                            {item.name}
                          </div>
                        );
                      }) : (
                        <div style={{ color: '#9CA3AF', fontSize: '0.875rem', padding: '0.5rem' }}>
                          모든 항목이 Pass 되었습니다 🎉
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {!result.passed && (
                  <div style={{
                    marginTop: '1rem',
                    padding: '0.75rem 1rem',
                    background: '#FEF2F2',
                    borderRadius: '8px',
                    border: '1px solid #FECACA',
                    fontSize: '0.875rem',
                    color: '#991B1B',
                  }}>
                    ⚠️ 기본 자격 항목 중 Fail이 있어 최종 결과가 <strong>Fail</strong>로 처리되었습니다. 미충족 항목을 보완한 후 재평가하시기 바랍니다.
                  </div>
                )}
              </div>

              {/* 2. 종합 등급 박스 */}
              <div className="print-avoid-break print-compact-box print-grade-box" style={{
                background: `linear-gradient(135deg, ${gradeColor}15 0%, ${gradeColor}05 100%)`,
                borderRadius: '24px',
                padding: '3rem',
                marginBottom: '2rem',
                border: `2px solid ${gradeColor}30`,
                position: 'relative',
                overflow: 'hidden',
              }}>
                {/* 배경 장식 */}
                <div style={{
                  position: 'absolute',
                  top: '-50px',
                  right: '-50px',
                  width: '200px',
                  height: '200px',
                  borderRadius: '50%',
                  background: `${gradeColor}10`,
                }} />
                <div style={{
                  position: 'absolute',
                  bottom: '-30px',
                  left: '-30px',
                  width: '150px',
                  height: '150px',
                  borderRadius: '50%',
                  background: `${gradeColor}08`,
                }} />

                <div style={{ position: 'relative', zIndex: 1 }}>
                  {/* 상단: 회사명 */}
                  <div style={{ marginBottom: '2rem' }}>
                    <div style={{ fontSize: '0.875rem', color: 'var(--gray-500)', marginBottom: '0.5rem', fontWeight: 500 }}>
                      평가 대상 기업
                    </div>
                    <h1 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--gray-900)', margin: 0 }}>
                      {data.companyInfo.name || '기업명 미입력'}
                    </h1>
                  </div>

                  {/* 중앙: 등급 표시 */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '3rem', flexWrap: 'wrap' }}>
                    {/* 등급 원형 */}
                    <div className="print-grade-circle-outer" style={{
                      width: '180px',
                      height: '180px',
                      borderRadius: '50%',
                      background: `conic-gradient(${gradeColor} ${result.totalScore}%, #E5E7EB ${result.totalScore}%)`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: `0 8px 32px ${gradeColor}40`,
                      position: 'relative',
                    }}>
                      <div className="print-grade-circle-inner" style={{
                        width: '150px',
                        height: '150px',
                        borderRadius: '50%',
                        background: 'white',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}>
                        <div className="print-grade-text" style={{ fontSize: '3.5rem', fontWeight: 900, color: gradeColor, lineHeight: 1 }}>
                          {result.grade}
                        </div>
                        <div className="print-grade-score" style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--gray-600)', marginTop: '0.25rem' }}>
                          {result.totalScore}점
                        </div>
                      </div>
                    </div>

                    {/* 등급 해설 */}
                    <div style={{ flex: 1, minWidth: '280px' }}>
                      <div style={{
                        display: 'inline-block',
                        padding: '0.5rem 1rem',
                        background: gradeColor,
                        color: 'white',
                        borderRadius: '8px',
                        fontSize: '0.875rem',
                        fontWeight: 700,
                        marginBottom: '1rem',
                      }}>
                        {gradeZones[gradeThresholds[result.grade].zone as keyof typeof gradeZones].name} ({gradeZones[gradeThresholds[result.grade].zone as keyof typeof gradeZones].range})
                      </div>
                      <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--gray-900)', marginBottom: '0.75rem' }}>
                        {gradeThresholds[result.grade].description}
                      </h2>
                      <p style={{ fontSize: '1rem', color: 'var(--gray-600)', lineHeight: 1.7, margin: 0 }}>
                        {gradeThresholds[result.grade].zoneDescription}
                      </p>
                    </div>
                  </div>
                  </div>
                </div>
                
                {/* 인쇄용 푸터 - 페이지 1 */}
                <div className="print-footer" style={{ display: 'none' }}>
                  공교육 중심 에듀테크 기업 가치평가 시스템 | © {new Date().getFullYear()}
                </div>
              </div>
              {/* ===== 인쇄 페이지 1 끝 ===== */}

              {/* ===== 인쇄 페이지 2: 기업역량 + 공교육가치 ===== */}
              <div className="print-page">
                {/* 인쇄용 헤더 - 페이지 2 */}
                <div className="print-header" style={{ display: 'none' }}>
                  <div>
                    <h1 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--gray-900)', margin: 0 }}>
                      에듀테크 기업 가치평가 결과 보고서
                    </h1>
                    <p style={{ fontSize: '0.875rem', color: 'var(--gray-500)', margin: '0.25rem 0 0 0' }}>
                      {data.companyInfo.name || '기업명 미입력'} | 세부 영역 평가 결과
                    </p>
                  </div>
                  <div style={{ textAlign: 'right', fontSize: '0.75rem', color: 'var(--gray-400)' }}>
                    기업역량 · 공교육가치
                  </div>
                </div>

                {/* 영역별 점수 섹션 - 파이차트 */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(480px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
                {/* 기업 역량 */}
                <div className="print-avoid-break" style={{
                  background: 'white',
                  borderRadius: '20px',
                  padding: '2rem',
                  boxShadow: '0 4px 24px rgba(0, 0, 0, 0.06)',
                  border: '1px solid var(--gray-100)',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--gray-900)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontSize: '1.5rem' }}>🏢</span> 기업 역량 평가
                    </h3>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '0.75rem', color: 'var(--gray-500)', marginBottom: '0.125rem' }}>획득 점수</div>
                      <div style={{
                        fontSize: '1.75rem',
                        fontWeight: 800,
                        color: '#3B82F6',
                      }}>
                        {result.companyCapabilityScore}<span style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--gray-400)' }}>/40점</span>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
                    {/* 도넛 차트 - 세부 영역별 점수 비율 */}
                    <div className="print-donut-container" style={{ position: 'relative', width: '160px', height: '160px', flexShrink: 0 }}>
                      <svg className="print-donut-svg" viewBox="0 0 100 100" style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
                        {(() => {
                          const total = capabilityData.reduce((sum, d) => sum + d.value, 0) || 1;
                          let currentAngle = 0;
                          return capabilityData.map((item, idx) => {
                            const percentage = (item.value / total) * 100;
                            const strokeDasharray = `${percentage * 2.51327} ${251.327 - percentage * 2.51327}`;
                            const strokeDashoffset = -currentAngle * 2.51327;
                            currentAngle += percentage;
                            return (
                              <circle
                                key={idx}
                                cx="50"
                                cy="50"
                                r="40"
                                fill="none"
                                stroke={item.color}
                                strokeWidth="20"
                                strokeDasharray={strokeDasharray}
                                strokeDashoffset={strokeDashoffset}
                                style={{ transition: 'all 0.5s ease' }}
                              />
                            );
                          });
                        })()}
                      </svg>
                      <div className="print-donut-text" style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        textAlign: 'center',
                        pointerEvents: 'none',
                      }}>
                        <div className="print-donut-label" style={{ fontSize: '0.625rem', color: 'var(--gray-500)', marginBottom: '0.125rem', lineHeight: 1 }}>달성률</div>
                        <div className="print-donut-value" style={{ fontSize: '1.375rem', fontWeight: 800, color: 'var(--gray-800)', lineHeight: 1 }}>
                          {Math.round((result.companyCapabilityScore / 40) * 100)}%
                        </div>
                      </div>
                    </div>

                    {/* 범례 - 세부 영역별 점수 */}
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '0.6875rem', color: 'var(--gray-500)', marginBottom: '0.5rem' }}>세부 영역별 점수</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                        {capabilityData.map((item, idx) => (
                          <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <div style={{ width: '10px', height: '10px', borderRadius: '2px', background: item.color }} />
                              <span style={{ fontSize: '0.875rem', color: 'var(--gray-700)' }}>{item.name}</span>
                            </div>
                            <span style={{ fontSize: '0.9375rem', fontWeight: 700, color: item.color }}>{item.value}점</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* 공교육 가치 */}
                <div className="print-avoid-break" style={{
                  background: 'white',
                  borderRadius: '20px',
                  padding: '2rem',
                  boxShadow: '0 4px 24px rgba(0, 0, 0, 0.06)',
                  border: '1px solid var(--gray-100)',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--gray-900)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontSize: '1.5rem' }}>🎓</span> 공교육 특화 가치
                    </h3>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '0.75rem', color: 'var(--gray-500)', marginBottom: '0.125rem' }}>획득 점수</div>
                      <div style={{
                        fontSize: '1.75rem',
                        fontWeight: 800,
                        color: '#F59E0B',
                      }}>
                        {result.publicEducationScore}<span style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--gray-400)' }}>/60점</span>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
                    {/* 도넛 차트 - 세부 영역별 점수 비율 */}
                    <div className="print-donut-container" style={{ position: 'relative', width: '160px', height: '160px', flexShrink: 0 }}>
                      <svg className="print-donut-svg" viewBox="0 0 100 100" style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
                        {(() => {
                          const total = educationData.reduce((sum, d) => sum + d.value, 0) || 1;
                          let currentAngle = 0;
                          return educationData.map((item, idx) => {
                            const percentage = (item.value / total) * 100;
                            const strokeDasharray = `${percentage * 2.51327} ${251.327 - percentage * 2.51327}`;
                            const strokeDashoffset = -currentAngle * 2.51327;
                            currentAngle += percentage;
                            return (
                              <circle
                                key={idx}
                                cx="50"
                                cy="50"
                                r="40"
                                fill="none"
                                stroke={item.color}
                                strokeWidth="20"
                                strokeDasharray={strokeDasharray}
                                strokeDashoffset={strokeDashoffset}
                                style={{ transition: 'all 0.5s ease' }}
                              />
                            );
                          });
                        })()}
                      </svg>
                      <div className="print-donut-text" style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        textAlign: 'center',
                        pointerEvents: 'none',
                      }}>
                        <div className="print-donut-label" style={{ fontSize: '0.625rem', color: 'var(--gray-500)', marginBottom: '0.125rem', lineHeight: 1 }}>달성률</div>
                        <div className="print-donut-value" style={{ fontSize: '1.375rem', fontWeight: 800, color: 'var(--gray-800)', lineHeight: 1 }}>
                          {Math.round((result.publicEducationScore / 60) * 100)}%
                        </div>
                      </div>
                    </div>

                    {/* 범례 - 세부 영역별 점수 */}
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '0.6875rem', color: 'var(--gray-500)', marginBottom: '0.5rem' }}>세부 영역별 점수</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                        {educationData.map((item, idx) => (
                          <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <div style={{ width: '10px', height: '10px', borderRadius: '2px', background: item.color }} />
                              <span style={{ fontSize: '0.875rem', color: 'var(--gray-700)' }}>{item.name}</span>
                            </div>
                            <span style={{ fontSize: '0.9375rem', fontWeight: 700, color: item.color }}>{item.value}점</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
                </div>

                {/* 인쇄용 푸터 - 페이지 2 */}
                <div className="print-footer" style={{ display: 'none' }}>
                  공교육 중심 에듀테크 기업 가치평가 시스템 | © {new Date().getFullYear()}
                </div>
              </div>
              {/* ===== 인쇄 페이지 2 끝 ===== */}

              {/* ===== 인쇄 페이지 3: 종합 제언 ===== */}
              <div className="print-page">
                {/* 인쇄용 헤더 */}
                <div className="print-header" style={{ display: 'none' }}>
                  <div>
                    <h1 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--gray-900)', margin: 0 }}>
                      에듀테크 기업 가치평가 결과 보고서
                    </h1>
                    <p style={{ fontSize: '0.875rem', color: 'var(--gray-500)', margin: '0.25rem 0 0 0' }}>
                      {data.companyInfo.name || '기업명 미입력'} | 종합 제언
                    </p>
                  </div>
                  <div style={{ textAlign: 'right', fontSize: '0.75rem', color: 'var(--gray-400)' }}>
                    종합 제언
                  </div>
                </div>

                {/* 종합 제언 섹션 - 파스텔 톤 현대적 디자인 */}
                <div style={{
                  background: 'linear-gradient(180deg, #F8FAFC 0%, #F1F5F9 100%)',
                  borderRadius: '24px',
                  padding: '2.5rem',
                  marginBottom: '2rem',
                  border: '1px solid #E2E8F0',
                  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.03)',
                }}>
                  <h3 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1.75rem', display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#1E293B' }}>
                    <span style={{ 
                      width: '44px', height: '44px', borderRadius: '12px',
                      background: 'linear-gradient(135deg, #818CF8 0%, #6366F1 100%)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '1.25rem',
                    }}>💡</span>
                    종합 제언
                  </h3>

                  {/* 기본 자격 미충족 시 경고 */}
                  {recommendations.filter(r => r.category === 'critical').length > 0 && (
                    <div style={{ marginBottom: '1.75rem' }}>
                      {recommendations.filter(r => r.category === 'critical').map((rec, idx) => (
                        <div key={idx} className="print-recommendation-item" style={{
                          display: 'flex',
                          gap: '1rem',
                          padding: '1.25rem',
                          background: 'linear-gradient(135deg, #FEF2F2 0%, #FEE2E2 100%)',
                          borderRadius: '16px',
                          border: '1px solid #FECACA',
                          marginBottom: '0.75rem',
                        }}>
                          <div style={{
                            width: '44px', height: '44px', borderRadius: '12px',
                            background: 'linear-gradient(135deg, #FCA5A5 0%, #F87171 100%)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '1.25rem', flexShrink: 0,
                          }}>⚠️</div>
                          <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                              <span style={{ fontSize: '0.6875rem', fontWeight: 600, color: '#991B1B', background: '#FECACA', padding: '0.25rem 0.625rem', borderRadius: '6px' }}>필수 확인</span>
                              <span style={{ fontSize: '1rem', fontWeight: 700, color: '#7F1D1D' }}>{rec.title}</span>
                            </div>
                            <p style={{ margin: 0, fontSize: '0.875rem', lineHeight: 1.7, color: '#991B1B' }}>{rec.text}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* 1. 기업 역량 부분 */}
                  {recommendations.filter(r => r.category === 'companyCapability').length > 0 && (
                    <div style={{ marginBottom: '1.75rem' }}>
                      <div style={{ 
                        fontSize: '1rem', fontWeight: 700, color: '#4F46E5', marginBottom: '1rem',
                        display: 'flex', alignItems: 'center', gap: '0.5rem',
                        paddingBottom: '0.625rem', borderBottom: '2px solid #E0E7FF'
                      }}>
                        <span style={{ fontSize: '1.125rem' }}>📊</span> 기업 역량 분석
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                        {recommendations.filter(r => r.category === 'companyCapability').map((rec, idx) => (
                          <div key={idx} className="print-recommendation-item" style={{
                            display: 'flex', gap: '0.875rem', padding: '1rem 1.125rem',
                            background: rec.type === 'strength' ? 'linear-gradient(135deg, #ECFDF5 0%, #D1FAE5 100%)' : rec.type === 'weakness' ? 'linear-gradient(135deg, #FFF7ED 0%, #FFEDD5 100%)' : 'linear-gradient(135deg, #F5F3FF 0%, #EDE9FE 100%)',
                            borderRadius: '14px',
                            border: `1px solid ${rec.type === 'strength' ? '#A7F3D0' : rec.type === 'weakness' ? '#FED7AA' : '#DDD6FE'}`,
                          }}>
                            <div style={{
                              width: '32px', height: '32px', borderRadius: '8px',
                              background: rec.type === 'strength' ? 'linear-gradient(135deg, #6EE7B7 0%, #34D399 100%)' : rec.type === 'weakness' ? 'linear-gradient(135deg, #FDBA74 0%, #FB923C 100%)' : 'linear-gradient(135deg, #C4B5FD 0%, #A78BFA 100%)',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              fontSize: '0.875rem', flexShrink: 0, color: 'white', fontWeight: 700,
                            }}>{rec.type === 'strength' ? '✓' : rec.type === 'weakness' ? '!' : '~'}</div>
                            <div style={{ flex: 1 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.375rem' }}>
                                <span style={{ 
                                  fontSize: '0.625rem', fontWeight: 600, 
                                  color: rec.type === 'strength' ? '#065F46' : rec.type === 'weakness' ? '#9A3412' : '#5B21B6',
                                  background: rec.type === 'strength' ? '#A7F3D0' : rec.type === 'weakness' ? '#FED7AA' : '#DDD6FE',
                                  padding: '0.1875rem 0.5rem', borderRadius: '5px'
                                }}>
                                  {rec.type === 'strength' ? '강점' : rec.type === 'weakness' ? '개선 필요' : '보통'}
                                </span>
                                <span style={{ fontSize: '0.9375rem', fontWeight: 600, color: '#1E293B' }}>{rec.title}</span>
                              </div>
                              <p style={{ margin: 0, fontSize: '0.8125rem', lineHeight: 1.65, color: '#475569' }}>{rec.text}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 2. 공교육 가치 부분 - 공통 영역 */}
                  {recommendations.filter(r => r.category === 'publicEducationCommon').length > 0 && (
                    <div style={{ marginBottom: '1.75rem' }}>
                      <div style={{ 
                        fontSize: '1rem', fontWeight: 700, color: '#0D9488', marginBottom: '1rem',
                        display: 'flex', alignItems: 'center', gap: '0.5rem',
                        paddingBottom: '0.625rem', borderBottom: '2px solid #CCFBF1'
                      }}>
                        <span style={{ fontSize: '1.125rem' }}>🏫</span> 공교육 가치 분석 (공통 영역)
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                        {recommendations.filter(r => r.category === 'publicEducationCommon').map((rec, idx) => (
                          <div key={idx} className="print-recommendation-item" style={{
                            display: 'flex', gap: '0.875rem', padding: '1rem 1.125rem',
                            background: rec.type === 'strength' ? 'linear-gradient(135deg, #ECFDF5 0%, #D1FAE5 100%)' : rec.type === 'weakness' ? 'linear-gradient(135deg, #FFF7ED 0%, #FFEDD5 100%)' : 'linear-gradient(135deg, #F5F3FF 0%, #EDE9FE 100%)',
                            borderRadius: '14px',
                            border: `1px solid ${rec.type === 'strength' ? '#A7F3D0' : rec.type === 'weakness' ? '#FED7AA' : '#DDD6FE'}`,
                          }}>
                            <div style={{
                              width: '32px', height: '32px', borderRadius: '8px',
                              background: rec.type === 'strength' ? 'linear-gradient(135deg, #6EE7B7 0%, #34D399 100%)' : rec.type === 'weakness' ? 'linear-gradient(135deg, #FDBA74 0%, #FB923C 100%)' : 'linear-gradient(135deg, #C4B5FD 0%, #A78BFA 100%)',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              fontSize: '0.875rem', flexShrink: 0, color: 'white', fontWeight: 700,
                            }}>{rec.type === 'strength' ? '✓' : rec.type === 'weakness' ? '!' : '~'}</div>
                            <div style={{ flex: 1 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.375rem' }}>
                                <span style={{ 
                                  fontSize: '0.625rem', fontWeight: 600, 
                                  color: rec.type === 'strength' ? '#065F46' : rec.type === 'weakness' ? '#9A3412' : '#5B21B6',
                                  background: rec.type === 'strength' ? '#A7F3D0' : rec.type === 'weakness' ? '#FED7AA' : '#DDD6FE',
                                  padding: '0.1875rem 0.5rem', borderRadius: '5px'
                                }}>
                                  {rec.type === 'strength' ? '강점' : rec.type === 'weakness' ? '개선 필요' : '보통'}
                                </span>
                                <span style={{ fontSize: '0.9375rem', fontWeight: 600, color: '#1E293B' }}>{rec.title}</span>
                              </div>
                              <p style={{ margin: 0, fontSize: '0.8125rem', lineHeight: 1.65, color: '#475569' }}>{rec.text}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 3. 공교육 가치 부분 - BM별 차별화 영역 */}
                  {recommendations.filter(r => r.category === 'bmSpecific').length > 0 && (
                    <div style={{ marginBottom: '1.75rem' }}>
                      <div style={{ 
                        fontSize: '1rem', fontWeight: 700, color: '#D97706', marginBottom: '1rem',
                        display: 'flex', alignItems: 'center', gap: '0.5rem',
                        paddingBottom: '0.625rem', borderBottom: '2px solid #FEF3C7'
                      }}>
                        <span style={{ fontSize: '1.125rem' }}>🎯</span> BM별 차별화 영역 분석
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                        {recommendations.filter(r => r.category === 'bmSpecific').map((rec, idx) => (
                          <div key={idx} className="print-recommendation-item" style={{
                            display: 'flex', gap: '0.875rem', padding: '1rem 1.125rem',
                            background: rec.type === 'strength' ? 'linear-gradient(135deg, #ECFDF5 0%, #D1FAE5 100%)' : rec.type === 'weakness' ? 'linear-gradient(135deg, #FFF7ED 0%, #FFEDD5 100%)' : 'linear-gradient(135deg, #F5F3FF 0%, #EDE9FE 100%)',
                            borderRadius: '14px',
                            border: `1px solid ${rec.type === 'strength' ? '#A7F3D0' : rec.type === 'weakness' ? '#FED7AA' : '#DDD6FE'}`,
                          }}>
                            <div style={{
                              width: '32px', height: '32px', borderRadius: '8px',
                              background: rec.type === 'strength' ? 'linear-gradient(135deg, #6EE7B7 0%, #34D399 100%)' : rec.type === 'weakness' ? 'linear-gradient(135deg, #FDBA74 0%, #FB923C 100%)' : 'linear-gradient(135deg, #C4B5FD 0%, #A78BFA 100%)',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              fontSize: '0.875rem', flexShrink: 0, color: 'white', fontWeight: 700,
                            }}>{rec.type === 'strength' ? '✓' : rec.type === 'weakness' ? '!' : '~'}</div>
                            <div style={{ flex: 1 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.375rem' }}>
                                <span style={{ 
                                  fontSize: '0.625rem', fontWeight: 600, 
                                  color: rec.type === 'strength' ? '#065F46' : rec.type === 'weakness' ? '#9A3412' : '#5B21B6',
                                  background: rec.type === 'strength' ? '#A7F3D0' : rec.type === 'weakness' ? '#FED7AA' : '#DDD6FE',
                                  padding: '0.1875rem 0.5rem', borderRadius: '5px'
                                }}>
                                  {rec.type === 'strength' ? '강점 BM' : rec.type === 'weakness' ? '개선 필요' : '보통'}
                                </span>
                                <span style={{ fontSize: '0.9375rem', fontWeight: 600, color: '#1E293B' }}>{rec.title}</span>
                              </div>
                              <p style={{ margin: 0, fontSize: '0.8125rem', lineHeight: 1.8, color: '#475569', whiteSpace: 'pre-line' }}>{rec.text}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 4. 종합 전략 제언 */}
                  {recommendations.filter(r => r.category === 'overall').length > 0 && (
                    <div style={{ marginBottom: '1.25rem' }}>
                      <div style={{ 
                        fontSize: '1rem', fontWeight: 700, color: '#7C3AED', marginBottom: '1rem',
                        display: 'flex', alignItems: 'center', gap: '0.5rem',
                        paddingBottom: '0.625rem', borderBottom: '2px solid #EDE9FE'
                      }}>
                        <span style={{ fontSize: '1.125rem' }}>🏆</span> 종합 전략 제언
                      </div>
                      {recommendations.filter(r => r.category === 'overall').map((rec, idx) => (
                        <div key={idx} className="print-recommendation-item" style={{
                          display: 'flex', gap: '1rem', padding: '1.25rem',
                          background: rec.type === 'strength' ? 'linear-gradient(135deg, #ECFDF5 0%, #D1FAE5 100%)' : rec.type === 'weakness' ? 'linear-gradient(135deg, #FFF7ED 0%, #FFEDD5 100%)' : 'linear-gradient(135deg, #FFFBEB 0%, #FEF3C7 100%)',
                          borderRadius: '16px',
                          border: `2px solid ${rec.type === 'strength' ? '#6EE7B7' : rec.type === 'weakness' ? '#FDBA74' : '#FCD34D'}`,
                        }}>
                          <div style={{
                            width: '44px', height: '44px', borderRadius: '12px',
                            background: rec.type === 'strength' ? 'linear-gradient(135deg, #6EE7B7 0%, #34D399 100%)' : rec.type === 'weakness' ? 'linear-gradient(135deg, #FDBA74 0%, #FB923C 100%)' : 'linear-gradient(135deg, #FCD34D 0%, #FBBF24 100%)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '1.25rem', flexShrink: 0,
                          }}>{rec.type === 'strength' ? '🏆' : rec.type === 'weakness' ? '📋' : '📝'}</div>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: '1rem', fontWeight: 700, color: '#1E293B', marginBottom: '0.5rem' }}>{rec.title}</div>
                            <p style={{ margin: 0, fontSize: '0.875rem', lineHeight: 1.7, color: '#475569' }}>{rec.text}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* 추가 안내 */}
                  <div className="print-recommendation-item" style={{
                    marginTop: '1.5rem',
                    padding: '1.25rem',
                    background: 'linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%)',
                    borderRadius: '14px',
                    borderLeft: '4px solid #93C5FD',
                  }}>
                    <p style={{ margin: 0, fontSize: '0.875rem', lineHeight: 1.7, color: '#1E40AF' }}>
                      💡 본 평가 결과는 공교육 시장 진출을 위한 가치 평가 기준에 따라 산출되었습니다. 
                      세부 영역별 개선을 통해 등급 상향이 가능하며, 특히 &quot;개선 필요&quot; 영역의 보완을 권장합니다.
                    </p>
                  </div>
                </div>

                {/* 인쇄용 푸터 - 페이지 3 */}
                <div className="print-footer" style={{ display: 'none' }}>
                  공교육 중심 에듀테크 기업 가치평가 시스템 | © {new Date().getFullYear()}
                </div>
              </div>
              {/* ===== 인쇄 페이지 3 끝 ===== */}

              {/* Actions - 인쇄 시 숨김 */}
              <div className="print-hide" style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                <button
                  className="btn"
                  onClick={() => {
                    setData(createInitialEvaluationData());
                    setCurrentStep('info');
                    setQualificationPassed(null);
                    setChecklistSelections({});
                  }}
                  style={{
                    padding: '1rem 2rem',
                    background: 'white',
                    color: 'var(--gray-700)',
                    border: '2px solid var(--gray-300)',
                    borderRadius: '12px',
                    fontWeight: 600,
                    fontSize: '1rem',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                >
                  🔄 새로운 평가 시작
                </button>
                <button
                  className="btn"
                  onClick={() => window.print()}
                  style={{
                    padding: '1rem 2rem',
                    background: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '12px',
                    fontWeight: 600,
                    fontSize: '1rem',
                    cursor: 'pointer',
                    boxShadow: '0 4px 14px rgba(59, 130, 246, 0.4)',
                    transition: 'all 0.2s ease',
                  }}
                >
                  🖨️ 결과 인쇄하기
                </button>
              </div>
            </div>
          );
        })()}

        {/* Navigation Buttons */}
        {currentStep !== 'result' && (
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2rem' }}>
            <button
              className="btn btn-secondary"
              onClick={goToPrevious}
            >
              ← 이전
            </button>
            <button
              className="btn btn-primary"
              onClick={goToNext}
              disabled={!canProceed()}
              style={{ opacity: !canProceed() ? 0.5 : 1 }}
            >
              {stepIndex === steps.length - 2 ? '결과 확인 →' : '다음 →'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

