# CLAUDE.md

---

# 프로젝트 개요: 해밀리 헬스 (Hemily Health)

## 서비스 소개
**비전**: CANCER FREE WORLD — 암 없는 세상
**서비스**: 통합의학 기반 디지털 헬스케어 플랫폼 (암 예방·사후관리)
**레포**: `https://github.com/Hemily-HEALTH/internship.git`

## 핵심 개념: DNA 시스템
| 단계 | 이름 | 역할 |
|------|------|------|
| D | Detox (비움/정화) | 장 청소, 영양 흡수 통로 열기 |
| N | Nutrition (채움/수선) | 유전자 수선, 세포 재건 재료 공급 |
| A | Activation (활성/방어) | 면역 스위치 ON, 염증 차단 |

## 유저 구분
| 유형 | 설명 |
|------|------|
| `hemilian` | 해밀리헬스 네트워크 마케터 — 케이스 관리, 팀 챌린지 개설, 연결 회원 리포트 열람 |
| `hemily_member` | 추천코드로 가입한 일반 회원 — 해밀리안과 리포트·챌린지 공유 (정보공유 동의 시) |
| `cancer` | 암환우 — 암종별 맞춤 리포트, 치료 단계별 제품 |
| `chronic` | 만성질환자 — 질환별 맞춤 리포트 |
| `normal` | 일반인 — 생애주기 × 건강목표 기반 리포트 |

## 서비스 흐름
1. **회원가입** (S-03) — 해밀리안/일반회원 선택, 추천코드 입력, 정보공유 동의
2. **설문** (S-06~S-08) — 건강 유형 → 프로필 → 질환 선택 → 세부 단계
3. **리포트 생성** — D·N·A 단계별 맞춤 제품 추천 (베이직/프리미엄)
4. **챌린지** — 리포트 기반 루틴 체크, 인증샷 AI 인식, 포인트 적립
5. **케이스 스터디** (해밀리안 전용) — 상담 사례 등록·관리

## 주요 화면 (라우팅)
| 경로 | 화면 |
|------|------|
| `/login`, `/signup` | 로그인, 회원가입 |
| `/signup/verify`, `/signup/consent` | 해밀리안 확인, 정보 동의 |
| `/survey` | 설문 (건강 유형 → 질환 → 치료 단계 → 목표) |
| `/report/:id` | D·N·A 맞춤 리포트 상세 |
| `/challenge` | 챌린지 현황 및 인증샷 |
| `/hemilian/*` | 해밀리안 전용 (대시보드, 케이스 관리) |
| `/mypage` | 마이페이지 (리포트/챌린지 이력, 동의 설정) |

## MVP 제외 항목
OCR 정밀 분석, 자동 의료 리포트 생성, 병원/검사기관 연동, 웹 푸시 알림, 포인트 사용 기능

---

# CLAUDE Behavioral Guidelines

Behavioral guidelines to reduce common LLM coding mistakes. Merge with project-specific instructions as needed.

**Tradeoff:** These guidelines bias toward caution over speed. For trivial tasks, use judgment.

## 1. Think Before Coding

**Don't assume. Don't hide confusion. Surface tradeoffs.**

Before implementing:
- State your assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them - don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop. Name what's confusing. Ask.

## 2. Simplicity First

**Minimum code that solves the problem. Nothing speculative.**

- No features beyond what was asked.
- No abstractions for single-use code.
- No "flexibility" or "configurability" that wasn't requested.
- No error handling for impossible scenarios.
- If you write 200 lines and it could be 50, rewrite it.

Ask yourself: "Would a senior engineer say this is overcomplicated?" If yes, simplify.

## 3. Surgical Changes

**Touch only what you must. Clean up only your own mess.**

When editing existing code:
- Don't "improve" adjacent code, comments, or formatting.
- Don't refactor things that aren't broken.
- Match existing style, even if you'd do it differently.
- If you notice unrelated dead code, mention it - don't delete it.

When your changes create orphans:
- Remove imports/variables/functions that YOUR changes made unused.
- Don't remove pre-existing dead code unless asked.

The test: Every changed line should trace directly to the user's request.

