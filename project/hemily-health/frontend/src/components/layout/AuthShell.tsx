import { useTranslation } from 'react-i18next'

interface Props {
  children: React.ReactNode
}

/**
 * 인증 화면(로그인·회원가입·동의 등) 반응형 래퍼
 *
 * 모바일 (< md)  : 브랜드 패널 숨김, 콘텐츠 전체 너비 (기존 모바일 디자인 유지)
 * 태블릿 (md)    : 좌측 브랜드 패널(축소) + 우측 콘텐츠 — 데스크탑 축소판
 * 데스크탑 (lg+) : 피그마 웹 디자인 (좌 #003E7F 패널 520px + 우측 흰 콘텐츠)
 */
export default function AuthShell({ children }: Props) {
  const { t } = useTranslation('common')

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-white">
      {/* 브랜드 패널 — 태블릿+데스크탑(md+)만 노출 */}
      <aside
        className="hidden md:flex flex-col justify-center shrink-0 bg-[#003E7F] text-white
                   md:w-[40%] md:px-10 lg:w-[520px] lg:px-20"
      >
        <p className="font-bold leading-none text-[44px] lg:text-[72px]">Hemily</p>
        <p className="mt-2 lg:mt-3 font-medium tracking-[5px] opacity-60 text-[16px] lg:text-[20px]">
          HEALTH
        </p>
        <p className="mt-4 lg:mt-5 leading-[1.6] opacity-75 whitespace-pre-line text-[18px] lg:text-[22px]">
          {t('brand.authTagline')}
        </p>
      </aside>

      {/* 콘텐츠 — 모바일 전체 / md+ 우측 */}
      <main className="flex-1 flex flex-col min-w-0">{children}</main>
    </div>
  )
}
