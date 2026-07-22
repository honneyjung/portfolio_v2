import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import type { TFunction } from 'i18next'
import AppShell from '../../components/layout/AppShell'
import BottomNav from '../../components/layout/BottomNav'
import { mypageApi } from '../../lib/api/mypage'
import { pointApi } from '../../lib/api/point'
import { usersApi } from '../../lib/api/users'
import { useAuthStore } from '../../lib/store/authStore'
import type { MypageSummary, HemilianManager, PointWallet, Challenge, User } from '../../types'

// { success, data } 래퍼 / flat 모두 방어적으로 언랩
function unwrap<T>(res: { data: unknown } | undefined): T | undefined {
  if (!res) return undefined
  const body = res.data as { data?: T } | T | undefined
  if (body && typeof body === 'object' && 'data' in (body as object)) {
    return (body as { data?: T }).data
  }
  return body as T | undefined
}

// "만성질환 · 50대 남성"
function profileMeta(user: User | undefined, t: TFunction<'mypage'>): string {
  if (!user) return ''
  const parts: string[] = []
  const typeLabel = t(`home.userType.${user.userType}`, { defaultValue: '' })
  if (typeLabel) parts.push(typeLabel)
  const tail: string[] = []
  if (user.birth_date) {
    const age = new Date().getFullYear() - parseInt(user.birth_date.slice(0, 4), 10)
    if (age > 0) tail.push(t('home.ageBand', { n: Math.floor(age / 10) * 10 }))
  }
  const g = user.gender === 'male' || user.gender === 'female' ? t(`home.gender.${user.gender}`) : ''
  if (g) tail.push(g)
  if (tail.length) parts.push(tail.join(' '))
  return parts.join(' · ')
}

