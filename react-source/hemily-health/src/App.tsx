import { useEffect, lazy, Suspense } from 'react'
import { HashRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'

import { queryClient } from './lib/queryClient'
import { isRTL } from './lib/i18n'
import { useAuthStore } from './lib/store/authStore'
import apiClient from './lib/api/client'

import LoginPage        from './pages/auth/LoginPage'
import SignupPage       from './pages/auth/SignupPage'
import VerifyPage       from './pages/auth/VerifyPage'
import ConsentPage      from './pages/auth/ConsentPage'
import HemilianLinkPage from './pages/auth/HemilianLinkPage'
import HomePage      from './pages/HomePage'
import NotificationsPage from './pages/NotificationsPage'
import SurveyPage    from './pages/survey/SurveyPage'
import ReportPage    from './pages/report/ReportPage'
import ReportIndexPage from './pages/report/ReportIndexPage'
import ReportComparePage from './pages/report/ReportComparePage'
import ReportDetailPage from './pages/report/ReportDetailPage'
import ChallengeHome from './pages/challenge/ChallengeHome'
import ChallengeCreatePage from './pages/challenge/ChallengeCreatePage'
import ChallengeProductsPage from './pages/challenge/ChallengeProductsPage'
import ChallengeCalendarPage from './pages/challenge/ChallengeCalendarPage'
import ChallengeRecognitionPage from './pages/challenge/ChallengeRecognitionPage'
import ChallengeTimelinePage from './pages/challenge/ChallengeTimelinePage'
import ChallengeRecognitionResultPage from './pages/challenge/ChallengeRecognitionResultPage'
import ChallengeProductResultPage from './pages/challenge/ChallengeProductResultPage'
import ChallengeTogetherPage from './pages/challenge/ChallengeTogetherPage'
import ChallengeTogetherDetailPage from './pages/challenge/ChallengeTogetherDetailPage'
import ChallengeTogetherCreatePage from './pages/challenge/ChallengeTogetherCreatePage'
import MyPage        from './pages/mypage/MyPage'
import ReportHistoryPage from './pages/mypage/ReportHistoryPage'
import ChallengeHistoryPage from './pages/mypage/ChallengeHistoryPage'
import ConsentSettingsPage from './pages/mypage/ConsentSettingsPage'
import ManagerSettingsPage from './pages/mypage/ManagerSettingsPage'
import PointHistoryPage from './pages/mypage/PointHistoryPage'
import HemilianPage  from './pages/hemilian/HemilianPage'
import HemilianMyPage from './pages/hemilian/HemilianMyPage'
import HemilianGradePage from './pages/hemilian/HemilianGradePage'
import CaseListPage   from './pages/hemilian/CaseListPage'
import CaseDetailPage from './pages/hemilian/CaseDetailPage'
import CaseCreatePage from './pages/hemilian/CaseCreatePage'
import MemberListPage from './pages/hemilian/MemberListPage'
import MemberDetailPage from './pages/hemilian/MemberDetailPage'
import UnverifiedCasesPage from './pages/hemilian/UnverifiedCasesPage'

// 개발용 프리뷰 — 모듈 로드 시 authStore에 mock 토큰을 시드하는 사이드이펙트가 있으므로
// 반드시 lazy 로 불러와 /preview/* 진입 시에만 실행되도록 한다 (실제 로그인 상태 오염 방지)
const HomePagePreview   = lazy(() => import('./pages/HomePagePreview'))
const SurveyPreview     = lazy(() => import('./pages/survey/SurveyPreview'))
const ReportPagePreview = lazy(() => import('./pages/report/ReportPagePreview'))
const MyPagePreview     = lazy(() => import('./pages/mypage/MyPagePreview'))

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => { window.scrollTo(0, 0) }, [pathname])
  return null
}

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn)
  return isLoggedIn ? <>{children}</> : <Navigate to="/login" replace />
}

