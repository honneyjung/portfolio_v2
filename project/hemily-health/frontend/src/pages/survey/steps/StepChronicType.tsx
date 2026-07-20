import { useSurveyStore } from '../../../lib/store/surveyStore'
import { SurveyLayout } from '../components/SurveyLayout'
import { CHRONIC_TYPES_NEW } from '../../../constants'

interface Props {
  currentStep: number
  totalSteps:  number
  onNext:      () => void
  onBack?:     () => void
}

export function StepChronicType({ currentStep, totalSteps, onNext, onBack }: Props) {
  const { selectedChronics, toggleChronic, clearChronics } = useSurveyStore()

  const handleSelect = (value: string) => {
    if (!selectedChronics.includes(value)) clearChronics()
    toggleChronic(value)
  }

  return (
    <SurveyLayout
      currentStep={currentStep}
      totalSteps={totalSteps}
      onBack={onBack}
      onNext={onNext}
      nextDisabled={selectedChronics.length === 0}
    >
      <h2 className="text-[24px] font-bold text-[#1E293B] tracking-[-0.24px] leading-snug mb-8">
        보유 중인 만성질환을 선택해주세요
      </h2>

      <div className="flex flex-wrap gap-2">
        {CHRONIC_TYPES_NEW.map(({ value, label }) => {
          const selected = selectedChronics.includes(value)
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
