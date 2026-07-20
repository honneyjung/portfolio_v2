import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import AppShell from '../../components/layout/AppShell'
import BottomNav from '../../components/layout/BottomNav'
import Header from '../../components/layout/Header'
import ChallengeTopTabs from '../../components/challenge/ChallengeTopTabs'
import apiClient from '../../lib/api/client'
import type { Challenge } from '../../types'

const noAutoLogout = { validateStatus: (s: number) => s < 500 }

type DailyRate = { date: string; submitted: boolean; daily_rate: number }
type Progress = { challenge_id: string; overall_rate: number; daily_rates: DailyRate[] }

function daysBetween(start?: string | null, end?: string | null) {
  if (!start || !end) return 0
  const diff = new Date(end).getTime() - new Date(start).getTime()
  return Math.max(1, Math.round(diff / (1000 * 60 * 60 * 24)) + 1)
}

function maxConsecutive(rates: DailyRate[]) {
  const sorted = [...rates].sort((a, b) => a.date.localeCompare(b.date))
  let max = 0, cur = 0
  for (const r of sorted) {
    if (r.submitted) { cur++; max = Math.max(max, cur) }
    else cur = 0
  }
  return max
}

function formatDateRange(start?: string | null, end?: string | null) {
  if (!start || !end) return ''
  return `${start.slice(0, 10).replace(/-/g, '.')} ~ ${end.slice(0, 10).replace(/-/g, '.')}`
}

