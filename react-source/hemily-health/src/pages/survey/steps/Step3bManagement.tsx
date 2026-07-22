import { useTranslation } from 'react-i18next'
import { useSurveyStore } from '../../../lib/store/surveyStore'
import { CHRONIC_TYPES, CHRONIC_MANAGEMENT_STAGES } from '../../../constants'
import { SurveyLayout } from '../components/SurveyLayout'

interface Props {
  chronic:     string
  currentStep: number
  totalSteps:  number
  onNext:      () => void
  onBack:      () => void
}

export function Step3bManagement({ chronic, currentStep, totalSteps, onNext, onBack }: Props) {
  const { t } = useTranslation('survey')
  const { chronicDetails, setChronicDetail } = useSurveyStore()
  const detail = chronicDetails[chronic]
  const stage  = detail?.managementStage ?? ''

  const chronicLabel = CHRONIC_TYPES.find((c) => c.value === chronic)
    ? t(`chronicType.${chronic}`) as string
    : chronic

  return (
    <SurveyLayout
      currentStep={currentStep}
      totalSteps={totalSteps}
      onBack={onBack}
      onNext={onNext}
      nextDisabled={!stage}
    >
      <h2 className="text-[24px] font-bold text-[#1E293B] tracking-[-0.24px] leading-snug whitespace-pre-line mb-8">
        {t('step3b_management.title2')}
      </h2>

      {/* 만성질환별 관리 단계 select */}
      <div>
        <p className="text-body-sm font-bold mb-2">
          <span className="text-blue">{chronicLabel}</span>
          {' '}
          <span className="text-gray-800">{t('step3b_management.stageLabel')}</span>
        </p>
        <select
          value={stage}
          onChange={(e) => setChronicDetail(chronic, { managementStage: e.target.value })}
          className={`
            w-full h-[52px] rounded-xl border px-4 text-body-sm bg-white
            focus:outline-none focus:border-blue transition-colors
            ${stage ? 'text-gray-900 border-blue' : 'text-gray-400 border-gray-300'}
          `}
        >
          <option value="" disabled>{t('step3b_management.placeholder')}</option>
          {CHRONIC_MANAGEMENT_STAGES.map(({ value }) => (
            <option key={value} value={value}>
              {t(`managementStage.${value}` as Parameters<typeof t>[0])}
            </option>
          ))}
        </select>
      </div>

      <p className="mt-8 text-caption text-gray-300 text-center">{t('step3b_management.disclaimer')}</p>
    </SurveyLayout>
  )
}
