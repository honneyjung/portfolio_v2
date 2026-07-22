import { useSurveyStore } from '../../../lib/store/surveyStore'
import { SurveyLayout } from '../components/SurveyLayout'
import { SYMPTOM_LIST } from '../../../constants'

interface Props {
  currentStep: number
  totalSteps:  number
  onNext:      () => void
  onBack?:     () => void
}

export function StepSymptoms({ currentStep, totalSteps, onNext, onBack }: Props) {
  const { symptoms, toggleSymptom } = useSurveyStore()

  return (
    <SurveyLayout
      currentStep={currentStep}
      totalSteps={totalSteps}
      onBack={onBack}
      onNext={onNext}
      nextDisabled={symptoms.length === 0}
    >
      <h2 className="text-[24px] font-bold text-[#1E293B] tracking-[-0.24px] leading-snug mb-8">
        현재 겪고 계신 증상을 모두 선택해주세요
      </h2>

      <div className="flex flex-wrap gap-2">
        {SYMPTOM_LIST.map(({ value, label }) => {
          const selected = symptoms.includes(value)
          return (
            <button
              key={value}
              type="button"
              onClick={() => toggleSymptom(value)}
              className={`
                px-4 py-2 rounded-full text-[13px] font-medium transition-colors
                ${selected
                  ? 'bg-blue text-white'
                  : 'bg-transparent border border-[#94A3B8] text-[#1E293B]'
                }
              `}
            >
              {label}
            </button>
          )
        })}
      </div>
    </SurveyLayout>
  )
}