export default function ChallengeEndedPage({ challenge }: { challenge: Challenge }) {
  const { t } = useTranslation('challenge')
  const navigate = useNavigate()

  const { data: progRes } = useQuery({
    queryKey: ['challenge-progress', challenge.challenge_id],
    queryFn: () => apiClient.get(`/challenges/${challenge.challenge_id}/progress`, noAutoLogout),
    retry: false,
  })
  const progress: Progress | undefined =
    progRes?.status === 200 ? (progRes.data as unknown as Progress) : undefined

  const title = challenge.goal_description || t('ended.defaultTitle')
  const overallRate = progress?.overall_rate ?? 0
  const submittedCount = useMemo(
    () => (progress?.daily_rates ?? []).filter((r) => r.submitted).length,
    [progress],
  )
  const durationDays = daysBetween(challenge.start_date, challenge.end_date)
  const consecutive = useMemo(() => maxConsecutive(progress?.daily_rates ?? []), [progress])
  const dateRange = formatDateRange(challenge.start_date, challenge.end_date)

  const mobileStats = [
    { label: t('ended.statDuration'), value: `${durationDays}일` },
    { label: t('ended.statMissions'), value: `${submittedCount}회` },
    { label: t('ended.statRate'), value: `${overallRate}%` },
  ]

  const webStats = [
    { label: t('ended.statMissions'), value: `${submittedCount}회` },
    { label: t('ended.statConsecutive'), value: `${consecutive}일` },
    { label: t('ended.statRate'), value: `${overallRate}%` },
  ]

  return (
    <AppShell
      active="challenge"
      topbarLeft={<span className="text-[17px] font-bold text-[#1E293B]">{t('ended.topTitle')}</span>}
    >
      {/* 모바일 헤더 */}
      <div className="md:hidden">
        <Header showBack title={<span className="text-[17px] font-bold text-[#1E293B]">{t('ended.topTitle')}</span>} />
      </div>

      {/* ── 모바일 ── */}
      <div className="md:hidden flex flex-col flex-1 bg-[#F1F5F9] overflow-hidden">
        <div className="flex-1 overflow-y-auto px-5 pt-4 pb-6 flex flex-col gap-8">
          <ChallengeTopTabs active="mine" />
          {/* 이모지 + 제목 */}
          <div className="flex flex-col gap-2 mt-4">
            <span className="text-[56px] leading-none">🎉</span>
            <p className="text-[24px] font-bold text-[#191919] tracking-[-0.24px] mt-2">
              {t('ended.title')}
            </p>
            <p className="text-[16px] font-medium text-black tracking-[-0.32px]">
              {t('ended.subtitle')}
            </p>
          </div>

          {/* 보상 카드 */}
          <div
            className="flex items-center justify-between bg-[#DBEAFE] rounded-[15px] px-6 py-[17px]"
            style={{ boxShadow: '7px 4px 2px rgba(0,0,0,0.02)' }}
          >
            <p className="text-[16px] tracking-[-0.32px]">
              <span className="font-medium text-[#191919]">{t('ended.rewardLabel')} </span>
              <span className="font-bold text-[#003E7F]">{t('ended.rewardSuffix')}</span>
            </p>
            <p className="text-[24px] font-bold text-[#003E7F] tracking-[-0.48px]">+ 100P</p>
          </div>

          {/* 통계 카드 3개 */}
          <div className="grid grid-cols-3 gap-3">
            {mobileStats.map((s) => (
              <div
                key={s.label}
                className="bg-[#003E7F] rounded-[16px] flex flex-col items-center justify-center gap-1 py-[19px] px-2"
              >
                <p className="text-[24px] font-bold text-white">{s.value}</p>
                <p className="text-[12px] text-[#DBEAFE] tracking-[-0.24px] text-center">{s.label}</p>
              </div>
            ))}
          </div>

          {/* 버튼 3개 */}
          <div className="flex flex-col gap-[9px]">
            <button
              type="button"
              onClick={() => navigate('/survey')}
              className="h-[52px] rounded-full flex items-center justify-center text-[#F8FAFF] text-[16px] font-medium tracking-[-0.32px]"
              style={{ backgroundImage: 'linear-gradient(179deg, #003E7F 31.476%, #052649 96.729%)' }}
            >
              {t('ended.btnSurvey')}
            </button>
            <button
              type="button"
              onClick={() => navigate('/mypage/reports')}
              className="h-[52px] rounded-full bg-[#69BBE4] flex items-center justify-center text-[#F8FAFF] text-[16px] font-medium tracking-[-0.32px]"
            >
              {t('ended.btnReport')}
            </button>
            <button
              type="button"
              onClick={() => navigate('/mypage/points')}
              className="h-[52px] rounded-full border border-[#5BA3D9] bg-[#DBEAFE] flex items-center justify-center text-[#191919] text-[16px] font-medium tracking-[-0.32px]"
            >
              {t('ended.btnPoints')}
            </button>
          </div>
        </div>

        <BottomNav active="challenge" />
      </div>

      {/* ── 웹 ── */}
      <div className="hidden md:flex md:flex-col bg-[#F1F5F9] px-8 py-6 gap-5 flex-1 overflow-y-auto">
        <div className="flex flex-col gap-5 max-w-[860px] w-full">
          <ChallengeTopTabs active="mine" />
          {/* 배너 카드 */}
          <div className="bg-[#003E7F] rounded-[20px] h-[200px] flex flex-col justify-center px-8 gap-2">
            <p className="text-[26px] font-bold text-white">{durationDays}일간의 챌린지 완료!</p>
            <p className="text-[15px] text-white/80">
              {t('ended.webBannerSub', { rate: overallRate })}
            </p>
            <p className="text-[12px] text-white/55 mt-auto pt-2">
              {title} · {dateRange}
            </p>
          </div>

          {/* 통계 카드 3개 */}
          <div className="grid grid-cols-3 gap-4">
            {webStats.map((s) => (
              <div
                key={s.label}
                className="bg-white rounded-[16px] h-[88px] flex flex-col items-center justify-center gap-2 shadow-[0_2px_12px_rgba(0,0,0,0.05)]"
              >
                <p className="text-[22px] font-bold text-[#003E7F]">{s.value}</p>
                <p className="text-[12px] text-[#64748B]">{s.label}</p>
              </div>
            ))}
          </div>

          {/* 버튼 2개 */}
          <div className="grid grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => navigate('/challenge/create')}
              className="h-[52px] rounded-full bg-[#003E7F] text-white text-[14px] font-bold"
            >
              {t('ended.btnNewChallenge')}
            </button>
            <button
              type="button"
              onClick={() => navigate('/mypage/reports')}
              className="h-[52px] rounded-full border border-[#94A3B8] bg-[#F1F5F9] text-[#64748B] text-[14px] font-bold"
            >
              {t('ended.btnReport')}
            </button>
          </div>

          {/* 공유 카드 */}
          <div className="bg-white rounded-[16px] h-[100px] flex items-center justify-between px-6 shadow-[0_2px_12px_rgba(0,0,0,0.05)]">
            <div>
              <p className="text-[15px] font-bold text-[#1E293B]">{t('ended.shareTitle')}</p>
              <p className="text-[13px] text-[#64748B] mt-1">{t('ended.shareDesc')}</p>
            </div>
            <button
              type="button"
              className="h-[36px] px-5 rounded-full bg-[#DBEAFE] text-[#003E7F] text-[14px] font-bold flex-shrink-0"
            >
              {t('ended.shareBtn')}
            </button>
          </div>
        </div>
      </div>
    </AppShell>
  )
}
