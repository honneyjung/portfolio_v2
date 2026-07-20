import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { useAuthStore } from '../../lib/store/authStore'
import AppShell from '../../components/layout/AppShell'
import HemilianBottomNav from '../../components/layout/HemilianBottomNav'
import { hemilianApi } from '../../lib/api/hemilian'
import type { HemilianDashboard, HemilianCaseListItem } from '../../types'

// 네이비 그라디언트 (담당회원 카드·케이스 등록 버튼) — Figma 토큰
const NAVY_GRADIENT = 'linear-gradient(179deg, #003E7F 31.476%, #052649 96.729%)'

// 현재 날짜 → "2026.06.10 수요일"
function formatToday(d: Date): string {
  const p = (n: number) => String(n).padStart(2, '0')
  const weekday = new Intl.DateTimeFormat('ko-KR', { weekday: 'long' }).format(d)
  return `${d.getFullYear()}.${p(d.getMonth() + 1)}.${p(d.getDate())} ${weekday}`
}

const CATEGORY_LABEL: Record<string, string> = {
  cancer:  '암 환우',
  chronic: '만성질환',
  general: '일반 건강관리',
}

function unwrap<T>(res: { data: unknown } | undefined): T | undefined {
  if (!res) return undefined
  const body = res.data as { data?: T } | T | undefined
  if (body && typeof body === 'object' && 'data' in (body as object)) {
    return (body as { data?: T }).data
  }
  return body as T | undefined
}

function formatRelativeDate(dateStr: string | null): string {
  if (!dateStr) return ''
  const diffMs = Date.now() - new Date(dateStr).getTime()
  const diffDays = Math.floor(diffMs / 86400000)
  if (diffDays === 0) return '오늘'
  if (diffDays === 1) return '어제'
  if (diffDays < 7) return `${diffDays}일 전`
  return `${Math.floor(diffDays / 7)}주 전`
}

