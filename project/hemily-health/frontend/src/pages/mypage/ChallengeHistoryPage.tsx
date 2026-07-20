import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import AppShell from '../../components/layout/AppShell'
import Header from '../../components/layout/Header'
import BottomNav from '../../components/layout/BottomNav'
import { mypageApi } from '../../lib/api/mypage'
import { useAuthStore } from '../../lib/store/authStore'
import type { Challenge, ChallengeStatus } from '../../types'

function unwrap<T>(res: { data: unknown } | undefined): T | undefined {
  if (!res) return undefined
  const body = res.data as { data?: T } | T | undefined
  if (body && typeof body === 'object' && 'data' in (body as object)) {
    return (body as { data?: T }).data
  }
  return body as T | undefined
}

type Tab = Extract<ChallengeStatus, 'active' | 'completed'>

export default function ChallengeHistoryPage() {
  const navigate = useNavigate()
  const { t } = useTranslation('mypage')
  const userType = useAuthStore((s) => s.user?.userType)
  const [tab, setTab] = useState<Tab>('active')

  const { data: res } = useQuery({
    queryKey: ['mypage', 'challenges', tab],
    queryFn: () => mypageApi.getChallenges({ status: tab }),
  })
  const items = unwrap<{ items: Challenge[] }>(res)?.items ?? []

  const careLabel = userType ? t(`challengeHistory.careType.${userType}`, { defaultValue: '' }) : ''

  const tabs: { key: Tab; label: string }[] = [
    { key: 'active', label: t('challengeHistory.tabActive') },
    { key: 'completed', label: t('challengeHistory.tabEnded') },
  ]

  const titleOf = (c: Challenge) =>
    c.goal_description ||
    (c.type === 'together' ? t('challengeHistory.teamChallenge') : t('challengeHistory.selfChallenge'))

  const pageTitle = t('challengeHistory.title')

  return (
    <AppShell active="mypage" topbarLeft={<span className="text-[17px] font-bold text-[#1E293B]">{pageTitle}</span>}>
      <div className="flex-1 flex flex-col bg-[#F1F5F9] overflow-hidden md:overflow-visible">

        {/* 헤더 (모바일만) */}
        <div className="md:hidden">
          <Header showBack title={<span className="text-[18px] font-bold text-[#1E293B]">{pageTitle}</span>} />
        </div>

        {/* 탭 */}
        <div className="flex-none px-5 border-b border-[#E2E8F0] md:px-8">
          <div className="flex gap-6">
            {tabs.map((tb) => {
              const active = tb.key === tab
              return (
                <button
                  key={tb.key}
                  type="button"
                  onClick={() => setTab(tb.key)}
                  className={`relative pb-2 text-[16px] tracking-[-0.32px] ${
                    active ? 'font-bold text-[#003E7F]' : 'font-medium text-[#191919]'
                  }`}
                >
                  {tb.label}
                  {active && <span className="absolute left-0 right-0 -bottom-px h-[2px] bg-[#003E7F]" />}
                </button>
              )
            })}
          </div>
        </div>

        {/* 목록 */}
        {items.length === 0 ? (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-[14px] text-[#94A3B8]">{t('challengeHistory.empty')}</p>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto md:overflow-visible">
            <ul className="px-5 pt-4 pb-4 flex flex-col gap-3 md:px-8 md:pt-6 md:max-w-[804px]">
              {items.map((c) => (
                <li key={c.challenge_id}>
                  <button
                    type="button"
                    onClick={() => navigate('/challenge')}
                    className="w-full bg-[#F8FAFF] rounded-[10px] px-5 py-4 flex items-center justify-between"
                  >
                    <div className="flex flex-col gap-[3px] items-start">
                      <p className="text-[14px] font-medium text-[#555] tracking-[-0.14px]">
                        {c.start_date ? c.start_date.slice(0, 10).replace(/-/g, '.') : ''}
                      </p>
                      <p className="text-[16px] font-bold text-[#191919] tracking-[-0.32px]">{titleOf(c)}</p>
                      {careLabel && (
                        <p className="text-[16px] font-medium text-[#555] tracking-[-0.32px]">{careLabel}</p>
                      )}
                    </div>
                    <svg width="8" height="14" viewBox="0 0 8 14" fill="none">
                      <path d="M1 1L7 7L1 13" stroke="#191919" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* 하단 탭 (모바일만) */}
        <div className="md:hidden">
          <BottomNav active="mypage" />
        </div>
      </div>
    </AppShell>
  )
}
