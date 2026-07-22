import { useState, useMemo, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import AppShell from '../../components/layout/AppShell'
import BottomNav from '../../components/layout/BottomNav'
import Header from '../../components/layout/Header'
import ChallengeTopTabs from '../../components/challenge/ChallengeTopTabs'
import ChallengeCompletePage from './ChallengeCompletePage'
import apiClient from '../../lib/api/client'
import { challengeApi } from '../../lib/api/challenge'
import type { Product } from '../../types'

const noAutoLogout = { validateStatus: (s: number) => s < 500 }

// 생활 습관 섹션에 표시할 루틴 (PRODUCT/GRATITUDE 제외) — 표시 순서
const LIFESTYLE_ORDER = ['WATER', 'EXERCISE', 'MEAL', 'SLEEP', 'CONDITION', 'INNER_REFLECTION'] as const

const WATER_MAX_CUPS = 7 // 백엔드 _WATER_MAX_CUPS와 동일해야 함 (초과 시 422)

// 팝업으로 세부 선택이 필요한 루틴
const WALK_OPTIONS = ['under_7000', 'over_7000', 'over_10000'] as const
const SLEEP_OPTIONS = ['under_6h', '6to8h', 'over_8h'] as const
const CONDITION_OPTIONS = ['very_good', 'good', 'normal', 'tired', 'very_tired'] as const

type ExerciseSelection = { walk_steps: string | null; strength: boolean; stretching: boolean }

type CurrentChallenge = {
  challenge_id: string
  title?: string | null
  selected_routines: string[]
  products?: Array<{ product_id: string; product_name: string; display_order: number }>
  today: { date: string; submitted: boolean; today_daily_rate: number }
  progress: { overall_rate: number; consecutive_days: number; elapsed_days: number; total_days: number; remaining_days: number }
}

// ── 체크 동그라미 ──────────────────────────────────────────────
function CheckCircle({ checked, size = 26 }: { checked: boolean; size?: number }) {
  const r = size / 2
  return checked ? (
    <svg width={size} height={size} viewBox="0 0 26 26" fill="none">
      <circle cx="13" cy="13" r="13" fill="#003E7F" />
      <path d="M7 13L11 17L19 9" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ) : (
    <svg width={size} height={size} viewBox="0 0 26 26" fill="none">
      <circle cx="13" cy="13" r={r - 1.5} stroke="#94A3B8" strokeWidth="1.5" />
    </svg>
  )
}

function CameraIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path d="M3 8.5C3 7.67 3.67 7 4.5 7H6.5L7.7 5.2C7.9 4.95 8.2 4.8 8.5 4.8H15.5C15.8 4.8 16.1 4.95 16.3 5.2L17.5 7H19.5C20.33 7 21 7.67 21 8.5V17.5C21 18.33 20.33 19 19.5 19H4.5C3.67 19 3 18.33 3 17.5V8.5Z" stroke="#94A3B8" strokeWidth="1.5" strokeLinejoin="round" />
      <circle cx="12" cy="12.5" r="3.2" stroke="#94A3B8" strokeWidth="1.5" />
    </svg>
  )
}