// ── 메뉴 행 ────────────────────────────────────────────
function MenuRow({ label, onClick, divider }: { label: string; onClick?: () => void; divider: boolean }) {
  return (
    <>
      <button
        type="button"
        onClick={onClick}
        className="w-full flex items-center justify-between px-5 py-6
                   md:py-4 md:bg-white md:rounded-[12px] md:shadow-[0_2px_12px_rgba(0,0,0,0.05)]"
      >
        <span className="text-[16px] font-medium text-black tracking-[-0.32px] md:text-[14px] md:text-[#1E293B]">{label}</span>
        <svg width="8" height="14" viewBox="0 0 8 14" fill="none">
          <path d="M1 1L7 7L1 13" stroke="#94A3B8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {divider && <div className="mx-5 border-t border-[#E2E8F0] md:hidden" />}
    </>
  )
}

// ── 통계 카드 ──────────────────────────────────────────
function StatCard({ value, label, onClick }: { value: string; label: string; onClick?: () => void }) {
  const className =
    'flex-1 h-[74px] rounded-[12px] bg-[#F8FAFF] border-[0.5px] border-[#DBEAFE] shadow-[0px_4px_2px_rgba(0,63,132,0.02)] flex flex-col items-center justify-center gap-1 md:h-[48px] md:rounded-none md:bg-transparent md:border-0 md:shadow-none'
  const inner = (
    <>
      <span className="text-[18px] font-bold text-[#003E7F]">{value}</span>
      <span className="text-[14px] font-medium text-[#555] tracking-[-0.14px]">{label}</span>
    </>
  )
  return onClick ? (
    <button type="button" onClick={onClick} className={className}>
      {inner}
    </button>
  ) : (
    <div className={className}>{inner}</div>
  )
}

// ── MyPage ─────────────────────────────────────────────
export default function MyPage() {
  const navigate = useNavigate()
  const { t } = useTranslation('mypage')
  const authUser = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)

  const { data: summaryRes } = useQuery({
    queryKey: ['mypage', 'summary'],
    queryFn: () => mypageApi.getSummary(),
  })
  const summary = unwrap<MypageSummary>(summaryRes)
  const user = summary?.me ?? authUser ?? undefined

  const { data: reportsRes } = useQuery({
    queryKey: ['mypage', 'reports'],
    queryFn: () => mypageApi.getReports(),
  })
  const reportCount = unwrap<{ items: unknown[] }>(reportsRes)?.items?.length ?? 0

  const { data: challengesRes } = useQuery({
    queryKey: ['mypage', 'challenges', 'active'],
    queryFn: () => mypageApi.getChallenges({ status: 'active' }),
  })
  const activeChallengeCount =
    unwrap<{ items: Challenge[] }>(challengesRes)?.items?.filter((c) => c.status === 'active').length ?? 0

  const { data: walletRes } = useQuery({
    queryKey: ['point', 'wallet'],
    queryFn: () => pointApi.getWallet(),
  })
  const points = unwrap<PointWallet>(walletRes)?.crm_point_balance ?? 0

  const { data: managerRes } = useQuery({
    queryKey: ['users', 'hemilian-manager'],
    queryFn: () => usersApi.getHemilianManager(),
  })
  const manager = unwrap<HemilianManager>(managerRes)
  const managerName = manager?.hemilian?.name

  const initial = user?.name?.[0] ?? ''

  return (
    <AppShell active="mypage" topbarLeft={<p className="text-[17px] font-bold text-[#1E293B]">{t('home.title')}</p>}>
      <div className="flex-1 flex flex-col bg-[#F1F5F9] overflow-hidden md:overflow-visible">
        <div className="flex-1 overflow-y-auto pt-5 pb-6 md:overflow-visible md:pt-8">
          {/* 타이틀 — 모바일만 */}
          <h1 className="text-[18px] font-bold text-[#191919] text-center mb-[30px] md:hidden">{t('home.title')}</h1>

          <div className="px-5 flex flex-col gap-[18px] md:px-8 md:gap-3 md:max-w-[584px]">
            {/* 프로필 */}
            <div className="flex items-center gap-5 md:bg-white md:rounded-[20px] md:shadow-[0_2px_12px_rgba(0,0,0,0.05)] md:p-6">
              <div className="flex-none size-[58px] rounded-full bg-[#5BA3D9] flex items-center justify-center md:size-[56px]">
                <span className="text-[18px] font-bold text-white md:text-[20px]">{initial}</span>
              </div>
              <div className="flex flex-col gap-1">
                <p className="text-[18px] font-bold text-black md:text-[#1E293B]">{user?.name ? `${user.name}${t('home.nameSuffix')}` : ''}</p>
                <p className="text-[14px] font-medium text-[#555] tracking-[-0.14px] md:text-[13px] md:text-[#64748B]">{profileMeta(user, t)}</p>
              </div>
            </div>

            <div className="flex flex-col gap-6 md:contents">
              {/* 담당 해밀리안 */}
              <div className="flex flex-col gap-[7px] items-end md:order-2">
                <div className="w-full bg-[#DBEAFE] rounded-[10px] pt-3 pb-4 pl-[17px] pr-4 flex flex-col gap-2
                                md:rounded-[16px] md:px-6 md:py-4 md:flex-row md:items-center md:justify-between md:gap-0 md:shadow-[0_2px_12px_rgba(0,0,0,0.05)]">
                  <div className="flex flex-col gap-2 md:gap-0.5 w-full md:w-auto">
                    <p className="text-[14px] font-bold text-[#191919] tracking-[-0.14px] md:text-[12px] md:font-normal md:text-[#003E7F]">{t('home.manager.label')}</p>
                    <p className="text-[18px] font-bold text-[#003E7F] text-right md:text-[16px] md:text-left">
                      {managerName ? t('home.manager.suffix', { name: managerName }) : t('home.manager.none')}
                    </p>
                  </div>
                  {managerName && (
                    <button
                      type="button"
                      onClick={() => navigate('/mypage/manager')}
                      className="hidden md:block flex-none text-[12px] font-normal text-[#64748B]"
                    >
                      {t('home.manager.change')}
                    </button>
                  )}
                </div>
                {managerName && (
                  <button
                    type="button"
                    onClick={() => navigate('/mypage/manager')}
                    className="md:hidden text-[12px] font-normal text-[#555] tracking-[-0.24px]"
                  >
                    {t('home.manager.change')}
                  </button>
                )}
              </div>

              {/* 통계 3개 */}
              <div className="flex gap-[14px] md:order-1 md:gap-0 md:bg-white md:rounded-[16px] md:shadow-[0_2px_12px_rgba(0,0,0,0.05)] md:py-5 md:divide-x md:divide-[#F1F5F9]">
                <StatCard value={String(reportCount)} label={t('home.stats.report')} />
                <StatCard value={String(activeChallengeCount)} label={t('home.stats.challenge')} />
                <StatCard value={`${points}p`} label={t('home.stats.point')} onClick={() => navigate('/mypage/points')} />
              </div>

              {/* 메뉴 리스트 — 간격은 각 행의 py로 잡아 여백까지 터치영역에 포함 */}
              <div className="bg-[#F8FAFF] rounded-[10px] flex flex-col md:order-3 md:bg-transparent md:rounded-none md:gap-3">
                <MenuRow label={t('home.menu.reportHistory')} onClick={() => navigate('/mypage/reports')} divider />
                <MenuRow label={t('home.menu.challengeHistory')} onClick={() => navigate('/mypage/challenges')} divider />
                <MenuRow label={t('home.menu.consent')} onClick={() => navigate('/mypage/consent')} divider />
                <MenuRow label={t('home.menu.managerManage')} onClick={() => navigate('/mypage/manager')} divider />
                {/* 로그아웃 */}
                <button
                  type="button"
                  onClick={() => { logout(); navigate('/login', { replace: true }) }}
                  className="w-full flex items-center gap-3 px-5 py-[14px]
                             md:py-4 md:bg-white md:rounded-[12px] md:shadow-[0_2px_12px_rgba(0,0,0,0.05)]"
                >
                  <div className="flex-none size-8 rounded-[8px] bg-[#FEE2E2] flex items-center justify-center">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <path d="M6 14H3C2.44772 14 2 13.5523 2 13V3C2 2.44772 2.44772 2 3 2H6"
                        stroke="#EF4444" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M10.5 11L14 8L10.5 5M14 8H6"
                        stroke="#EF4444" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                  <span className="flex-1 text-[15px] font-medium text-[#EF4444] text-left tracking-[-0.3px] md:text-[14px]">
                    {t('settings.logout')}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 하단 탭 바 — 모바일만 */}
        <div className="md:hidden">
          <BottomNav active="mypage" />
        </div>
      </div>
    </AppShell>
  )
}
