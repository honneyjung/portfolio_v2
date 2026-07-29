# 정현희 — Portfolio

퍼블리싱 감각과 프론트엔드 개발 역량을 함께 보여주는 개인 포트폴리오입니다.

**배포 링크**: [hyunhee.shop](https://hyunhee.shop)

## 기술 스택

- **메인 사이트**: HTML5, CSS3, JavaScript (정적 페이지)
- **프론트엔드 프로젝트**: React 19, TypeScript, TanStack Query, Zustand, Vite
- **배포**: Vercel

## 폴더 구조

```
portfolio/
├── index.html            # 메인 포트폴리오 페이지
├── css/                   # 메인 사이트 스타일
├── js/                    # 메인 사이트 스크립트
├── images/                # 이미지, 이력서 등 정적 리소스
├── projects/              # 빌드된 프로젝트 데모 (실제 배포되는 정적 산출물)
│   ├── hemily-health/     # React 앱 빌드 결과물
│   ├── carenation_v2/     # 케어네이션 홈페이지 리뉴얼 퍼블리싱 인덱스
│   ├── care/               # 케어네이션 앱 UI 퍼블리싱 인덱스
│   ├── asan-nanum/         # 아산나눔재단 클론 코딩
│   └── backoffice-executive/ # 경영진 관리자 대시보드
├── react-source/          # React 프로젝트 소스 코드
│   └── hemily-health/      # 헬스케어 플랫폼 프론트엔드 (React 19 + TypeScript)
├── package.json            # 루트 빌드 스크립트
└── vercel.json              # Vercel 배포 설정
```

## 프로젝트 소개

- **헤밀리 헬스**: 헬스케어 플랫폼 프론트엔드 개발 (React 19, TypeScript, TanStack Query, Zustand)
- **케어네이션 홈페이지 리뉴얼 / 앱 UI**: 웹 퍼블리셔로서 담당한 신규 서비스 구축 및 운영 퍼블리싱
- **아산나눔재단 클론 코딩**: 반응형 웹 퍼블리싱 및 슬라이더 UI 구현
- **경영진 관리자 대시보드**: 관리자 대시보드 UI 퍼블리싱

## 빌드

```bash
npm run build
```

`react-source/hemily-health`를 빌드해 `projects/hemily-health/`에 정적 산출물로 복사합니다.