// 팝업 내 선택 버튼 (단일/복수 선택 공용)
function OptionPill({ label, selected, onClick }: { label: string; selected: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-4 h-[40px] rounded-full text-[14px] font-medium tracking-[-0.28px] border transition-colors ${
        selected ? 'bg-[#003E7F] text-white border-[#003E7F]' : 'bg-white text-[#555] border-[#D2DEEA]'
      }`}
    >
      {label}
    </button>
  )
}

export default function TodayChallengePage({ challenge }: {
  challenge: CurrentChallenge
}) {
  const { t } = useTranslation('challenge')
  const navigate = useNavigate()

  // submitted 플래그는 "로그 레코드 생성됨"을 의미 — 실제 완료(100%) 여부로만 잠금
  const alreadySubmitted = (challenge.today.today_daily_rate ?? 0) >= 100
  const challengeId = challenge.challenge_id
  const logDate = challenge.today.date
  const storageKey = `supplement_checked_${challengeId}_${logDate}`

  // 리포트 제품 (영양제 복용 카드 소스 — 챌린지 제품 조회 API 부재로 리포트 재사용)
  const { data: reportsRes } = useQuery({
    queryKey: ['reports-latest'],
    queryFn: () => apiClient.get('/reports/me', { params: { limit: 1 }, ...noAutoLogout }),
    retry: false,
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
  const products: Product[] = reportRes?.status === 200
    ? ((reportRes.data as unknown as { products?: Product[] })?.products ?? [])
    : []

  const { data: dailyLogRes } = useQuery({
    queryKey: ['dailyLog', challengeId, logDate],
    queryFn: () => challengeApi.getDailyLog(challengeId, logDate),
    enabled: !alreadySubmitted,
    retry: false,
  })

  const hasProduct = challenge.selected_routines.includes('PRODUCT')
  const lifestyleItems = LIFESTYLE_ORDER.filter((k) => challenge.selected_routines.includes(k))
  const hasGratitude = challenge.selected_routines.includes('GRATITUDE')

  // ── 체크 상태 (일방향, 세션 기준 — 하루 지나면 초기화) ──
  // 이미 제출된 날은 읽기 전용(전부 체크된 것으로 표시)
  const [checkedProducts, setCheckedProducts] = useState<Set<string>>(() => {
    if (alreadySubmitted) return new Set(products.map((p) => p.product_id))
    const stored = sessionStorage.getItem(storageKey)
    return stored ? new Set(JSON.parse(stored) as string[]) : new Set()
  })
  const [checkedRoutines, setCheckedRoutines] = useState<Set<string>>(
    () => alreadySubmitted ? new Set([...LIFESTYLE_ORDER]) : new Set()
  )
  // 5감사일기 — 하나씩 저장해 누적, 5개 채워지면 완료(입력 영역 숨김)
  const [gratitudeList, setGratitudeList] = useState<string[]>([])
  const [gratitudeInput, setGratitudeInput] = useState('')
  const gratitudeComplete = alreadySubmitted || gratitudeList.length >= 5

  // 세부 선택 팝업 (운동/수면/몸 상태) — 선택값은 로컬 보관, 백엔드 컬럼 형식과 매핑
  const [showWaterModal, setShowWaterModal] = useState(false)
  const [waterCups, setWaterCups] = useState(1)
  const [modalRoutine, setModalRoutine] = useState<'EXERCISE' | 'SLEEP' | 'CONDITION' | null>(null)
  const [exerciseSel, setExerciseSel] = useState<ExerciseSelection>({ walk_steps: null, strength: false, stretching: false })
  const [sleepBand, setSleepBand] = useState<string | null>(null)
  const [bodyStatus, setBodyStatus] = useState<string | null>(null)

  // 이미 제출된 날: 제품이 비동기 로드 완료되면 전부 체크 상태로 동기화
  useEffect(() => {
    if (alreadySubmitted && products.length > 0) {
      setCheckedProducts(new Set(products.map((p) => p.product_id)))
    }
  }, [alreadySubmitted, products])

  // 체크된 제품 sessionStorage 동기화 (인증샷 페이지 이탈 후 복원)
  useEffect(() => {
    if (!alreadySubmitted) {
      sessionStorage.setItem(storageKey, JSON.stringify([...checkedProducts]))
    }
  }, [checkedProducts, storageKey, alreadySubmitted])

  // 미제출 날: 일일 로그에서 이미 체크된 루틴 상태 복원
  useEffect(() => {
    if (!dailyLogRes || dailyLogRes.status !== 200 || alreadySubmitted) return
    const rates = dailyLogRes.data.item_rates ?? {}
    setCheckedRoutines((prev) => {
      const next = new Set(prev)
      for (const [key, rate] of Object.entries(rates)) {
        if (rate <= 0 || key === 'PRODUCT') continue
        // WATER는 8잔(100%) 달성 시에만 완료
        if (key === 'WATER' && rate < 100) continue
        next.add(key)
      }
      return next
    })
    // 저장된 물 잔 수 복원 (100% = 8잔, 그 외 비율로 역산)
    const waterRate = rates['WATER'] ?? 0
    if (waterRate > 0) {
      setWaterCups(Math.round((waterRate / 100) * WATER_MAX_CUPS))
    }
  }, [dailyLogRes, alreadySubmitted])


  const checkRoutine = (key: string) => {
    if (alreadySubmitted) return
    setCheckedRoutines((prev) => prev.has(key) ? prev : new Set(prev).add(key))
  }
  // 카드 클릭: 운동/수면/몸 상태는 세부 선택 팝업, 나머지는 단순 체크 + 즉시 영속화
  // 연속 클릭(중복 API 호출) 방지용
  const checkBusyRef = useRef(false)

  const handleRoutineClick = (key: string) => {
    if (alreadySubmitted) return
    if (key === 'WATER') {
      setShowWaterModal(true)
      return
    }
    if (key === 'EXERCISE' || key === 'SLEEP' || key === 'CONDITION') {
      setModalRoutine(key)
      return
    }
    if (checkedRoutines.has(key) || checkBusyRef.current) return
    checkBusyRef.current = true
    checkRoutine(key)
    const req = key === 'MEAL'
      ? challengeApi.checkMealRoutine(challengeId, logDate)
      : challengeApi.checkReflectionRoutine(challengeId, logDate)
    req.catch(() => {}).finally(() => { checkBusyRef.current = false })
  }
  // 팝업에서 선택 완료 시 해당 루틴 체크 처리 + 선택값 영속화 후 닫기
  const confirmModal = () => {
    if (!modalRoutine || checkBusyRef.current) return
    checkBusyRef.current = true
    checkRoutine(modalRoutine)
    let req: Promise<unknown> | null = null
    if (modalRoutine === 'EXERCISE') {
      req = challengeApi.checkExerciseRoutine(challengeId, logDate, {
        walk_steps: exerciseSel.walk_steps,
        exercise_strength: exerciseSel.strength,
        exercise_stretching: exerciseSel.stretching,
      })
    } else if (modalRoutine === 'SLEEP' && sleepBand) {
      req = challengeApi.checkSleepRoutine(challengeId, logDate, sleepBand)
    } else if (modalRoutine === 'CONDITION' && bodyStatus) {
      req = challengeApi.checkConditionRoutine(challengeId, logDate, bodyStatus)
    }
    if (req) {
      req.catch(() => {}).finally(() => { checkBusyRef.current = false })
    } else {
      checkBusyRef.current = false
    }
    setModalRoutine(null)
  }
  const exerciseHasSelection = exerciseSel.walk_steps !== null || exerciseSel.strength || exerciseSel.stretching
  const modalCanConfirm =
    modalRoutine === 'EXERCISE' ? exerciseHasSelection
    : modalRoutine === 'SLEEP' ? sleepBand !== null
    : modalRoutine === 'CONDITION' ? bodyStatus !== null
    : false
  const [gratitudeSaving, setGratitudeSaving] = useState(false)
  const saveGratitude = async () => {
    if (gratitudeComplete || !gratitudeInput.trim() || gratitudeSaving) return
    const item = gratitudeInput.trim()
    setGratitudeSaving(true)
    try {
      await challengeApi.checkGratitudeRoutine(challengeId, logDate, [item])
      setGratitudeList((prev) => [...prev, item])
      setGratitudeInput('')
    } catch { /* 실패 시 입력 유지 — 재시도 가능 */ } finally {
      setGratitudeSaving(false)
    }
  }

  // ── 실시간 달성률 (클라이언트 계산, 백엔드 평균 방식 미러) ──
  const liveRate = useMemo(() => {
    if (alreadySubmitted) return challenge.today.today_daily_rate
    const rates: number[] = []
    if (hasProduct) {
      // report products 미로드 시 challenge.products.length 폴백 사용
      const productCount = products.length > 0 ? products.length : (challenge.products?.length ?? 0)
      rates.push(productCount === 0 ? 0 : Math.round((checkedProducts.size / productCount) * 100))
    }
    for (const k of lifestyleItems) rates.push(checkedRoutines.has(k) ? 100 : 0)
    if (hasGratitude) rates.push(gratitudeComplete ? 100 : 0)
    if (rates.length === 0) return 0
    return Math.round(rates.reduce((a, b) => a + b, 0) / rates.length)
  }, [alreadySubmitted, challenge.today.today_daily_rate, hasProduct, products, challenge.products, checkedProducts, lifestyleItems, checkedRoutines, hasGratitude, gratitudeComplete])

  const streak = challenge.progress.consecutive_days

  // ── 완료 화면 (달성률 100% 도달 시) ──
  const [dismissedComplete, setDismissedComplete] = useState(false)
  const isComplete = liveRate === 100

  const StreakCard = (
    <div className="bg-[#003E7F] rounded-[12px] md:rounded-[16px] px-6 py-4 md:px-7 md:h-[88px] flex items-center gap-3 shadow-[0_2px_12px_rgba(0,0,0,0.05)]">
      <span className="text-[56px] md:text-[36px] font-bold text-white leading-none">{streak}</span>
      <span className="text-[16px] md:text-[16px] font-medium text-white">{t('main.streakSuffix')}</span>
      <div className="ml-auto flex items-center bg-white/20 rounded-full px-3.5 h-[28px]">
        <span className="text-[12px] font-medium text-white">{t('main.todayRate')} </span>
        <span className="text-[12px] font-bold text-[#FFE3DD] ml-1">{liveRate}</span>
        <span className="text-[12px] font-medium text-white">%</span>
      </div>
    </div>
  )

  // ── 영양제 복용 카드 ──
  const SupplementCard = ({ p }: { p: Product }) => {
    const checked = checkedProducts.has(p.product_id)
    return (
      <button
        type="button"
        onClick={() => navigate(`/challenge/recognition?product_id=${p.product_id}&challenge_id=${challengeId}&log_date=${logDate}&product_name=${encodeURIComponent(p.product_name)}&product_image=${encodeURIComponent(p.package_image_url ?? '')}`)}
        disabled={alreadySubmitted || checked}
        className={`w-full flex items-center gap-3 rounded-[12px] pl-5 pr-4 py-4 text-left transition-colors md:bg-white md:shadow-[0_2px_12px_rgba(0,0,0,0.05)] ${
          checked ? 'bg-[#DBEAFE]' : 'bg-[#F8FAFF]'
        }`}
      >
        <span className="flex-shrink-0"><CheckCircle checked={checked} /></span>
        {p.package_image_url ? (
          <img src={p.package_image_url} alt={p.product_name} className="w-[68px] h-[68px] md:w-[40px] md:h-[40px] object-cover rounded-[8px] flex-shrink-0" />
        ) : (
          <div className="w-[68px] h-[68px] md:w-[40px] md:h-[40px] rounded-[8px] bg-[#DBEAFE] flex-shrink-0" />
        )}
        <div className="flex-1 min-w-0 flex flex-col gap-1">
          <p className="text-[15px] md:text-[13px] font-bold text-[#1E293B] tracking-[-0.3px] leading-tight">{p.product_name}</p>
          {p.intake_timing && <p className="text-[12px] md:text-[11px] text-[#64748B]">{p.intake_timing}</p>}
        </div>
        <span className="flex-shrink-0 self-center">
          {checked
            ? <span className="text-[12px] font-bold text-[#003E7F]">{t('main.uploadDone')}</span>
            : <CameraIcon />}
        </span>
      </button>
    )
  }

  // ── 생활 습관 카드 ──
  const LifestyleCard = ({ k }: { k: typeof LIFESTYLE_ORDER[number] }) => {
    const checked = checkedRoutines.has(k)
    const desc = t(`main.routineDesc.${k}`, { defaultValue: '' })
    return (
      <button
        type="button"
        onClick={() => handleRoutineClick(k)}
        disabled={alreadySubmitted}
        className={`w-full flex items-center gap-5 rounded-[12px] px-6 py-4 text-left transition-colors md:bg-white md:shadow-[0_2px_12px_rgba(0,0,0,0.05)] md:h-[64px] ${
          checked ? 'bg-[#DBEAFE]' : 'bg-[#F8FAFF]'
        }`}
      >
        <span className="flex-shrink-0"><CheckCircle checked={checked} /></span>
        <div className="flex flex-col gap-1 min-w-0">
          <p className="text-[16px] md:text-[14px] font-bold md:font-medium text-[#1E293B] tracking-[-0.32px]">
            {t(`main.routineLabel.${k}`)}
          </p>
          {desc && <p className="text-[12px] text-[#555] tracking-[-0.24px] md:hidden">{desc}</p>}
        </div>
      </button>
    )
  }

  // ── 감사일기 섹션 ──
  const GratitudeSection = hasGratitude ? (
    <section className="flex flex-col gap-5">
      <h2 className="text-[21px] md:text-[15px] font-bold text-[#1E293B]">{t('main.gratitudeSection')}</h2>
      <div className="flex flex-col gap-2">
        {/* 작성 완료된 일기 — 일기마다 분홍 카드 하나씩 */}
        {gratitudeList.map((g, i) => (
          <div key={i} className="bg-[#FFE3DD] rounded-[10px] px-6 py-4">
            <p className="text-[12px] text-[#555] tracking-[-0.24px] break-keep">{g}</p>
          </div>
        ))}
        {/* 입력 영역 — 5개 미만일 때만 노출 */}
        {!gratitudeComplete && (
          <div className="bg-[#F8FAFF] rounded-[10px] px-5 py-4 flex flex-col gap-3">
            <p className="text-[12px] font-bold text-[#555] tracking-[-0.24px]">{t('main.gratitudeTodayLabel')}</p>
            <input
              type="text"
              value={gratitudeInput}
              onChange={(e) => setGratitudeInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') saveGratitude() }}
              placeholder={t('main.gratitudeItemPlaceholder', { index: gratitudeList.length + 1 })}
              className="w-full bg-[#F1F5F9] rounded-[5px] px-3 h-[40px] text-[12px] text-[#1E293B] placeholder-[#C5C5C5] tracking-[-0.24px] outline-none"
            />
            <button
              type="button"
              onClick={saveGratitude}
              disabled={!gratitudeInput.trim() || gratitudeSaving}
              className="self-end bg-[#003E7F] text-white text-[14px] font-semibold rounded-[5px] px-4 h-[27px] disabled:opacity-50"
            >
              {t('main.save')}
            </button>
          </div>
        )}
      </div>
    </section>
  ) : null

  const supplementCount = products.length > 0 ? products.length : (challenge.products?.length ?? 0)
  const SupplementSection = hasProduct && supplementCount > 0 ? (
    <section className="flex flex-col gap-5">
      <h2 className="text-[21px] md:text-[15px] font-bold text-[#1E293B]">{t('main.supplementSection')}</h2>
      <div className="flex flex-col gap-3 md:gap-2">
        {products.map((p) => <SupplementCard key={p.product_id} p={p} />)}
      </div>
    </section>
  ) : null

  const LifestyleSection = lifestyleItems.length > 0 ? (
    <section className="flex flex-col gap-5">
      <h2 className="text-[21px] md:text-[15px] font-bold text-[#1E293B]">{t('main.lifestyleSection')}</h2>
      <div className="flex flex-col gap-3 md:gap-2">
        {lifestyleItems.map((k) => <LifestyleCard key={k} k={k} />)}
      </div>
    </section>
  ) : null

  // ── 물 잔 수 팝업 ──
  const confirmWater = () => {
    if (checkBusyRef.current) return
    checkBusyRef.current = true
    // 최대 잔 수 달성 시에만 완료 처리
    if (waterCups === WATER_MAX_CUPS) checkRoutine('WATER')
    challengeApi.checkWaterRoutine(challengeId, logDate, waterCups)
      .catch(() => {})
      .finally(() => { checkBusyRef.current = false })
    setShowWaterModal(false)
  }
  const WaterModal = showWaterModal ? (
    <div
      className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/40"
      onClick={() => setShowWaterModal(false)}
    >
      <div
        className="w-full max-w-[480px] md:w-[400px] bg-white rounded-t-[20px] md:rounded-[20px] px-6 pt-6 pb-8 flex flex-col gap-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-col gap-1">
          <p className="text-[18px] font-bold text-[#1E293B] tracking-[-0.36px]">{t('water.modalTitle')}</p>
          <p className="text-[13px] text-[#64748B] tracking-[-0.26px]">{t('water.modalDesc')}</p>
        </div>

        {/* 컵 아이콘 그리드 — 탭하면 해당 잔 수로 설정 */}
        <div className="grid grid-cols-4 gap-3">
          {Array.from({ length: WATER_MAX_CUPS }, (_, i) => {
            const n = i + 1
            const filled = n <= waterCups
            return (
              <button
                key={n}
                type="button"
                onClick={() => setWaterCups(n)}
                className="flex flex-col items-center gap-1"
              >
                <svg width="44" height="52" viewBox="0 0 44 52" fill="none">
                  <path
                    d="M8 6h28l-4 40H12L8 6Z"
                    fill={filled ? '#DBEAFE' : '#F1F5F9'}
                    stroke={filled ? '#003E7F' : '#CBD5E1'}
                    strokeWidth="1.5"
                    strokeLinejoin="round"
                  />
                  {filled && (
                    <path
                      d="M10 28h24l-2 18H12L10 28Z"
                      fill="#5BA3D9"
                    />
                  )}
                  <path d="M6 6h32" stroke={filled ? '#003E7F' : '#CBD5E1'} strokeWidth="1.5" strokeLinecap="round" />
                </svg>
                <span className={`text-[12px] font-bold ${filled ? 'text-[#003E7F]' : 'text-[#94A3B8]'}`}>{n}</span>
              </button>
            )
          })}
        </div>

        {/* 현재 선택 잔 수 */}
        <p className="text-center text-[28px] font-bold text-[#003E7F] tracking-[-0.56px]">
          {t('water.cupsLabel', { count: waterCups })}
        </p>

        <button
          type="button"
          onClick={confirmWater}
          className="h-[52px] rounded-full bg-[#003E7F] text-white text-[16px] font-medium tracking-[-0.32px]"
        >
          {t('water.save')}
        </button>
      </div>
    </div>
  ) : null

  // ── 세부 선택 팝업 (운동/수면/몸 상태) ──
  const modalTitleKey = modalRoutine === 'EXERCISE' ? 'exerciseTitle' : modalRoutine === 'SLEEP' ? 'sleepTitle' : 'conditionTitle'
  const modalDescKey = modalRoutine === 'EXERCISE' ? 'exerciseDesc' : modalRoutine === 'SLEEP' ? 'sleepDesc' : 'conditionDesc'
  const LifestyleModal = modalRoutine ? (
    <div
      className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/40"
      onClick={() => setModalRoutine(null)}
    >
      <div
        className="w-full max-w-[480px] md:w-[400px] bg-white rounded-t-[20px] md:rounded-[20px] px-6 pt-6 pb-8 flex flex-col gap-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-col gap-1">
          <p className="text-[18px] font-bold text-[#1E293B] tracking-[-0.36px]">{t(`main.lifestyleModal.${modalTitleKey}`)}</p>
          <p className="text-[13px] text-[#64748B] tracking-[-0.26px]">{t(`main.lifestyleModal.${modalDescKey}`)}</p>
        </div>

        {modalRoutine === 'EXERCISE' && (
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <p className="text-[14px] font-bold text-[#1E293B]">{t('main.lifestyleModal.walkLabel')}</p>
              <div className="flex flex-wrap gap-2">
                {WALK_OPTIONS.map((opt) => (
                  <OptionPill
                    key={opt}
                    label={t(`main.lifestyleModal.walk.${opt}`)}
                    selected={exerciseSel.walk_steps === opt}
                    onClick={() => setExerciseSel((s) => ({ ...s, walk_steps: s.walk_steps === opt ? null : opt }))}
                  />
                ))}
              </div>
            </div>
            <div className="flex gap-2">
              <OptionPill label={t('main.lifestyleModal.strength')} selected={exerciseSel.strength}
                onClick={() => setExerciseSel((s) => ({ ...s, strength: !s.strength }))} />
              <OptionPill label={t('main.lifestyleModal.stretching')} selected={exerciseSel.stretching}
                onClick={() => setExerciseSel((s) => ({ ...s, stretching: !s.stretching }))} />
            </div>
          </div>
        )}

        {modalRoutine === 'SLEEP' && (
          <div className="flex flex-wrap gap-2">
            {SLEEP_OPTIONS.map((opt) => (
              <OptionPill key={opt} label={t(`main.lifestyleModal.sleep.${opt}`)} selected={sleepBand === opt}
                onClick={() => setSleepBand((v) => v === opt ? null : opt)} />
            ))}
          </div>
        )}

        {modalRoutine === 'CONDITION' && (
          <div className="flex flex-wrap gap-2">
            {CONDITION_OPTIONS.map((opt) => (
              <OptionPill key={opt} label={t(`main.lifestyleModal.condition.${opt}`)} selected={bodyStatus === opt}
                onClick={() => setBodyStatus((v) => v === opt ? null : opt)} />
            ))}
          </div>
        )}

        <button
          type="button"
          onClick={confirmModal}
          disabled={!modalCanConfirm}
          className="h-[52px] rounded-full bg-[#003E7F] text-white text-[16px] font-medium tracking-[-0.32px] disabled:opacity-50"
        >
          {t('main.lifestyleModal.save')}
        </button>
      </div>
    </div>
  ) : null

  if (isComplete && !dismissedComplete) {
    return <ChallengeCompletePage challenge={challenge} rate={liveRate} onClose={() => setDismissedComplete(true)} />
  }

  return (
    <AppShell active="challenge" topbarLeft={<span className="text-[17px] font-bold text-[#1E293B]">{t('main.title')}</span>}>
      {/* 모바일 헤더 */}
      <div className="md:hidden">
        <Header title={<span className="text-[17px] font-bold text-[#1E293B]">{t('main.title')}</span>} />
      </div>

      <div className="flex-1 flex flex-col bg-[#F1F5F9] overflow-hidden md:overflow-visible">
        <div className="flex-1 overflow-y-auto px-5 pt-2 pb-6 md:px-8 md:py-6">
          {/* 모바일: 단일 컬럼 */}
          <div className="md:hidden flex flex-col gap-8">
            <h1 className="text-[24px] font-bold text-black tracking-[-0.24px]">{t('main.title')}</h1>
            <ChallengeTopTabs active="mine" />
            <div className="flex flex-col gap-3">{StreakCard}</div>
            {SupplementSection}
            {LifestyleSection}
            {GratitudeSection}
          </div>

          {/* 웹: 탭 + 스트릭 풀폭, 그 아래 2컬럼 */}
          <div className="hidden md:flex md:flex-col md:gap-5 md:max-w-[1100px]">
            <ChallengeTopTabs active="mine" />
            {StreakCard}
            <div className="grid grid-cols-2 gap-6 items-start mt-1">
              <div className="flex flex-col gap-8">
                {SupplementSection}
                {GratitudeSection}
              </div>
              <div className="flex flex-col gap-8">
                {LifestyleSection}
              </div>
            </div>
          </div>
        </div>

        <div className="md:hidden">
          <BottomNav active="challenge" />
        </div>
      </div>

      {WaterModal}
      {LifestyleModal}
    </AppShell>
  )
}

export type { CurrentChallenge }
