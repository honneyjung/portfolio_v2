import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import AppShell from '../../components/layout/AppShell'
import Header from '../../components/layout/Header'
import { challengeApi } from '../../lib/api/challenge'
import { ROUTINE_POINTS } from '../../constants'

const NAVY_GRADIENT = 'linear-gradient(179deg, #003E7F 31.476%, #052649 96.729%)'

const ROUTINE_KEYS = ['WATER', 'PRODUCT', 'EXERCISE', 'MEAL', 'SLEEP', 'CONDITION', 'GRATITUDE'] as const
type RoutineKey = typeof ROUTINE_KEYS[number]

// 기간 유형별 진행 일수·완료 보상 포인트 (백엔드 TEAM_DURATION_DAYS·base_points와 일치)
const DURATION_META: Record<string, { days: number; points: number }> = {
  '1week': { days: 7, points: 10 },
  '2weeks': { days: 14, points: 30 },
  '1month': { days: 30, points: 100 },
}

// 입력값 보존용 (확인 단계 왕복 시에도 유지)
export const TEAM_CREATE_DRAFT_KEY = 'team-create-form-draft'

type FormDraft = {
  teamName: string
  title: string
  durationType: string  // 1week | 2weeks | 1month
  routineOn: Record<RoutineKey, boolean>
}

function loadFormDraft(): Partial<FormDraft> {
  try {
    const raw = sessionStorage.getItem(TEAM_CREATE_DRAFT_KEY)
    return raw ? (JSON.parse(raw) as FormDraft) : {}
  } catch {
    return {}
  }
}

function pad(n: number) { return String(n).padStart(2, '0') }

