import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useSurveyStore } from '../../../lib/store/surveyStore'
import { CANCER_TYPES, CHRONIC_TYPES } from '../../../constants'
import { SurveyLayout } from '../components/SurveyLayout'
import { Chip } from '../components/Chip'

interface Props {
  currentStep: number
  totalSteps:  number
  onNext:      () => void
  onBack:      () => void
}

export function Step2Disease({ currentStep, totalSteps, onNext, onBack }: Props) {
  const { t } = useTranslation('survey')
  const {
    selectedCancers, selectedChronics,
    toggleCancer, toggleChronic,
    clearCancers, clearChronics,
  } = useSurveyStore()

  const [noCancer,  setNoCancer]  = useState(false)
  const [noChronic, setNoChronic] = useState(false)

  const handleCancerChip = (value: string) => {
    setNoCancer(false)
    toggleCancer(value)
  }

  const handleNoCancer = () => {
    clearCancers()
    setNoCancer((v) => !v)
  }

  const handleChronicChip = (value: string) => {
    setNoChronic(false)
    toggleChronic(value)
  }

  const handleNoChronic = () => {
    clearChronics()
    setNoChronic((v) => !v)
  }

  const cancerDone  = selectedCancers.length > 0 || noCancer
  const chronicDone = selectedChronics.length > 0 || noChronic

  return (
    <SurveyLayout
      currentStep={currentStep}
      totalSteps={totalSteps}
      onBack={onBack}
      onNext={onNext}
      nextDisabled={!(cancerDone && chronicDone)}
    >
      <h2 className="text-[24px] font-bold text-[#1E293B] tracking-[-0.24px] leading-snug mb-1">{t('step2.title')}</h2>
      <p className="text-label text-sub-text tracking-[-0.14px] mb-6">{t('step2.subtitle')}</p>

      {/* ── 암 질환 섹션 ── */}
      <div className="bg-white rounded-[10px] border border-gray-200 mb-4 overflow-hidden">
        {/* 헤더 */}
        <div className="flex items-center justify-between px-4 py-3">
          <span className="bg-blue text-white text-label font-bold px-3 py-1 rounded-lg">
            {t('step2.cancerSection')}
          </span>
          <button
            type="button"
            onClick={handleNoCancer}
            className={`text-label font-bold px-4 py-1.5 rounded-lg transition-colors
              ${noCancer ? 'bg-blue text-white' : 'bg-blue-muted text-white'}`}
          >
            {t('step2.none')}
          </button>
        </div>

        {/* 구분선 */}
        <div className="h-px bg-gray-100" />

        {/* 칩 영역 */}
        <div className="flex flex-wrap gap-2 px-4 py-4">
          {CANCER_TYPES.map(({ value }) => (
            <Chip
              key={value}
              label={t(`cancerType.${value}` as Parameters<typeof t>[0])}
              selected={selectedCancers.includes(value)}
              onClick={() => handleCancerChip(value)}
              disabled={noCancer}
            />
          ))}
        </div>
      </div>

      {/* ── 만성질환 섹션 ── */}
      <div className="rounded-[10px] overflow-hidden mb-6">
        {/* 파란 헤더 */}
        <div className="bg-blue flex items-center justify-between px-4 py-3">
          <span className="text-body-sm font-bold text-white">
            {t('step2.chronicSection')}
          </span>
          <button
            type="button"
            onClick={handleNoChronic}
            className={`text-label font-bold px-4 py-1.5 rounded-lg transition-colors
              ${noChronic ? 'bg-white text-blue' : 'bg-white/20 text-white'}`}
          >
            {t('step2.none')}
          </button>
        </div>

        {/* 칩 영역 */}
        <div className="flex flex-wrap gap-2 px-4 py-4 bg-white border border-t-0 border-gray-200 rounded-b-[10px]">
          {CHRONIC_TYPES.map(({ value }) => (
            <Chip
              key={value}
              label={t(`chronicType.${value}` as Parameters<typeof t>[0])}
              selected={selectedChronics.includes(value)}
              onClick={() => handleChronicChip(value)}
              disabled={noChronic}
            />
          ))}
        </div>
      </div>

      <p className="text-caption text-gray-300 text-center">{t('step2.disclaimer')}</p>
    </SurveyLayout>
  )
}
