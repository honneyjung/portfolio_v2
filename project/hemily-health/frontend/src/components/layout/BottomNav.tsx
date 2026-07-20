import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuthStore } from '../../lib/store/authStore'

export type NavKey = 'home' | 'challenge' | 'report' | 'mypage'

/**
 * 하단 탭 바 (홈/챌린지/리포트/마이)
 * 리포트 화면 등에서 'report' 항목은 /report 목록 진입점이 없어
 * 기존 페이지들은 인라인으로 사용 중. 신규 화면은 이 공용 컴포넌트를 사용.
 */
export default function BottomNav({ active }: { active: NavKey }) {
  const navigate = useNavigate()
  const { t } = useTranslation('home')
  const userType = useAuthStore((s) => s.user?.userType)
  const blue = '#003E7F'
  const gray = '#555555'

  const items: { key: NavKey; path: string; icon: (color: string) => React.ReactNode }[] = [
    {
      key: 'home', path: userType === 'hemilian' ? '/hemilian' : '/',
      icon: (c) => (
        <svg width="17" height="18" viewBox="0 0 17 18" fill="none">
          <path d="M1 6.5L8.5 1L16 6.5V16.5C16 16.7652 15.8946 17.0196 15.7071 17.2071C15.5196 17.3946 15.2652 17.5 15 17.5H11V12.5H6V17.5H2C1.73478 17.5 1.48043 17.3946 1.29289 17.2071C1.10536 17.0196 1 16.7652 1 16.5V6.5Z"
            stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ),
    },
    {
      key: 'challenge', path: '/challenge',
      icon: (c) => (
        <svg width="14" height="20" viewBox="0 0 14 20" fill="none">
          <path d="M7.833 1C7.833 1 3 8 3 12C3 14.761 4.791 17.085 7.28 17.792C7.476 17.849 7.619 17.676 7.552 17.487C7.19 16.458 7 15.253 7 14C7 11 9.5 8.5 9.5 8.5C9.5 8.5 9 11 10.5 12C11 12 13 10.5 13 8C13 5.239 11.209 2.915 8.72 2.208C8.524 2.151 8.381 1.976 8.448 1.787C8.527 1.568 7.833 1 7.833 1Z"
            stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ),
    },
    {
      key: 'report', path: '/report',
      icon: (c) => (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z"
            stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M14 2V8H20M16 13H8M16 17H8M10 9H8"
            stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ),
    },
    {
      key: 'mypage', path: '/mypage',
      icon: (c) => (
        <svg width="16" height="18" viewBox="0 0 16 18" fill="none">
          <path d="M8 8C10.2091 8 12 6.20914 12 4C12 1.79086 10.2091 0 8 0C5.79086 0 4 1.79086 4 4C4 6.20914 5.79086 8 8 8Z"
            stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M1 17C1 14.2386 4.13401 12 8 12C11.866 12 15 14.2386 15 17"
            stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ),
    },
  ]

  return (
    <>
      <div className="h-[89px] flex-none" aria-hidden="true" />
      <div className="fixed bottom-0 inset-x-0 z-50 bg-[#F8FAFF] shadow-[0_-2px_1px_rgba(0,0,0,0.08)] rounded-t-[12px] px-[38px] pt-5 pb-[19px]">
        <div className="flex items-end justify-between">
          {items.map((item) => {
            const isActive = item.key === active
            return (
              <button key={item.key} type="button" onClick={() => navigate(item.path)} className="flex flex-col items-center gap-2">
                {item.icon(isActive ? blue : gray)}
                <span className={`text-[12px] tracking-[-0.24px] ${isActive ? 'font-semibold text-[#003E7F]' : 'font-medium text-[#555]'}`}>
                  {t(`nav.${item.key}`)}
                </span>
              </button>
            )
          })}
        </div>
      </div>
    </>
  )
}
