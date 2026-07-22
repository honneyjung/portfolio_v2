import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import AppShell from '../../components/layout/AppShell'
import { ROUTINE_POINTS } from '../../constants'
import type { CurrentChallenge } from './TodayChallengePage'

// 웹 달성 항목 리스트 표시 순서
const MISSION_ORDER = ['PRODUCT', 'EXERCISE', 'MEAL', 'SLEEP', 'WATER', 'CONDITION', 'GRATITUDE', 'INNER_REFLECTION'] as const

// 반원 게이지 (rate%)
function SemiGauge({ rate }: { rate: number }) {
  const len = Math.PI * 110 // 반원 호 길이 ≈ 345.6
  const offset = len * (1 - Math.min(100, Math.max(0, rate)) / 100)
  return (
    <div className="relative w-[252px] h-[150px]">
      <svg width="252" height="150" viewBox="0 0 252 150" fill="none">
        <defs>
          <linearGradient id="gaugeGrad" x1="16" y1="130" x2="236" y2="130" gradientUnits="userSpaceOnUse">
            <stop stopColor="#5BA3D9" />
            <stop offset="1" stopColor="#003E7F" />
          </linearGradient>
        </defs>
        <path d="M16 132 A110 110 0 0 1 236 132" stroke="#E2E8F0" strokeWidth="22" strokeLinecap="round" />
        <path
          d="M16 132 A110 110 0 0 1 236 132"
          stroke="url(#gaugeGrad)"
          strokeWidth="22"
          strokeLinecap="round"
          strokeDasharray={len}
          strokeDashoffset={offset}
        />
      </svg>
      <p className="absolute inset-0 flex items-center justify-center pt-6 text-[42px] font-bold text-[#003E7F] tracking-[-0.84px]">
        {rate}%
      </p>
    </div>
  )
}

export default function ChallengeCompletePage({
  challenge,
  rate,
  onClose,
}: {
  challenge: CurrentChallenge
  rate: number
  onClose: () => void
}) {
  const { t } = useTranslation('challenge')
  const navigate = useNavigate()

  const streak = challenge.progress.consecutive_days
  // 달성 항목 (선택 루틴 기준)
  const missions = MISSION_ORDER.filter((k) => challenge.selected_routines.includes(k))
  const totalPoints = missions.reduce((sum, k) => sum + (ROUTINE_POINTS[k] ?? 0), 0)

  return (
    <AppShell
      active="challenge"
      topbarLeft={<span className="text-[17px] font-bold text-[#1E293B]">{t('main.complete.topTitle')}</span>}
    >
      {/* ── 모바일: 축하 풀스크린 ── */}
      <div className="md:hidden flex flex-col min-h-screen bg-[#F1F5F9] px-5 pt-4 pb-8">
        <button type="button" onClick={onClose} aria-label="닫기" className="self-end p-1">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M5 5L19 19M19 5L5 19" stroke="#191919" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>

        <div className="flex-1 flex flex-col items-center justify-center gap-10">
          <div className="flex flex-col items-center gap-3 text-center">
            <p className="text-[21px] font-medium text-black tracking-[-0.21px]">{t('main.complete.celebrateSub')}</p>
            <div className="text-[32px] font-bold leading-tight">
              <p className="text-[#191919]">{t('main.complete.celebrateTitle1')}</p>
              <p className="text-[#003E7F]">{t('main.complete.celebrateTitle2')}</p>
            </div>
          </div>

          <SemiGauge rate={rate} />

          <div className="bg-[#F8FAFF] rounded-[15px] h-[57px] px-8 flex items-center justify-center shadow-[7px_4px_2px_rgba(0,0,0,0.02)]">
            <span className="text-[16px] font-bold text-[#003E7F] tracking-[-0.16px]">
              {t('main.complete.streakOngoing', { count: streak })}
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={() => navigate('/challenge')}
            className="h-[52px] rounded-full flex items-center justify-center text-[#F8FAFF] text-[16px] font-medium tracking-[-0.32px]"
            style={{ backgroundImage: 'linear-gradient(179deg, #003E7F 31.476%, #052649 96.729%)' }}
          >
            {t('main.complete.backHome')}
          </button>
          <button
            type="button"
            onClick={() => navigate('/challenge/history')}
            className="h-[52px] rounded-full bg-[#D2DEEA] flex items-center justify-center text-[16px] font-bold text-[#003E7F] tracking-[-0.48px]"
          >
            {t('main.complete.history')}
          </button>
        </div>
      </div>

      {/* ── 웹: 포인트 요약 ── */}
      <div className="hidden md:flex md:flex-col bg-[#F1F5F9] px-8 py-6 gap-6">
        <div className="max-w-[860px] w-full flex flex-col gap-6">
          {/* 배너 */}
          <div className="bg-[#003E7F] rounded-[20px] h-[180px] flex flex-col items-center justify-center gap-2 text-white">
            <p className="text-[26px] font-bold">{t('main.complete.webTitle')}</p>
            <p className="text-[15px] opacity-80">{t('main.complete.webSub', { count: missions.length })}</p>
            <p className="text-[18px] font-bold mt-2">{t('main.complete.pointsEarned', { points: totalPoints })}</p>
          </div>

          {/* 달성 항목 */}
          <div className="flex flex-col gap-3">
            <p className="text-[14px] font-bold text-[#1E293B]">{t('main.complete.achievedItems')}</p>
            <div className="flex flex-col gap-2">
              {missions.map((k) => (
                <div key={k} className="bg-white rounded-[10px] h-[56px] px-4 flex items-center shadow-[0_2px_12px_rgba(0,0,0,0.05)]">
                  <span className="flex-shrink-0">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="12" fill="#16A34A" />
                      <path d="M7 12L10.5 15.5L17 8.5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                  <span className="ml-3 text-[13px] font-medium text-[#1E293B]">{t(`main.routineLabel.${k}`)}</span>
                  <span className="ml-auto text-[13px] font-bold text-[#16A34A]">{ROUTINE_POINTS[k] ?? 0}P</span>
                </div>
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={() => navigate('/')}
            className="h-[52px] rounded-full bg-[#003E7F] flex items-center justify-center text-white text-[14px] font-bold"
          >
            {t('main.complete.webBackHome')}
          </button>
        </div>
      </div>
    </AppShell>
  )
}
