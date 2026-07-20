import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import AppShell from '../../components/layout/AppShell'
import Header from '../../components/layout/Header'
import ChallengeTopTabs from '../../components/challenge/ChallengeTopTabs'
import apiClient from '../../lib/api/client'
import { challengeApi } from '../../lib/api/challenge'
import { useChallengeDraftStore, type DraftProduct } from '../../lib/store/challengeDraftStore'
import { useAuthStore } from '../../lib/store/authStore'
import { ROUTINE_POINTS } from '../../constants'
import type { Product } from '../../types'

const NAVY_GRADIENT = 'linear-gradient(179deg, #003E7F 31.476%, #052649 96.729%)'

const ROUTINE_KEYS = ['WATER', 'EXERCISE', 'MEAL', 'SLEEP', 'CONDITION', 'GRATITUDE'] as const
type RoutineKey = typeof ROUTINE_KEYS[number]

// 나의 영양제 찾아보기(/challenge/products) 이동 후 복귀 시 입력값 보존용
const CREATE_DRAFT_KEY = 'challenge-create-form-draft'

type FormDraft = {
  title: string
  durationMonths: number
  routineOn: Record<RoutineKey, boolean>
  notifOn: boolean
}

function loadFormDraft(): Partial<FormDraft> {
  try {
    const raw = sessionStorage.getItem(CREATE_DRAFT_KEY)
    return raw ? (JSON.parse(raw) as FormDraft) : {}
  } catch {
    return {}
  }
}

type ReportDetail = {
  id: string
  products?: Product[]
}

function pad(n: number) { return String(n).padStart(2, '0') }

function todayStr() {
  const d = new Date()
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

function formatDate(s: string) {
  return s.replace(/-/g, '.')
}

function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!on)}
      className={`w-[51px] h-[25px] rounded-full flex items-center px-[3px] transition-colors flex-shrink-0
        ${on ? 'bg-[#003E7F] justify-end' : 'bg-[#94A3B8] justify-start'}`}
    >
      <div className="w-[19px] h-[19px] rounded-full bg-white shadow-sm" />
    </button>
  )
}

function PointBadge({ points }: { points: string }) {
  return (
    <span className="inline-flex items-center rounded-full bg-[#FFE4E4] px-[9px] py-[3px] text-[12px] font-semibold text-[#E05252] tracking-[-0.24px] flex-shrink-0">
      {points}
    </span>
  )
}

function planTierBg(tier?: string) {
  if (tier === 'basic') return 'bg-[#5BA3D9]'
  if (tier === 'standard') return 'bg-[#2B6CB0]'
  if (tier === 'premium') return 'bg-[#003E7F]'
  return 'bg-[#64748B]'
}
function planTierLabel(tier?: string) {
  if (tier === 'basic') return 'Basic'
  if (tier === 'standard') return 'Standard'
  if (tier === 'premium') return 'Premium'
  return tier ?? ''
}

// 단계별 그룹: 등급은 단계별 조합 등급(상위 등급이 하위를 누적 포함)이므로
// 그룹의 등급 = 해당 단계 제품 중 최상위 tier (검색으로 추가한 제품은 plan_tier 없음 → 등급 산정 제외)
const STAGE_ORDER = ['DNA_ALL', 'D', 'N', 'A'] as const
const TIER_RANK: Record<string, number> = { basic: 0, standard: 1, premium: 2 }

type StageGroup = { stage: typeof STAGE_ORDER[number] | 'OTHER'; tier?: string; items: DraftProduct[] }

function groupByStage(products: DraftProduct[]): StageGroup[] {
  const groups: StageGroup[] = STAGE_ORDER.flatMap((stage) => {
    const items = products.filter((p) => p.dna_stage === stage)
    if (items.length === 0) return []
    const tier = items.reduce<string | undefined>((max, p) => {
      if (!p.plan_tier) return max
      if (max === undefined) return p.plan_tier
      return TIER_RANK[p.plan_tier] > TIER_RANK[max] ? p.plan_tier : max
    }, undefined)
    return [{ stage, tier, items }]
  })
  // 단계 정보가 없는(검색 추가 등) 제품은 '기타' 그룹으로 — 목록에서 누락/삭제 불가 방지
  const known = new Set<string>(STAGE_ORDER)
  const rest = products.filter((p) => !p.dna_stage || !known.has(p.dna_stage))
  if (rest.length > 0) groups.push({ stage: 'OTHER', tier: undefined, items: rest })
  return groups
}

