import icBack from '../../../assets/images/ic_back.svg'

interface SurveyLayoutProps {
  stepLabel?:          string
  currentStep:         number   // 현재 메이저 스텝 (1-based). 0이면 인디케이터 숨김
  totalSteps:          number
  onBack?:             () => void
  children:            React.ReactNode
  onNext:              () => void
  nextLabel?:          string
  nextDisabled?:       boolean
  isLoading?:          boolean
  backLabel?:          string
  headerBackHidden?:   boolean  // 헤더 < 아이콘 숨김 (chronic_yn, medication_yn)
  footerBackHidden?:   boolean  // 하단 이전 버튼 숨김, 다음만 표시 (cancer_yn)
}

export function SurveyLayout({
  currentStep,
  totalSteps,
  onBack,
  children,
  onNext,
  nextLabel,
  nextDisabled     = false,
  isLoading        = false,
  backLabel,
  headerBackHidden = false,
  footerBackHidden = false,
}: SurveyLayoutProps) {
  const showIndicator    = totalSteps > 0
  const showHeaderBack   = !!onBack && !headerBackHidden
  const showFooterBack   = !!onBack && !footerBackHidden

  return (
    <div className="min-h-screen flex flex-col bg-onboarding md:bg-[#F1F5F9] md:items-center md:justify-center md:py-12">
      {/* 좌측 네이비 스트립 — 데스크탑/태블릿 */}
      <div className="hidden md:block fixed left-0 top-0 h-full w-2 bg-[#003E7F]" />

      <div className="flex-1 w-full flex flex-col bg-onboarding
                      md:flex-none md:bg-white md:rounded-[24px] md:shadow-[0_4px_24px_rgba(0,0,0,0.06)]
                      md:w-[840px] md:max-w-[calc(100vw-72px)] md:min-h-[640px] md:p-12">

        {/* ── 헤더 (뒤로가기 위, 인디케이터 아래) ── */}
        <div className="flex-none px-5 relative md:px-0">

          {/* 뒤로가기 아이콘 — 상단 */}
          {showHeaderBack && (
            <button
              type="button"
              onClick={onBack}
              aria-label="뒤로가기"
              className={`p-1 -ml-1 flex-none ${
                showIndicator
                  ? 'absolute left-5 top-6 md:static md:left-auto md:top-auto md:mb-5'
                  : 'mt-6 md:mt-0'
              }`}
            >
              <img src={icBack} alt="뒤로가기" width={14} height={23} />
            </button>
          )}

          {/* 스텝 인디케이터 — 뒤로가기 아래, 위 여백 112px (모바일) / 좌측 정렬·점선 */}
          {showIndicator && (
            <div className="pt-[112px] pb-2 md:pt-0 md:pb-0">
              <div className="flex items-center">
                {Array.from({ length: totalSteps }, (_, i) => {
                  const active = i + 1 === currentStep
                  return (
                    <div key={i} className="flex items-center">
                      {i > 0 && (
                        <div className="w-[18px] mx-[6px] border-t border-dashed border-[#CBD5E1]" />
                      )}
                      <div
                        className={`rounded-full flex-none flex items-center justify-center transition-all
                          ${active
                            ? 'w-7 h-7 bg-blue text-white text-[13px] font-bold'
                            : 'w-3 h-3 border border-[#CBD5E1]'
                          }`}
                      >
                        {active ? i + 1 : null}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {/* ── 콘텐츠 ── */}
        <div className="flex-1 overflow-y-auto px-5 pt-6 pb-4 md:px-0 md:pt-10 md:pb-0 md:overflow-visible">
          {children}
        </div>

        {/* ── 하단 버튼 ── */}
        <div className="flex-none px-5 pb-10 pt-3 md:px-0 md:pb-0 md:pt-8">
          {showFooterBack ? (
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onBack}
                className="flex-1 py-4 rounded-full text-[14px] font-bold text-[#64748B] bg-[#E2E8F0] transition-all active:scale-[0.98]"
              >
                {backLabel ?? '이전'}
              </button>
              <button
                type="button"
                onClick={onNext}
                disabled={nextDisabled || isLoading}
                className={`flex-[2] py-4 rounded-full text-[14px] font-bold text-white transition-all
                  ${nextDisabled || isLoading ? 'bg-gray-300 cursor-not-allowed' : 'bg-blue active:scale-[0.98]'}`}
              >
                {isLoading ? '제출 중...' : (nextLabel ?? '다음')}
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={onNext}
              disabled={nextDisabled || isLoading}
              className={`w-full py-4 rounded-full text-[14px] font-bold text-white transition-all
                ${nextDisabled || isLoading ? 'bg-gray-300 cursor-not-allowed' : 'bg-blue active:scale-[0.98]'}`}
            >
              {isLoading ? '제출 중...' : (nextLabel ?? '다음')}
            </button>
          )}
        </div>

      </div>
    </div>
  )
}
