import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import AppShell from '../components/layout/AppShell'
import BottomNav from '../components/layout/BottomNav'
import { mypageApi } from '../lib/api/mypage'
import { challengeApi } from '../lib/api/challenge'
import { useAuthStore } from '../lib/store/authStore'
import apiClient from '../lib/api/client'
import type { MypageSummary, ChallengeHistoryItem, Team, RoutineItem } from '../types'

const noAutoLogout = { validateStatus: (s: number) => s < 500 }

const ROUTINE_LABELS: Record<string, string> = {
  PRODUCT: '제품 섭취', WATER: '알칼리 이온수', EXERCISE: '운동하기',
  MEAL: '식사 체크', SLEEP: '수면 체크', CONDITION: '몸 상태',
  GRATITUDE: '5감사 일기', INNER_REFLECTION: '내면 성찰',
}

// 백엔드 응답이 { success, data } 래퍼 또는 flat 둘 다 올 수 있어 방어적으로 언랩
function unwrap<T>(res: { data: unknown }): T | undefined {
  const body = res?.data as { data?: T } | T | undefined
  if (body && typeof body === 'object' && 'data' in (body as object)) {
    return (body as { data?: T }).data
  }
  return body as T | undefined
}

// 오늘 날짜 "2026.05.27 수요일"
function formatToday(): string {
  const d = new Date()
  const days = ['일', '월', '화', '수', '목', '금', '토']
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}.${m}.${day} ${days[d.getDay()]}요일`
}

// 이번 주(월~일) 날짜 배열
function thisWeekDates(): Date[] {
  const today = new Date()
  const dow = (today.getDay() + 6) % 7 // 월=0 … 일=6
  const monday = new Date(today)
  monday.setDate(today.getDate() - dow)
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    return d
  })
}

const ymd = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

// ── 오늘의 루틴 카드 ───────────────────────────────────
function RoutineCard({ routineItems, todayRate }: { routineItems: RoutineItem[]; todayRate?: number }) {
  const { t } = useTranslation('home')
  const navigate = useNavigate()

  const total = routineItems.length
  const done = routineItems.filter((r) => r.isChecked).length
  const rate = todayRate !== undefined ? todayRate : (total > 0 ? Math.round((done / total) * 100) : 0)

  // 챌린지가 없으면 시작 유도
  if (total === 0) {
    return (
      <div
        className="rounded-[10px] px-5 py-4 flex flex-col gap-4"
        style={{ background: 'linear-gradient(177.4deg, #003E7F 31.5%, #052649 96.7%)' }}
      >
        <p className="text-[14px] font-medium text-[#F8FAFF]">{t('routine.title')}</p>
        <p className="text-[16px] font-medium text-[#93AFC7]">{t('routine.empty')}</p>
        <button
          type="button"
          onClick={() => navigate('/challenge')}
          className="bg-[#F8FAFF] rounded-[10px] px-4 py-[10px] flex items-center justify-between"
        >
          <span className="text-[16px] font-bold text-[#003E7F]">{t('routine.start')}</span>
          <svg width="6" height="10" viewBox="0 0 6 10" fill="none">
            <path d="M1 1L5 5L1 9" stroke="#003E7F" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>
    )
  }

  return (
    <div
      className="rounded-[10px] px-5 py-4 flex flex-col gap-4"
      style={{ background: 'linear-gradient(177.4deg, #003E7F 31.5%, #052649 96.7%)' }}
    >
      {/* 달성률 */}
      <div className="flex flex-col gap-[6px]">
        <p className="text-[14px] font-medium text-[#F8FAFF] tracking-[-0.14px]">{t('routine.title')}</p>
        <div className="flex items-end gap-[6px]">
          <span className="text-[42px] font-bold text-[#F8FAFF] leading-none">{rate}%</span>
          <span className="text-[14px] font-medium text-[#93AFC7] tracking-[-0.14px] pb-1">
            {t('routine.rateLabel')}・{t('routine.missions', { total, done })}
          </span>
        </div>
      </div>

      {/* 진행 바 */}
      <div className="h-2 w-full bg-[#F1F5F9] rounded-[10px] overflow-hidden">
        <div className="h-2 bg-[#5BA3D9] rounded-[10px]" style={{ width: `${rate}%` }} />
      </div>

      {/* 루틴 칩 */}
      <div className="flex flex-wrap gap-[6px]">
        {routineItems.slice(0, 4).map((r) =>
          r.isChecked ? (
            <span key={r.id} className="bg-[#DBEAFE] rounded-full px-[11px] py-[7px] flex items-center gap-[5px]">
              <svg width="12" height="10" viewBox="0 0 13 10" fill="none">
                <path d="M1 5L4.5 8.5L11.5 1.5" stroke="#003E7F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span className="text-[14px] font-medium text-[#003E7F] tracking-[-0.14px]">{r.name}</span>
            </span>
          ) : (
            <span key={r.id} className="border border-[#DBEAFE] rounded-full px-[10px] py-[7px]">
              <span className="text-[14px] font-medium text-[#DBEAFE] tracking-[-0.14px]">{r.name}</span>
            </span>
          ),
        )}
      </div>

      {/* CTA */}
      <button
        type="button"
        onClick={() => navigate('/challenge')}
        className="bg-[#F8FAFF] rounded-[10px] pl-4 pr-3 py-[10px] flex items-center justify-between"
      >
        <span className="text-[16px] font-bold text-[#003E7F] tracking-[-0.16px]">{t('routine.cta')}</span>
        <svg width="6" height="10" viewBox="0 0 6 10" fill="none">
          <path d="M1 1L5 5L1 9" stroke="#003E7F" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
    </div>
  )
}

// ── 이번 주 챌린지 현황 카드 ───────────────────────────
function WeekCard({ history }: { history: ChallengeHistoryItem[] }) {
  const { t } = useTranslation('home')
  const days = t('week.days', { returnObjects: true }) as string[]
  const week = thisWeekDates()
  const todayStr = ymd(new Date())
  const byDate = new Map(history.map((h) => [h.log_date?.slice(0, 10), h.completion_rate]))

  return (
    <div className="bg-[#F8FAFF] rounded-[10px] px-5 py-4 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-[16px] font-bold text-black tracking-[-0.32px]">{t('week.title')}</p>
      </div>
      <div className="flex gap-[7px] items-center justify-between">
        {week.map((d, i) => {
          const key = ymd(d)
          const rate = byDate.get(key) ?? 0
          const completed = rate > 0
          return (
            <div key={key} className="flex flex-col gap-2 items-center flex-1">
              <span className="text-[14px] font-medium text-[#64748B] tracking-[-0.14px]">{days[i]}</span>
              {completed ? (
                <div className="h-10 w-full max-w-[40px] rounded-[20px] bg-[#003E7F] flex items-center justify-center">
                  <svg width="14" height="11" viewBox="0 0 14 11" fill="none">
                    <path d="M1 5.5L5 9.5L13 1.5" stroke="#F8FAFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              ) : (
                <div
                  className={`h-10 w-full max-w-[40px] rounded-[20px] border-[1.5px] flex items-center justify-center ${
                    key === todayStr ? 'border-[#003E7F]' : 'border-[#003E7F]'
                  }`}
                >
                  <span className="text-[14px] font-semibold text-[#003E7F] tracking-[-0.28px]">{d.getDate()}</span>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── 맞춤 리포트 요약 카드 ──────────────────────────────
function ReportCard({ summary }: { summary?: MypageSummary }) {
  const { t } = useTranslation('home')
  const navigate = useNavigate()
  const report = summary?.latest_report

  // 리포트 없으면 설문 유도
  if (!report) {
    return (
      <button
        type="button"
        onClick={() => navigate('/survey')}
        className="bg-[#F8FAFF] border-[0.5px] border-[#93AFC7] rounded-[20px] shadow-[4px_4px_7.7px_rgba(0,0,0,0.04)] px-5 py-4 flex items-center justify-between"
      >
        <div className="flex items-center gap-[13px]">
          <div className="bg-[#DBEAFE] rounded-[10px] size-[54px] flex items-center justify-center">
            <ReportIcon />
          </div>
          <div className="flex flex-col gap-1 items-start">
            <span className="text-[16px] font-bold text-[#1E293B]">{t('report.title')}</span>
            <span className="text-[14px] font-medium text-[#64748B]">{t('report.empty')}</span>
          </div>
        </div>
        <Chevron />
      </button>
    )
  }

  // 질환·단계 칩 + 추천 제품 수 (응답 스키마가 유동적이라 방어적으로 추출)
  const snap = (report.result_snapshot ?? {}) as Record<string, unknown>
  const diseases = (snap.diseases as Array<{ name: string }> | undefined)?.map((x) => x.name) ?? []
  const stage =
    typeof snap.treatment_stage === 'string'
      ? snap.treatment_stage
      : typeof snap.disease_stage === 'string'
        ? snap.disease_stage
        : ''
  const chipText = [diseases[0], stage].filter(Boolean).join('・')

  const basic = report.basicProducts?.length ?? 0
  const reportId = report.id

  return (
    <button
      type="button"
      onClick={() => reportId && navigate(`/report/${reportId}`)}
      className="bg-[#F8FAFF] border-[0.5px] border-[#93AFC7] rounded-[20px] shadow-[4px_4px_7.7px_rgba(0,0,0,0.04)] px-5 py-4 flex items-center justify-between"
    >
      <div className="flex items-center gap-[13px]">
        <div className="bg-[#DBEAFE] rounded-[10px] size-[54px] flex items-center justify-center">
          <ReportIcon />
        </div>
        <div className="flex flex-col gap-[6px] items-start">
          <span className="text-[16px] font-bold text-[#1E293B]">{t('report.title')}</span>
          <div className="flex items-center gap-[9px]">
            {chipText && (
              <span className="bg-[#FFE3DD] rounded-full px-[10px] py-[6px] text-[12px] font-semibold text-[#9D0006] tracking-[-0.48px] whitespace-nowrap">
                {chipText}
              </span>
            )}
            {basic > 0 && (
              <span className="text-[14px] font-medium text-[#64748B] tracking-[-0.14px] whitespace-nowrap">
                {t('report.recommend', { tier: 'Basic', count: basic })}
              </span>
            )}
          </div>
        </div>
      </div>
      <Chevron />
    </button>
  )
}

// ── 함께 챌린지 카드 ───────────────────────────────────
function TeamCard({ team }: { team: Team }) {
  const { t } = useTranslation('home')
  const navigate = useNavigate()
  const members = team.members ?? []
  const progress = team.progress ?? 0
  const avatarColors = ['#2B8E43', '#235AB1', '#235AB1', '#235AB1']

  return (
    <button
      type="button"
      onClick={() => navigate('/challenge')}
      className="bg-[#003E7F] rounded-[10px] px-5 py-4 flex flex-col gap-3 text-left"
    >
      <div className="flex items-start justify-between w-full">
        <div className="flex flex-col gap-2 items-start">
          <span className="border border-[#DBEAFE] rounded-[40px] px-2 py-1 text-[11px] font-medium text-[#DBEAFE] leading-[1.3] tracking-[-0.33px]">
            {t('team.together')}
          </span>
          <p className="text-[24px] font-bold text-[#F8FAFF] tracking-[-0.24px]">{team.team_name}</p>
        </div>
        {/* 멤버 아바타 */}
        <div className="flex">
          {members.slice(0, 4).map((m, i) => (
            <div
              key={m.userId ?? i}
              className="size-6 rounded-full border-2 border-[#003E7F] flex items-center justify-center text-[11px] font-semibold"
              style={{ marginLeft: i === 0 ? 0 : -8, background: '#DBEAFE', color: avatarColors[i] ?? '#235AB1' }}
            >
              {m.name?.[0] ?? ''}
            </div>
          ))}
        </div>
      </div>

      {/* 진행률 */}
      <div className="flex flex-col gap-2 w-full">
        <div className="flex items-center justify-between">
          <span className="text-[12px] text-[#F8FAFF]">{t('team.participants', { count: members.length })}</span>
          <span className="text-[12px] text-[#DBEAFE]">{t('team.progress', { rate: progress })}</span>
        </div>
        <div className="h-1 w-full bg-[#F8FAFF] rounded-[5px] overflow-hidden">
          <div className="h-1 bg-[#5BA3D9] rounded-[5px]" style={{ width: `${progress}%` }} />
        </div>
      </div>
    </button>
  )
}

// ── 아이콘 ─────────────────────────────────────────────
function ReportIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
      <path d="M14 3H7C6.46957 3 5.96086 3.21071 5.58579 3.58579C5.21071 3.96086 5 4.46957 5 5V19C5 19.5304 5.21071 20.0391 5.58579 20.4142C5.96086 20.7893 6.46957 21 7 21H17C17.5304 21 18.0391 20.7893 18.4142 20.4142C18.7893 20.0391 19 19.5304 19 19V8L14 3Z"
        stroke="#003E7F" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M14 3V8H19M15 13H9M15 16H9" stroke="#003E7F" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function Chevron() {
  return (
    <svg width="8" height="14" viewBox="0 0 8 14" fill="none">
      <path d="M1 1L7 7L1 13" stroke="#64748B" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

// ── HomePage ───────────────────────────────────────────
export default function HomePage() {
  const { t } = useTranslation('home')
  const navigate = useNavigate()
  const authUser = useAuthStore((s) => s.user)

  const { data: summaryRes } = useQuery({
    queryKey: ['mypage', 'summary'],
    queryFn: () => mypageApi.getSummary(),
  })
  const summary = summaryRes ? unwrap<MypageSummary>(summaryRes) : undefined

  const { data: teamsRes } = useQuery({
    queryKey: ['challenge', 'teams'],
    queryFn: () => challengeApi.getMyTeams(),
  })
  const teams = teamsRes ? unwrap<{ items: Team[] }>(teamsRes)?.items ?? [] : []
  const team = teams[0]

  const { data: currentChallengeRes } = useQuery({
    queryKey: ['challenge-current'],
    queryFn: () => apiClient.get('/challenges/current', noAutoLogout),
    retry: false,
  })
  type CurrentSummary = { challenge_id: string; selected_routines: string[]; today: { today_daily_rate: number } }
  const currentChallenge = currentChallengeRes?.status === 200
    ? (currentChallengeRes.data as unknown as CurrentSummary)
    : null

  const { data: progressRes } = useQuery({
    queryKey: ['challenge-progress', currentChallenge?.challenge_id],
    queryFn: () => apiClient.get(`/challenges/${currentChallenge!.challenge_id}/progress`, noAutoLogout),
    enabled: !!currentChallenge?.challenge_id,
    retry: false,
  })
  type DailyRateItem = { date: string; daily_rate: number }
  const history: ChallengeHistoryItem[] = progressRes?.status === 200
    ? ((progressRes.data as unknown as { daily_rates?: DailyRateItem[] })?.daily_rates ?? [])
        .map((r) => ({ log_date: r.date, completion_rate: r.daily_rate }))
    : []

  const userName = authUser?.name ?? summary?.me?.name ?? ''
  const routineItems: RoutineItem[] = currentChallenge
    ? currentChallenge.selected_routines.map((key) => ({
        id: key, name: ROUTINE_LABELS[key] ?? key, category: 'custom' as const, isChecked: false,
      }))
    : (summary?.latest_challenge as unknown as { routineItems?: RoutineItem[] } | null)?.routineItems ?? []
  const todayRate = currentChallenge?.today?.today_daily_rate

  // 데스크탑 상단바 좌측: 날짜 + 인사
  const topbarLeft = (
    <div>
      <p className="text-[13px] font-normal text-[#64748B]">{formatToday()}</p>
      <p className="text-[15px] font-bold text-[#1E293B]">
        {t('greeting')}
        {userName}
        {t('greetingSuffix')}
      </p>
    </div>
  )

  return (
    <AppShell active="home" topbarLeft={topbarLeft}>
      <div className="flex-1 flex flex-col overflow-hidden md:overflow-visible">
        <div className="flex-1 overflow-y-auto px-5 pt-5 pb-6 flex flex-col gap-4 md:overflow-visible md:px-8 md:py-6">
          {/* 헤더: 날짜 + 인사 + 알림 — 모바일만 (md+는 상단바) */}
          <div className="flex items-start justify-between md:hidden">
            <div className="flex flex-col gap-1">
              <p className="text-[14px] font-medium text-[#64748B] tracking-[-0.14px]">{formatToday()}</p>
              <p className="text-[24px] font-bold text-[#191919] tracking-[-0.24px]">
                {t('greeting')}
                <span className="text-[#003E7F]">{userName}</span>
                {t('greetingSuffix')}
              </p>
            </div>
            <button type="button" aria-label="알림" className="mt-1" onClick={() => navigate('/notifications')}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M18 8A6 6 0 1 0 6 8c0 7-3 9-3 9h18s-3-2-3-9Z" stroke="#191919" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" stroke="#191919" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>

          {/* 카드: 모바일·태블릿 세로 스택 / 데스크탑(lg) 2열(오늘의 루틴 + 우측 컬럼) */}
          <div className="flex flex-col gap-4 lg:flex-row lg:gap-6 lg:items-start">
            <div className="lg:flex-1 lg:min-w-0">
              <RoutineCard routineItems={routineItems} todayRate={todayRate} />
            </div>
            <div className="flex flex-col gap-4 lg:w-[476px] lg:flex-none">
              <WeekCard history={history} />
              <ReportCard summary={summary} />
              {team && <TeamCard team={team} />}
            </div>
          </div>
        </div>

        {/* 하단 탭 — 모바일만 */}
        <div className="md:hidden">
          <BottomNav active="home" />
        </div>
      </div>
    </AppShell>
  )
}
