import { useParams, useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { useState, useRef, useEffect } from 'react'
import AppShell from '../../components/layout/AppShell'
import Header from '../../components/layout/Header'
import BottomNav from '../../components/layout/BottomNav'
import { reportApi } from '../../lib/api/report'
import { challengeApi } from '../../lib/api/challenge'
import { mypageApi } from '../../lib/api/mypage'
import apiClient from '../../lib/api/client'
import type { Product } from '../../types'

// ── 날짜 포맷 ──────────────────────────────────────────
function formatDate(iso: string): string {
  return iso.slice(0, 10).replace(/-/g, '.')
}

// ── 원형 진행 게이지 ───────────────────────────────────
function CircularProgress({ percent }: { percent: number }) {
  const r = 46
  const circumference = 2 * Math.PI * r
  const offset = circumference * (1 - percent / 100)

  return (
    <svg width="112" height="112" viewBox="0 0 112 112">
      <circle cx="56" cy="56" r={r} fill="none" stroke="#E6E6E6" strokeWidth="10" />
      <circle
        cx="56" cy="56" r={r}
        fill="none"
        stroke="#003E7F"
        strokeWidth="10"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        transform="rotate(-90 56 56)"
      />
      <text x="56" y="60" textAnchor="middle" fontSize="18" fontWeight="bold" fill="#003E7F">
        {percent}%
      </text>
    </svg>
  )
}


type ReportData = Record<string, unknown> & {
  products: Product[]
  created_at: string
  previous_report_id?: string | null
}

type ProgressData = {
  overall_rate: number
}

// ── ReportComparePage ──────────────────────────────────
export default function ReportComparePage() {
  const { id } = useParams<{ id: string }>()
  const { t } = useTranslation('report')
  const [searchParams] = useSearchParams()
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [selectedPrevId, setSelectedPrevId] = useState<string | null>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // 외부 클릭 시 드롭다운 닫기
  useEffect(() => {
    if (!dropdownOpen) return
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [dropdownOpen])

  // 전체 리포트 목록 (드롭다운용)
  const { data: reportsRes } = useQuery({
    queryKey: ['mypage', 'reports'],
    queryFn: () => mypageApi.getReports(),
  })
  const allReportItems = (() => {
    const body = reportsRes?.data as { data?: { items: { report_id: string; created_at: string }[] } } | { items: { report_id: string; created_at: string }[] } | undefined
    const items = (body as { data?: { items: { report_id: string; created_at: string }[] } })?.data?.items
      ?? (body as { items: { report_id: string; created_at: string }[] })?.items
      ?? []
    return [...items]
      .sort((a, b) => b.created_at.localeCompare(a.created_at))
      .filter((r) => r.report_id !== id)
  })()

  // 현재 리포트
  const { data: currRes, isLoading: currLoading } = useQuery({
    queryKey: ['report', id],
    queryFn: () => reportApi.getById(id!),
    enabled: !!id,
  })
  const currReport = currRes?.data as ReportData | undefined

  // 이전 리포트 — 드롭다운 선택 > URL 쿼리 파라미터 > API 필드 순으로 우선
  const prevId = selectedPrevId ?? searchParams.get('prevId') ?? currReport?.previous_report_id ?? null
  const { data: prevRes } = useQuery({
    queryKey: ['report', prevId],
    queryFn: () => reportApi.getById(prevId!),
    enabled: !!prevId,
  })
  const prevReport = prevRes?.data as ReportData | undefined

  // 챌린지 현황
  const { data: challengeRes } = useQuery({
    queryKey: ['challenge-current'],
    queryFn: () => challengeApi.getCurrent(),
    retry: false,
  })
  const challenge = (challengeRes?.data as { data?: { challenge_id?: string; status?: string } } | undefined)?.data
    ?? (challengeRes?.data as { challenge_id?: string; status?: string } | undefined)
  const challengeId = challenge?.status === 'active' ? challenge.challenge_id : undefined

  const { data: progressRes } = useQuery({
    queryKey: ['challenge-progress', challengeId],
    queryFn: () => apiClient.get<ProgressData>(`/challenges/${challengeId}/progress`),
    enabled: !!challengeId,
    retry: false,
  })
  const overallRate = Math.round(
    (progressRes?.data as unknown as ProgressData | undefined)?.overall_rate ?? 0
  )

  // ── 로딩 ──────────────────────────────────────────────
  if (currLoading || !currReport) {
    return (
      <AppShell active="report" topbarLeft={<span className="text-[17px] font-bold text-[#1E293B]">{t('compare.pageTitle')}</span>}>
        <div className="flex-1 flex items-center justify-center bg-[#F1F5F9]">
          <p className="text-[#64748B] text-[14px]">불러오는 중...</p>
        </div>
      </AppShell>
    )
  }

  // ── 데이터 계산 ────────────────────────────────────────
  const dedup = (list: Product[]) => {
    const seen = new Set<string>()
    return list.filter((p) => { const ok = !seen.has(p.product_id); seen.add(p.product_id); return ok })
  }
  const currProducts: Product[] = dedup(currReport.products ?? [])
  const prevProducts: Product[] = dedup(prevReport?.products ?? [])

  const prevProductIds = new Set(prevProducts.map((p) => p.product_id))

  const currDate = currReport.created_at ? formatDate(currReport.created_at) : '-'
  const prevDate = prevReport?.created_at ? formatDate(prevReport.created_at) : '-'

  const productsWithStatus = currProducts.map((p) => ({
    ...p,
    status: (prevReport && prevProductIds.has(p.product_id) ? 'kept' : 'new') as 'kept' | 'new',
  }))

  // ── 이전 리포트 없을 때 ─────────────────────────────────
  if (!prevId) {
    return (
      <AppShell active="report" topbarLeft={<span className="text-[17px] font-bold text-[#1E293B]">{t('compare.pageTitle')}</span>}>
        <div className="flex-1 flex flex-col bg-[#F1F5F9] overflow-hidden md:overflow-visible">
          <div className="md:hidden">
            <Header showBack title={<span className="text-[18px] font-bold text-[#1E293B]">{t('compare.pageTitle')}</span>} />
          </div>
          <div className="flex-1 flex items-center justify-center px-5">
            <p className="text-[#64748B] text-[14px] text-center">{t('compare.noComparison')}</p>
          </div>
          <div className="md:hidden">
            <BottomNav active="report" />
          </div>
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell active="report" topbarLeft={<span className="text-[17px] font-bold text-[#1E293B]">{t('compare.pageTitle')}</span>}>
      <div className="flex-1 flex flex-col bg-[#F1F5F9] overflow-hidden md:overflow-visible">
        {/* ── 헤더 (모바일만) ─────────────────────────────── */}
        <div className="md:hidden">
          <Header showBack title={<span className="text-[18px] font-bold text-[#1E293B]">{t('compare.pageTitle')}</span>} />
        </div>

        {/* ── 스크롤 콘텐츠 ──────────────────────────────── */}
        <div className="flex-1 overflow-y-auto md:overflow-visible">
          <div className="px-5 pb-6 md:px-8 md:pb-10 md:max-w-[804px]">

            {/* 날짜 선택 행 */}
            <div className="flex items-center justify-between mt-4 mb-5">
              {/* 이전 리포트 — 드롭다운 */}
              <div className="flex flex-col items-center gap-1" ref={dropdownRef}>
                <span className="text-[14px] font-medium text-[#64748B]">{t('compare.previousReport')}</span>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setDropdownOpen((o) => !o)}
                    className="flex items-center gap-1 bg-[#E6E6E6] rounded-full px-3 py-1"
                  >
                    <span className="text-[13px] font-medium text-[#1E293B]">{prevDate}</span>
                    <svg
                      width="12" height="12" viewBox="0 0 12 12" fill="none"
                      style={{ transform: dropdownOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }}
                    >
                      <path d="M3 4.5L6 7.5L9 4.5" stroke="#64748B" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>

                  {dropdownOpen && allReportItems.length > 0 && (
                    <div className="absolute top-full left-0 mt-1 min-w-[130px] bg-white rounded-[10px] shadow-lg border border-[#E2E8F0] z-20 overflow-hidden">
                      {allReportItems.map((r) => {
                        const isSelected = r.report_id === prevId
                        return (
                          <button
                            key={r.report_id}
                            type="button"
                            onClick={() => { setSelectedPrevId(r.report_id); setDropdownOpen(false) }}
                            className={`w-full text-left px-4 py-2.5 text-[13px] font-medium transition-colors ${
                              isSelected
                                ? 'bg-[#EAF0F7] text-[#003E7F]'
                                : 'text-[#1E293B] hover:bg-[#F8FAFF]'
                            }`}
                          >
                            {formatDate(r.created_at)}
                          </button>
                        )
                      })}
                    </div>
                  )}
                </div>
              </div>

              <svg width="20" height="16" viewBox="0 0 20 16" fill="none">
                <path d="M1 8H19M19 8L12 1M19 8L12 15" stroke="#94A3B8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>

              <div className="flex flex-col items-center gap-1">
                <span className="text-[14px] font-medium text-[#64748B]">{t('compare.latestReport')}</span>
                <div className="bg-[#D2DFED] rounded-full px-3 py-1">
                  <span className="text-[13px] font-medium text-[#003E7F]">{currDate}</span>
                </div>
              </div>
            </div>

            {/* ── 추천 제품 ──────────────────────────────── */}
            <div className="mb-4">
              <div className="flex items-center justify-between bg-[#003E7F] rounded-full px-4 py-2 mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-[14px] font-bold text-white">{t('compare.products')}</span>
                  <span className="text-[14px] font-medium text-[#A0B6CE]">
                    {t('compare.productCount', {
                      prev: prevProducts.length,
                      curr: currProducts.length,
                    })}
                  </span>
                </div>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M4 6L8 10L12 6" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>

              <div className="bg-[#F8FAFF] rounded-[12px] overflow-hidden">
                {productsWithStatus.map((product, idx) => {
                  const isKept = product.status === 'kept'
                  const intakeLine = [product.intake_timing, product.intake_method].filter(Boolean).join(' · ')
                  return (
                    <div key={product.product_id}>
                      {idx > 0 && <div className="mx-4 border-t border-[#E2E8F0]" />}
                      <div className="flex items-center gap-3 px-4 py-3">
                        <div className="flex-none w-[60px] h-[60px] rounded-[6px] bg-[#F1F5F9] overflow-hidden">
                          {product.package_image_url ? (
                            <img src={product.package_image_url} alt={product.product_name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                                <rect x="4" y="4" width="16" height="16" rx="2" stroke="#CBD5E1" strokeWidth="1.5" />
                                <circle cx="9" cy="9" r="1.5" fill="#CBD5E1" />
                                <path d="M4 15L8 11L11 14L15 10L20 15" stroke="#CBD5E1" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[14px] font-semibold text-[#1E293B] truncate">{product.product_name}</p>
                          {intakeLine && (
                            <p className="text-[12px] text-[#64748B] mt-0.5">{intakeLine}</p>
                          )}
                        </div>
                        <span
                          className={`flex-none text-white text-[11px] font-medium rounded-full px-2 py-0.5 ${
                            isKept ? 'bg-[#5BA3D9]' : 'bg-[#F1C2C0]'
                          }`}
                        >
                          {isKept ? t('compare.kept') : t('compare.newProduct')}
                        </span>
                      </div>
                    </div>
                  )
                })}
                {currProducts.length === 0 && (
                  <p className="text-center text-[13px] text-[#94A3B8] py-6">추천 제품 정보가 없습니다.</p>
                )}
              </div>
            </div>

            {/* ── 챌린지 현황 ────────────────────────────── */}
            <div className="bg-white rounded-[16px] p-4 mb-4">
              <h3 className="text-[18px] font-bold text-[#1E293B] mb-4">{t('compare.challengeStatus')}</h3>
              <div className="flex flex-col items-center gap-3">
                {challengeId ? (
                  <>
                    <CircularProgress percent={overallRate} />
                    <p className="text-[13px] text-[#64748B]">
                      {t('compare.challengeProgress')}: {overallRate}%
                    </p>
                  </>
                ) : (
                  <>
                    <CircularProgress percent={0} />
                    <p className="text-[13px] text-[#94A3B8]">{t('compare.noChallenge')}</p>
                  </>
                )}
              </div>
            </div>

          </div>
        </div>

        {/* ── 하단 탭 바 (모바일만) ──────────────────────── */}
        <div className="md:hidden">
          <BottomNav active="report" />
        </div>
      </div>
    </AppShell>
  )
}