function HemilianRoute({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((s) => s.user)
  if (!user) return <Navigate to="/login" replace />
  if (user.userType !== 'hemilian') return <Navigate to="/" replace />
  return <>{children}</>
}

function HomeRoute() {
  const user = useAuthStore((s) => s.user)
  if (user?.userType === 'hemilian') return <Navigate to="/hemilian" replace />
  return <HomePage />
}

function MypageRoute() {
  const user = useAuthStore((s) => s.user)
  if (user?.userType === 'hemilian') return <HemilianMyPage />
  return <MyPage />
}

function I18nProvider({ children }: { children: React.ReactNode }) {
  const { i18n } = useTranslation()

  // 언어 변경 시 html dir/lang 속성 자동 업데이트 (아랍어 RTL 대응)
  useEffect(() => {
    const lang = i18n.language
    document.documentElement.lang = lang
    document.documentElement.dir = isRTL(lang) ? 'rtl' : 'ltr'
  }, [i18n.language])

  return <>{children}</>
}

// 토큰 유효성 검증 — 만료/무효 토큰(401)이면 자동 로그아웃
// 네트워크 오류·서버 재시작 등은 무시 (로그인 상태 유지)
function TokenValidator() {
  const { isLoggedIn, logout } = useAuthStore()

  useEffect(() => {
    if (!isLoggedIn) return
    // 프리뷰 라우트 또는 mock 토큰이면 검증 건너뜀
    if (window.location.pathname.startsWith('/preview')) return
    const raw = localStorage.getItem('hemily-auth')
    const token = raw ? JSON.parse(raw)?.state?.accessToken : null
    if (token === 'preview-token') return
    apiClient.get('/auth/me').catch((err) => {
      if (err.response?.status === 401) logout()
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return null
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <I18nProvider>
        <HashRouter>
          <ScrollToTop />
          <TokenValidator />
          <Suspense fallback={null}>
          <Routes>
            <Route path="/login"  element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/signup/hemilian-link" element={<HemilianLinkPage />} />
            <Route path="/signup/verify" element={<PrivateRoute><VerifyPage /></PrivateRoute>} />
            <Route path="/consent" element={<ConsentPage />} />
            <Route path="/" element={<PrivateRoute><HomeRoute /></PrivateRoute>} />
            <Route path="/notifications" element={<PrivateRoute><NotificationsPage /></PrivateRoute>} />
            <Route path="/survey/*" element={<PrivateRoute><SurveyPage /></PrivateRoute>} />
            <Route path="/report" element={<PrivateRoute><ReportIndexPage /></PrivateRoute>} />
            <Route path="/report/:id" element={<PrivateRoute><ReportPage /></PrivateRoute>} />
            <Route path="/report/:id/comparison" element={<PrivateRoute><ReportComparePage /></PrivateRoute>} />
            <Route path="/report/:id/detail" element={<PrivateRoute><ReportDetailPage /></PrivateRoute>} />
            <Route path="/challenge/create" element={<PrivateRoute><ChallengeCreatePage /></PrivateRoute>} />
            <Route path="/challenge/products" element={<PrivateRoute><ChallengeProductsPage /></PrivateRoute>} />
            <Route path="/challenge/history" element={<PrivateRoute><ChallengeCalendarPage /></PrivateRoute>} />
            <Route path="/challenge/timeline/:type/:id" element={<PrivateRoute><ChallengeTimelinePage /></PrivateRoute>} />
            <Route path="/challenge/recognition" element={<PrivateRoute><ChallengeRecognitionPage /></PrivateRoute>} />
            <Route path="/challenge/recognition/result" element={<PrivateRoute><ChallengeRecognitionResultPage /></PrivateRoute>} />
            <Route path="/challenge/recognition/product-result" element={<PrivateRoute><ChallengeProductResultPage /></PrivateRoute>} />
            <Route path="/challenge/teams/create" element={<PrivateRoute><ChallengeTogetherCreatePage /></PrivateRoute>} />
            <Route path="/challenge/teams/:teamId" element={<PrivateRoute><ChallengeTogetherDetailPage /></PrivateRoute>} />
            <Route path="/challenge/teams" element={<PrivateRoute><ChallengeTogetherPage /></PrivateRoute>} />
            <Route path="/challenge/*" element={<PrivateRoute><ChallengeHome /></PrivateRoute>} />
            <Route path="/mypage" element={<PrivateRoute><MypageRoute /></PrivateRoute>} />
            <Route path="/mypage/reports" element={<PrivateRoute><ReportHistoryPage /></PrivateRoute>} />
            <Route path="/mypage/challenges" element={<PrivateRoute><ChallengeHistoryPage /></PrivateRoute>} />
            <Route path="/mypage/consent" element={<PrivateRoute><ConsentSettingsPage /></PrivateRoute>} />
            <Route path="/mypage/manager" element={<PrivateRoute><ManagerSettingsPage /></PrivateRoute>} />
            <Route path="/mypage/points" element={<PrivateRoute><PointHistoryPage /></PrivateRoute>} />
            <Route path="/hemilian/grade" element={<HemilianRoute><HemilianGradePage /></HemilianRoute>} />
            <Route path="/hemilian/unverified" element={<HemilianRoute><UnverifiedCasesPage /></HemilianRoute>} />
            <Route path="/hemilian/members" element={<HemilianRoute><MemberListPage /></HemilianRoute>} />
            <Route path="/hemilian/members/:memberId" element={<HemilianRoute><MemberDetailPage /></HemilianRoute>} />
            <Route path="/hemilian/cases/new" element={<HemilianRoute><CaseCreatePage /></HemilianRoute>} />
            <Route path="/hemilian/cases" element={<HemilianRoute><CaseListPage /></HemilianRoute>} />
            <Route path="/hemilian/cases/:caseId" element={<HemilianRoute><CaseDetailPage /></HemilianRoute>} />
            <Route path="/hemilian/*" element={<HemilianRoute><HemilianPage /></HemilianRoute>} />
            <Route path="/preview/home" element={<HomePagePreview />} />
            <Route path="/preview/home/view" element={<HomePage />} />
            <Route path="/preview/report" element={<ReportPagePreview />} />
            <Route path="/preview/report/:id" element={<ReportPage />} />
            <Route path="/preview/mypage" element={<MyPagePreview />} />
            <Route path="/preview/mypage/view" element={<MyPage />} />
            <Route path="/preview/survey" element={<SurveyPreview />} />
            <Route path="/preview/mypage/notifications" element={<NotificationsPage />} />
            <Route path="/preview/mypage/points" element={<PointHistoryPage />} />
            <Route path="/preview/mypage/consent" element={<ConsentSettingsPage />} />
            <Route path="/preview/mypage/manager" element={<ManagerSettingsPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          </Suspense>
        </HashRouter>
      </I18nProvider>
    </QueryClientProvider>
  )
}