// ── 제품 카드 (단계별 그룹 내, 삭제 가능) ──────────────────────
// 등급(plan_tier)은 제품 속성이 아니라 단계별 조합 등급이므로 카드에는 표시하지 않음
function ProductCard({ product, onRemove }: { product: DraftProduct; onRemove: () => void }) {
  return (
    <div className="flex items-center gap-3 py-3 border-b border-[#EAF0F7] last:border-0">
      {product.package_image_url ? (
        <img
          src={product.package_image_url}
          alt={product.product_name}
          className="w-[52px] h-[52px] object-contain rounded-[8px] bg-[#F1F5F9] flex-shrink-0"
        />
      ) : (
        <div className="w-[52px] h-[52px] rounded-[8px] bg-[#F1F5F9] flex-shrink-0" />
      )}
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-semibold text-[#1E293B] leading-tight truncate">{product.product_name}</p>
        {product.intake_timing && (
          <p className="text-[11px] text-[#64748B] mt-0.5 truncate">{product.intake_timing}</p>
        )}
      </div>
      <button
        type="button"
        onClick={onRemove}
        className="flex-shrink-0 w-6 h-6 flex items-center justify-center"
        aria-label="제품 삭제"
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M1 1L13 13M13 1L1 13" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </button>
    </div>
  )
}

// ── 메인 ─────────────────────────────────────────────────────
export default function ChallengeCreatePage() {
  const { t } = useTranslation('challenge')
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [title, setTitle] = useState(() => loadFormDraft().title ?? '')
  const [durationMonths, setDurationMonths] = useState(() => loadFormDraft().durationMonths ?? 1)
  const startDate = todayStr()
  const [routineOn, setRoutineOn] = useState<Record<RoutineKey, boolean>>(
    () => loadFormDraft().routineOn ?? {
      WATER: true, EXERCISE: true, MEAL: true, SLEEP: true, CONDITION: true, GRATITUDE: true,
    }
  )
  const [notifOn, setNotifOn] = useState(() => loadFormDraft().notifOn ?? true)
  const [error, setError] = useState('')

  // 입력값 보존 — 영양제 검색 페이지 다녀와도 유지
  useEffect(() => {
    sessionStorage.setItem(
      CREATE_DRAFT_KEY,
      JSON.stringify({ title, durationMonths, routineOn, notifOn } satisfies FormDraft)
    )
  }, [title, durationMonths, routineOn, notifOn])

  const { products: draftProducts, initialized: draftInitialized, setProducts: setDraftProducts, removeProduct } = useChallengeDraftStore()

  const isDemo = useAuthStore((s) => s.accessToken) === '__demo__'
  const noAutoLogout = { validateStatus: (s: number) => s < 500 }

  // 이미 진행 중인 챌린지가 있으면 챌린지 홈으로 리다이렉트
  const { data: currentData, isLoading: isCurrentLoading } = useQuery({
    queryKey: ['challenge-current'],
    queryFn: () => apiClient.get('/challenges/current', noAutoLogout),
    retry: false,
    enabled: !isDemo,
  })
  const currentLoading = !isDemo && isCurrentLoading
  useEffect(() => {
    if (currentData?.status === 200) {
      navigate('/challenge', { replace: true })
    }
  }, [currentData, navigate])

  const { data: reportsRes } = useQuery({
    queryKey: ['reports-latest'],
    queryFn: () => apiClient.get('/reports/me', { params: { limit: 1 }, ...noAutoLogout }),
    retry: false,
    enabled: !isDemo,
  })
  const latestReportId = reportsRes?.status === 200
    ? (reportsRes.data as unknown as { items: { id: string }[] })?.items?.[0]?.id
    : undefined

  const { data: reportRes } = useQuery({
    queryKey: ['report', latestReportId],
    queryFn: () => apiClient.get(`/reports/${latestReportId}`, noAutoLogout),
    enabled: !!latestReportId,
    retry: false,
  })
  const report = reportRes?.status === 200
    ? (reportRes.data as unknown as ReportDetail)
    : undefined
  const reportProducts = report?.products ?? []

  // 리포트 추천 제품으로 draft store 최초 초기화 (이후 사용자가 편집)
  useEffect(() => {
    if (!draftInitialized && reportProducts.length > 0) {
      // 리포트 제품은 질환(암/만성)·DNA 단계별로 같은 product_id가 여러 행 존재
      // → 챌린지는 복용 체크용이므로 product_id 기준 첫 등장 행만 유지
      const seen = new Set<string>()
      const unique = reportProducts.filter((p) => {
        if (seen.has(p.product_id)) return false
        seen.add(p.product_id)
        return true
      })
      setDraftProducts(
        unique.map((p) => ({
          product_id: p.product_id,
          product_name: p.product_name,
          plan_tier: p.plan_tier,
          dna_stage: p.dna_stage,
          intake_timing: p.intake_timing,
          package_image_url: p.package_image_url,
        }))
      )
    }
  }, [reportProducts, draftInitialized, setDraftProducts])

  // 편집된 제품 목록 (삭제/검색 추가 반영)
  const challengeProducts = draftInitialized ? draftProducts : []
  const productIds = challengeProducts.map((p) => p.product_id)

  const handleRemoveProduct = (productId: string) => {
    removeProduct(productId)
  }

  // 제품 섭취(PRODUCT)는 별도 토글 없이 추천 영양제 선택 시 자동 포함되는 루틴
  const buildSelectedRoutines = (): string[] => {
    const routines: string[] = ROUTINE_KEYS.filter((k) => routineOn[k])
    if (productIds.length > 0) routines.push('PRODUCT')
    return routines
  }

  const createMutation = useMutation({
    mutationFn: () => challengeApi.create({
      title,
      duration_months: durationMonths,
      selected_routines: buildSelectedRoutines(),
      product_ids: productIds.length > 0 ? productIds : null,
      report_id: latestReportId ?? null,
    }),
    onSuccess: () => {
      sessionStorage.removeItem(CREATE_DRAFT_KEY)
      queryClient.invalidateQueries({ queryKey: ['challenge-current'] })
      navigate('/challenge')
    },
    onError: (err: unknown) => {
      const status = (err as { response?: { status?: number; data?: { detail?: string } } })?.response?.status
      const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail
      if (status === 409) {
        queryClient.invalidateQueries({ queryKey: ['challenge-current'] })
        navigate('/challenge', { replace: true })
        return
      }
      setError(detail ?? '챌린지 생성에 실패했어요. 다시 시도해주세요.')
    },
  })

  const handleSubmit = () => {
    if (!title.trim()) { setError(t('create.errorNoName')); return }
    if (buildSelectedRoutines().length === 0) { setError(t('create.errorNoRoutine')); return }
    setError('')
    createMutation.mutate()
  }

  if (currentLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-[#F1F5F9]" />
  }

  return (
    <AppShell
      active="challenge"
      topbarLeft={
        <span className="text-[17px] font-bold text-[#1E293B]">{t('create.topTitle')}</span>
      }
    >
      {/* 공통 헤더 — 모바일 전용 */}
      <div className="md:hidden">
        <Header showBack title={<span className="text-[17px] font-bold text-[#1E293B]">{t('create.topTitle')}</span>} />
      </div>

      <div className="flex-1 flex flex-col bg-[#F1F5F9] overflow-y-auto">
        <div className="flex flex-col w-full px-5 pt-6 pb-10 gap-5 md:max-w-[600px] md:px-10 md:py-8">

          <ChallengeTopTabs active="mine" />

          {/* 챌린지 이름 */}
          <div>
            <label className="text-[13px] font-semibold text-[#64748B] mb-2 block tracking-[-0.26px]">
              {t('create.nameLabel')}
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t('create.namePlaceholder')}
              className="w-full h-[49px] rounded-full border border-[#C5D6E8] bg-white px-5 text-[14px] text-[#1E293B] placeholder-[#94A3B8] tracking-[-0.28px] outline-none focus:border-[#003E7F]"
            />
          </div>

          {/* 기간 설정 */}
          <div className="flex gap-3 items-end">
            {/* 시작일 — 오늘 고정 */}
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-semibold text-[#64748B] mb-1.5 tracking-[-0.26px]">{t('create.startDate')}</p>
              <div className="h-[49px] rounded-full border border-[#C5D6E8] bg-[#F1F5F9] flex items-center px-5">
                <span className="text-[14px] text-[#94A3B8] tracking-[-0.28px]">{formatDate(startDate)}</span>
              </div>
            </div>

            {/* 기간 — 드롭다운 */}
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-semibold text-[#64748B] mb-1.5 tracking-[-0.26px]">{t('create.duration')}</p>
              <div className="relative">
                <select
                  value={durationMonths}
                  onChange={(e) => setDurationMonths(Number(e.target.value))}
                  className="w-full h-[49px] rounded-full border border-[#003E7F] bg-white px-5 pr-10 text-[14px] text-[#1E293B] tracking-[-0.28px] outline-none appearance-none cursor-pointer"
                >
                  <option value={1}>1달</option>
                  <option value={2}>2달</option>
                  <option value={3}>3달</option>
                </select>
                <svg width="12" height="7" viewBox="0 0 12 7" fill="none" className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                  <path d="M1 1L6 6L11 1" stroke="#003E7F" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            </div>
          </div>

          {/* ── 해밀리 헬스 추천 영양제 (D·N·A 단계별 조합 등급 그룹, 편집 가능) ── */}
          <div className="flex flex-col gap-3">
            <p className="text-[14px] font-bold text-[#1E293B] tracking-[-0.28px]">{t('create.productsTitle')}</p>
            {groupByStage(challengeProducts).map(({ stage, tier, items }) => (
              <div key={stage} className="bg-white rounded-[14px] shadow-[0_1px_6px_rgba(0,0,0,0.06)] px-4 pb-2">
                <div className="flex items-center justify-between py-3 border-b border-[#EAF0F7]">
                  <p className="text-[13px] font-bold text-[#1E293B] tracking-[-0.26px]">
                    {stage === 'DNA_ALL' ? t('create.stageCommon')
                      : stage === 'OTHER' ? t('create.stageEtc')
                      : t(`create.stage${stage}`)}
                  </p>
                  {tier && (
                    <span className={`inline-block text-white text-[11px] font-medium px-2.5 py-[3px] rounded-full ${planTierBg(tier)}`}>
                      {planTierLabel(tier)}
                    </span>
                  )}
                </div>
                {items.map((p) => (
                  <ProductCard key={p.product_id} product={p} onRemove={() => handleRemoveProduct(p.product_id)} />
                ))}
              </div>
            ))}
            <button
              type="button"
              onClick={() => navigate('/challenge/products')}
              className="w-full h-[54px] rounded-[10px] bg-[#003E7F] flex items-center justify-center text-white text-[16px] font-bold tracking-[-0.32px]"
            >
              {t('create.findSupplements')}
            </button>
          </div>

          {/* 챌린지 항목 설정 */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <p className="text-[14px] font-bold text-[#1E293B] tracking-[-0.28px]">{t('create.routinesTitle')}</p>
              <p className="text-[12px] text-[#EF4444] tracking-[-0.24px]">{t('create.routinesRequired')}</p>
            </div>
            <div className="flex flex-col gap-2">
              {ROUTINE_KEYS.map((key) => (
                <div
                  key={key}
                  className="flex items-center justify-between bg-white rounded-[14px] px-4 py-3 shadow-[0_1px_4px_rgba(0,0,0,0.05)]"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="md:hidden"><PointBadge points={`+${ROUTINE_POINTS[key]}p`} /></span>
                    <span className="text-[14px] font-medium text-[#1E293B] tracking-[-0.28px] truncate">
                      {t(`create.${key}`)}
                    </span>
                    <span className="hidden md:inline"><PointBadge points={`+${ROUTINE_POINTS[key]}p`} /></span>
                  </div>
                  <Toggle
                    on={routineOn[key]}
                    onChange={(v) => setRoutineOn((prev) => ({ ...prev, [key]: v }))}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* 알림 설정 */}
          <div>
            <p className="text-[13px] font-semibold text-[#64748B] tracking-[-0.26px] mb-2">{t('create.notifTitle')}</p>
            <div
              className={`flex items-center justify-between rounded-[14px] px-4 py-3.5 transition-colors ${
                notifOn ? 'bg-[#DBEAFE] border border-[#93C5FD]' : 'bg-white border border-[#E2E8F0]'
              }`}
            >
              <p className="text-[14px] font-medium text-[#1E293B] tracking-[-0.28px]">{t('create.notifLabel')}</p>
              <Toggle on={notifOn} onChange={setNotifOn} />
            </div>
          </div>

          {error && (
            <p className="text-[13px] text-[#EF4444] text-center tracking-[-0.26px]">{error}</p>
          )}

          <button
            type="button"
            onClick={handleSubmit}
            disabled={createMutation.isPending}
            className="h-[52px] rounded-full flex items-center justify-center text-white text-[16px] font-medium tracking-[-0.32px] disabled:opacity-60"
            style={{ backgroundImage: NAVY_GRADIENT }}
          >
            {createMutation.isPending ? '처리 중...' : t('create.submitBtn')}
          </button>
        </div>
      </div>
    </AppShell>
  )
}