function todayStr() {
  const d = new Date()
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

function addDays(s: string, n: number) {
  const [y, m, d] = s.split('-').map(Number)
  const dt = new Date(y, m - 1, d)
  dt.setDate(dt.getDate() + n)
  return `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}`
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

// ── 메인 ─────────────────────────────────────────────────────
export default function ChallengeTogetherCreatePage() {
  const { t } = useTranslation('challenge')
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [step, setStep] = useState<'compose' | 'confirm'>('compose')
  const [teamName, setTeamName] = useState(() => loadFormDraft().teamName ?? '')
  const [title, setTitle] = useState(() => loadFormDraft().title ?? '')
  const [durationType, setDurationType] = useState(() => loadFormDraft().durationType ?? '1week')
  const startDate = todayStr()
  const [routineOn, setRoutineOn] = useState<Record<RoutineKey, boolean>>(
    () => loadFormDraft().routineOn ?? {
      WATER: true, PRODUCT: true, EXERCISE: true, MEAL: true, SLEEP: true, CONDITION: true, GRATITUDE: true,
    }
  )
  const [error, setError] = useState('')

  // 입력값 보존
  useEffect(() => {
    sessionStorage.setItem(
      TEAM_CREATE_DRAFT_KEY,
      JSON.stringify({ teamName, title, durationType, routineOn } satisfies FormDraft)
    )
  }, [teamName, title, durationType, routineOn])

  const buildSelectedRoutines = (): string[] => ROUTINE_KEYS.filter((k) => routineOn[k])

  const meta = DURATION_META[durationType] ?? DURATION_META['1week']
  const endDate = addDays(startDate, meta.days - 1)

  const createMutation = useMutation({
    mutationFn: () => challengeApi.createTeamFull({
      team_name: teamName.trim(),
      challenge_title: title.trim() || teamName.trim(),
      selected_routines: buildSelectedRoutines(),
      duration_type: durationType,
    }),
    onSuccess: (res) => {
      sessionStorage.removeItem(TEAM_CREATE_DRAFT_KEY)
      queryClient.invalidateQueries({ queryKey: ['teams-available'] })
      navigate(`/challenge/teams/${res.data.team_id}`, { replace: true })
    },
    onError: (err: unknown) => {
      const data = (err as { response?: { data?: { error?: { message?: string }; detail?: string } } })?.response?.data
      setError(data?.error?.message ?? data?.detail ?? t('together.createFailed'))
    },
  })

  // 구성 → 확인 단계 이동 (검증)
  const goConfirm = () => {
    if (!teamName.trim()) { setError(t('together.errorNoName')); return }
    if (buildSelectedRoutines().length === 0) { setError(t('create.errorNoRoutine')); return }
    setError('')
    setStep('confirm')
  }

  const titleText = step === 'confirm' ? t('together.confirmTitle') : t('together.createTitle')

  // ── 확인 단계 본문 ──
  const ConfirmBody = (
    <div className="flex flex-col w-full px-5 pt-6 pb-10 gap-5 md:max-w-[600px] md:px-10 md:py-8">
      {/* 진행 기간 */}
      <div className="bg-white rounded-[14px] shadow-[0_1px_6px_rgba(0,0,0,0.06)] px-5 py-4 flex flex-col gap-2">
        <p className="text-[16px] font-bold text-[#1E293B] tracking-[-0.32px]">
          {title.trim() || teamName.trim()}
        </p>
        <div className="flex items-center justify-between">
          <span className="text-[13px] text-[#64748B] tracking-[-0.26px]">{t('together.summaryPeriodLabel')}</span>
          <span className="text-[14px] font-semibold text-[#1E293B] tracking-[-0.28px]">
            {formatDate(startDate)} ~ {formatDate(endDate)}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[13px] text-[#64748B] tracking-[-0.26px]">{t('together.summaryDaysLabel', { count: meta.days })}</span>
        </div>
      </div>

      {/* 최대 포인트 */}
      <div className="rounded-[14px] px-5 py-5 flex flex-col items-center gap-1.5" style={{ backgroundImage: NAVY_GRADIENT }}>
        <p className="text-[13px] text-white/80 tracking-[-0.26px]">{t('together.maxPointsTitle')}</p>
        <p className="text-[24px] font-bold text-white tracking-[-0.48px]">{t('together.maxPointsValue', { points: meta.points })}</p>
      </div>

      {/* 구성한 루틴 */}
      <div className="flex flex-col gap-3">
        <p className="text-[14px] font-bold text-[#1E293B] tracking-[-0.28px]">{t('together.summaryRoutinesLabel')}</p>
        <div className="bg-white rounded-[14px] shadow-[0_1px_6px_rgba(0,0,0,0.06)] px-4 py-1">
          {ROUTINE_KEYS.filter((k) => routineOn[k]).map((k) => (
            <div key={k} className="flex items-center justify-between py-3 border-b border-[#EAF0F7] last:border-0">
              <span className="text-[14px] font-medium text-[#1E293B] tracking-[-0.28px]">{t(`create.${k}`)}</span>
              <PointBadge points={`+${ROUTINE_POINTS[k]}p`} />
            </div>
          ))}
        </div>
      </div>

      {error && (
        <p className="text-[13px] text-[#EF4444] text-center tracking-[-0.26px]">{error}</p>
      )}

      {/* 수정하기 / 시작하기 */}
      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => { setError(''); setStep('compose') }}
          disabled={createMutation.isPending}
          className="flex-1 h-[52px] rounded-full border border-[#C5D6E8] bg-white text-[#003E7F] text-[16px] font-medium tracking-[-0.32px] disabled:opacity-60"
        >
          {t('together.editBtn')}
        </button>
        <button
          type="button"
          onClick={() => createMutation.mutate()}
          disabled={createMutation.isPending}
          className="flex-1 h-[52px] rounded-full flex items-center justify-center text-white text-[16px] font-medium tracking-[-0.32px] disabled:opacity-60"
          style={{ backgroundImage: NAVY_GRADIENT }}
        >
          {createMutation.isPending ? t('together.creating') : t('together.startBtn')}
        </button>
      </div>
    </div>
  )

  // ── 구성 단계 본문 ──
  const ComposeBody = (
    <div className="flex flex-col w-full px-5 pt-6 pb-10 gap-5 md:max-w-[600px] md:px-10 md:py-8">
      {/* 팀 이름 */}
      <div>
        <label className="text-[13px] font-semibold text-[#64748B] mb-2 block tracking-[-0.26px]">
          {t('together.teamNameLabel')}
        </label>
        <input
          type="text"
          value={teamName}
          onChange={(e) => setTeamName(e.target.value)}
          placeholder={t('together.teamNamePlaceholder')}
          className="w-full h-[49px] rounded-full border border-[#C5D6E8] bg-white px-5 text-[14px] text-[#1E293B] placeholder-[#94A3B8] tracking-[-0.28px] outline-none focus:border-[#003E7F]"
          maxLength={30}
        />
      </div>

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
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-semibold text-[#64748B] mb-1.5 tracking-[-0.26px]">{t('create.startDate')}</p>
          <div className="h-[49px] rounded-full border border-[#C5D6E8] bg-[#F1F5F9] flex items-center px-5">
            <span className="text-[14px] text-[#94A3B8] tracking-[-0.28px]">{formatDate(startDate)}</span>
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-semibold text-[#64748B] mb-1.5 tracking-[-0.26px]">{t('create.duration')}</p>
          <div className="relative">
            <select
              value={durationType}
              onChange={(e) => setDurationType(e.target.value)}
              className="w-full h-[49px] rounded-full border border-[#003E7F] bg-white px-5 pr-10 text-[14px] text-[#1E293B] tracking-[-0.28px] outline-none appearance-none cursor-pointer"
            >
              <option value="1week">1주</option>
              <option value="2weeks">2주</option>
              <option value="1month">1달</option>
            </select>
            <svg width="12" height="7" viewBox="0 0 12 7" fill="none" className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
              <path d="M1 1L6 6L11 1" stroke="#003E7F" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        </div>
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

      {error && (
        <p className="text-[13px] text-[#EF4444] text-center tracking-[-0.26px]">{error}</p>
      )}

      <button
        type="button"
        onClick={goConfirm}
        className="h-[52px] rounded-full flex items-center justify-center text-white text-[16px] font-medium tracking-[-0.32px]"
        style={{ backgroundImage: NAVY_GRADIENT }}
      >
        {t('together.nextBtn')}
      </button>
    </div>
  )

  return (
    <AppShell
      active="challenge"
      topbarLeft={
        <span className="text-[17px] font-bold text-[#1E293B]">{titleText}</span>
      }
    >
      {/* 공통 헤더 — 모바일 전용. 확인 단계 뒤로가기는 구성 단계로 */}
      <div className="md:hidden">
        <Header
          showBack
          onBack={step === 'confirm' ? () => { setError(''); setStep('compose') } : undefined}
          title={<span className="text-[17px] font-bold text-[#1E293B]">{titleText}</span>}
        />
      </div>

      <div className="flex-1 flex flex-col bg-[#F1F5F9] overflow-y-auto">
        {step === 'confirm' ? ConfirmBody : ComposeBody}
      </div>
    </AppShell>
  )
}