## 4. Goal-Driven Execution

**Define success criteria. Loop until verified.**

Transform tasks into verifiable goals:
- "Add validation" → "Write tests for invalid inputs, then make them pass"
- "Fix the bug" → "Write a test that reproduces it, then make it pass"
- "Refactor X" → "Ensure tests pass before and after"

For multi-step tasks, state a brief plan:
```
1. [Step] → verify: [check]
2. [Step] → verify: [check]
3. [Step] → verify: [check]
```

Strong success criteria let you loop independently. Weak criteria ("make it work") require constant clarification.

---

**These guidelines are working if:** fewer unnecessary changes in diffs, fewer rewrites due to overcomplication, and clarifying questions come before implementation rather than after mistakes.

---

# Project-Specific Rules: Hemily Health Frontend

## Stack
React 19, TypeScript, Vite, TailwindCSS, React Router v7, TanStack Query v5, Zustand, Axios, react-i18next.

## Folder Structure
```
frontend/src/
  pages/          # 화면 단위 컴포넌트 (auth/, survey/ 등)
  components/     # 공용 컴포넌트 (layout/MobileShell 등)
  lib/
    api/          # Axios 기반 API 함수
    store/        # Zustand 스토어 (authStore, surveyStore)
    i18n.ts       # i18n 초기화
  locales/        # 번역 파일 (ko/, en/)
  constants/      # 상수 (CANCER_TYPES, CHRONIC_TYPES 등)
  types/          # 글로벌 TypeScript 타입
```

## Design System
- Tailwind 커스텀 토큰: `blue`(#003E7F), `blue-mid`(#C5D6E8), `blue-light`(#EAF0F7), `blue-muted`(#A0B6CE), `blue-btn`(#D2DFED)
- 그라디언트: `bg-gradient-blue` (로그인·가입 제출 버튼)
- 전역 input 클래스: `.input` (h-[49px], pl-6, rounded-[10px], bg-gray-50, border border-blue-mid)
- 레이아웃: `MobileShell` — 모바일/태블릿/데스크탑 반응형 래퍼
- 설문 레이아웃: `SurveyLayout` — 헤더(뒤로가기 + 스텝 인디케이터) + 콘텐츠 + 다음 버튼

## i18n Rules
- 화면에 노출되는 모든 텍스트는 반드시 `useTranslation`을 통해 출력한다.
- 한국어 하드코딩 금지. 번역 키를 먼저 `locales/ko/*.json`에 추가 후 사용.
- 네임스페이스: `auth`, `survey`, `common`, `report`, `hemilian`, `mypage`, `challenge`

## State Management
- 서버 상태: TanStack Query (`useQuery`, `useMutation`)
- 인증 상태: `useAuthStore` (Zustand) — `isLoggedIn`, `user`
- 설문 상태: `useSurveyStore` (Zustand) — gender, birthDate, ageGroup, selectedCancers, selectedChronics 등

## Survey Flow
- 스텝 순서: `health_type → profile → disease → [암 세부] → [만성 세부] → health_goals`
- `getMajorStep()` 으로 서브스텝 → 메이저 스텝(1~3) 매핑
- 각 Step 컴포넌트 공통 Props: `currentStep`, `totalSteps`, `onNext`, `onBack`
- `SurveyLayout`의 `progress` prop은 제거됨 — `currentStep`/`totalSteps` 사용

## Component Rules
- Tailwind 클래스만 사용. 인라인 스타일 금지.
- SVG 디자인 파일이 제공되면 색상·크기·여백을 최대한 맞춘다.
- Figma MCP 연동 전까지 세부 픽셀은 근사치로 구현하고 주석으로 표시.
- 새 컴포넌트 작성 시 불필요한 prop 인터페이스 추가 금지.

## Repo Rules
- 프론트엔드 코드는 `frontend/` 하위에만 작성.
- 공용 유틸/상수 추가 시 `constants/index.ts` 또는 `lib/` 에 위치.
- 라우터 경로 변경 시 `App.tsx`의 `PrivateRoute` 구조 유지.
- 비밀키·토큰을 소스에 하드코딩 금지.