function Chevron({ color }: { color: string }) {
  return (
    <svg width="8" height="14" viewBox="0 0 8 14" fill="none" className="flex-none">
      <path d="M1 1L7 7L1 13" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function CaseRow({ c, onClick }: { c: HemilianCaseListItem; onClick: () => void }) {
  const initial = c.case_label?.charAt(0) ?? '?'
  const categoryLabel = c.case_category ? (CATEGORY_LABEL[c.case_category] ?? c.case_category) : ''
  const timeLabel = formatRelativeDate(c.created_at)
  return (
    <button type="button" onClick={onClick} className="w-full flex items-center justify-between">
      <div className="flex items-center gap-4">
        <div
          className="flex-none size-[33px] rounded-full flex items-center justify-center text-[14px] font-bold"
          style={{ background: '#D2DEEA', color: '#003E7F' }}
        >
          {initial}
        </div>
        <div className="flex flex-col gap-1 items-start text-left">
          {timeLabel && <p className="text-[12px] font-normal text-[#555]">{timeLabel}</p>}
          <p className="text-[15px] font-bold text-[#191919]">{c.case_label ?? '이름 없음'}</p>
          {categoryLabel && <p className="text-[12px] font-normal text-[#555]">{categoryLabel}</p>}
        </div>
      </div>
      <Chevron color="#003E7F" />
    </button>
  )
}

export default function HemilianPage() {
  const navigate = useNavigate()
  const { t } = useTranslation('hemilian')
  const name = useAuthStore((s) => s.user?.name) ?? ''

  const { data: dashboardRes } = useQuery({
    queryKey: ['hemilian-dashboard'],
    queryFn: () => hemilianApi.getDashboard(),
  })
  const dashboard = unwrap<HemilianDashboard>(dashboardRes)
  const memberCount = dashboard?.assigned_member_count ?? 0
  const challengeCount = dashboard?.active_challenge_count ?? 0

  const { data: casesRes, isLoading: casesLoading } = useQuery({
    queryKey: ['hemilian-cases-recent'],
    queryFn: () => hemilianApi.getCases({ limit: 3 }),
  })
  const recentCases = unwrap<{ items: HemilianCaseListItem[]; total: number }>(casesRes)?.items ?? []

  const topbarLeft = (
    <div>
      <p className="text-[13px] font-normal text-[#64748B]">{formatToday(new Date())}</p>
      <p className="text-[15px] font-bold text-[#1E293B]">
        {t('dashboard.greeting')} {t('dashboard.greetingName', { name })}{t('dashboard.greetingHonorific')}
      </p>
    </div>
  )

  return (
    <AppShell active="home" topbarLeft={topbarLeft}>
      {/* ── 모바일 레이아웃 (md 미만) ───────────────────── */}
      <div className="md:hidden min-h-screen bg-[#F1F5F9]">
        <div className="mx-auto w-full max-w-[480px] min-h-screen flex flex-col px-5 pt-[18px] pb-8">
          {/* 헤더 */}
          <div className="flex items-start justify-between">
            <div className="flex flex-col gap-1">
              <p className="text-[14px] font-medium text-[#64748B] tracking-[-0.14px]">{formatToday(new Date())}</p>
              <div className="text-[24px] font-bold text-[#191919] tracking-[-0.24px] leading-snug">
                <p>{t('dashboard.greeting')}</p>
                <p>
                  <span className="text-[#003E7F]">{t('dashboard.greetingName', { name })}</span>
                  {t('dashboard.greetingHonorific')}
                </p>
              </div>
            </div>
            <button
              type="button"
              aria-label={t('dashboard.notifications')}
              onClick={() => navigate('/notifications')}
              className="flex-none size-[35px] flex items-center justify-center text-[#191919]"
            >
              <svg width="22" height="24" viewBox="0 0 22 24" fill="none">
                <path d="M11 2.5c-3.6 0-6 2.7-6 6.3 0 4.3-1.2 6-2 6.9-.3.3-.1.8.3.8h15.4c.4 0 .6-.5.3-.8-.8-.9-2-2.6-2-6.9 0-3.6-2.4-6.3-6-6.3Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
                <path d="M9 20.5a2 2 0 0 0 4 0" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              </svg>
            </button>
          </div>
          {/* 통계 카드 */}
          <div className="mt-[22px] flex flex-col gap-1">
            <div className="h-[84px] rounded-[10px] p-4 flex flex-col justify-between text-white" style={{ backgroundImage: NAVY_GRADIENT }}>
              <p className="text-[16px] font-medium tracking-[-0.32px]">{t('dashboard.managedMembers')}</p>
              <div className="self-end flex items-baseline gap-1">
                <span className="text-[32px] font-bold leading-none">{memberCount}</span>
                <span className="text-[16px] font-medium tracking-[-0.32px]">{t('dashboard.unit')}</span>
              </div>
            </div>
            <div className="h-[84px] rounded-[10px] p-4 flex flex-col justify-between bg-[#F8FAFF] border border-[#D2DEEA] text-[#003E7F]">
              <p className="text-[16px] font-medium tracking-[-0.32px]">{t('dashboard.challengeInProgress')}</p>
              <div className="self-end flex items-baseline gap-1">
                <span className="text-[32px] font-bold leading-none">{challengeCount}</span>
                <span className="text-[16px] font-medium tracking-[-0.32px]">{t('dashboard.unit')}</span>
              </div>
            </div>
          </div>
          {/* CTA */}
          <button type="button" onClick={() => navigate('/hemilian/unverified')} className="mt-[21px] w-full rounded-full bg-[#69BBE4] py-[15px] flex items-center justify-center gap-3 text-[#F8FAFF] text-[16px] font-medium tracking-[-0.32px]">
            {t('dashboard.unverifiedCases')}
            <Chevron color="#F8FAFF" />
          </button>
          {/* 최근 케이스 */}
          <div className="mt-[34px] flex flex-col gap-3">
            <div className="flex items-end justify-between">
              <p className="text-[16px] font-medium text-[#191919] tracking-[-0.32px]">{t('dashboard.recentCases')}</p>
              <button type="button" onClick={() => navigate('/hemilian/cases')} className="text-[14px] font-medium text-[#191919] tracking-[-0.14px]">{t('dashboard.viewAll')}</button>
            </div>
            <div className="bg-[#F8FAFF] rounded-[10px] px-[17px] py-6 flex flex-col">
              {casesLoading ? (
                <p className="text-[13px] text-[#94A3B8] text-center py-4">불러오는 중...</p>
              ) : recentCases.length === 0 ? (
                <p className="text-[13px] text-[#94A3B8] text-center py-4">최근 케이스가 없어요</p>
              ) : recentCases.map((c, i) => (
                <div key={c.case_id}>
                  {i > 0 && <div className="my-3 h-px bg-[#E2E8F0]" />}
                  <CaseRow c={c} onClick={() => navigate(`/hemilian/cases/${c.case_id}`, { state: { createdAt: c.created_at } })} />
                </div>
              ))}
            </div>
          </div>
          {/* 하단 버튼 */}
          <div className="mt-7 flex flex-col gap-2.5">
            <button type="button" onClick={() => navigate('/hemilian/cases/new')} className="w-full h-[52px] rounded-full flex items-center justify-center text-[#F8FAFF] text-[16px] font-medium tracking-[-0.32px]" style={{ backgroundImage: NAVY_GRADIENT }}>
              {t('dashboard.registerCase')}
            </button>
            <button type="button" onClick={() => navigate('/hemilian/members')} className="w-full h-[52px] rounded-full bg-[#DBEAFE] border border-[#5BA3D9] flex items-center justify-center text-[#191919] text-[16px] font-medium tracking-[-0.32px]">
              {t('dashboard.memberList')}
            </button>
          </div>
        </div>
        <HemilianBottomNav />
      </div>

      {/* ── 데스크탑 레이아웃 (md 이상) ─────────────────── */}
      <div className="hidden md:flex flex-1 flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto px-8 py-6">
          <div className="flex gap-6 items-start">
            {/* 좌측: 최근 상담 케이스 이력 */}
            <div className="flex-1 min-w-0 bg-white rounded-[20px] shadow-[0_2px_12px_rgba(0,0,0,0.05)] p-6">
              <div className="flex items-center justify-between mb-5">
                <p className="text-[16px] font-bold text-[#1E293B]">{t('dashboard.recentCases')}</p>
                <button type="button" onClick={() => navigate('/hemilian/cases')} className="text-[13px] font-medium text-[#64748B] hover:text-[#003E7F]">{t('dashboard.viewAll')}</button>
              </div>
              <div className="flex flex-col">
                {casesLoading ? (
                  <p className="text-[13px] text-[#94A3B8] text-center py-4">불러오는 중...</p>
                ) : recentCases.length === 0 ? (
                  <p className="text-[13px] text-[#94A3B8] text-center py-4">최근 케이스가 없어요</p>
                ) : recentCases.map((c, i) => (
                  <div key={c.case_id}>
                    {i > 0 && <div className="my-4 h-px bg-[#F1F5F9]" />}
                    <CaseRow c={c} onClick={() => navigate(`/hemilian/cases/${c.case_id}`, { state: { createdAt: c.created_at } })} />
                  </div>
                ))}
              </div>
            </div>

            {/* 우측: 통계 + CTA + 버튼 */}
            <div className="w-[300px] lg:w-[340px] flex-none flex flex-col gap-3">
              {/* 담당회원 */}
              <div className="rounded-[16px] p-5 flex items-center justify-between text-white" style={{ backgroundImage: NAVY_GRADIENT }}>
                <p className="text-[15px] font-medium">{t('dashboard.managedMembers')}</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-[28px] font-bold leading-none">{memberCount}</span>
                  <span className="text-[14px] font-medium">{t('dashboard.unit')}</span>
                </div>
              </div>
              {/* 챌린지 진행 중 */}
              <div className="rounded-[16px] p-5 flex items-center justify-between bg-white border border-[#D2DEEA] text-[#003E7F] shadow-[0_2px_12px_rgba(0,0,0,0.05)]">
                <p className="text-[15px] font-medium">{t('dashboard.challengeInProgress')}</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-[28px] font-bold leading-none">{challengeCount}</span>
                  <span className="text-[14px] font-medium">{t('dashboard.unit')}</span>
                </div>
              </div>
              {/* 미확인 케이스 */}
              <button type="button" onClick={() => navigate('/hemilian/unverified')} className="w-full rounded-[12px] bg-[#69BBE4] py-3.5 flex items-center justify-center gap-2 text-white text-[14px] font-medium">
                {t('dashboard.unverifiedCases')}
                <Chevron color="white" />
              </button>
              {/* 하단 액션 버튼 */}
              <div className="flex flex-col gap-2 mt-1">
                <button type="button" onClick={() => navigate('/hemilian/cases/new')} className="w-full h-[46px] rounded-[12px] flex items-center justify-center text-white text-[14px] font-medium" style={{ backgroundImage: NAVY_GRADIENT }}>
                  {t('dashboard.registerCase')}
                </button>
                <button type="button" onClick={() => navigate('/hemilian/members')} className="w-full h-[46px] rounded-[12px] bg-[#DBEAFE] border border-[#5BA3D9] flex items-center justify-center text-[#1E293B] text-[14px] font-medium">
                  {t('dashboard.memberList')}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  )
}
