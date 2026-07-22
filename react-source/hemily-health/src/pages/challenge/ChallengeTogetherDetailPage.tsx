import { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import AppShell from '../../components/layout/AppShell'
import Header from '../../components/layout/Header'
import BottomNav from '../../components/layout/BottomNav'
import TeamComments from '../../components/challenge/TeamComments'
import ChallengeTopTabs from '../../components/challenge/ChallengeTopTabs'
import { challengeApi } from '../../lib/api/challenge'
import { useAuthStore } from '../../lib/store/authStore'
import type { TeamDetail } from '../../types'

const noAutoLogout = { validateStatus: (s: number) => s < 500 }

// TodayChallengePage와 동일한 상수/순서
const LIFESTYLE_ORDER = ['WATER', 'EXERCISE', 'MEAL', 'SLEEP', 'CONDITION', 'INNER_REFLECTION'] as const
const WATER_MAX_CUPS = 7 // 백엔드 _WATER_MAX_CUPS와 동일해야 함 (초과 시 422)
const WALK_OPTIONS = ['under_7000', 'over_7000', 'over_10000'] as const
const SLEEP_OPTIONS = ['under_6h', '6to8h', 'over_8h'] as const
const CONDITION_OPTIONS = ['very_good', 'good', 'normal', 'tired', 'very_tired'] as const

type ExerciseSelection = { walk_steps: string | null; strength: boolean; stretching: boolean }

function todayKST() {
  return new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString().slice(0, 10)
}
function formatDate(d?: string) {
  return d ? d.slice(0, 10).replace(/-/g, '.') : ''
}

// ── TodayChallengePage와 동일한 공용 컴포넌트 ────────────────
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

// ── 메인 ────────────────────────────────────────────────────
export default function ChallengeTogetherDetailPage() {
  const { t } = useTranslation('challenge')
  const navigate = useNavigate()
  const { teamId } = useParams<{ teamId: string }>()
  const queryClient = useQueryClient()
  const user = useAuthStore((s) => s.user)
  const logDate = todayKST()

  // ── 팀 데이터 ──
  const { data: teamRes, isLoading } = useQuery({
    queryKey: ['team', teamId],
    queryFn: () => challengeApi.getTeam(teamId!),
    enabled: !!teamId,
    retry: false,
    ...noAutoLogout,
  })
  const team: TeamDetail | null = (teamRes?.data as any) ?? null
  const isMember = !!team && team.members.some((m) => m.user_id === user?.id)

  // ── 팀 제품 목록 (PRODUCT 루틴 멤버별) ──
  const { data: prodRes } = useQuery({
    queryKey: ['team-products', teamId],
    queryFn: () => challengeApi.getTeamMemberProducts(teamId!),
    enabled: !!teamId && isMember,
    ...noAutoLogout,
  })
  const teamProducts: Array<{ product_id: string; product_name: string }> =
    (prodRes?.data as any)?.items ?? []

  // ── 체크 상태 (TodayChallengePage와 동일한 단방향) ──
  // 팀 일일 로그 조회 API가 없어 오늘 체크 상태는 sessionStorage로 복원
  const storageKey = `supplement_checked_team_${teamId}_${logDate}`
  const routinesKey = `routines_checked_team_${teamId}_${logDate}`
  const gratitudeKey = `gratitude_team_${teamId}_${logDate}`
  const [checkedProducts, setCheckedProducts] = useState<Set<string>>(() => {
    const stored = sessionStorage.getItem(storageKey)
    return stored ? new Set(JSON.parse(stored) as string[]) : new Set()
  })
  const [checkedRoutines, setCheckedRoutines] = useState<Set<string>>(() => {
    const stored = sessionStorage.getItem(routinesKey)
    return stored ? new Set(JSON.parse(stored) as string[]) : new Set()
  })
  const [gratitudeList, setGratitudeList] = useState<string[]>(() => {
    const stored = sessionStorage.getItem(gratitudeKey)
    return stored ? (JSON.parse(stored) as string[]) : []
  })
  const [gratitudeInput, setGratitudeInput] = useState('')
  const [gratitudeSaving, setGratitudeSaving] = useState(false)
  // 연속 클릭(중복 API 호출) 방지용
  const checkBusyRef = useRef(false)

  // ── 모달 상태 ──
  const [showWaterModal, setShowWaterModal] = useState(false)
  const [showLeaveModal, setShowLeaveModal] = useState(false)
  const [waterCups, setWaterCups] = useState(1)
  const [modalRoutine, setModalRoutine] = useState<'EXERCISE' | 'SLEEP' | 'CONDITION' | null>(null)
  const [exerciseSel, setExerciseSel] = useState<ExerciseSelection>({ walk_steps: null, strength: false, stretching: false })
  const [sleepBand, setSleepBand] = useState<string | null>(null)
  const [bodyStatus, setBodyStatus] = useState<string | null>(null)

  // ── 루틴 파생 ──
  const selectedRoutines = team?.selected_routines ?? []
  const hasProduct = selectedRoutines.includes('PRODUCT')
  const lifestyleItems = LIFESTYLE_ORDER.filter((k) => selectedRoutines.includes(k))
  const hasGratitude = selectedRoutines.includes('GRATITUDE')
  const gratitudeComplete = gratitudeList.length >= 5

  // 이미 오늘 완료한 멤버인지 (team.members에서 확인)
  const myMember = team?.members.find((m) => m.user_id === user?.id)
  const alreadyCompleted = !!myMember?.today_completed

  useEffect(() => {
    if (alreadyCompleted) {
      setCheckedProducts(new Set(teamProducts.map((p) => p.product_id)))
      setCheckedRoutines(new Set(LIFESTYLE_ORDER))
    }
  }, [alreadyCompleted, teamProducts])

  useEffect(() => {
    if (!alreadyCompleted) {
      sessionStorage.setItem(storageKey, JSON.stringify([...checkedProducts]))
      sessionStorage.setItem(routinesKey, JSON.stringify([...checkedRoutines]))
      sessionStorage.setItem(gratitudeKey, JSON.stringify(gratitudeList))
    }
  }, [checkedProducts, checkedRoutines, gratitudeList, storageKey, routinesKey, gratitudeKey, alreadyCompleted])

  // ── 체크 함수 ──
  function checkRoutine(key: string) {
    if (alreadyCompleted) return
    setCheckedRoutines((prev) => (prev.has(key) ? prev : new Set(prev).add(key)))
  }

  function handleRoutineClick(key: string) {
    if (alreadyCompleted) return
    if (key === 'WATER') { setShowWaterModal(true); return }
    if (key === 'EXERCISE' || key === 'SLEEP' || key === 'CONDITION') {
      setModalRoutine(key); return
    }
    // 이미 체크된 항목 재클릭·연속 클릭 시 중복 호출 방지
    if (checkedRoutines.has(key) || checkBusyRef.current) return
    checkBusyRef.current = true
    checkRoutine(key)
    const req = key === 'MEAL'
      ? challengeApi.checkTeamMealRoutine(teamId!, logDate)
      : challengeApi.checkTeamReflectionRoutine(teamId!, logDate)
    req.then(() => { queryClient.invalidateQueries({ queryKey: ['team', teamId] }) }).catch(() => {}).finally(() => { checkBusyRef.current = false })
  }

  // 제품 클릭 → 인증샷 업로드 페이지 (개인 챌린지와 동일 프로세스, 체크는 인증 후 처리)
  function goProductRecognition(p: { product_id: string; product_name: string }) {
    if (alreadyCompleted || checkedProducts.has(p.product_id)) return
    navigate(
      `/challenge/recognition?product_id=${p.product_id}&team_id=${teamId}&log_date=${logDate}&product_name=${encodeURIComponent(p.product_name)}`
    )
  }

  // ── 물 팝업 확인 ──
  function confirmWater() {
    if (checkBusyRef.current) return
    checkBusyRef.current = true
    if (waterCups === WATER_MAX_CUPS) checkRoutine('WATER')
    challengeApi.checkTeamWaterRoutine(teamId!, logDate, waterCups)
      .then(() => { queryClient.invalidateQueries({ queryKey: ['team', teamId] }) })
      .catch(() => {})
      .finally(() => { checkBusyRef.current = false })
    setShowWaterModal(false)
  }

  // ── 생활습관 팝업 확인 ──
  function confirmModal() {
    if (!modalRoutine || checkBusyRef.current) return
    checkBusyRef.current = true
    checkRoutine(modalRoutine)
    let req: Promise<unknown> | null = null
    if (modalRoutine === 'EXERCISE') {
      req = challengeApi.checkTeamExerciseRoutine(teamId!, logDate, {
        walk_steps: exerciseSel.walk_steps,
        exercise_strength: exerciseSel.strength,
        exercise_stretching: exerciseSel.stretching,
      })
    } else if (modalRoutine === 'SLEEP' && sleepBand) {
      req = challengeApi.checkTeamSleepRoutine(teamId!, logDate, sleepBand)
    } else if (modalRoutine === 'CONDITION' && bodyStatus) {
      req = challengeApi.checkTeamConditionRoutine(teamId!, logDate, bodyStatus)
    }
    if (req) {
      req.then(() => { queryClient.invalidateQueries({ queryKey: ['team', teamId] }) }).catch(() => {}).finally(() => { checkBusyRef.current = false })
    } else {
      checkBusyRef.current = false
    }
    setModalRoutine(null)
  }

  async function saveGratitude() {
    if (gratitudeComplete || !gratitudeInput.trim() || gratitudeSaving) return
    const item = gratitudeInput.trim()
    setGratitudeSaving(true)
    try {
      await challengeApi.checkTeamGratitudeRoutine(teamId!, logDate, [item])
      setGratitudeList((prev) => [...prev, item])
      setGratitudeInput('')
      queryClient.invalidateQueries({ queryKey: ['team', teamId] })
    } catch { /* 실패 시 입력 유지 — 재시도 가능 */ } finally {
      setGratitudeSaving(false)
    }
  }

  const exerciseHasSelection = exerciseSel.walk_steps !== null || exerciseSel.strength || exerciseSel.stretching
  const modalCanConfirm =
    modalRoutine === 'EXERCISE' ? exerciseHasSelection
    : modalRoutine === 'SLEEP' ? sleepBand !== null
    : modalRoutine === 'CONDITION' ? bodyStatus !== null
    : false

  // ── 참여하기 ──
  const [joinError, setJoinError] = useState('')
  const joinMutation = useMutation({
    mutationFn: () => challengeApi.joinTeam(teamId!),
    onSuccess: () => {
      setJoinError('')
      queryClient.invalidateQueries({ queryKey: ['teams-available'] })
      queryClient.invalidateQueries({ queryKey: ['team', teamId] })
      queryClient.invalidateQueries({ queryKey: ['team-products', teamId] })
    },
    onError: (err: unknown) => {
      const data = (err as { response?: { data?: { error?: { message?: string }; detail?: string } } })?.response?.data
      setJoinError(data?.error?.message ?? data?.detail ?? t('together.joinFailed'))
    },
  })

  // ── 탈퇴 ── (기록 삭제·포인트 미지급, 백엔드가 종료·방장 규칙 검증)
  const [leaveError, setLeaveError] = useState('')
  const leaveMutation = useMutation({
    mutationFn: () => challengeApi.leaveTeam(teamId!),
    onSuccess: () => {
      setShowLeaveModal(false)
      queryClient.invalidateQueries({ queryKey: ['teams-available'] })
      queryClient.invalidateQueries({ queryKey: ['team', teamId] })
      navigate('/challenge', { replace: true })
    },
    onError: (err: unknown) => {
      const data = (err as { response?: { data?: { error?: { message?: string }; detail?: string } } })?.response?.data
      setLeaveError(data?.error?.message ?? data?.detail ?? t('together.leaveFailed'))
    },
  })

  // ── UI 블록 (TodayChallengePage 구조 미러) ──────────────────

  const TeamBanner = team ? (
    <div className="bg-[#003E7F] rounded-[12px] md:rounded-[16px] px-6 py-4 md:h-[88px] flex items-center gap-3 shadow-[0_2px_12px_rgba(0,0,0,0.05)]">
      <div className="flex flex-col gap-0.5 flex-1 min-w-0">
        <p className="text-[13px] text-white/60">{t('type.together')}</p>
        <p className="text-[18px] font-bold text-white truncate leading-snug">
          {team.challenge_title || team.team_name}
        </p>
        <p className="text-[12px] text-white/60">
          {formatDate(team.start_date)} ~ {formatDate(team.end_date)}
          {team.remaining_days >= 0 && ` · ${t('together.remainingDays', { count: team.remaining_days })}`}
        </p>
      </div>
      <div className="ml-auto flex flex-col items-end gap-1.5 flex-shrink-0">
        {myMember && (
          <div className="flex items-center bg-white/20 rounded-full px-3.5 h-[28px] gap-1">
            <span className="text-[12px] font-medium text-white">{t('together.myProgress')}</span>
            <span className="text-[12px] text-white/70 ml-0.5">{t('together.todayLabel')}</span>
            <span className="text-[12px] font-bold text-[#FFE3DD]">{team.my_today_rate}%</span>
            <span className="text-[11px] text-white/40">·</span>
            <span className="text-[12px] text-white/70">{t('together.overallLabel')}</span>
            <span className="text-[12px] font-bold text-[#FFE3DD]">{team.my_overall_rate}%</span>
          </div>
        )}
        <div className="flex items-center bg-white/20 rounded-full px-3.5 h-[28px] gap-1">
          <span className="text-[12px] font-medium text-white">{t('together.teamProgressLabel')}</span>
          <span className="text-[12px] text-white/70 ml-0.5">{t('together.todayLabel')}</span>
          <span className="text-[12px] font-bold text-[#FFE3DD]">{team.team_today_progress}%</span>
          <span className="text-[11px] text-white/40">·</span>
          <span className="text-[12px] text-white/70">{t('together.overallLabel')}</span>
          <span className="text-[12px] font-bold text-[#FFE3DD]">{team.team_progress}%</span>
        </div>
      </div>
    </div>
  ) : null

  // 영양제 섭취 (PRODUCT)
  const SupplementSection = hasProduct && isMember ? (
    <section className="flex flex-col gap-5">
      <h2 className="text-[21px] md:text-[15px] font-bold text-[#1E293B]">{t('main.supplementSection')}</h2>
      {teamProducts.length === 0 ? (
        <p className="text-[14px] text-[#64748B]">{t('together.productNeedRegister')}</p>
      ) : (
        <div className="flex flex-col gap-3 md:gap-2">
          {teamProducts.map((p) => {
            const checked = checkedProducts.has(p.product_id)
            return (
              <button
                key={p.product_id}
                type="button"
                onClick={() => goProductRecognition(p)}
                disabled={alreadyCompleted || checked}
                className={`w-full flex items-center gap-5 rounded-[12px] px-6 py-4 text-left transition-colors md:bg-white md:shadow-[0_2px_12px_rgba(0,0,0,0.05)] ${
                  checked ? 'bg-[#DBEAFE]' : 'bg-[#F8FAFF]'
                }`}
              >
                <span className="flex-shrink-0"><CheckCircle checked={checked} /></span>
                <p className="text-[15px] md:text-[13px] font-bold text-[#1E293B] tracking-[-0.3px] leading-tight flex-1 min-w-0">
                  {p.product_name}
                </p>
              </button>
            )
          })}
        </div>
      )}
    </section>
  ) : null

  // 생활 습관 (WATER, EXERCISE, MEAL, SLEEP, CONDITION, INNER_REFLECTION)
  const LifestyleSection = lifestyleItems.length > 0 && isMember ? (
    <section className="flex flex-col gap-5">
      <h2 className="text-[21px] md:text-[15px] font-bold text-[#1E293B]">{t('main.lifestyleSection')}</h2>
      <div className="flex flex-col gap-3 md:gap-2">
        {lifestyleItems.map((k) => {
          const checked = checkedRoutines.has(k)
          const desc = t(`main.routineDesc.${k}`, { defaultValue: '' })
          return (
            <button
              key={k}
              type="button"
              onClick={() => handleRoutineClick(k)}
              disabled={alreadyCompleted}
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
        })}
      </div>
    </section>
  ) : null

  // 5감사일기
  const GratitudeSection = hasGratitude && isMember ? (
    <section className="flex flex-col gap-5">
      <h2 className="text-[21px] md:text-[15px] font-bold text-[#1E293B]">{t('main.gratitudeSection')}</h2>
      <div className="flex flex-col gap-2">
        {gratitudeList.map((g, i) => (
          <div key={i} className="bg-[#FFE3DD] rounded-[10px] px-6 py-4">
            <p className="text-[12px] text-[#555] tracking-[-0.24px] break-keep">{g}</p>
          </div>
        ))}
        {!gratitudeComplete && !alreadyCompleted && (
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

  // 팀원 현황 — 팀장 배지·개인 진행률 바·오늘 완료 표시
  const MembersSection = team && team.members.length > 0 ? (
    <section className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="text-[21px] md:text-[15px] font-bold text-[#1E293B]">{t('together.membersLabel')}</h2>
        <span className="text-[12px] font-medium text-[#003E7F] bg-[#DBEAFE] rounded-full px-3 py-1">
          {t('together.completedMembers', { count: team.today_completed_count })}
        </span>
      </div>
      <div className="bg-[#F8FAFF] rounded-[12px] px-5 py-2 flex flex-col divide-y divide-[#EAF0F7] md:bg-white md:shadow-[0_2px_12px_rgba(0,0,0,0.05)]">
        {team.members.map((m) => {
          const isMe = m.user_id === user?.id
          return (
            <div key={m.user_id} className="flex items-center gap-3 py-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-[14px] font-bold flex-shrink-0 ${m.today_completed ? 'bg-[#003E7F] text-white' : 'bg-[#E2E8F0] text-[#64748B]'}`}>
                {m.name?.[0] ?? '?'}
              </div>
              <div className="flex-1 min-w-0 flex flex-col gap-1.5">
                <div className="flex items-center gap-1.5">
                  <span className={`text-[13px] font-semibold truncate tracking-[-0.26px] ${isMe ? 'text-[#003E7F]' : 'text-[#1E293B]'}`}>
                    {m.name ?? '?'}
                  </span>
                  {m.member_role === 'owner' && (
                    <span className="text-[10px] font-bold text-white bg-[#5BA3D9] rounded-full px-2 py-[2px] flex-shrink-0">
                      {t('together.leaderLabel')}
                    </span>
                  )}
                  {m.today_completed && (
                    <svg width="14" height="14" viewBox="0 0 26 26" fill="none" className="flex-shrink-0">
                      <circle cx="13" cy="13" r="13" fill="#2B8E43" />
                      <path d="M7 13L11 17L19 9" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </div>
                <div className="h-[6px] rounded-full bg-[#E2E8F0] overflow-hidden">
                  <div className="h-full rounded-full bg-[#003E7F]" style={{ width: `${m.progress_rate}%` }} />
                </div>
              </div>
              <span className="text-[13px] font-bold text-[#003E7F] flex-shrink-0 w-[44px] text-right">
                {m.progress_rate}%
              </span>
            </div>
          )
        })}
      </div>
    </section>
  ) : null

  // ── 물 팝업 (TodayChallengePage 동일) ──────────────────────
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
        <div className="grid grid-cols-4 gap-3">
          {Array.from({ length: WATER_MAX_CUPS }, (_, i) => {
            const n = i + 1
            const filled = n <= waterCups
            return (
              <button key={n} type="button" onClick={() => setWaterCups(n)} className="flex flex-col items-center gap-1">
                <svg width="44" height="52" viewBox="0 0 44 52" fill="none">
                  <path d="M8 6h28l-4 40H12L8 6Z" fill={filled ? '#DBEAFE' : '#F1F5F9'} stroke={filled ? '#003E7F' : '#CBD5E1'} strokeWidth="1.5" strokeLinejoin="round" />
                  {filled && <path d="M10 28h24l-2 18H12L10 28Z" fill="#5BA3D9" />}
                  <path d="M6 6h32" stroke={filled ? '#003E7F' : '#CBD5E1'} strokeWidth="1.5" strokeLinecap="round" />
                </svg>
                <span className={`text-[12px] font-bold ${filled ? 'text-[#003E7F]' : 'text-[#94A3B8]'}`}>{n}</span>
              </button>
            )
          })}
        </div>
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

  // ── 생활 습관 팝업 (TodayChallengePage 동일) ───────────────
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
                  <OptionPill key={opt} label={t(`main.lifestyleModal.walk.${opt}`)}
                    selected={exerciseSel.walk_steps === opt}
                    onClick={() => setExerciseSel((s) => ({ ...s, walk_steps: s.walk_steps === opt ? null : opt }))} />
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

  // ── 탈퇴 버튼·팝업 ─────────────────────────────────────────
  const LeaveButton = isMember ? (
    <button
      type="button"
      onClick={() => { setLeaveError(''); setShowLeaveModal(true) }}
      className="self-center text-[13px] text-[#94A3B8] underline underline-offset-2 tracking-[-0.26px] py-2"
    >
      {t('together.leaveBtn')}
    </button>
  ) : null

  const LeaveModal = showLeaveModal ? (
    <div
      className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/40"
      onClick={() => { if (!leaveMutation.isPending) setShowLeaveModal(false) }}
    >
      <div
        className="w-full max-w-[480px] md:w-[400px] bg-white rounded-t-[20px] md:rounded-[20px] px-6 pt-6 pb-8 flex flex-col gap-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-col gap-2">
          <p className="text-[18px] font-bold text-[#1E293B] tracking-[-0.36px]">{t('together.leaveModalTitle')}</p>
          <p className="text-[14px] text-[#64748B] leading-relaxed tracking-[-0.28px]">{t('together.leaveModalDesc')}</p>
        </div>
        {leaveError && <p className="text-[13px] text-[#EF4444] tracking-[-0.26px]">{leaveError}</p>}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => setShowLeaveModal(false)}
            disabled={leaveMutation.isPending}
            className="flex-1 h-[52px] rounded-full border border-[#CBD5E1] bg-white text-[#64748B] text-[16px] font-medium tracking-[-0.32px] disabled:opacity-50"
          >
            {t('together.leaveCancel')}
          </button>
          <button
            type="button"
            onClick={() => leaveMutation.mutate()}
            disabled={leaveMutation.isPending}
            className="flex-1 h-[52px] rounded-full bg-[#EF4444] text-white text-[16px] font-medium tracking-[-0.32px] disabled:opacity-50"
          >
            {leaveMutation.isPending ? t('together.leaving') : t('together.leaveConfirm')}
          </button>
        </div>
      </div>
    </div>
  ) : null

  // ── 렌더 ────────────────────────────────────────────────────
  const titleEl = <span className="text-[17px] font-bold text-[#1E293B]">{t('together.detailTitle')}</span>

  function renderBody() {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center h-40">
          <div className="w-6 h-6 border-2 border-[#003E7F] border-t-transparent rounded-full animate-spin" />
        </div>
      )
    }
    if (!team) {
      return <p className="text-[14px] text-[#64748B] text-center py-20">{t('together.loadFailed')}</p>
    }

    return (
      <div className="flex flex-col gap-8">
        {TeamBanner}
        {SupplementSection}
        {LifestyleSection}
        {GratitudeSection}
        {MembersSection}
        {isMember && teamId && (
          <button
            type="button"
            onClick={() => navigate(`/challenge/timeline/team/${teamId}`)}
            className="w-full h-[48px] rounded-full bg-white border border-[#003E7F] text-[#003E7F] text-[14px] font-bold"
          >
            인증·루틴 타임라인 보기
          </button>
        )}
        {isMember && teamId && <TeamComments teamId={teamId} />}

        {/* 참여하기 버튼 (비멤버) */}
        {!isMember && (
          <div className="flex flex-col gap-2">
            {joinError && (
              <p className="text-[13px] text-[#EF4444] text-center tracking-[-0.26px]">{joinError}</p>
            )}
            <button
              type="button"
              disabled={joinMutation.isPending}
              onClick={() => joinMutation.mutate()}
              className="w-full h-[52px] rounded-full bg-gradient-blue text-white text-[16px] font-medium tracking-[-0.32px] disabled:opacity-50"
            >
              {joinMutation.isPending ? t('together.joining') : t('together.joinBtn')}
            </button>
          </div>
        )}

        {LeaveButton}
      </div>
    )
  }

  return (
    <AppShell active="challenge" topbarLeft={titleEl}>
      {/* 모바일 헤더 — 참여 중이면 목록이 상세로 재이동하므로 뒤로가기는 챌린지 홈으로 */}
      <div className="md:hidden">
        <Header showBack onBack={() => navigate(isMember ? '/challenge' : '/challenge/teams')} title={titleEl} />
      </div>

      <div className="flex-1 flex flex-col bg-[#F1F5F9] overflow-hidden md:overflow-visible">
        <div className="flex-1 overflow-y-auto px-5 pt-2 pb-6 md:px-8 md:py-6">
          <ChallengeTopTabs active="together" />
          {/* 모바일: 단일 컬럼 */}
          <div className="md:hidden">
            {renderBody()}
          </div>

          {/* 웹: 배너 풀폭, 아래 2컬럼 */}
          <div className="hidden md:flex md:flex-col md:gap-5 md:max-w-[1100px]">
            {!isLoading && team && (
              <>
                {TeamBanner}
                <div className="grid grid-cols-2 gap-6 items-start mt-1">
                  <div className="flex flex-col gap-8">
                    {SupplementSection}
                    {GratitudeSection}
                    {!isMember && (
                      <div className="flex flex-col gap-2">
                        {joinError && (
                          <p className="text-[13px] text-[#EF4444] text-center tracking-[-0.26px]">{joinError}</p>
                        )}
                        <button
                          type="button"
                          disabled={joinMutation.isPending}
                          onClick={() => joinMutation.mutate()}
                          className="w-full h-[52px] rounded-full bg-gradient-blue text-white text-[16px] font-medium tracking-[-0.32px] disabled:opacity-50"
                        >
                          {joinMutation.isPending ? t('together.joining') : t('together.joinBtn')}
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col gap-8">
                    {LifestyleSection}
                    {MembersSection}
                    {isMember && teamId && (
                      <button
                        type="button"
                        onClick={() => navigate(`/challenge/timeline/team/${teamId}`)}
                        className="w-full h-[48px] rounded-full bg-white border border-[#003E7F] text-[#003E7F] text-[14px] font-bold"
                      >
                        인증·루틴 타임라인 보기
                      </button>
                    )}
                    {isMember && teamId && <TeamComments teamId={teamId} />}
                  </div>
                </div>
                {LeaveButton}
              </>
            )}
            {isLoading && (
              <div className="flex items-center justify-center h-40">
                <div className="w-6 h-6 border-2 border-[#003E7F] border-t-transparent rounded-full animate-spin" />
              </div>
            )}
          </div>
        </div>

        <div className="md:hidden">
          <BottomNav active="challenge" />
        </div>
      </div>

      {WaterModal}
      {LifestyleModal}
      {LeaveModal}
    </AppShell>
  )
}
