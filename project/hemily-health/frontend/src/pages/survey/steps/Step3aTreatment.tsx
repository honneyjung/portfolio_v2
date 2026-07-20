import { useTranslation } from 'react-i18next'
import { useSurveyStore } from '../../../lib/store/surveyStore'
import { CANCER_TYPES, CANCER_TREATMENT_STAGES, CANCER_FOLLOWUP_STAGES } from '../../../constants'
import { SurveyLayout } from '../components/SurveyLayout'

interface Props {
  cancer:      string
  currentStep: number
  totalSteps:  number
  onNext:      () => void
  onBack:      () => void
}

export function Step3aTreatment({ cancer, currentStep, totalSteps, onNext, onBack }: Props) {
  const { t } = useTranslation('survey')
  const { cancerDetails, setCancerDetail } = useSurveyStore()
  const detail   = cancerDetails[cancer]
  const stage    = detail?.treatmentStage ?? ''
  const followup = detail?.followupStage ?? ''

  const cancerLabel = CANCER_TYPES.find((c) => c.value === cancer)
    ? t(`cancerType.${cancer}`) as string
    : cancer

  const setStage = (value: string) =>
    setCancerDetail(cancer, { treatmentStage: value, followupStage: undefined })

  const setFollowup = (value: string) =>
    setCancerDetail(cancer, { followupStage: value })

  return (
    <SurveyLayout
      currentStep={currentStep}
      totalSteps={totalSteps}
      onBack={onBack}
      onNext={onNext}
      nextDisabled={!stage || (stage === 'followup' && !followup)}
    >
      <h2 className="text-[24px] font-bold text-[#1E293B] tracking-[-0.24px] leading-snug whitespace-pre-line mb-8">
        {t('step3a_treatment.title2')}
      </h2>

      {/* 암별 치료 단계 select */}
      <div className="space-y-5">
        <div>
          <p className="text-body-sm font-bold mb-2">
            <span className="text-blue">{cancerLabel}</span>
            {' '}
            <span className="text-gray-800">{t('step3a_treatment.stageLabel')}</span>
          </p>
          <select
            value={stage}
            onChange={(e) => setStage(e.target.value)}
            className={`
              w-full h-[52px] rounded-xl border px-4 text-body-sm bg-white
              focus:outline-none focus:border-blue transition-colors
              ${stage ? 'text-gray-900 border-blue' : 'text-gray-400 border-gray-300'}
            `}
          >
            <option value="" disabled>{t('step3a_treatment.placeholder')}</option>
            {CANCER_TREATMENT_STAGES.map(({ value }) => (
              <option key={value} value={value}>
                {t(`treatmentStage.${value}` as Parameters<typeof t>[0])}
              </option>
            ))}
          </select>
        </div>

        {/* 추적관찰 세부 단계 */}
        {stage === 'followup' && (
          <div>
            <p className="text-body-sm font-bold mb-2">
              <span className="text-blue">{cancerLabel}</span>
              {' '}
              <span className="text-gray-800">{t('step3a_treatment.followupLabel')}</span>
            </p>
            <select
              value={followup}
              onChange={(e) => setFollowup(e.target.value)}
              className={`
                w-full h-[52px] rounded-xl border px-4 text-body-sm bg-white
                focus:outline-none focus:border-blue transition-colors
                ${followup ? 'text-gray-900 border-blue' : 'text-gray-400 border-gray-300'}
              `}
            >
              <option value="" disabled>{t('step3a_treatment.placeholder')}</option>
              {CANCER_FOLLOWUP_STAGES.map(({ value }) => (
                <option key={value} value={value}>
                  {t(`followupStage.${value}` as Parameters<typeof t>[0])}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      <p className="mt-8 text-caption text-gray-300 text-center">{t('step3a_treatment.disclaimer')}</p>
    </SurveyLayout>
  )
}
