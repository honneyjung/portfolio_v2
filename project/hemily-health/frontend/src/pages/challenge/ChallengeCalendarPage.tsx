import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import AppShell from '../../components/layout/AppShell'
import BottomNav from '../../components/layout/BottomNav'
import Header from '../../components/layout/Header'
import apiClient from '../../lib/api/client'

const noAutoLogout = { validateStatus: (s: number) => s < 500 }
const WEEKDAYS = ['월', '화', '수', '목', '금', '토', '일']

type DailyRate = { date: string; submitted: boolean; daily_rate: number }
type Progress = {
  challenge_id: string
  start_date: string
  end_date: string
  overall_rate: number
  daily_rates: DailyRate[]
}

function pad(n: number) {
  return String(n).padStart(2, '0')
}
function todayStr() {
  const d = new Date()
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

// 반원 게이지 (모바일)
function SemiGauge({ rate }: { rate: number }) {
  const len = Math.PI * 110
  const offset = len * (1 - Math.min(100, Math.max(0, rate)) / 100)
  return (
    <div className="relative w-[253px] h-[150px]">
      <svg width="253" height="150" viewBox="0 0 253 150" fill="none">
        <defs>
          <linearGradient id="histGauge" x1="16" y1="130" x2="237" y2="130" gradientUnits="userSpaceOnUse">
            <stop stopColor="#5BA3D9" />
            <stop offset="1" stopColor="#003E7F" />
          </linearGradient>
        </defs>
        <path d="M16 132 A110 110 0 0 1 237 132" stroke="#DBEAFE" strokeWidth="22" strokeLinecap="round" />
        <path d="M16 132 A110 110 0 0 1 237 132" stroke="url(#histGauge)" strokeWidth="22" strokeLinecap="round" strokeDasharray={len} strokeDashoffset={offset} />
      </svg>
      <p className="absolute inset-0 flex items-center justify-center pt-6 text-[42px] font-bold text-[#003E7F]">{rate}%</p>
    </div>
  )
}

export default function ChallengeCalendarPage() {
  const { t } = useTranslation('challenge')
  const navigate = useNavigate()

  // 최근 챌린지 → 진행률(일별) 조회
  const { data: histRes } = useQuery({
    queryKey: ['challenge-history-list'],
    queryFn: () => apiClient.get('/challenges/history', noAutoLogout),
    retry: false,
  })
  const latestChallengeId = histRes?.status === 200
    ? (histRes.data as unknown as { items: { challenge_id: string }[] })?.items?.[0]?.challenge_id
    : undefined

  const { data: progRes } = useQuery({
    queryKey: ['challenge-progress', latestChallengeId],
    queryFn: () => apiClient.get(`/challenges/${latestChallengeId}/progress`, noAutoLogout),
    enabled: !!latestChallengeId,
    retry: false,
  })
  const progress: Progress | undefined = progRes?.status === 200
    ? (progRes.data as unknown as Progress)
    : undefined

  // 날짜별 달성률 맵 (제출된 날만)
  const rateByDate = useMemo(() => {
    const m = new Map<string, number>()
    for (const r of progress?.daily_rates ?? []) {
      if (r.submitted) m.set(r.date, r.daily_rate)
    }
    return m
  }, [progress])

  // 표시 월 (기본: 이번 달)
  const now = new Date()
  const [view, setView] = useState<{ y: number; m: number }>({ y: now.getFullYear(), m: now.getMonth() })

  const grid = useMemo(() => {
    const first = new Date(view.y, view.m, 1)
    const daysInMonth = new Date(view.y, view.m + 1, 0).getDate()
    const leadBlanks = (first.getDay() + 6) % 7 // 월요일 시작
    const cells: (number | null)[] = []
    for (let i = 0; i < leadBlanks; i++) cells.push(null)
    for (let d = 1; d <= daysInMonth; d++) cells.push(d)
    while (cells.length % 7 !== 0) cells.push(null)
    return cells
  }, [view])

  // 월별 평균 (최근 3개월)
  const monthlyAvgs = useMemo(() => {
    const sums: Record<string, { total: number; count: number }> = {}
    for (const r of progress?.daily_rates ?? []) {
      if (!r.submitted) continue
      const key = r.date.slice(0, 7) // YYYY-MM
      if (!sums[key]) sums[key] = { total: 0, count: 0 }
      sums[key].total += r.daily_rate
      sums[key].count += 1
    }
    const result: { label: string; rate: number; isCurrent: boolean }[] = []
    for (let i = 2; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const key = `${d.getFullYear()}-${pad(d.getMonth() + 1)}`
      const agg = sums[key]
      result.push({
        label: i === 0 ? t('historyPage.thisMonth') : `${d.getFullYear()}.${pad(d.getMonth() + 1)}`,
        rate: agg ? Math.round(agg.total / agg.count) : 0,
        isCurrent: i === 0,
      })
    }
    return result
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [progress, t])

  const avgRate = progress?.overall_rate ?? 0
  const today = todayStr()

  // ── 캘린더 ──
  const Calendar = (
    <div className="bg-[#F8FAFF] md:bg-white rounded-[10px] md:rounded-[16px] md:shadow-[0_2px_12px_rgba(0,0,0,0.05)] px-3 py-5 md:px-6 md:py-5">
      <div className="flex items-center justify-center gap-3 mb-4">
        <button type="button" onClick={() => setView((v) => ({ ...(v.m === 0 ? { y: v.y - 1, m: 11 } : { y: v.y, m: v.m - 1 }) }))} aria-label="이전 달" className="p-1">
          <svg width="8" height="14" viewBox="0 0 8 14" fill="none"><path d="M7 1L1 7L7 13" stroke="#64748B" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </button>
        <span className="text-[16px] font-bold text-[#1E293B] tracking-[-0.32px]">{view.y}년 {view.m + 1}월</span>
        <button type="button" onClick={() => setView((v) => ({ ...(v.m === 11 ? { y: v.y + 1, m: 0 } : { y: v.y, m: v.m + 1 }) }))} aria-label="다음 달" className="p-1">
          <svg width="8" height="14" viewBox="0 0 8 14" fill="none"><path d="M1 1L7 7L1 13" stroke="#64748B" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </button>
      </div>
      <div className="grid grid-cols-7 mb-1">
        {WEEKDAYS.map((w) => (
          <div key={w} className="text-center text-[12px] font-semibold text-[#64748B] py-1">{w}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-y-1">
        {grid.map((d, i) => {
          if (d === null) return <div key={i} />
          const dateStr = `${view.y}-${pad(view.m + 1)}-${pad(d)}`
          const done = rateByDate.has(dateStr)
          const isToday = dateStr === today
          return (
            <div key={i} className="flex items-center justify-center h-[44px] md:h-[48px]">
              <div className={`w-9 h-9 flex items-center justify-center rounded-full text-[14px] ${
                done
                  ? 'bg-[#003E7F] text-white font-medium'
                  : isToday
                    ? 'border-2 border-[#003E7F] text-[#003E7F] font-medium'
                    : 'text-[#94A3B8] font-medium'
              }`}>
                {d}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )

  // ── 일일 달성률 ──
  const DailyRateMobile = (
    <div className="flex flex-col items-center gap-6">
      <p className="text-[16px] font-medium text-[#555] tracking-[-0.32px] self-start">{t('historyPage.dailyRate')}</p>
      <SemiGauge rate={avgRate} />
    </div>
  )

  const DailyRateWeb = (
    <div className="bg-white rounded-[16px] shadow-[0_2px_12px_rgba(0,0,0,0.05)] p-6">
      <p className="text-[15px] font-bold text-[#1E293B] mb-4">{t('historyPage.dailyRate')}</p>
      <div className="flex flex-col items-center py-2">
        <div className="bg-[#DBEAFE] rounded-full w-[160px] h-[80px] flex items-center justify-center">
          <span className="text-[32px] font-bold text-[#003E7F]">{avgRate}%</span>
        </div>
        <p className="text-[12px] text-[#64748B] mt-3">{t('historyPage.avgRate')}</p>
      </div>
    </div>
  )

  // ── 최근 3개월 변화 ──
  const Recent3m = (
    <div className="flex flex-col gap-[18px] md:bg-white md:rounded-[16px] md:shadow-[0_2px_12px_rgba(0,0,0,0.05)] md:p-6">
      <p className="text-[16px] md:text-[14px] font-medium md:font-bold text-[#555] md:text-[#1E293B] tracking-[-0.32px]">{t('historyPage.recent3m')}</p>
      <div className="grid grid-cols-3 gap-[19px] md:gap-3">
        {monthlyAvgs.map((mm) => (
          <div
            key={mm.label}
            className={`rounded-[10px] md:rounded-[12px] h-[90px] md:h-[88px] flex flex-col items-center justify-center gap-2 ${
              mm.isCurrent ? 'text-[#F8FAFF]' : 'bg-[#F8FAFF] md:bg-[#F1F5F9] text-[#1E293B]'
            }`}
            style={mm.isCurrent ? { backgroundImage: 'linear-gradient(176deg, #003E7F 31.476%, #052649 96.729%)' } : undefined}
          >
            <span className="text-[30px] md:text-[22px] font-bold tracking-[-0.3px]">{mm.rate}%</span>
            <span className={`text-[16px] md:text-[11px] font-medium ${mm.isCurrent ? '' : 'text-[#64748B]'}`}>{mm.label}</span>
          </div>
        ))}
      </div>
    </div>
  )

  const TimelineLink = latestChallengeId ? (
    <button
      type="button"
      onClick={() => navigate(`/challenge/timeline/self/${latestChallengeId}`)}
      className="w-full h-[48px] rounded-full bg-white border border-[#003E7F] text-[#003E7F] text-[14px] font-bold"
    >
      인증·루틴 타임라인 보기
    </button>
  ) : null

  return (
    <AppShell active="challenge" topbarLeft={<span className="text-[17px] font-bold text-[#1E293B]">{t('historyPage.title')}</span>}>
      {/* 모바일 헤더 */}
      <div className="md:hidden">
        <Header showBack title={<span className="text-[18px] font-bold text-[#1E293B]">{t('historyPage.title')}</span>} />
      </div>

      <div className="flex-1 flex flex-col bg-[#F1F5F9] overflow-hidden md:overflow-visible">
        <div className="flex-1 overflow-y-auto px-5 pt-2 pb-6 md:px-8 md:py-6">
          {/* 모바일: 단일 컬럼 */}
          <div className="md:hidden flex flex-col gap-16 pt-2">
            <div className="flex flex-col gap-9">
              {Calendar}
              {DailyRateMobile}
            </div>
            {Recent3m}
            {TimelineLink}
          </div>

          {/* 웹: 2컬럼 */}
          <div className="hidden md:grid md:grid-cols-[1.15fr_1fr] md:gap-9 md:items-start md:max-w-[1200px]">
            <div>{Calendar}</div>
            <div className="flex flex-col gap-6">
              {DailyRateWeb}
              {Recent3m}
              {TimelineLink}
            </div>
          </div>

          {!latestChallengeId && (
            <p className="text-center text-[14px] text-[#94A3B8] mt-10">{t('historyPage.empty')}</p>
          )}
        </div>

        <div className="md:hidden">
          <BottomNav active="challenge" />
        </div>
      </div>
    </AppShell>
  )
}
