import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import AppShell from '../../components/layout/AppShell'

const NAVY_GRADIENT = 'linear-gradient(179deg, #003E7F 31.476%, #052649 96.729%)'

type ChallengeType = 'recommend' | 'custom'

export default function ChallengePage() {
  const navigate = useNavigate()
  const { t } = useTranslation('challenge')
  const [selected, setSelected] = useState<ChallengeType>('recommend')

  const handleNext = () => {
    // TODO: 다음 단계(챌린지 생성) 화면 연결
    navigate(`/challenge/create?type=${selected}`)
  }

  const optionClass = (active: boolean) =>
    `h-[66px] rounded-full flex items-center pl-6 pr-5 text-[16px] font-medium tracking-[-0.32px] w-full transition-colors ${
      active ? 'bg-[#003E7F] text-[#F8FAFF]' : 'bg-[#F1F5F9] text-[#1E293B] border border-[#E0E6EF]'
    }`

  return (
    <AppShell active="challenge" topbarLeft={<p className="text-[17px] font-bold text-[#1E293B]">{t('start.topTitle')}</p>}>
      <div className="flex-1 flex flex-col bg-[#F1F5F9] md:items-center md:justify-center md:py-10">
        <div
          className="flex-1 flex flex-col w-full px-5 pt-14 pb-8
                     md:flex-none md:max-w-[640px] md:bg-white md:rounded-[24px] md:shadow-[0_2px_16px_rgba(0,0,0,0.06)] md:px-12 md:py-12"
        >
          {/* 헤더 */}
          <div className="flex flex-col gap-2">
            <h1 className="text-[24px] font-bold text-[#1E293B] tracking-[-0.24px] leading-snug max-w-[240px] break-keep">
              {t('start.heading')}
            </h1>
            <p className="text-[14px] font-medium text-[#64748B] tracking-[-0.14px]">{t('start.subtitle')}</p>
          </div>

          {/* 유형 선택 */}
          <div className="mt-6 flex flex-col gap-4">
            <button type="button" onClick={() => setSelected('recommend')} className={optionClass(selected === 'recommend')}>
              {t('start.optionRecommend')}
            </button>
            <button type="button" onClick={() => setSelected('custom')} className={optionClass(selected === 'custom')}>
              {t('start.optionCustom')}
            </button>
          </div>

          {/* 다음 */}
          <button
            type="button"
            onClick={handleNext}
            className="mt-auto md:mt-8 h-[52px] rounded-full flex items-center justify-center text-[#F8FAFF] text-[16px] font-medium tracking-[-0.32px]"
            style={{ backgroundImage: NAVY_GRADIENT }}
          >
            {t('start.next')}
          </button>
        </div>
      </div>
    </AppShell>
  )
}
