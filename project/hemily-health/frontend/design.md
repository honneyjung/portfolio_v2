# 해밀리 헬스 — Design System

> 화면 구현 시 이 문서를 기준으로 합니다.  
> Tailwind 클래스명은 `tailwind.config.js`의 커스텀 토큰을 기반으로 합니다.

---

## 1. Color

### Hemily BLUE
| 역할 | HEX | Tailwind 클래스 |
|------|-----|----------------|
| Primary (버튼, 주요 액션, 네비게이션 활성) | `#003E7F` | `bg-blue` / `text-blue` / `border-blue` |
| Secondary (아이콘, 보조 강조) | `#69BBE4` | `bg-blue-mid` / `text-blue-mid` |
| Light (태그 배경, 뱃지 배경) | `#BCE4F8` | `bg-blue-light` / `text-blue-light` |
| Muted (Disabled 상태, 비활성 텍스트) | `#A0B6CE` | `bg-blue-muted` / `text-blue-muted` |

### Hemily RED
| 역할 | HEX | Tailwind 클래스 |
|------|-----|----------------|
| Primary (경고, 삭제, 강조 액션) | `#9D0006` | `bg-red` / `text-red` / `border-red` |
| Secondary (에러 아이콘, 보조) | `#F1C2C0` | `bg-red-mid` / `text-red-mid` |
| Light (에러 입력 배경, 태그 배경) | `#FFE3DD` | `bg-red-light` |
| Muted (Hover 배경) | `#FFF5F2` | `bg-red-muted` |

### Grayscale
| 역할 | HEX | Tailwind 클래스 |
|------|-----|----------------|
| 본문 텍스트 | `#191919` | `text-gray-900` |
| 보조 텍스트, 플레이스홀더 | `#555555` | `text-gray-600` |
| Disabled (비활성 요소) | `#C5C5C5` | `text-gray-300` / `bg-gray-300` |
| 구분선, 입력 배경 | `#F4F4F4` | `bg-gray-100` |
| 카드 배경, 페이지 배경 | `#FCFCFC` | `bg-gray-50` |

---

## 2. Typography

**폰트**: `Pretendard` (전 페이지 공통)

| 역할 | 굵기 | 크기 | Tailwind 클래스 |
|------|------|------|----------------|
| Heading | Bold (700) | 32px | `text-heading font-bold` |
| Title | Bold (700) | 24px | `text-title font-bold` |
| Body Large | Bold / Medium | 21px | `text-body-lg font-bold` or `font-medium` |
| Body Medium | Bold / Medium | 18px | `text-body-md` |
| Body Small | Medium | 16px | `text-body-sm` |
| Label | Medium (500) | 14px | `text-label font-medium` |
| Caption | Regular (400) | 12px | `text-caption` |

---

## 3. Components

### 3-1. Button

#### Filled (Primary)
```
Blue   : bg-blue text-white rounded-lg py-3 px-4 font-bold text-body-sm w-full
Red    : bg-red text-white rounded-lg py-3 px-4 font-bold text-body-sm w-full
```

#### Filled (Disabled)
```
bg-gray-300 text-white rounded-lg py-3 px-4 font-bold text-body-sm w-full cursor-not-allowed
```

#### Outlined
```
Blue     : border border-blue text-blue rounded-lg py-3 px-4 font-bold text-body-sm
Red      : border border-red text-red rounded-lg py-3 px-4 font-bold text-body-sm
Disabled : border border-gray-300 text-gray-300 rounded-lg py-3 px-4 cursor-not-allowed
```

#### Small Text Button
```
Blue     : text-blue text-label font-medium underline-offset-2
Red      : text-red text-label font-medium
Disabled : text-gray-300 text-label cursor-not-allowed
```

#### Loading Button
```
bg-blue text-white rounded-lg py-3 px-4 flex items-center gap-2 (스피너 아이콘 포함)
```

---

### 3-2. Input

#### 기본 입력 필드
```
border border-gray-300 rounded-lg px-4 py-3 text-body-sm text-gray-900
placeholder:text-gray-300 focus:outline-none focus:border-blue w-full bg-white
```

#### 비밀번호 입력 (눈 아이콘 포함)
```
relative
  input: border border-gray-300 rounded-lg px-4 py-3 pr-10 text-body-sm w-full
  icon:  absolute right-3 top-1/2 -translate-y-1/2 text-gray-300
```

#### 날짜 입력
```
border border-gray-300 rounded-lg px-4 py-3 text-body-sm text-gray-300 w-full
(DD/MM/YY 형식)
```

#### 추천인 입력 (화살표 포함)
```
border border-gray-300 rounded-lg px-4 py-3 flex justify-between items-center text-body-sm
text-gray-600 cursor-pointer  (우측 > 화살표 아이콘)
```

#### 에러 상태
```
input : border border-red rounded-lg px-4 py-3 text-body-sm w-full
error : text-red text-caption mt-1 flex items-center gap-1
```

---

### 3-3. Checkbox
```
기본   : w-5 h-5 rounded border border-gray-300 bg-white
체크됨 : w-5 h-5 rounded border border-blue bg-blue (체크 아이콘 white)
텍스트 : text-body-sm text-gray-900 ml-2
```

