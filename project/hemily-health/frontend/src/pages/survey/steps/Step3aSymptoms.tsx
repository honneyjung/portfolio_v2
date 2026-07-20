import { useTranslation } from 'react-i18next'
import { useSurveyStore } from '../../../lib/store/surveyStore'
import { CANCER_TYPES, CANCER_SYMPTOMS, CANCER_GOALS } from '../../../constants'
import { SurveyLayout } from '../components/SurveyLayout'
import { Chip } from '../components/Chip'

interface Props {
  cancer:      string
  currentStep: number
  totalSteps:  number
  onNext:      () => void
  onBack:      () => void
}

export function Step3aSymptoms({ cancer, currentStep, totalSteps, onNext, onBack }: Props) {
  const { t } = useTranslation('survey')
  const { cancerDetails, setCancerDetail } = useSurveyStore()
  const detail   = cancerDetails[cancer]
  const symptoms = detail?.symptoms ?? []
  const goals    = detail?.goals    ?? []

  const cancerLabel = CANCER_TYPES.find((c) => c.value === cancer)
    ? t(`cancerType.${cancer}` as Parameters<typeof t>[0])
    : cancer

  const toggleSymptom = (value: string) => {
    if (value === 'none') {
      setCancerDetail(cancer, { symptoms: ['none'] })
      return
    }
    const next = symptoms.filter((s) => s !== 'none').includes(value)
      ? symptoms.filter((s) => s !== value)
      : [...symptoms.filter((s) => s !== 'none'), value]
    setCancerDetail(cancer, { symptoms: next })
  }

  const toggleGoal = (value: string) => {
    const next = goals.includes(value)
      ? goals.filter((g) => g !== value)
      : [...goals, value]
    setCancerDetail(cancer, { goals: next })
  }

  return (
    <SurveyLayout
      currentStep={currentStep}
      totalSteps={totalSteps}
      onBack={onBack}
      onNext={onNext}
      nextDisabled={symptoms.length === 0 || goals.length === 0}
    >
      <h2 className="text-[24px] font-bold text-[#1E293B] tracking-[-0.24px] leading-snug mb-1">
        {t('step3a_symptoms.symptomTitle', { cancer: cancerLabel })}
      </h2>
      <p className="text-label text-sub-text tracking-[-0.14px] mb-5">{t('step3a_symptoms.symptomSubtitle')}</p>

      <div className="flex flex-wrap gap-2 mb-8">
        {CANCER_SYMPTOMS.map(({ value }) => (
          <Chip
            key={value}
            label={t(`cancerSymptom.${value}` as Parameters<typeof t>[0])}
            selected={symptoms.includes(value)}
            onClick={() => toggleSymptom(value)}
            disabled={value !== 'none' && symptoms.includes('none')}
          />
        ))}
      </div>

      <h2 className="text-[24px] font-bold text-[#1E293B] tracking-[-0.24px] leading-snug mb-1">{t('step3a_symptoms.goalTitle')}</h2>
      <p className="text-label text-sub-text tracking-[-0.14px] mb-5">{t('step3a_symptoms.goalSubtitle')}</p>

      <div className="flex flex-wrap gap-2">
        {CANCER_GOALS.map(({ value }) => (
          <Chip
            key={value}
            label={t(`cancerGoal.${value}` as Parameters<typeof t>[0])}
            selected={goals.includes(value)}
            onClick={() => toggleGoal(value)}
          />
        ))}
      </div>

      <p className="mt-8 text-caption text-gray-300 text-center">{t('step3a_symptoms.disclaimer')}</p>
    </SurveyLayout>
  )
}
