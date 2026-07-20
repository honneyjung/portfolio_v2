# 해밀리 헬스 — 프론트엔드

## 기술 스택

| 분류 | 라이브러리 |
|------|-----------|
| UI | React 19 + TypeScript |
| 빌드 | Vite |
| 스타일 | TailwindCSS |
| 라우팅 | React Router v7 |
| 서버 상태 | TanStack Query v5 |
| 클라이언트 상태 | Zustand |
| HTTP | Axios |
| 배포 | Vercel |

## 시작하기

```bash
# 패키지 설치
npm install

# 환경변수 설정
cp .env.example .env
# .env에서 VITE_API_URL을 백엔드 서버 주소로 변경

# 개발 서버 실행 (http://localhost:5173)
npm run dev

# 프로덕션 빌드
npm run build

# 빌드 결과물 미리보기
npm run preview
```

## 환경변수

```env
VITE_API_URL=http://localhost:8000   # 백엔드 API 서버 주소
```

## 프로젝트 구조

```
src/
├── lib/
│   ├── api/           # API 호출 모듈 (도메인별 분리)
│   │   ├── client.ts       # Axios 인스턴스 (baseURL, 인터셉터)
│   │   ├── auth.ts         # 회원가입 / 로그인 / 로그아웃
│   │   ├── users.ts        # 프로필 / 해밀리안 매니저 / 동의
│   │   ├── survey.ts       # 설문 / 질병·치료단계 마스터
│   │   ├── report.ts       # 리포트 생성·조회·비교
│   │   ├── product.ts      # 제품 목록 / 사용자 제품 CRUD
│   │   ├── challenge.ts    # 챌린지 / 체크인 / 팀
│   │   ├── recognition.ts  # 인증샷 업로드·검토
│   │   ├── point.ts        # 포인트 지갑·내역
│   │   ├── notification.ts # 알림
│   │   ├── hemilian.ts     # 해밀리안 전용 (대시보드·회원·케이스)
│   │   └── mypage.ts       # 마이페이지
│   └── store/
│       ├── authStore.ts    # 인증 상태 (Zustand)
│       └── surveyStore.ts  # 설문 진행 상태 (Zustand)
├── pages/
│   ├── auth/          # 로그인 / 회원가입
│   ├── survey/        # 설문 플로우
│   ├── report/        # 리포트 상세
│   ├── challenge/     # 챌린지
│   ├── hemilian/      # 해밀리안 전용 페이지
│   ├── mypage/        # 마이페이지
│   └── HomePage.tsx
└── types/
    └── index.ts       # 전체 도메인 타입 정의
```

## 라우팅

| 경로 | 페이지 | 접근 권한 |
|------|--------|----------|
| `/login` | 로그인 | 공개 |
| `/signup` | 회원가입 | 공개 |
| `/` | 홈 | 로그인 필요 |
| `/survey/*` | 설문 | 로그인 필요 |
| `/report/:id` | 리포트 | 로그인 필요 |
| `/challenge/*` | 챌린지 | 로그인 필요 |
| `/mypage` | 마이페이지 | 로그인 필요 |
| `/hemilian/*` | 해밀리안 페이지 | 해밀리안 계정 전용 |

## 유저 타입

| 타입 | 설명 |
|------|------|
| `hemilian` | 해밀리안 (사업자) |
| `hemily_member` | 해밀리 회원 (추천코드 가입) |
| `cancer` | 암환우 |
| `chronic` | 만성질환자 |
| `normal` | 일반인 (예방·관리) |
