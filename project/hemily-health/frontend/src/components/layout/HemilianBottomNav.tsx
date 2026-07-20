import { useNavigate, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

const ITEMS = [
  {
    key: 'home',
    path: '/hemilian',
    icon: (active: boolean) => (
      <svg width="17" height="18" viewBox="0 0 17 18" fill="none">
        <path d="M1 6.5L8.5 1L16 6.5V16.5C16 16.7652 15.8946 17.0196 15.7071 17.2071C15.5196 17.3946 15.2652 17.5 15 17.5H11V12.5H6V17.5H2C1.73478 17.5 1.48043 17.3946 1.29289 17.2071C1.10536 17.0196 1 16.7652 1 16.5V6.5Z"
          stroke={active ? '#003E7F' : '#555555'} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    key: 'health',
    path: '/report',
    icon: (active: boolean) => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z"
          stroke={active ? '#003E7F' : '#555555'} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M14 2V8H20M16 13H8M16 17H8M10 9H8"
          stroke={active ? '#003E7F' : '#555555'} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    key: 'mypage',
    path: '/mypage',
    icon: (active: boolean) => (
      <svg width="16" height="18" viewBox="0 0 16 18" fill="none">
        <path d="M8 8C10.2091 8 12 6.20914 12 4C12 1.79086 10.2091 0 8 0C5.79086 0 4 1.79086 4 4C4 6.20914 5.79086 8 8 8Z"
          stroke={active ? '#003E7F' : '#555555'} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M1 17C1 14.2386 4.13401 12 8 12C11.866 12 15 14.2386 15 17"
          stroke={active ? '#003E7F' : '#555555'} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
] as const

export default function HemilianBottomNav() {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const { t } = useTranslation('hemilian')

  const activeKey =
    pathname.startsWith('/hemilian') ? 'home'
    : pathname.startsWith('/report') ? 'health'
    : 'mypage'

  return (
    <>
      <div className="h-[89px] flex-none" aria-hidden="true" />
      <div className="fixed bottom-0 inset-x-0 z-50 bg-[#F8FAFF] shadow-[0_-2px_1px_rgba(0,0,0,0.08)] rounded-t-[12px]">
        <div className="mx-auto w-full max-w-[480px] px-[38px] pt-5 pb-[19px] flex items-end justify-between">
          {ITEMS.map((item) => {
            const isActive = item.key === activeKey
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => navigate(item.path)}
                className="flex flex-col items-center gap-2"
              >
                {item.icon(isActive)}
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
