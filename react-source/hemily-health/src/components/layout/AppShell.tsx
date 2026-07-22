import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuthStore } from '../../lib/store/authStore'
import type { NavKey } from './BottomNav'

interface Props {
  active: NavKey
  topbarLeft?: React.ReactNode
  topbarRight?: React.ReactNode
  children: React.ReactNode
}

const NAV_KEYS: NavKey[] = ['home', 'challenge', 'report', 'mypage']

/**
 * 앱 화면(홈·챌린지·리포트·마이) 반응형 셸
 *
 * 모바일 (< md) : 셸 없음 — children(페이지 자체 헤더+하단탭) 그대로
 * 데스크탑 (md+): 좌측 사이드바 네비 + 상단바 + 콘텐츠 (피그마 웹 디자인)
 *   사이드바 너비: md 200px / lg 240px
 */
export default function AppShell({ active, topbarLeft, topbarRight, children }: Props) {
  const navigate = useNavigate()
  const { t } = useTranslation('home')
  const user = useAuthStore((s) => s.user)
  const name = user?.name ?? ''

  const NAV = NAV_KEYS.map((key) => ({
    key,
    path: key === 'home' && user?.userType === 'hemilian' ? '/hemilian' : `/${key === 'home' ? '' : key}`,
  }))

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#F1F5F9]">
      {/* 사이드바 — md+ */}
      <aside className="hidden md:flex flex-col flex-none w-[200px] lg:w-[240px] bg-[#003E7F] text-white sticky top-0 h-screen overflow-y-auto">
        <div className="px-6 pt-9 pb-5">
          <p className="text-[24px] font-bold leading-none">Hemily</p>
          <p className="mt-1.5 text-[11px] font-medium tracking-[3px] opacity-50">HEALTH</p>
        </div>
        <div className="mx-6 h-px bg-white/15" />
        <nav className="flex flex-col gap-1 px-6 py-6">
          {NAV.map((item) => {
            const isActive = item.key === active
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => navigate(item.path)}
                className={`relative h-11 rounded-[10px] pl-5 flex items-center text-[14px] text-left transition-colors ${
                  isActive ? 'bg-white/[0.18] font-bold' : 'font-normal text-white/65 hover:text-white'
                }`}
              >
                {isActive && <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-6 bg-white rounded-[2px]" />}
                {t(`nav.${item.key}`)}
              </button>
            )
          })}
        </nav>
        <div className="mt-auto px-6 pb-8">
          <div className="h-px bg-white/15 mb-5" />
          <div className="flex items-center gap-3">
            <div className="flex-none size-8 rounded-full bg-[#5BA3D9] flex items-center justify-center text-[14px] font-bold">
              {name[0] ?? ''}
            </div>
            <span className="text-[13px] font-medium opacity-80 truncate">
              {name}
              {t('greetingSuffix')}
            </span>
          </div>
        </div>
      </aside>

      {/* 우측: 상단바 + 콘텐츠 */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* 상단바 — md+ */}
        <header className="hidden md:flex flex-none h-[60px] bg-white shadow-[0_2px_8px_rgba(0,0,0,0.05)] items-center justify-between px-8 sticky top-0 z-10">
          <div className="min-w-0">{topbarLeft}</div>
          <div className="flex items-center gap-3">
            {topbarRight}
            <button
              type="button"
              aria-label="알림"
              onClick={() => navigate('/notifications')}
              className="flex-none size-9 rounded-full bg-[#F1F5F9] flex items-center justify-center"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M18 8A6 6 0 1 0 6 8c0 7-3 9-3 9h18s-3-2-3-9Z" stroke="#191919" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" stroke="#191919" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
        </header>

        <main className="flex-1 min-w-0 flex flex-col">{children}</main>
      </div>
    </div>
  )
}
