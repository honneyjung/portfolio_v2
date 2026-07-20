import { useQuery } from '@tanstack/react-query'
import apiClient from '../../lib/api/client'
import ChallengeCreatePage from './ChallengeCreatePage'
import TodayChallengePage, { type CurrentChallenge } from './TodayChallengePage'
import ChallengeEndedPage from './ChallengeEndedPage'
import { useAuthStore } from '../../lib/store/authStore'
import type { Challenge } from '../../types'

const noAutoLogout = { validateStatus: (s: number) => s < 500 }

// 나의(셀프) 챌린지 현황 화면. 함께 챌린지로의 전환은 상단 탭(ChallengeTopTabs)이
// /challenge/teams 로 이동시킨다.
export default function ChallengeHome() {
  const isDemo = useAuthStore((s) => s.accessToken) === '__demo__'

  const { data: currentData, isLoading: currentLoading } = useQuery({
    queryKey: ['challenge-current'],
    queryFn: () => apiClient.get('/challenges/current', noAutoLogout),
    retry: false,
    enabled: !isDemo,
  })
  const hasActive = currentData?.status === 200
  const current = hasActive ? (currentData!.data as unknown as CurrentChallenge) : null

  const { data: histRes, isLoading: histLoading } = useQuery({
    queryKey: ['challenge-history-list'],
    queryFn: () => apiClient.get('/challenges/history', noAutoLogout),
    enabled: !isDemo && !currentLoading && !hasActive,
    retry: false,
  })

  if (!isDemo && (currentLoading || (!hasActive && histLoading))) {
    return <div className="min-h-screen flex items-center justify-center bg-[#F1F5F9]" />
  }

  if (current) {
    return <TodayChallengePage challenge={current} />
  }

  const latestChallenge = histRes?.status === 200
    ? (histRes.data as unknown as { items: Challenge[] })?.items?.[0]
    : null

  if (latestChallenge?.status === 'completed') {
    return <ChallengeEndedPage challenge={latestChallenge} />
  }

  return <ChallengeCreatePage />
}
