import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import AppShell from '../../components/layout/AppShell'
import HemilianBottomNav from '../../components/layout/HemilianBottomNav'
import { mypageApi } from '../../lib/api/mypage'
import { useAuthStore } from '../../lib/store/authStore'
import { HEMILIAN_GRADES } from '../../constants'

const NAVY_GRADIENT = 'linear-gradient(179deg, #003E7F 31.476%, #052649 96.729%)'

function unwrap<T>(res: { data: unknown } | undefined): T | undefined {
  if (!res) return undefined
  const body = res.data as { data?: T } | T | undefined
  if (body && typeof body === 'object' && 'data' in (body as object)) {
    return (body as { data?: T }).data
  }
  return body as T | undefined
}

// ── 아이콘 컨테이너 (모바일 메뉴 행 왼쪽) ──────────────────
function IconBox({ children, red }: { children: React.ReactNode; red?: boolean }) {
  return (
    <div className={`flex-none size-8 rounded-[8px] flex items-center justify-center ${red ? 'bg-[#FEE2E2]' : 'bg-[#EAF0F7]'}`}>
      {children}
    </div>
  )
}

// ── 메뉴 행 ────────────────────────────────────────────────
function MenuRow({
  icon, label, onClick, divider, danger,
}: {
  icon: React.ReactNode
  label: string
  onClick?: () => void
  divider: boolean
  danger?: boolean
}) {
  return (
    <>
      <button
        type="button"
        onClick={onClick}
        className="w-full flex items-center gap-3 px-4 py-[14px] md:py-4 md:bg-white md:rounded-[12px] md:shadow-[0_2px_12px_rgba(0,0,0,0.05)]"
      >
        <IconBox red={danger}>{icon}</IconBox>
        <span className={`flex-1 text-[15px] font-medium text-left tracking-[-0.3px] md:text-[14px] ${danger ? 'text-[#EF4444]' : 'text-[#191919] md:text-[#1E293B]'}`}>
          {label}
        </span>
        {!danger && (
          <svg width="8" height="14" viewBox="0 0 8 14" fill="none" className="flex-none">
            <path d="M1 1L7 7L1 13" stroke="#94A3B8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </button>
      {divider && <div className="mx-4 border-t border-[#F1F5F9] md:hidden" />}
    </>
  )
}

// ── SVG 아이콘 ─────────────────────────────────────────────
const icons = {
  grade: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M8 1L9.854 5.526L14.657 5.975L11.2 9.074L12.291 13.775L8 11.2L3.709 13.775L4.8 9.074L1.343 5.975L6.146 5.526L8 1Z"
        stroke="#003E7F" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  report: (
    <svg width="14" height="16" viewBox="0 0 14 16" fill="none">
      <path d="M9 1H2C1.44772 1 1 1.44772 1 2V14C1 14.5523 1.44772 15 2 15H12C12.5523 15 13 14.5523 13 14V5L9 1Z"
        stroke="#003E7F" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M9 1V5H13M9 11H4M9 8H4M5 5H4"
        stroke="#003E7F" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  challenge: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M8 1V11M5 14H11M4 1H12V7C12 9.20914 10.2091 11 8 11C5.79086 11 4 9.20914 4 7V1ZM1 3H4M12 3H15"
        stroke="#003E7F" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  consent: (
    <svg width="14" height="16" viewBox="0 0 14 16" fill="none">
      <path d="M7 1L1 3.5V7.5C1 11 4 14 7 15C10 14 13 11 13 7.5V3.5L7 1Z"
        stroke="#003E7F" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M4.5 8L6.5 10L9.5 6.5"
        stroke="#003E7F" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  bell: (
    <svg width="14" height="16" viewBox="0 0 14 16" fill="none">
      <path d="M7 1.5C4.8 1.5 3 3.3 3 5.5C3 8.5 1.5 10 1.5 10H12.5C12.5 10 11 8.5 11 5.5C11 3.3 9.2 1.5 7 1.5Z"
        stroke="#003E7F" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5.5 10C5.5 10.8284 6.17157 11.5 7 11.5C7.82843 11.5 8.5 10.8284 8.5 10"
        stroke="#003E7F" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  ),
  point: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="7" stroke="#003E7F" strokeWidth="1.3" />
      <path d="M8 4V12M5.5 6H9.25C10.2165 6 11 6.67157 11 7.5C11 8.32843 10.2165 9 9.25 9H5.5"
        stroke="#003E7F" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  logout: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M6 14H3C2.44772 14 2 13.5523 2 13V3C2 2.44772 2.44772 2 3 2H6"
        stroke="#EF4444" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M10.5 11L14 8L10.5 5M14 8H6"
        stroke="#EF4444" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  copy: (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
      <rect x="7" y="7" width="11" height="11" rx="2" stroke="white" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M7 15H5C4.44772 15 4 14.5523 4 14V5C4 4.44772 4.44772 4 5 4H14C14.5523 4 15 4.44772 15 5V7"
        stroke="white" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  share: (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
      <path d="M15 8C16.6569 8 18 6.65685 18 5C18 3.34315 16.6569 2 15 2C13.3431 2 12 3.34315 12 5C12 6.65685 13.3431 8 15 8Z"
        stroke="white" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M7 13.5C8.65685 13.5 10 12.1569 10 10.5C10 8.84315 8.65685 7.5 7 7.5C5.34315 7.5 4 8.84315 4 10.5C4 12.1569 5.34315 13.5 7 13.5Z"
        stroke="white" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M15 19C16.6569 19 18 17.6569 18 16C18 14.3431 16.6569 13 15 13C13.3431 13 12 14.3431 12 16C12 17.6569 13.3431 19 15 19Z"
        stroke="white" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M9.5 9.5L12.5 6.5M9.5 11.5L12.5 14.5"
        stroke="white" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
}

// ── HemilianMyPage ─────────────────────────────────────────
export default function HemilianMyPage() {
  const navigate = useNavigate()
  const { t } = useTranslation('mypage')
  const [copied, setCopied] = useState(false)
  const authUser = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)

  const { data: summaryRes } = useQuery({
    queryKey: ['mypage', 'summary'],
    queryFn: () => mypageApi.getSummary(),
  })
  // Backend MypageResponse has report_count, challenge_count directly
  const raw = unwrap<{
    me: { id: string; name: string; email: string; hemilian_code?: string }
    report_count: number
    challenge_count: number
    cm_point?: { crm_point_balance: number } | null
  }>(summaryRes)

  const name = raw?.me?.name ?? authUser?.name ?? ''
  const initial = name[0] ?? ''
  const referralCode = raw?.me?.hemilian_code ?? null
  const userGradeKey = (authUser as { grade?: string } | null)?.grade
  const gradeName = userGradeKey
    ? (HEMILIAN_GRADES.find((g) => g.key === userGradeKey || g.name === userGradeKey)?.name ?? null)
    : null

  function handleCopy() {
    if (!referralCode) return
    navigator.clipboard.writeText(referralCode).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  function handleShare() {
    if (!referralCode) return
    if (navigator.share) {
      navigator.share({ text: referralCode })
    } else {
      handleCopy()
    }
  }

  function handleLogout() {
    logout()
    navigate('/login', { replace: true })
  }

  const menuItems = [
    { icon: icons.grade,     label: t('hemilian.menu.grade'),           onClick: () => navigate('/hemilian/grade') },
    { icon: icons.report,    label: t('hemilian.menu.reportHistory'),   onClick: () => navigate('/mypage/reports') },
    { icon: icons.challenge, label: t('hemilian.menu.challengeHistory'), onClick: () => navigate('/mypage/challenges') },
    { icon: icons.point,     label: t('hemilian.menu.point'),           onClick: () => navigate('/mypage/points') },
    { icon: icons.consent,   label: t('hemilian.menu.consent'),         onClick: () => navigate('/mypage/consent') },
  ]

  const topbarLeft = <p className="text-[17px] font-bold text-[#1E293B]">{t('home.title')}</p>

  return (
    <AppShell active="mypage" topbarLeft={topbarLeft}>
      {/* 토스트 */}
      {copied && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 bg-[#1E293B] text-white text-[14px] font-medium px-5 py-3 rounded-full shadow-lg whitespace-nowrap">
          추천 코드가 복사되었습니다
        </div>
      )}
      {/* ── 모바일 레이아웃 (md 미만) ──────────────────── */}
      <div className="md:hidden flex flex-col bg-[#F1F5F9] min-h-screen">
        <div className="flex-1 mx-auto w-full max-w-[480px] px-5 pt-5 pb-4">
          {/* 헤더 */}
          <div className="flex items-center justify-between mb-5">
            <h1 className="text-[18px] font-bold text-[#191919]">{t('home.title')}</h1>
            <button type="button" aria-label="설정" className="size-9 flex items-center justify-center">
              <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                <path d="M9.172 2.343A9 9 0 0 1 12.828 2.343L13.414 4.172A7 7 0 0 1 14.657 4.828L16.486 4.243A9 9 0 0 1 18.657 7.414L17.414 8.828A7 7 0 0 1 17.5 10A7 7 0 0 1 17.414 11.172L18.657 12.586A9 9 0 0 1 16.486 15.757L14.657 15.172A7 7 0 0 1 13.414 15.828L12.828 17.657A9 9 0 0 1 9.172 17.657L8.586 15.828A7 7 0 0 1 7.343 15.172L5.514 15.757A9 9 0 0 1 3.343 12.586L4.586 11.172A7 7 0 0 1 4.5 10A7 7 0 0 1 4.586 8.828L3.343 7.414A9 9 0 0 1 5.514 4.243L7.343 4.828A7 7 0 0 1 8.586 4.172L9.172 2.343Z"
                  stroke="#191919" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                <circle cx="11" cy="10" r="2.5" stroke="#191919" strokeWidth="1.5" />
              </svg>
            </button>
          </div>

          {/* 프로필 카드 */}
          <div className="bg-white rounded-[12px] p-4 flex items-center gap-4 mb-3">
            <div className="flex-none size-[58px] rounded-full bg-[#5BA3D9] flex items-center justify-center">
              <span className="text-[22px] font-bold text-white">{initial}</span>
            </div>
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center gap-2">
                <span className="text-[18px] font-bold text-[#191919]">{name}{t('home.nameSuffix')}</span>
                <span className="px-2 py-0.5 bg-[#EAF0F7] text-[#003E7F] text-[11px] font-semibold rounded-full">
                  {gradeName ?? t('hemilian.badge')}
                </span>
              </div>
            </div>
          </div>

          {/* 내 추천코드 카드 */}
          <div className="rounded-[12px] px-4 py-[14px] mb-3" style={{ backgroundImage: NAVY_GRADIENT }}>
            <p className="text-[12px] text-white/70 mb-1">{t('hemilian.referralCode.label')}</p>
            <div className="flex items-center justify-between">
              <span className="text-[22px] font-bold text-white tracking-widest">
                {referralCode ?? t('hemilian.referralCode.placeholder')}
              </span>
              {referralCode && (
                <div className="flex gap-3">
                  <button type="button" onClick={handleCopy} aria-label="복사">{icons.copy}</button>
                  <button type="button" onClick={handleShare} aria-label="공유">{icons.share}</button>
                </div>
              )}
            </div>
          </div>

          {/* 메뉴 리스트 */}
          <div className="bg-white rounded-[12px]">
            {menuItems.map((item, i) => (
              <MenuRow
                key={item.label}
                icon={item.icon}
                label={item.label}
                onClick={item.onClick}
                divider={i < menuItems.length - 1}
              />
            ))}
            {/* 로그아웃 */}
            <div className="mx-4 border-t border-[#F1F5F9]" />
            <MenuRow
              icon={icons.logout}
              label={t('settings.logout')}
              onClick={handleLogout}
              divider={false}
              danger
            />
          </div>
        </div>

        <HemilianBottomNav />
      </div>

      {/* ── 데스크탑 레이아웃 (md 이상) ─────────────────── */}
      <div className="hidden md:flex flex-1 flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto px-8 py-6">
          <div className="max-w-[584px] flex flex-col gap-3">
            {/* 프로필 카드 */}
            <div className="bg-white rounded-[20px] shadow-[0_2px_12px_rgba(0,0,0,0.05)] p-6 flex items-center gap-5">
              <div className="flex-none size-[56px] rounded-full bg-[#5BA3D9] flex items-center justify-center">
                <span className="text-[20px] font-bold text-white">{initial}</span>
              </div>
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <span className="text-[18px] font-bold text-[#1E293B]">{name}{t('home.nameSuffix')}</span>
                  <span className="px-2 py-0.5 bg-[#EAF0F7] text-[#003E7F] text-[11px] font-semibold rounded-full">
                    {gradeName ?? t('hemilian.badge')}
                  </span>
                </div>
                <p className="text-[13px] font-medium text-[#64748B]">{t('home.userType.hemilian')}</p>
              </div>
            </div>

            {/* 내 추천코드 카드 */}
            <div className="rounded-[16px] px-6 py-4" style={{ backgroundImage: NAVY_GRADIENT }}>
              <p className="text-[12px] text-white/70 mb-1">{t('hemilian.referralCode.label')}</p>
              <div className="flex items-center justify-between">
                <span className="text-[20px] font-bold text-white tracking-widest">
                  {referralCode ?? t('hemilian.referralCode.placeholder')}
                </span>
                {referralCode && (
                  <div className="flex gap-3">
                    <button type="button" onClick={handleCopy} aria-label="복사">{icons.copy}</button>
                    <button type="button" onClick={handleShare} aria-label="공유">{icons.share}</button>
                  </div>
                )}
              </div>
            </div>

            {/* 메뉴 (데스크탑: 개별 카드) */}
            <div className="flex flex-col gap-3">
              {menuItems.map((item) => (
                <MenuRow
                  key={item.label}
                  icon={item.icon}
                  label={item.label}
                  onClick={item.onClick}
                  divider={false}
                />
              ))}
              <MenuRow
                icon={icons.logout}
                label={t('settings.logout')}
                onClick={handleLogout}
                divider={false}
                danger
              />
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  )
}
