# 에듀테크 가치평가 자가진단 웹사이트 - 설치 가이드

## 시스템 요구사항

- **Node.js**: 18.17.0 이상 (권장: 20.x LTS)
- **npm**: 9.x 이상 (Node.js 설치 시 함께 설치됨)
- **운영체제**: Windows, macOS, Linux

## 의존성 패키지

### 프로덕션 의존성 (dependencies)
| 패키지 | 버전 | 설명 |
|--------|------|------|
| next | ^16.0.4 | React 기반 풀스택 웹 프레임워크 |
| react | ^19.1.0 | UI 라이브러리 |
| react-dom | ^19.1.0 | React DOM 렌더링 |

### 개발 의존성 (devDependencies)
| 패키지 | 버전 | 설명 |
|--------|------|------|
| @types/node | ^22.15.29 | Node.js 타입 정의 |
| @types/react | ^19.1.6 | React 타입 정의 |
| @types/react-dom | ^19.1.6 | React DOM 타입 정의 |
| eslint | ^9.28.0 | 코드 린터 |
| eslint-config-next | ^16.0.4 | Next.js ESLint 설정 |
| typescript | ^5.8.3 | TypeScript 컴파일러 |

## 설치 방법

### 1. Node.js 설치

#### Windows
```powershell
# winget 사용 (Windows 10/11)
winget install OpenJS.NodeJS.LTS

# 또는 공식 웹사이트에서 다운로드
# https://nodejs.org/
```

#### Linux (Ubuntu/Debian)
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
```

#### macOS
```bash
# Homebrew 사용
brew install node@20
```

### 2. 프로젝트 클론 및 설치

```bash
# 프로젝트 폴더로 이동
cd "에듀테크 가치평가 웹개발"

# 의존성 설치
npm install
```

### 3. 개발 서버 실행

```bash
# 개발 모드 실행 (http://localhost:3000)
npm run dev
```

### 4. 프로덕션 빌드 및 실행

```bash
# 프로덕션 빌드
npm run build

# 프로덕션 서버 실행
npm run start
```

## 폴더 구조

```
에듀테크 가치평가 웹개발/
├── app/                    # Next.js App Router
│   ├── page.tsx           # 메인 페이지
│   ├── layout.tsx         # 루트 레이아웃
│   ├── globals.css        # 전역 스타일
│   ├── evaluate/          # 평가 페이지
│   │   └── page.tsx
│   └── lib/               # 유틸리티 및 데이터
│       ├── types.ts       # TypeScript 타입 정의
│       ├── evaluationData.ts  # 평가 기준 데이터
│       └── calculateScore.ts  # 점수 계산 로직
├── package.json           # 프로젝트 설정 및 의존성
├── tsconfig.json          # TypeScript 설정
├── next.config.ts         # Next.js 설정
└── INSTALL.md             # 설치 가이드 (이 파일)
```

## 환경 변수 (선택사항)

프로덕션 배포 시 필요한 경우 `.env.local` 파일을 생성:

```env
# 예시 (현재 프로젝트에서는 필요 없음)
# NEXT_PUBLIC_API_URL=https://api.example.com
```

## 문제 해결

### PowerShell 스크립트 실행 오류 (Windows)

```powershell
# 현재 세션에서만 실행 정책 변경
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
```

### 포트 충돌

```bash
# 다른 포트로 실행
npm run dev -- -p 3001
```

### 캐시 문제

```bash
# Next.js 캐시 삭제 후 재빌드
rm -rf .next
npm run build
```

## 배포

### Vercel (권장)
```bash
npm install -g vercel
vercel
```

### Docker
```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

## 라이선스

이 프로젝트는 내부 사용 목적으로 개발되었습니다.

