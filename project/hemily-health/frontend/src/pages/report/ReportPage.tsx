import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import type { TFunction } from 'i18next'
import AppShell from '../../components/layout/AppShell'
import { reportApi } from '../../lib/api/report'
import apiClient from '../../lib/api/client'
import { usersApi } from '../../lib/api/users'
import { diseasesApi } from '../../lib/api/survey'
import type { DiseaseItem as CatalogDiseaseItem } from '../../lib/api/survey'
import { useAuthStore } from '../../lib/store/authStore'
import type { Product, User } from '../../types'
import { CANCER_STAGE_LIST, CHRONIC_STAGE_LIST } from '../../constants'
import { CANCER_DOSAGE_STAGES, CANCER_DOSAGE_ROWS, CANCER_DOSAGE_NOTE } from '../../lib/pdf/cancerStageDosage'
import Header from '../../components/layout/Header'

// 암 치료 단계 code → 표시 라벨 (없으면 원문 그대로)
function stageLabel(codeOrLabel: string): string {
  return (
    CANCER_STAGE_LIST.find((s) => s.value === codeOrLabel)?.label ??
    CHRONIC_STAGE_LIST.find((s) => s.value === codeOrLabel)?.label ??
    codeOrLabel
  )
}

// 리포트 유형 (암/만성)
type ReportTypeKey = 'cancer' | 'chronic'

// API ReportDetailResponse 질환 항목
type DiseaseItem = {
  disease_id?: string | null
  disease_type: string
  disease_code: string
  name: string
  disease_stage: string
  cancer_treatment_stage?: string | null
}

// ── 해시태그 추출 ──────────────────────────────────────
function extractTags(
  diseases: DiseaseItem[],
  diseaseCategory: string | null | undefined,
  user: User | null,
): string[] {
  const tags: string[] = []
  if (diseaseCategory === 'cancer') tags.push('# 암환우')
  else if (diseaseCategory === 'chronic') tags.push('# 만성질환')
  if (diseases[0]?.name) tags.push(`# ${diseases[0].name}`)
  const stage = diseases.find((d) => d.cancer_treatment_stage)?.cancer_treatment_stage
              ?? diseases[0]?.disease_stage
  if (stage) tags.push(`# ${stageLabel(stage)}`)
  if (user?.birth_date) {
    const age = new Date().getFullYear() - parseInt(user.birth_date.slice(0, 4))
    tags.push(`# ${Math.floor(age / 10) * 10}대`)
  }
  if (user?.gender === 'male')        tags.push('# 남성')
  else if (user?.gender === 'female') tags.push('# 여성')
  return tags.slice(0, 4)
}

// ── 현재 단계 계산 ─────────────────────────────────────
function computeDominantPhase(products: Product[]): 'D' | 'N' | 'A' {
  const phases = ['D', 'N', 'A'] as const
  // DNA_ALL 제품은 모든 단계에 포함되므로 제외하고 계산
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
    <>
      <div className="h-[89px] flex-none" aria-hidden="true" />
      <div className="fixed bottom-0 inset-x-0 z-50 bg-[#F8FAFF] shadow-[0_-2px_1px_rgba(0,0,0,0.08)] rounded-t-[12px] px-[38px] pt-5 pb-[19px]">
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
    </>
  )
}

// ── 플랜 티어 정의 ───────────────────────────────────
const PLAN_TIERS = [
  { key: 'basic',    label: 'Basic',    color: '#69BBE4' },
  { key: 'standard', label: 'Standard', color: '#003E7F' },
  { key: 'premium',  label: 'Premium',  color: '#9D0006' },
] as const

