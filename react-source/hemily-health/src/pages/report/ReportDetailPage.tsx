import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import MobileShell from '../../components/layout/MobileShell'
import { reportApi } from '../../lib/api/report'
import type { Product } from '../../types'
import icBack from '../../assets/images/ic_back.svg'

// ── 날짜 포맷 ──────────────────────────────────────────
function formatDate(iso: string): string {
  return iso.slice(0, 10).replace(/-/g, '.')
}

// ── 현재 단계 계산 ─────────────────────────────────────
function computeDominantPhase(products: Product[]): 'D' | 'N' | 'A' {
  const phases = ['D', 'N', 'A'] as const
  const counts = phases.map((p) => products.filter((prod) => prod.dna_stage === p).length)
  const max = Math.max(...counts)
  if (max === 0) return 'N'
  return phases[counts.indexOf(max)]
}

// ── 하단 탭 바 ─────────────────────────────────────────
function BottomNav() {
  const navigate = useNavigate()
  const active = 'report' as 'home' | 'challenge' | 'report' | 'mypage'
  const blue = '#003E7F'
  const gray = '#555555'

  const items = [
    {
      key: 'home', label: '홈', path: '/',
      icon: (
        <svg width="17" height="18" viewBox="0 0 17 18" fill="none">
          <path d="M1 6.5L8.5 1L16 6.5V16.5C16 16.7652 15.8946 17.0196 15.7071 17.2071C15.5196 17.3946 15.2652 17.5 15 17.5H11V12.5H6V17.5H2C1.73478 17.5 1.48043 17.3946 1.29289 17.2071C1.10536 17.0196 1 16.7652 1 16.5V6.5Z"
            stroke={active === 'home' ? blue : gray} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ),
    },
    {
      key: 'challenge', label: '챌린지', path: '/challenge',
      icon: (
        <svg width="14" height="20" viewBox="0 0 14 20" fill="none">
          <path d="M7.833 1C7.833 1 3 8 3 12C3 14.761 4.791 17.085 7.28 17.792C7.476 17.849 7.619 17.676 7.552 17.487C7.19 16.458 7 15.253 7 14C7 11 9.5 8.5 9.5 8.5C9.5 8.5 9 11 10.5 12C11 12 13 10.5 13 8C13 5.239 11.209 2.915 8.72 2.208C8.524 2.151 8.381 1.976 8.448 1.787C8.527 1.568 7.833 1 7.833 1Z"
            stroke={active === 'challenge' ? blue : gray} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ),
    },
    {
      key: 'report', label: '리포트', path: '/report',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z"
            stroke={active === 'report' ? blue : gray} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M14 2V8H20M16 13H8M16 17H8M10 9H8"
            stroke={active === 'report' ? blue : gray} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ),
    },
    {
      key: 'mypage', label: '마이', path: '/mypage',
      icon: (
        <svg width="16" height="18" viewBox="0 0 16 18" fill="none">
          <path d="M8 8C10.2091 8 12 6.20914 12 4C12 1.79086 10.2091 0 8 0C5.79086 0 4 1.79086 4 4C4 6.20914 5.79086 8 8 8Z"
            stroke={active === 'mypage' ? blue : gray} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M1 17C1 14.2386 4.13401 12 8 12C11.866 12 15 14.2386 15 17"
            stroke={active === 'mypage' ? blue : gray} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ),
    },
  ] as const

  return (
    <div className="flex-none bg-[#F8FAFF] shadow-[0_-2px_1px_rgba(0,0,0,0.08)] rounded-t-[12px] px-[38px] pt-5 pb-[19px]">
      <div className="flex items-end justify-between">
        {items.map((item) => (
          <button key={item.key} type="button" onClick={() => navigate(item.path)} className="flex flex-col items-center gap-2">
            {item.icon}
            <span className={`text-[12px] tracking-[-0.24px] ${item.key === active ? 'font-semibold text-[#003E7F]' : 'font-medium text-[#555]'}`}>
              {item.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}

// ── ReportDetailPage ───────────────────────────────────
export default function ReportDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { t } = useTranslation('report')

  const { data: reportRes, isLoading } = useQuery({
    queryKey: ['report', id],
    queryFn: () => reportApi.getById(id!),
    enabled: !!id,
  })

  type ReportData = {
    id: string
    products: Product[]
    result_snapshot: unknown
    previous_report_id?: string | null
    createdAt: string
  }
  const report = reportRes?.data as ReportData | undefined

  // ── 로딩 ──────────────────────────────────────────────
  if (isLoading || !report) {
    return (
      <MobileShell>
        <div className="flex-1 flex items-center justify-center bg-[#F8FAFF]">
          <p className="text-[#64748B] text-[14px]">불러오는 중...</p>
        </div>
      </MobileShell>
    )
  }

  const products: Product[] = report.products ?? []
  const dominantPhase = computeDominantPhase(products)
  const publishDate = report.createdAt ? formatDate(report.createdAt) : '-'

  const sortedProducts = [...products].sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0))

  return (
    <MobileShell>
      {/* MobileShell은 className을 받지 않으므로 내부 div에 bg 지정 */}
      <div className="flex-1 flex flex-col bg-[#F8FAFF]">

        {/* ── 헤더 ────────────────────────────────────── */}
        <div className="flex-none flex items-center h-[64px] px-5 relative">
          <button type="button" onClick={() => navigate(-1)} className="absolute left-5">
            <img src={icBack} alt="뒤로" className="w-6 h-6" />
          </button>

          {/* 중앙: 타이틀 + 발행일 */}
          <div className="mx-auto flex flex-col items-center gap-[4px]">
            <span className="text-[24px] font-bold text-[#1E293B] tracking-[-0.24px] leading-none">
              {t('detail.pageTitle')}
            </span>
            <span className="text-[14px] font-medium text-[#94A3B8] tracking-[-0.14px] leading-none">
              {t('detail.publishedAt', { date: publishDate })}
            </span>
          </div>

          {/* 우측: 문서 아이콘 (Iconex Light Document) */}
          <div className="absolute right-5">
            <svg width="20" height="22" viewBox="0 0 20 22" fill="none">
              <path d="M13 1H3C2.46957 1 1.96086 1.21071 1.58579 1.58579C1.21071 1.96086 1 2.46957 1 3V19C1 19.5304 1.21071 20.0391 1.58579 20.4142C1.96086 20.7893 2.46957 21 3 21H17C17.5304 21 18.0391 20.7893 18.4142 20.4142C18.7893 20.0391 19 19.5304 19 19V7L13 1Z"
                stroke="#94A3B8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M13 1V7H19M13 14H7M15 18H7M9 10H7"
                stroke="#94A3B8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </div>

        {/* ── 스크롤 콘텐츠 ──────────────────────────── */}
        <div className="flex-1 overflow-y-auto px-5 pb-6">

          {/* 나의 건강 상태 */}
          <div className="mb-8 mt-2">
            <h3 className="text-[18px] font-bold text-[#1E293B] mb-4">
              {t('detail.healthStatus')}
            </h3>
            {/* 2열 카드: gap-[17px], 각 w-[171px] → flex-1 사용 */}
            <div className="flex gap-[17px]">
              <div
                className="flex-1 flex flex-col items-center justify-center gap-[4px] h-[101px] rounded-[10px]"
                style={{ background: 'linear-gradient(177.5deg, #003E7F 31.5%, #052649 96.7%)' }}
              >
                <span className="text-[32px] font-bold text-[#F8FAFF] leading-none">{products.length}</span>
                <span className="text-[16px] font-medium text-[#F8FAFF] tracking-[-0.32px]">{t('detail.productCount')}</span>
              </div>
              <div
                className="flex-1 flex flex-col items-center justify-center gap-[4px] h-[101px] rounded-[10px]"
                style={{ background: 'linear-gradient(177.5deg, #003E7F 31.5%, #052649 96.7%)' }}
              >
                <span className="text-[32px] font-bold text-[#F8FAFF] leading-none">{dominantPhase}</span>
                <span className="text-[16px] font-medium text-[#F8FAFF] tracking-[-0.32px]">{t('detail.currentStage')}</span>
              </div>
            </div>
          </div>

          {/* 해밀리안 추천 제품 */}
          <div className="mb-[52px]">
            <h3 className="text-[18px] font-bold text-[#1E293B] mb-4">
              {t('detail.recommendedProducts')}
            </h3>
            {/*
              피그마: bg-[#f8faff] (페이지와 동일), 테두리 없음, rounded-[10px]
              pl-[12px] pr-[13px] py-[16px]
            */}
            <div className="bg-[#F8FAFF] rounded-[10px] pl-[12px] pr-[13px] py-[16px]">
              {sortedProducts.length === 0 ? (
                <p className="text-center text-[13px] text-[#94A3B8] py-4">추천 제품 정보가 없습니다.</p>
              ) : (
                <div className="flex flex-col gap-[16px]">
                  {sortedProducts.map((product, idx) => {
                    const isCore = product.tier_type === 'core'
                    const tierLabel = isCore ? 'Basic' : 'Premium'
                    const chipClass = isCore
                      ? 'bg-[#5BA3D9] text-[#F8FAFF] text-[12px] font-normal tracking-[-0.24px] px-2 py-[2px] rounded-[40px] whitespace-nowrap'
                      : 'bg-[#003E7F] text-[#F8FAFF] text-[11px] font-medium leading-[1.3] tracking-[-0.33px] px-2 py-[4px] rounded-[40px] whitespace-nowrap'

                    return (
                      <div key={product.product_id}>
                        {/* 구분선: 피그마 gap-[16px] 사이 thin line */}
                        {idx > 0 && (
                          <div className="border-t border-[#E2E8F0] mb-[16px]" />
                        )}
                        <div className="flex items-center justify-between w-full">
                          {/* 왼쪽: 이미지 + 텍스트 */}
                          <div className="flex items-center gap-[12px] min-w-0 flex-1">
                            {/* 제품 이미지 */}
                            <div className="flex-none w-[68px] h-[68px] rounded-[6px] bg-[#EEF3F7] overflow-hidden">
                              {product.package_image_url ? (
                                <img
                                  src={product.package_image_url}
                                  alt={product.product_name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                                    <rect x="4" y="4" width="16" height="16" rx="2" stroke="#CBD5E1" strokeWidth="1.5" />
                                    <circle cx="9" cy="9" r="1.5" fill="#CBD5E1" />
                                    <path d="M4 15L8 11L11 14L15 10L20 15" stroke="#CBD5E1" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                  </svg>
                                </div>
                              )}
                            </div>
                            {/* 제품명 + 요약 */}
                            <div className="flex flex-col gap-[4px] min-w-0">
                              <p className="text-[16px] font-bold text-[#1E293B] tracking-[-0.32px] leading-snug">
                                {product.product_name}
                              </p>
                              {(product.summary || product.key_ingredients) && (
                                <p className="text-[12px] text-[#64748B] tracking-[-0.24px] leading-normal">
                                  {product.summary ?? product.key_ingredients}
                                </p>
                              )}
                            </div>
                          </div>
                          {/* 티어 칩 */}
                          <span className={`flex-none ml-3 ${chipClass}`}>
                            {tierLabel}
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>

          {/* 버튼 */}
          <div className="flex flex-col gap-[9px]">
            <button
              type="button"
              onClick={() => navigate(`/report/${id}/comparison`)}
              className="w-full h-[52px] rounded-full text-[16px] font-medium text-[#F8FAFF] tracking-[-0.32px] bg-[#003E7F]"
            >
              {t('detail.compareButton')}
            </button>
          </div>
        </div>

        {/* ── 하단 탭 바 ──────────────────────────────── */}
        <BottomNav />
      </div>
    </MobileShell>
  )
}
