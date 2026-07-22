import { useState, useEffect } from 'react'
import { useParams, useLocation, useNavigate } from 'react-router-dom'
import { useQuery, useMutation } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import AppShell from '../../components/layout/AppShell'
import HemilianBottomNav from '../../components/layout/HemilianBottomNav'
import { hemilianApi } from '../../lib/api/hemilian'
import { useAuthStore } from '../../lib/store/authStore'
import { queryClient } from '../../lib/queryClient'
import type { HemilianCaseDetail } from '../../types'

const NAVY_GRADIENT = 'linear-gradient(179deg, #003E7F 31.476%, #052649 96.729%)'

function unwrap<T>(res: { data: unknown } | undefined): T | undefined {
  if (!res) return undefined
  const body = res.data as { data?: T } | T | undefined
  if (body && typeof body === 'object' && 'data' in (body as object)) {
    return (body as { data?: T }).data
  }
  return body as T | undefined
}

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  new:       { label: '진행중', color: 'bg-[#9D0006]' },
  following: { label: '진행중', color: 'bg-[#9D0006]' },
  done:      { label: '완료',   color: 'bg-[#2B8E43]' },
}
function getStatus(fs: string | undefined | null) {
  if (!fs) return { label: '보류', color: 'bg-[#BD6B00]' }
  return STATUS_MAP[fs] ?? { label: '보류', color: 'bg-[#BD6B00]' }
}

const MEMBER_LABEL: Record<string, string> = {
  member:     '회원',
  non_member: '비회원',
}
const MEMBER_COLOR: Record<string, string> = {
  member:     'bg-[#003E7F]',
  non_member: 'bg-[#69BBE4]',
}

