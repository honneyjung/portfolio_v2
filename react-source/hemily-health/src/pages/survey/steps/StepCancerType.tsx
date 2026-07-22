import { useSurveyStore } from '../../../lib/store/surveyStore'
import { SurveyLayout } from '../components/SurveyLayout'
import { CANCER_TYPES_NEW } from '../../../constants'

interface Props {
  currentStep: number
  totalSteps:  number
  onNext:      () => void
  onBack?:     () => void
}

export function StepCancerType({ currentStep, totalSteps, onNext, onBack }: Props) {
  const { selectedCancers, toggleCancer, clearCancers } = useSurveyStore()

  const handleSelect = (value: string) => {
    if (!selectedCancers.includes(value)) clearCancers()
    toggleCancer(value)
  }

  return (
    <SurveyLayout
      currentStep={currentStep}
      totalSteps={totalSteps}
      onBack={onBack}
      onNext={onNext}
      nextDisabled={selectedCancers.length === 0}
    >
      <h2 className="text-[24px] font-bold text-[#1E293B] tracking-[-0.24px] leading-snug mb-8">
        투병 중인 암 유형을 선택해주세요
      </h2>

      <div className="flex flex-wrap gap-2">
        {CANCER_TYPES_NEW.map(({ value, label }) => {
          const selected = selectedCancers.includes(value)
          return (
            <button
              key={value}
              type="button"
              onClick={() => handleSelect(value)}
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