// ── 제품 행 ───────────────────────────────────────────
function ProductRow({ product, onClick }: { product: Product; onClick: () => void }) {
  const intakeLine = [product.intake_timing, product.intake_method].filter(Boolean).join(' · ')
  return (
    <button type="button" onClick={onClick} className="w-full flex items-center justify-between text-left">
      <div className="flex items-center gap-3">
        <div className="flex-none w-[68px] h-[68px] rounded-[6px] bg-[#E2EAF4] overflow-hidden">
          {product.package_image_url ? (
            <img src={product.package_image_url} alt={product.product_name} className="w-full h-full object-cover" />
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
        <div className="flex flex-col gap-1">
          <p className="text-[16px] font-bold text-[#191919] tracking-[-0.32px] leading-normal">
            {product.product_name}
          </p>
          {intakeLine && (
            <p className="text-[12px] text-[#94A3B8] tracking-[-0.24px]">{intakeLine}</p>
          )}
        </div>
      </div>
      <svg width="8" height="14" viewBox="0 0 8 14" fill="none" className="flex-none">
        <path d="M1 1L7 7L1 13" stroke="#003E7F" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  )
}

// ── 맞춤 리포트 선택 바텀시트 (암/만성 전환) ───────────
function RadioMark({ on }: { on: boolean }) {
  return on ? (
    <span className="size-5 rounded-full border-2 border-[#003E7F] flex items-center justify-center">
      <span className="size-2.5 rounded-full bg-[#003E7F]" />
    </span>
  ) : (
    <span className="size-5 rounded-full border-2 border-[#CBD5E1] flex items-center justify-center">
      <span className="size-2.5 rounded-full border-2 border-[#CBD5E1]" />
    </span>
  )
}

function ReportSelectSheet({
  open, onClose, current, onSelect, t, diseases,
}: {
  open: boolean
  onClose: () => void
  current: ReportTypeKey | null
  onSelect: (key: ReportTypeKey) => void
  t: TFunction<'report'>
  diseases: DiseaseItem[]
}) {
  if (!open) return null
  const hasCancer  = diseases.some((d) => d.disease_type === 'cancer')
  const hasChronic = diseases.some((d) => d.disease_type === 'chronic')
  const items: ReportTypeKey[] =
    hasCancer && hasChronic ? ['cancer', 'chronic']
    : hasCancer  ? ['cancer']
    : hasChronic ? ['chronic']
    : []
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />
      <div className="relative w-full md:max-w-[480px] bg-[#F8FAFF] rounded-t-[16px] px-5 pt-6 pb-9 flex flex-col gap-8">
        <div className="flex items-center justify-between">
          <p className="text-[18px] font-bold text-black">{t('selectSheet.title')}</p>
          <button type="button" onClick={onClose} aria-label="닫기">
            <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
              <path d="M1 1L14 14M14 1L1 14" stroke="#191919" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
          </button>
        </div>
        <div className="flex flex-col gap-6">
          <p className="text-[18px] font-medium text-black">{t('selectSheet.myReports')}</p>
          <div className="flex flex-col gap-4">
            {items.map((key) => (
              <button key={key} type="button" onClick={() => onSelect(key)} className="flex items-center justify-between">
                <div className="flex items-center gap-5">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path d="M14 3H7C6.45 3 6 3.45 6 4V20C6 20.55 6.45 21 7 21H17C17.55 21 18 20.55 18 20V7L14 3Z"
                      stroke="#191919" strokeWidth="1.4" strokeLinejoin="round" />
                    <path d="M14 3V7H18" stroke="#191919" strokeWidth="1.4" strokeLinejoin="round" />
                  </svg>
                  <span className="text-[16px] font-medium text-black tracking-[-0.32px]">{t(`reportType.${key}`)}</span>
                </div>
                <RadioMark on={current === key} />
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// ── ReportPage ─────────────────────────────────────────
export default function ReportPage() {
  const { t }     = useTranslation('report')
  const { id }    = useParams<{ id: string }>()
  const navigate  = useNavigate()
  const authUser  = useAuthStore((s) => s.user)

  const [selectedPhase, setSelectedPhase] = useState<'D' | 'N' | 'A'>('D')
  const [selectedReport, setSelectedReport] = useState<ReportTypeKey | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [synced, setSynced] = useState(false)
  const [isExporting, setIsExporting] = useState(false)

  const { data, isLoading, isError } = useQuery({
    queryKey: ['report', id],
    queryFn:  () => reportApi.getById(id!),
    enabled:  !!id,
    retry: 3,
    retryDelay: 2000,
  })

  // 해밀리안 계정이면 상담용 리포트 발행 → 본인 이름·연락처를 위해 프로필 조회
  const isHemilian = authUser?.userType === 'hemilian'
  const { data: meRes } = useQuery({
    queryKey: ['users', 'me'],
    queryFn:  () => usersApi.getMe(),
    enabled:  isHemilian,
  })
  const meProfile = ((meRes?.data as { data?: User } | undefined)?.data ?? (meRes?.data as User | undefined))

  const { data: catalogRes } = useQuery({
    queryKey: ['diseases'],
    queryFn:  () => diseasesApi.list(),
    staleTime: 24 * 60 * 60 * 1000,
  })

  const { data: currentChallengeRes } = useQuery({
    queryKey: ['challenge-current'],
    queryFn: () => apiClient.get('/challenges/current', { validateStatus: (s) => s < 500 }),
    staleTime: 60 * 1000,
  })
  const hasActiveChallenge = currentChallengeRes?.status === 200
  const catalogDiseases: CatalogDiseaseItem[] =
    (catalogRes?.data as unknown as { items: CatalogDiseaseItem[] } | undefined)?.items ?? []

  // 백엔드 ReportDetailResponse
  const report = data?.data as unknown as {
    id: string
    created_at?: string | null
    user_name?: string | null
    age_band?: string | null
    disease_category?: string | null
    diseases?: DiseaseItem[]
    products?: Product[]
    previous_report_id?: string | null
  } | undefined

  // 리포트 로드 시 현재 단계/유형으로 초기화 (1회)
  useEffect(() => {
    if (report && !synced) {
      setSelectedPhase(computeDominantPhase(report.products ?? []))
      const dc = report.disease_category
      setSelectedReport(dc === 'cancer' ? 'cancer' : dc === 'chronic' ? 'chronic' : null)
      setSynced(true)
    }
  }, [report, synced])

  // ── 로딩 / 에러 ─────────────────────────────────────
  if (isLoading || !report) {
    return (
      <AppShell active="report" topbarLeft={<p className="text-[17px] font-bold text-[#1E293B]">{t('title')}</p>}>
        <div className="flex-1 flex flex-col bg-[#F1F5F9] items-center justify-center gap-4 py-20">
          <p className="text-[16px] font-medium text-[#64748B]">
            {isError ? '리포트를 불러오지 못했어요.' : '리포트를 생성하는 중이에요...'}
          </p>
          {isError && (
            <button
              type="button"
              onClick={() => navigate('/', { replace: true })}
              className="px-6 py-3 rounded-full bg-blue text-white text-[14px] font-medium"
            >
              홈으로 돌아가기
            </button>
          )}
        </div>
      </AppShell>
    )
  }

  const allProducts = report.products ?? []
  const diseases = report.diseases ?? []

  // 현재 선택된 리포트 타입(암/만성). 미선택 시 리포트의 disease_category 기준
  const typeKey: ReportTypeKey | null =
    selectedReport ??
    (report.disease_category === 'cancer' ? 'cancer'
     : report.disease_category === 'chronic' ? 'chronic'
     : null)

  const diseaseTypeById = new Map<string, string>(
    catalogDiseases.map((d) => [String(d.id), d.disease_category])
  )


  const matchesSelectedType = (p: Product) => {
    if (!typeKey) return true
    if (p.disease_id == null) return true
    const mapped = diseaseTypeById.get(String(p.disease_id))
    return mapped === undefined || mapped === typeKey
  }

  const productsForStage = (stage: 'D' | 'N' | 'A') =>
    allProducts
      .filter((p) => p.dna_stage === stage || p.dna_stage === 'DNA_ALL')
      .filter(matchesSelectedType)
      .sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0))

  const issuedAt = report.created_at
    ? new Date(report.created_at).toLocaleDateString('ko-KR', {
        year: 'numeric', month: '2-digit', day: '2-digit',
      }).replace(/\. /g, '.').replace(/\.$/, '')
    : ''

  const userName = report.user_name ?? authUser?.name ?? ''
  const reportTitle = typeKey ? t(`reportType.${typeKey}`) : t('title')

  // 선택된 리포트 타입에 해당하는 질환만 필터 (암↔만성 전환 시 태그·타이틀 반영)
  const viewDiseases = typeKey
    ? diseases.filter((d) => d.disease_type === typeKey)
    : diseases
  const hashtags = extractTags(viewDiseases, typeKey, authUser)

  // ── PDF 내보내기 ────────────────────────────────────
  const handleExportPdf = async () => {
    if (isExporting) return
    setIsExporting(true)
    try {
      const diseaseNames   = diseases.map((d) => d.name)
      const treatmentStage = diseases.find((d) => d.cancer_treatment_stage)?.cancer_treatment_stage ?? undefined
      // PDF 라이브러리(html2canvas/jsPDF)는 무거우므로 클릭 시 동적 로드
      const { exportReportPdf } = await import('../../lib/pdf/exportReportPdf')
      await exportReportPdf({
        t,
        userName,
        gender: authUser?.gender,
        diseases: diseaseNames,
        treatmentStage,
        isCancer: report.disease_category === 'cancer',
        consultGuide: isHemilian,
        hemilianName: meProfile?.name ?? authUser?.name,
        hemilianPhone: meProfile?.phone_number,
        issuedDate: issuedAt,
        fileDate: report.created_at ? report.created_at.slice(0, 10).replace(/-/g, '') : '',
        products: allProducts,
        diseaseTypeMap: Object.fromEntries(diseaseTypeById),
      })
    } finally {
      setIsExporting(false)
    }
  }

  const pdfButton = (
    <button
      type="button"
      onClick={handleExportPdf}
      disabled={isExporting}
      className="rounded-[8px] bg-[#DBEAFE] px-3 h-7 flex items-center justify-center text-[12px] font-medium text-[#003E7F] disabled:opacity-50"
    >
      {isExporting ? t('pdf.generating') : t('pdfDownload')}
    </button>
  )

  // 모바일 헤더용 PDF 버튼 (테두리형)
  const pdfMobileButton = (
    <button
      type="button"
      onClick={handleExportPdf}
      disabled={isExporting}
      className="border border-[#5BA3D9] rounded-full px-2 py-[3px] flex items-center justify-center disabled:opacity-50"
      aria-label="PDF 다운"
    >
      <span className="text-[11px] font-semibold text-[#5BA3D9] tracking-[-0.33px] leading-[1.3]">
        {isExporting ? t('pdf.generating') : t('pdfDownload')}
      </span>
    </button>
  )

  // 제목 + 리포트 전환 드롭다운 (암/만성 유형이 있을 때)
  const titleWithSelector = (size: string) => (
    <button
      type="button"
      onClick={() => typeKey && setSheetOpen(true)}
      disabled={!typeKey}
      className="flex items-center gap-1.5 disabled:cursor-default"
    >
      <p className={`${size} font-bold text-[#191919]`}>{reportTitle}</p>
      {typeKey && (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="flex-none">
          <circle cx="10" cy="10" r="8.5" stroke="#003E7F" strokeWidth="1.3" />
          <path d="M6.5 8.5L10 12L13.5 8.5" stroke="#003E7F" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
    </button>
  )

  return (
    <AppShell
      active="report"
      topbarLeft={titleWithSelector('text-[17px]')}
      topbarRight={pdfButton}
    >
      <div className="flex-1 flex flex-col bg-[#F1F5F9] overflow-hidden md:overflow-visible">
        <div className="flex-1 overflow-y-auto md:overflow-visible">
          {/* ── 헤더 (모바일만) ── */}
          <div className="md:hidden">
            <Header
              showBack
              title={titleWithSelector('text-[21px]')}
              right={pdfMobileButton}
            />
          </div>

          <div className="px-5 pt-5 pb-8 flex flex-col gap-6 md:px-8 md:py-8 md:max-w-[804px] md:gap-5">

            {/* ── 리포트 카드 ── */}
            <div
              className="rounded-[10px] p-5 flex flex-col gap-3 md:rounded-[20px] md:p-7"
              style={{ background: 'linear-gradient(177.04deg, #003E7F 31.48%, #052649 96.73%)' }}
            >
              {/* 날짜 + 이름 + 해시태그 */}
              <div className="flex flex-col gap-2">
                <div className="flex flex-col gap-1">
                  {issuedAt && (
                    <p className="text-[14px] font-medium text-[#94A3B8] tracking-[-0.14px]">
                      {issuedAt} 발행
                    </p>
                  )}
                  <p className="text-[24px] font-bold text-[#F8FAFF] tracking-[-0.24px]">
                    {userName}{t('reportCardSuffix')}
                  </p>
                </div>
                {hashtags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {hashtags.map((tag) => (
                      <span
                        key={tag}
                        className="border border-[#F8FAFF] rounded-full px-[11px] py-[6px] text-[14px] font-medium text-[#F8FAFF] tracking-[-0.14px] bg-[#003E7F]"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>

            </div>

            {/* ── 의료 안내 ── */}
            <div className="flex gap-3 items-center bg-[#FFF5F2] border-[1.5px] border-dashed border-[#9D0006] rounded-[20px] px-4 py-3">
              <div className="flex-none w-[19px] h-[19px] bg-[#9D0006] rounded-full flex items-center justify-center shrink-0">
                <span className="text-[12px] font-medium text-[#F1F5F9] leading-none">i</span>
              </div>
              <p className="text-[12px] text-[#191919] tracking-[-0.24px] leading-[1.6]">
                {t('disclaimerBody1')}{' '}
                <strong className="font-semibold">{t('disclaimerBold')}</strong>{' '}
                {t('disclaimerBody2')}
                <br />
                {t('disclaimerBody3')}
              </p>
            </div>

            {/* ── 등급 안내 테이블 ── */}
            <div className="rounded-[10px] overflow-hidden border border-[#D2DEEA]">
              <div className="grid grid-cols-3 bg-[#003E7F] text-[#F8FAFF] text-[11px] font-semibold">
                <div className="px-3 py-2">{t('planGrade.colGrade')}</div>
                <div className="px-3 py-2">{t('planGrade.colConcept')}</div>
                <div className="px-3 py-2">{t('planGrade.colTarget')}</div>
              </div>
              {PLAN_TIERS.map((tier, i) => (
                <div key={tier.key} className={`grid grid-cols-3 bg-white text-[11px] ${i > 0 ? 'border-t border-[#E2E8F0]' : ''}`}>
                  <div className="px-3 py-3 font-bold" style={{ color: tier.color }}>{tier.label}</div>
                  <div className="px-3 py-3 text-[#475569] leading-relaxed whitespace-pre-line">{t(`planGrade.${tier.key}.concept`)}</div>
                  <div className="px-3 py-3 text-[#475569] leading-relaxed whitespace-pre-line">{t(`planGrade.${tier.key}.target`)}</div>
                </div>
              ))}
            </div>

            {/* ── DNA 탭 ── */}
            <div className="-mx-5 px-5 py-2 bg-[#F1F5F9] z-30 md:z-0 md:mx-0 md:px-0 md:py-0 md:bg-transparent">
              <div className="flex gap-[14px] md:gap-0 md:bg-[#F1F5F9] md:rounded-[22px] md:p-1">
                {([
                  { phase: 'D', activeGrad: 'linear-gradient(177deg, #16A34A 31%, #15803D 97%)', inactiveColor: '#16A34A' },
                  { phase: 'N', activeGrad: 'linear-gradient(177.24deg, #003E7F 31.48%, #052649 96.73%)', inactiveColor: '#003E7F' },
                  { phase: 'A', activeGrad: 'linear-gradient(177deg, #EA580C 31%, #C2410C 97%)', inactiveColor: '#EA580C' },
                ] as const).map(({ phase, activeGrad, inactiveColor }) => {
                  const isActive = selectedPhase === phase
                  return (
                    <button
                      key={phase}
                      type="button"
                      onClick={() => setSelectedPhase(phase)}
                      className={`flex-1 h-[74px] flex flex-col items-center justify-center gap-1 rounded-[12px] transition-all
                        md:h-9 md:flex-row md:gap-1.5 md:rounded-[18px] ${
                        isActive
                          ? 'shadow-md md:shadow-none'
                          : 'bg-[#F8FAFF] shadow-[0_4px_2px_rgba(0,63,132,0.02)] md:bg-[#F8FAFF] md:shadow-none'
                      }`}
                      style={isActive ? { background: activeGrad } : undefined}
                    >
                      <p className={`text-[24px] font-bold tracking-[-0.24px] md:text-[13px] ${isActive ? 'text-white' : 'md:text-[#64748B]'}`}
                        style={isActive ? undefined : { color: inactiveColor }}>
                        {phase}
                      </p>
                      <p className={`text-[14px] font-medium tracking-[-0.14px] md:text-[13px] ${isActive ? 'text-white md:font-bold' : 'text-[#555] md:text-[#64748B]'}`}>
                        {t(`dnaTabLabel.${phase}`)}
                      </p>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* ── 구매 안내 문구 ── */}
            <p className="text-[11px] text-[#94A3B8] text-right pr-1">{t('productPurchaseHint')}</p>

            {/* ── 제품 목록 (플랜 티어별 그룹) ── */}
            {(() => {
              const products = productsForStage(selectedPhase)
              const TIER_CUMULATIVE: Record<string, string[]> = {
                basic:    ['basic'],
                standard: ['basic', 'standard'],
                premium:  ['basic', 'standard', 'premium'],
              }
              const grouped = PLAN_TIERS
                .map((tier) => ({
                  ...tier,
                  products: products.filter((p) => (TIER_CUMULATIVE[tier.key] ?? [tier.key]).includes(p.plan_tier ?? '')),
                }))
                .filter((g) => g.products.length > 0)
              return (
                <div className="bg-[#F8FAFF] border border-[#D2DEEA] rounded-[10px] px-3 py-6 flex flex-col gap-6">
                  {grouped.length > 0 ? grouped.map((group, gIdx) => (
                    <div key={group.key} className="flex flex-col gap-4">
                      {gIdx > 0 && <div className="w-full h-px bg-[#D2DEEA] -mt-3" />}
                      <p className="text-[16px] tracking-[-0.32px]">
                        <span className="font-bold" style={{ color: group.color }}>{group.label}</span>
                        {' '}PLAN
                      </p>
                      <div className="flex flex-col">
                        {group.products.map((product, idx) => (
                          <div key={product.product_id}>
                            <ProductRow
                              product={product}
                              onClick={() => product.homepage_url && window.open(product.homepage_url, '_blank', 'noopener')}
                            />
                            {idx < group.products.length - 1 && (
                              <div className="w-full h-px bg-[#E2E8F0] my-4" />
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )) : (
                    <p className="py-4 text-center text-[13px] text-[#94A3B8]">추천 제품이 없습니다.</p>
                  )}
                </div>
              )
            })()}

            {/* ── 암 치료단계별 복용량 가이드 표 (암 환우만) ── */}
            {typeKey === 'cancer' && (() => {
              const currentStage = diseases.find((d) => d.cancer_treatment_stage)?.cancer_treatment_stage ?? null
              return (
                <div className="flex flex-col gap-3">
                  <p className="text-[16px] font-bold text-[#1E293B] tracking-[-0.32px]">{t('cancerDosageTable.title')}</p>
                  {currentStage && (
                    <p className="text-[12px] text-[#003E7F] font-medium tracking-[-0.24px]">
                      {t('cancerDosageTable.current', { stage: CANCER_DOSAGE_STAGES.find(s => s.code === currentStage)?.label ?? currentStage })}
                    </p>
                  )}
                  <div className="overflow-x-auto rounded-[10px] border border-[#D2DEEA]">
                    <table className="border-collapse" style={{ minWidth: 640 }}>
                      <thead>
                        <tr>
                          <th className="sticky left-0 z-[9] bg-[#003E7F] px-3 py-2 text-[11px] font-semibold text-white text-left whitespace-nowrap">
                            {t('cancerDosageTable.colProduct')}
                          </th>
                          {CANCER_DOSAGE_STAGES.map((s) => (
                            <th
                              key={s.code}
                              className={`px-2 py-2 text-[10px] font-semibold text-center whitespace-nowrap ${
                                s.code === currentStage
                                  ? 'bg-[#C5D6E8] text-[#003E7F]'
                                  : 'bg-[#003E7F] text-white'
                              }`}
                            >
                              {s.label}
                              {s.code === currentStage && (
                                <span className="block text-[9px] font-bold text-[#003E7F]">{t('cancerDosageTable.currentBadge')}</span>
                              )}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {CANCER_DOSAGE_ROWS.map((row, i) => (
                          <tr key={row.product} className={i % 2 === 0 ? 'bg-white' : 'bg-[#F8FAFF]'}>
                            <td className="sticky left-0 z-[9] bg-inherit px-3 py-2 text-[12px] font-medium text-[#1E293B] whitespace-nowrap border-t border-[#E2E8F0]">
                              {row.product}
                            </td>
                            {row.values.map((val, j) => (
                              <td
                                key={j}
                                className={`px-2 py-2 text-[11px] text-center border-t border-[#E2E8F0] ${
                                  CANCER_DOSAGE_STAGES[j].code === currentStage
                                    ? 'bg-[#EAF0F7] font-semibold text-[#003E7F]'
                                    : 'text-[#475569]'
                                }`}
                              >
                                {val}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <p className="text-[10px] text-[#94A3B8] leading-relaxed tracking-[-0.2px]">{CANCER_DOSAGE_NOTE}</p>
                </div>
              )
            })()}

            {/* ── 하단 버튼 ── */}
            <div className="flex flex-col gap-[9px] md:max-w-[804px] md:w-full">
              {hasActiveChallenge ? (
                <button
                  type="button"
                  onClick={() => navigate('/challenge')}
                  className="w-full py-[17px] rounded-full bg-[#003E7F] text-white text-[16px] font-medium tracking-[-0.32px] active:scale-[0.98] transition-all md:py-3"
                >
                  {t('viewChallenge')}
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => navigate('/challenge/teams')}
                    className="w-full py-[17px] rounded-full bg-[#003E7F] text-white text-[16px] font-medium tracking-[-0.32px] active:scale-[0.98] transition-all md:py-3"
                  >
                    {t('joinChallenge')}
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate('/challenge/create')}
                    className="w-full py-[17px] rounded-full bg-[#D2DFED] text-[#003E7F] text-[16px] font-medium tracking-[-0.32px] active:scale-[0.98] transition-all md:py-3"
                  >
                    {t('selfChallenge')}
                  </button>
                </>
              )}
            </div>

          </div>
        </div>

        {/* ── 하단 탭 바 (모바일만) ── */}
        <div className="md:hidden">
          <BottomNav />
        </div>
      </div>

      {/* ── 맞춤 리포트 선택 바텀시트 ── */}
      <ReportSelectSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        current={typeKey}
        onSelect={(key) => {
          setSelectedReport(key)
          setSheetOpen(false)
        }}
        t={t}
        diseases={diseases}
      />
    </AppShell>
  )
}
