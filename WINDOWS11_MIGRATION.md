# Windows 11 마이그레이션 및 규칙 준수 가이드

## 개요

본 문서는 공교육 중심 에듀테크 기업 가치평가 웹페이지를 Windows 11 환경에 적합하게 수정하고, 프로젝트 규칙(rule.mdc) 및 사용자 규칙에 맞게 개선한 내용을 설명합니다.

## 주요 변경 사항

### 1. Windows 11 호환성 개선

#### 1.1 package.json
- **Node.js 엔진 버전 명시**: `engines` 필드 추가 (Node.js >= 18.0.0, npm >= 9.0.0)
- **타입 체크 스크립트 추가**: `type-check` 스크립트 추가

#### 1.2 TypeScript 설정 (tsconfig.json)
- **타겟 버전 업그레이드**: ES2017 → ES2020
- **라이브러리 추가**: ES2020 라이브러리 추가로 최신 JavaScript 기능 지원

#### 1.3 Next.js 설정 (next.config.ts)
- **React Strict Mode 활성화**: 개발 시 잠재적 문제 조기 발견
- **SWC Minify 활성화**: 빌드 성능 최적화
- **TypeScript/ESLint 빌드 검사**: 빌드 시 타입 및 린트 오류 검사
- **Standalone 출력**: 프로덕션 배포 최적화
- **패키지 최적화**: React, React-DOM 자동 최적화

#### 1.4 배치 파일 개선
- **UTF-8 인코딩 설정**: Windows 11에서 한글 표시 개선
- **Node.js 버전 확인**: 실행 전 Node.js 설치 및 버전 확인
- **에러 처리 강화**: 각 단계별 에러 처리 및 사용자 피드백
- **의존성 자동 확인**: node_modules 존재 여부 확인 및 자동 설치

### 2. 규칙 준수 (rule.mdc 및 User Rules)

#### 2.1 API-Driven 아키텍처 준비
프로젝트 규칙에 따라 평가 로직을 서버 사이드로 분리할 수 있는 API 라우트 구조를 추가했습니다.

**추가된 API 엔드포인트:**

1. **POST /api/v1/evaluation/calculate**
   - 평가 데이터를 받아 점수를 계산하고 결과를 반환
   - Request: `{ evaluationData: EvaluationData }`
   - Response: `{ success: boolean, data: EvaluationResult }`
   - Error: 400 (Validation Error), 500 (Internal Server Error)

2. **GET /api/v1/evaluation/model**
   - 평가 모델의 구조와 기준을 반환
   - Response: `{ success: boolean, data: { version, basicQualification, companyCapability, ... } }`
   - 버전 관리: 모델 버전 1.0.0

3. **POST /api/v1/evaluation/validate**
   - 평가 데이터의 유효성을 검증
   - Request: `{ evaluationData: EvaluationData }`
   - Response: `{ success: boolean, data: { isValid, basicQualificationPassed, validationErrors } }`

#### 2.2 API 설계 원칙
- **버전 관리**: 모든 API는 `/api/v1/` 경로로 버전 관리
- **명확한 스키마**: Request/Response 스키마 명시
- **에러 처리**: 일관된 에러 응답 형식
  ```json
  {
    "success": false,
    "error": {
      "code": "ERROR_CODE",
      "message": "Human-readable message",
      "details": {}
    }
  }
  ```
- **서버 사이드 로직**: 점수 계산 로직은 서버에서 실행

### 3. 향후 개선 사항

#### 3.1 인증 및 권한 관리
- JWT 또는 API Key 기반 인증 추가
- 역할 기반 접근 제어 (EdTech Company User, Evaluator/Researcher, Admin)

#### 3.2 데이터 영속성
- 평가 결과 저장 기능 (현재는 1회용 진단)
- 평가 이력 관리

#### 3.3 모델 버전 관리
- 평가 모델 버전별 결과 비교 기능
- 모델 변경 이력 추적

## 설치 및 실행

### 사전 요구사항
- Windows 11
- Node.js 18.0.0 이상
- npm 9.0.0 이상

### 설치
```bash
npm install
```

### 개발 서버 실행
```bash
# 방법 1: 배치 파일 사용 (권장)
start.bat

# 방법 2: npm 스크립트 사용
npm run dev
```

### 프로덕션 빌드
```bash
npm run build
npm start
```

## API 사용 예시

### 평가 점수 계산
```typescript
const response = await fetch('/api/v1/evaluation/calculate', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    evaluationData: {
      // EvaluationData 객체
    },
  }),
});

const result = await response.json();
```

### 평가 모델 조회
```typescript
const response = await fetch('/api/v1/evaluation/model');
const model = await response.json();
```

### 데이터 유효성 검증
```typescript
const response = await fetch('/api/v1/evaluation/validate', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    evaluationData: {
      // EvaluationData 객체
    },
  }),
});

const validation = await response.json();
```

## 변경 이력

- **2025-01-XX**: Windows 11 마이그레이션 및 규칙 준수 개선
  - package.json 엔진 버전 명시
  - TypeScript ES2020 타겟 업그레이드
  - Next.js 설정 최적화
  - 배치 파일 개선
  - API 라우트 구조 추가

## 참고 사항

- 현재 클라이언트 사이드 로직은 그대로 유지되며, API는 선택적으로 사용 가능합니다.
- 향후 완전한 API-driven 아키텍처로 전환 시 클라이언트 코드를 API 호출로 변경할 수 있습니다.
- 모든 API는 버전 관리되며, Breaking Change 시 새로운 버전(v2)을 추가해야 합니다.





