import { useTranslation } from 'react-i18next'
import { useSurveyStore } from '../../../lib/store/surveyStore'
import { SurveyLayout } from '../components/SurveyLayout'

interface Props {
  chronic:     string
  currentStep: number
  totalSteps:  number
  onNext:      () => void
  onBack:      () => void
}

export function Step3bMedication({ chronic, currentStep, totalSteps, onNext, onBack }: Props) {
  const { t } = useTranslation('survey')
  const { chronicDetails, setChronicDetail } = useSurveyStore()
  const detail        = chronicDetails[chronic]
  const hasMedication = detail?.hasMedication

  const select = (value: boolean) =>
    setChronicDetail(chronic, { hasMedication: value })

  return (
    <SurveyLayout
      currentStep={currentStep}
      totalSteps={totalSteps}
      onBack={onBack}
      onNext={onNext}
      nextDisabled={hasMedication === undefined}
    >
      <h2 className="text-[24px] font-bold text-[#1E293B] tracking-[-0.24px] leading-snug whitespace-pre-line mb-8">
        {t('step3b_medication.title')}
      </h2>

      <div className="space-y-3">
        {([true, false] as const).map((value) => (
          <button
            key={String(value)}
            type="button"
            onClick={() => select(value)}
            className={`
              w-full py-4 rounded-full text-body-sm font-bold transition-colors
              ${hasMedication === value
                ? 'bg-blue text-white'
                : 'bg-white border border-gray-300 text-gray-700'
              }
            `}
          >
            {value ? t('step3b_medication.yes') : t('step3b_medication.no')}
          </button>
        ))}
      </div>
    </SurveyLayout>
  )
}
