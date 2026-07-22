import { useNavigate, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import AppShell from '../../components/layout/AppShell'
import Header from '../../components/layout/Header'
import BottomNav from '../../components/layout/BottomNav'

const NAVY_GRADIENT = 'linear-gradient(179deg, #003E7F 31.476%, #052649 96.729%)'

type LocationState = {
  productName?: string
  productImage?: string
  logDate?: string
  returnTo?: string
}

function formatDate(isoDate: string): string {
  return isoDate.replace(/-/g, '.')
}

export default function ChallengeProductResultPage() {
  const { t } = useTranslation('challenge')
  const navigate = useNavigate()
  const { state } = useLocation() as { state: LocationState | null }

  const productName = state?.productName ?? ''
  const productImage = state?.productImage ?? ''
  const logDate = state?.logDate ? formatDate(state.logDate) : ''
  const returnTo = state?.returnTo ?? '/challenge'

  return (
    <AppShell
      active="challenge"
      topbarLeft={<span className="text-[17px] font-bold text-[#1E293B]">{t('recognition.pageTitle')}</span>}
    >
      {/* 모바일 헤더 */}
      <div className="md:hidden">
        <Header
          showBack
          title={<span className="text-[17px] font-bold text-[#1E293B]">{t('recognition.pageTitle')}</span>}
        />
      </div>

      {/* ── 모바일 ── */}
      <div className="md:hidden flex flex-col flex-1 bg-[#F1F5F9] overflow-hidden">
        <div className="flex-1 overflow-y-auto px-5 pt-8 pb-6 flex flex-col gap-7">

          {/* 업로드 완료 헤더 */}
          <div className="flex flex-col items-center gap-5">
            <span className="text-[56px] leading-none">📂</span>
            <div className="flex flex-col items-center gap-[9px] text-center">
              <p className="text-[24px] font-bold text-[#191919] tracking-[-0.24px]">
                {t('recognition.resultTitle')}
              </p>
              <p className="text-[16px] font-medium text-[#191919] tracking-[-0.32px]">
                {t('recognition.resultSubtitle')}
              </p>
            </div>
          </div>

          {/* 제품 카드 */}
          <div className="bg-[#F8FAFF] rounded-[10px] px-5 py-5 flex flex-col gap-3">
            {logDate && (
              <p className="text-[14px] font-medium text-[#555] tracking-[-0.14px]">{logDate}</p>
            )}

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {productImage ? (
                  <img
                    src={productImage}
                    alt={productName}
                    className="w-[68px] h-[68px] object-cover rounded-[8px] flex-shrink-0"
                  />
                ) : (
                  <div className="w-[68px] h-[68px] rounded-[8px] bg-[#DBEAFE] flex-shrink-0" />
                )}
                <div className="flex flex-col gap-1">
                  <p className="text-[16px] font-bold text-[#1E293B] tracking-[-0.32px] leading-tight max-w-[140px]">
                    {productName}
                  </p>
                </div>
              </div>

              <div className="bg-[#2B8E43] flex items-center justify-center h-[26px] px-2 rounded-full flex-shrink-0">
                <p className="text-[14px] font-medium text-[#F8FAFF] tracking-[-0.14px] whitespace-nowrap">
                  {t('recognition.statusReviewing')}
                </p>
              </div>
            </div>

            <div className="h-px bg-[#E2E8F0]" />

            <p className="text-[13px] text-[#64748B] leading-relaxed tracking-[-0.13px]">
              {t('recognition.resultGuide')}
            </p>
          </div>

          {/* 확인 버튼 */}
          <button
            type="button"
            onClick={() => navigate(returnTo)}
            className="mt-auto h-[52px] rounded-full flex items-center justify-center text-[#F8FAFF] text-[16px] font-medium tracking-[-0.32px]"
            style={{ backgroundImage: NAVY_GRADIENT }}
          >
            {t('recognition.resultConfirm')}
          </button>
        </div>

        <BottomNav active="challenge" />
      </div>

      {/* ── 웹 ── */}
      <div className="hidden md:flex md:flex-col bg-[#F1F5F9] px-8 py-6 flex-1 overflow-y-auto">
        <div className="flex flex-col gap-6 max-w-[640px] w-full">

          {/* 업로드 완료 헤더 */}
          <div className="flex flex-col items-center gap-4 py-4">
            <span className="text-[48px] leading-none">📂</span>
            <div className="flex flex-col items-center gap-2 text-center">
              <p className="text-[20px] font-bold text-[#191919] tracking-[-0.2px]">
                {t('recognition.resultTitle')}
              </p>
              <p className="text-[14px] font-medium text-[#555] tracking-[-0.14px]">
                {t('recognition.resultSubtitle')}
              </p>
            </div>
          </div>

          {/* 제품 카드 */}
          <div className="bg-white rounded-[16px] shadow-[0_2px_12px_rgba(0,0,0,0.05)] px-6 py-5 flex flex-col gap-4">
            {logDate && (
              <p className="text-[13px] font-medium text-[#555] tracking-[-0.13px]">{logDate}</p>
            )}

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {productImage ? (
                  <img
                    src={productImage}
                    alt={productName}
                    className="w-[48px] h-[48px] object-cover rounded-[8px] flex-shrink-0"
                  />
                ) : (
                  <div className="w-[48px] h-[48px] rounded-[8px] bg-[#DBEAFE] flex-shrink-0" />
                )}
                <p className="text-[15px] font-bold text-[#1E293B] tracking-[-0.3px] leading-tight">
                  {productName}
                </p>
              </div>

              <div className="bg-[#2B8E43] flex items-center justify-center h-[26px] px-3 rounded-full flex-shrink-0">
                <p className="text-[13px] font-medium text-[#F8FAFF] tracking-[-0.13px] whitespace-nowrap">
                  {t('recognition.statusReviewing')}
                </p>
              </div>
            </div>

            <div className="h-px bg-[#E2E8F0]" />

            <p className="text-[13px] text-[#64748B] leading-relaxed tracking-[-0.13px]">
              {t('recognition.resultGuide')}
            </p>
          </div>

          {/* 확인 버튼 */}
          <button
            type="button"
            onClick={() => navigate(returnTo)}
            className="h-[52px] rounded-full bg-[#003E7F] text-white text-[14px] font-bold"
          >
            {t('recognition.resultConfirm')}
          </button>
        </div>
      </div>
    </AppShell>
  )
}