const CATEGORY_LABEL: Record<string, string> = {
  cancer:  '암 환우',
  chronic: '만성질환',
  general: '일반 건강관리',
}

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}.${p(d.getMonth() + 1)}.${p(d.getDate())}`
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <span className="w-[88px] flex-none text-[13px] font-medium text-[#94A3B8] tracking-[-0.13px]">{label}</span>
      <span className="flex-1 text-[14px] font-medium text-[#191919] tracking-[-0.14px]">{value}</span>
    </div>
  )
}

// ── 챌린지 섹션 (empty state) ────────────────────────────
function ChallengeSection() {
  const { t } = useTranslation('hemilian')
  return (
    <div className="bg-[#EFF6FF] rounded-[14px] p-5">
      <p className="text-[15px] font-bold text-[#003E7F] mb-4">{t('caseDetail.challengeTitle')}</p>
      <div className="flex flex-col items-center justify-center py-6 gap-2">
        <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
          <circle cx="16" cy="16" r="15" stroke="#BFDBFE" strokeWidth="2" />
          <path d="M16 10v6l4 2" stroke="#93C5FD" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <p className="text-[13px] font-medium text-[#94A3B8]">{t('caseDetail.challengeEmpty')}</p>
      </div>
    </div>
  )
}

// ── 메모 섹션 ────────────────────────────────────────────
function MemoSection({
  existingMemo,
  caseId,
}: {
  existingMemo: string | null
  caseId: string
}) {
  const [memoText, setMemoText] = useState(existingMemo ?? '')
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    setMemoText(existingMemo ?? '')
  }, [existingMemo])

  const mutation = useMutation({
    mutationFn: (memo: string) => hemilianApi.updateCase(caseId, { memo }),
    onSuccess: () => {
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
      queryClient.invalidateQueries({ queryKey: ['hemilian-case', caseId] })
    },
  })

  return (
    <div className="flex flex-col gap-3">
      <p className="text-[15px] font-bold text-[#191919]">상담 메모</p>
      {existingMemo && (
        <div className="bg-[#F8FAFF] rounded-[10px] p-4 border border-[#D2DEEA]">
          <p className="text-[14px] text-[#555] leading-relaxed whitespace-pre-wrap">{existingMemo}</p>
        </div>
      )}
      <textarea
        value={memoText}
        onChange={(e) => setMemoText(e.target.value)}
        placeholder="상담 내용을 자유롭게 기록하세요"
        className="w-full rounded-[10px] border border-[#D2DEEA] bg-white px-4 py-3 text-[14px] text-[#191919] placeholder:text-[#C5C5C5] resize-none min-h-[120px] outline-none focus:border-[#003E7F] transition-colors"
      />
      <button
        type="button"
        onClick={() => mutation.mutate(memoText)}
        disabled={mutation.isPending || !memoText.trim()}
        className="w-full h-[48px] rounded-full text-white text-[15px] font-medium tracking-[-0.3px] disabled:opacity-50 transition-opacity"
        style={{ backgroundImage: NAVY_GRADIENT }}
      >
        {mutation.isPending ? '저장 중...' : saved ? '저장 완료!' : '메모 저장'}
      </button>
    </div>
  )
}

// ── CaseDetailPage ────────────────────────────────────────
export default function CaseDetailPage() {
  const { caseId } = useParams<{ caseId: string }>()
  const navigate = useNavigate()
  const { t } = useTranslation('hemilian')
  const location = useLocation()
  const createdAt = (location.state as { createdAt?: string } | null)?.createdAt
  const me = useAuthStore((s) => s.user)

  const { data: caseRes, isLoading } = useQuery({
    queryKey: ['hemilian-case', caseId],
    queryFn: () => hemilianApi.getCaseDetail(caseId!),
    enabled: !!caseId,
  })

  const caseData = unwrap<HemilianCaseDetail>(caseRes)
  const profile = caseData?.case_profile
  const firstReportId = (caseData?.report_links as { report_id?: string }[] | undefined)?.[0]?.report_id ?? null

  const status = getStatus(profile?.followup_status)
  const memberLabel = MEMBER_LABEL[profile?.case_type ?? ''] ?? '비회원'
  const memberColor = MEMBER_COLOR[profile?.case_type ?? ''] ?? 'bg-[#69BBE4]'
  const categoryLabel = profile?.case_category ? (CATEGORY_LABEL[profile.case_category] ?? profile.case_category) : '미분류'
  const initial = profile?.case_label?.charAt(0) ?? '?'

  const topbarLeft = (
    <div className="flex items-center gap-3">
      <button type="button" onClick={() => navigate(-1)} className="flex-none size-8 rounded-full hover:bg-[#F1F5F9] flex items-center justify-center transition-colors">
        <svg width="8" height="14" viewBox="0 0 8 14" fill="none"><path d="M7 1L1 7L7 13" stroke="#64748B" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
      </button>
      <p className="text-[17px] font-bold text-[#1E293B]">{t('caseDetail.title')}</p>
    </div>
  )

  if (isLoading) {
    return (
      <AppShell active="home" topbarLeft={topbarLeft}>
        <div className="flex items-center justify-center h-40">
          <p className="text-[14px] text-[#94A3B8]">{t('caseDetail.loading')}</p>
        </div>
      </AppShell>
    )
  }

  if (!profile) {
    return (
      <AppShell active="home" topbarLeft={topbarLeft}>
        <div className="flex flex-col items-center justify-center h-40 gap-3">
          <p className="text-[14px] text-[#94A3B8]">{t('caseDetail.notFound')}</p>
          <button
            type="button"
            onClick={() => navigate('/hemilian/cases')}
            className="text-[14px] font-medium text-[#003E7F]"
          >
            {t('caseDetail.backLink')}
          </button>
        </div>
      </AppShell>
    )
  }

  const profileContent = (
    <div className="flex flex-col gap-5">
      {/* 아바타 + 이름 + 배지 */}
      <div className="flex items-center gap-4">
        <div
          className="flex-none size-[64px] rounded-full flex items-center justify-center text-[24px] font-bold text-[#003E7F]"
          style={{ background: '#D2DEEA' }}
        >
          {initial}
        </div>
        <div className="flex flex-col gap-2">
          <p className="text-[20px] font-bold text-[#191919] tracking-[-0.4px]">
            {profile.case_label}
          </p>
          <div className="flex items-center gap-1.5">
            <span className={`px-2.5 h-[24px] flex items-center rounded-full text-[13px] font-medium text-white ${memberColor}`}>
              {memberLabel}
            </span>
            <span className={`px-2.5 h-[24px] flex items-center rounded-full text-[13px] font-medium text-white ${status.color}`}>
              {status.label}
            </span>
          </div>
        </div>
      </div>

      {/* 정보 행 */}
      <div className="flex flex-col gap-[10px] pl-1">
        <InfoRow label={t('caseDetail.labelCategory')} value={categoryLabel} />
        <InfoRow label={t('caseDetail.labelHemilian')} value={me?.name ?? ''} />
        {createdAt && <InfoRow label={t('caseDetail.labelRegisteredAt')} value={formatDate(createdAt)} />}
      </div>
    </div>
  )

  return (
    <AppShell active="home" topbarLeft={topbarLeft}>
      {/* ── 모바일 (md 미만) ────────────────────────────── */}
      <div className="md:hidden flex flex-col bg-[#F1F5F9] min-h-screen">
        <div className="mx-auto w-full max-w-[480px] px-5 pt-5 pb-24">
          {/* 헤더 */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-[9px]">
              <button type="button" onClick={() => navigate(-1)} aria-label="뒤로가기">
                <svg width="10" height="17" viewBox="0 0 10 17" fill="none">
                  <path d="M8.5 1.5L1.5 8.5L8.5 15.5" stroke="#191919" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
              <button type="button" onClick={() => navigate('/hemilian')} aria-label="홈으로">
                <svg width="19" height="20" viewBox="0 0 17 18" fill="none">
                  <path d="M1 6.5L8.5 1L16 6.5V16.5C16 16.7652 15.8946 17.0196 15.7071 17.2071C15.5196 17.3946 15.2652 17.5 15 17.5H11V12.5H6V17.5H2C1.73478 17.5 1.48043 17.3946 1.29289 17.2071C1.10536 17.0196 1 16.7652 1 16.5V6.5Z"
                    stroke="#191919" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>
            <p className="text-[18px] font-bold text-[#1E293B]">{t('caseDetail.title')}</p>
            <div className="w-8" />
          </div>

          {/* 프로필 */}
          <div className="bg-white rounded-[16px] p-5 mb-4">
            {profileContent}
          </div>

          {/* 챌린지 */}
          <div className="mb-4">
            <ChallengeSection />
          </div>

          {/* 메모 */}
          <div className="bg-white rounded-[16px] p-5 mb-4">
            <MemoSection existingMemo={profile.memo} caseId={caseId!} />
          </div>

          {/* CTA */}
          <button
            type="button"
            onClick={() => firstReportId && navigate(`/report/${firstReportId}`)}
            disabled={!firstReportId}
            className="w-full h-[52px] rounded-full text-white text-[16px] font-medium tracking-[-0.32px] disabled:opacity-40"
            style={{ backgroundImage: NAVY_GRADIENT }}
          >
            {firstReportId ? t('caseDetail.viewReport') : t('caseDetail.noReport')}
          </button>
        </div>
        <HemilianBottomNav />
      </div>

      {/* ── 데스크탑 (md 이상) ──────────────────────────── */}
      <div className="hidden md:flex flex-1 flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto px-8 py-6">
          {/* 2열 레이아웃 */}
          <div className="flex gap-6 items-start max-w-[1000px]">
            {/* 왼쪽: 메모 */}
            <div className="flex-1 min-w-0 flex flex-col gap-4">
              <div className="bg-white rounded-[20px] shadow-[0_2px_12px_rgba(0,0,0,0.05)] p-6">
                <MemoSection existingMemo={profile.memo} caseId={caseId!} />
              </div>
              <ChallengeSection />
            </div>

            {/* 오른쪽: 프로필 + CTA */}
            <div className="w-[300px] lg:w-[340px] flex-none flex flex-col gap-4">
              <div className="bg-white rounded-[20px] shadow-[0_2px_12px_rgba(0,0,0,0.05)] p-6">
                {profileContent}
              </div>
              <button
                type="button"
                onClick={() => firstReportId && navigate(`/report/${firstReportId}`)}
                disabled={!firstReportId}
                className="w-full h-[48px] rounded-[12px] text-white text-[15px] font-medium tracking-[-0.3px] disabled:opacity-40"
                style={{ backgroundImage: NAVY_GRADIENT }}
              >
                {firstReportId ? t('caseDetail.viewReport') : t('caseDetail.noReport')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  )
}
