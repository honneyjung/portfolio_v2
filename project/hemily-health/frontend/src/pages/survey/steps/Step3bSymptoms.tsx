import { useTranslation } from 'react-i18next'
import { useSurveyStore } from '../../../lib/store/surveyStore'
import { CHRONIC_TYPES, CHRONIC_SYMPTOMS } from '../../../constants'
import type { ChronicTypeValue } from '../../../constants'
import { SurveyLayout } from '../components/SurveyLayout'
import { Chip } from '../components/Chip'

interface Props {
  chronic:     string
  currentStep: number
  totalSteps:  number
  onNext:      () => void
  onBack:      () => void
}

export function Step3bSymptoms({ chronic, currentStep, totalSteps, onNext, onBack }: Props) {
  const { t } = useTranslation('survey')
  const { chronicDetails, setChronicDetail } = useSurveyStore()
  const detail   = chronicDetails[chronic]
  const symptoms = detail?.symptoms ?? []

  const chronicLabel = CHRONIC_TYPES.find((c) => c.value === chronic)
    ? t(`chronicType.${chronic}` as Parameters<typeof t>[0])
    : chronic
  const symptomList = CHRONIC_SYMPTOMS[chronic as ChronicTypeValue] ?? []

  const toggleSymptom = (value: string) => {
    if (value === 'none') {
      setChronicDetail(chronic, { symptoms: ['none'] })
      return
    }
    const next = symptoms.filter((s) => s !== 'none').includes(value)
      ? symptoms.filter((s) => s !== value)
      : [...symptoms.filter((s) => s !== 'none'), value]
    setChronicDetail(chronic, { symptoms: next })
  }

  return (
    <SurveyLayout
      currentStep={currentStep}
      totalSteps={totalSteps}
      onBack={onBack}
      onNext={onNext}
      nextDisabled={symptoms.length === 0}
    >
      <h2 className="text-[24px] font-bold text-[#1E293B] tracking-[-0.24px] leading-snug mb-1">
        {t('step3b_symptoms.title', { chronic: chronicLabel })}
      </h2>
      <p className="text-label text-sub-text tracking-[-0.14px] mb-5">{t('step3b_symptoms.subtitle')}</p>

      <div className="flex flex-wrap gap-2">
        {symptomList.map(({ value }) => (
          <Chip
            key={value}
            label={t(`chronicSymptom.${value}` as Parameters<typeof t>[0])}
            selected={symptoms.includes(value)}
            onClick={() => toggleSymptom(value)}
            disabled={value !== 'none' && symptoms.includes('none')}
          />
        ))}
      </div>

      <p className="mt-8 text-caption text-gray-300 text-center">{t('step3b_symptoms.disclaimer')}</p>
    </SurveyLayout>
  )
}
