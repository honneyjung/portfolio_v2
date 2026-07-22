import { useTranslation } from 'react-i18next'
import logo from '../../assets/images/img_logo.png'

interface Props {
  children: React.ReactNode
}

/**
 * 반응형 페이지 래퍼
 *
 * 모바일 (< 768px) : 흰 배경, 전체 너비
 * 태블릿 (md 768px+): 회색 배경 위 중앙 카드 (max-w-[480px], 그림자)
 * 노트북 (lg 1024px+): 좌측 브랜딩 패널 + 우측 콘텐츠 패널
 */
export default function MobileShell({ children }: Props) {
  const { t } = useTranslation('common')

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col lg:flex-row">

      {/* 브랜딩 패널 — 노트북(lg+)에서만 노출 */}
      <aside className="hidden lg:flex flex-col items-center justify-center bg-blue-800 text-white px-16 shrink-0 w-[45%]">
        <img
          src={logo}
          alt="HEMILY HEALTH"
          style={{ height: 72, width: 'auto', filter: 'brightness(0) invert(1)' }}
        />
        <p className="mt-6 text-xl font-medium text-center leading-relaxed whitespace-pre-line">
          {t('brand.tagline')}
        </p>
      </aside>

      {/* 콘텐츠 열 */}
      <div className="flex-1 flex flex-col md:items-center lg:items-stretch">
        {/*
          모바일 : flex-1 flex-col (전체 높이 채움)
          태블릿 : 디바이스 전체 높이(100dvh) 카드, 가로 중앙 정렬
          노트북 : flex-1 + 카드 스타일 초기화 (패널 전체 채움)
        */}
        <div className="
          w-full flex-1 flex flex-col
          md:flex-none md:h-[100dvh] md:max-w-[480px] md:bg-white md:rounded-3xl md:shadow-xl md:overflow-hidden
          lg:flex-1 lg:h-auto lg:max-w-none lg:bg-white lg:rounded-none lg:shadow-none lg:overflow-visible
        ">
          {children}
        </div>
      </div>

    </div>
  )
}