---

### 3-4. Toggle (Switch)
```
OFF : bg-gray-300 rounded-full w-10 h-6 transition
ON  : bg-blue rounded-full w-10 h-6 transition
thumb : bg-white rounded-full w-5 h-5 shadow
```

---

### 3-5. Dropdown / Select
```
trigger : border border-gray-300 rounded-lg px-4 py-3 flex justify-between items-center text-body-sm
menu    : border border-gray-100 rounded-lg shadow-md bg-white mt-1 z-10
option  : px-4 py-3 text-body-sm text-gray-900 hover:bg-gray-100 cursor-pointer
선택됨  : text-blue font-medium (우측 체크 아이콘)
```

---

### 3-6. Step Indicator (설문 단계)
```
기본   : w-8 h-8 rounded-full bg-gray-100 text-gray-300 text-label font-bold flex items-center justify-center
활성   : w-8 h-8 rounded-full bg-blue text-white text-label font-bold flex items-center justify-center
완료   : w-8 h-8 rounded-full bg-blue-light text-blue text-label font-bold (또는 체크 아이콘)
연결선 : h-px bg-gray-100 flex-1 mx-1
```

---

### 3-7. Badge / Tag
| 종류 | 스타일 |
|------|--------|
| 스타터 | `border border-blue text-blue text-caption font-medium px-2 py-0.5 rounded-full` |
| Basic | `bg-blue-light text-blue text-caption font-medium px-2 py-0.5 rounded-full` |
| Premium | `bg-red-light text-red text-caption font-medium px-2 py-0.5 rounded-full` |
| 일반 칩 (챌린지 항목) | `bg-gray-100 text-gray-600 text-caption px-2 py-0.5 rounded-full` |

---

### 3-8. Bottom Navigation
```
container : fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100
            flex justify-around items-center py-2 z-50

탭 (비활성) :
  icon : text-gray-300 w-6 h-6
  label: text-caption text-gray-300

탭 (활성) :
  icon : text-blue w-6 h-6
  label: text-caption text-blue font-medium
```

**탭 구성** (좌 → 우):
1. 홈 (home 아이콘)
2. 챌린지 (activity 아이콘)
3. 리포트 (document 아이콘)
4. 마이 (person 아이콘)

---

### 3-9. Card

#### 챌린지 대시보드 카드 (진한 파란 배경)
```
bg-blue rounded-2xl p-4 text-white

구성 요소:
  - 상단 라벨 : text-caption text-blue-light "오늘의 달성률"
  - 퍼센트    : text-heading font-bold text-white "45%"
  - 부제      : text-caption text-blue-light
  - 칩 목록   : flex gap-2 flex-wrap mt-2
    칩 스타일 : bg-white/20 text-white text-caption px-2 py-0.5 rounded-full
  - 하단 버튼 : bg-white/10 border border-white/20 rounded-lg px-4 py-2
               text-white text-label flex justify-between items-center mt-3
```

#### 리포트 카드 (흰 배경)
```
bg-white rounded-2xl p-4 border border-gray-100 flex items-center gap-3

구성 요소:
  - 아이콘 : bg-blue-light rounded-xl p-2 (document 아이콘, text-blue)
  - 제목   : text-label font-bold text-gray-900 "나의 맞춤 리포트"
  - 태그   : 인라인 뱃지 (D-N · 기본계 등)
  - 부제   : text-caption text-gray-600
  - 우측 > : text-gray-300
```

#### 알림 / 공지 아이템
```
flex items-start gap-3 py-3

구성 요소:
  - 아이콘 : w-2 h-2 rounded-full bg-orange-400 mt-1.5 flex-shrink-0
  - 텍스트 : text-caption text-gray-600 leading-relaxed
```

---

## 4. Spacing & Layout

```
페이지 기본 패딩 : px-4 (16px 좌우)
카드 내부 패딩  : p-4 (16px)
요소 간 기본 간격: gap-3 (12px) 또는 gap-4 (16px)
버튼 높이       : py-3 (기본), py-2 (소형)
입력 필드 높이  : py-3
하단 네비 높이  : 60px (pb-safe 고려)
```

---

## 5. 아이콘 가이드

- 아이콘 라이브러리: `public/icons.svg` (SVG 스프라이트) 사용
- 기본 크기: `w-6 h-6` (24px)
- 소형: `w-5 h-5` (20px)
- 색상: 부모 요소 색상 상속 (`currentColor`)

---

## 6. 주요 디자인 원칙

1. **색상 일관성**: 주요 액션은 `blue DEFAULT`, 경고/강조는 `red DEFAULT` 사용
2. **Disabled 처리**: 모든 비활성 상태는 `gray-300` (#C5C5C5) 적용
3. **텍스트 계층**: Heading → Title → Body → Label → Caption 순으로 명확히 구분
4. **둥근 모서리**: 버튼·카드·입력 모두 `rounded-lg` (8px) 또는 `rounded-2xl` (16px)
5. **그림자 최소화**: 카드에만 `shadow-sm` 또는 border 사용, 그림자 남용 지양
6. **폰트**: 전 페이지 Pretendard 고정 (이미 tailwind.config에 설정됨)
