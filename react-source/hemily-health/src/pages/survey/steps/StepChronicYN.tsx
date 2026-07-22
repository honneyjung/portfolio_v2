import { useSurveyStore } from '../../../lib/store/surveyStore'
import { SurveyLayout } from '../components/SurveyLayout'

interface Props {
  currentStep: number
  totalSteps:  number
  onNext:      () => void
  onBack?:     () => void
  backLabel?:  string
}

export function StepChronicYN({ currentStep, totalSteps, onNext, onBack, backLabel }: Props) {
  const { hasChronic, setHasChronic } = useSurveyStore()

  const handleSelect = (value: boolean) => {
    setHasChronic(value)
  }

  return (
    <SurveyLayout
      currentStep={currentStep}
      totalSteps={totalSteps}
      onBack={onBack}
      onNext={onNext}
      nextDisabled={hasChronic === null}
      backLabel={backLabel}
    >
      <h2 className="text-[24px] font-bold text-[#1E293B] tracking-[-0.24px] leading-snug mb-8">
        보유하고 있는 만성질환이 있으신가요?
      </h2>

      <div className="flex flex-col gap-3">
        {[
          { value: true,  label: '네, 만성질환이 있습니다.' },
          { value: false, label: '아니요, 가지고 있지 않습니다.' },
        ].map(({ value, label }) => (
          <button
            key={String(value)}
            type="button"
            onClick={() => handleSelect(value)}
            className={`
              w-full py-4 px-5 rounded-full text-[14px] font-bold text-left transition-colors
              ${hasChronic === value
                ? 'bg-blue text-white'
                : 'bg-transparent border border-[#94A3B8] text-[#1E293B]'
              }
            `}
          >
            {label}
          </button>
        ))}
      </div>
    </SurveyLayout>
  )
}
