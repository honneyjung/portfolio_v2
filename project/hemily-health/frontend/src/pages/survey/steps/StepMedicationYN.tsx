import { useSurveyStore } from '../../../lib/store/surveyStore'
import { SurveyLayout } from '../components/SurveyLayout'

interface Props {
  currentStep: number
  totalSteps:  number
  onNext:      () => void
  onBack?:     () => void
  backLabel?:  string
}

export function StepMedicationYN({ currentStep, totalSteps, onNext, onBack, backLabel }: Props) {
  const { hasMedication, setHasMedication } = useSurveyStore()

  const handleSelect = (value: boolean) => {
    setHasMedication(value)
  }

  return (
    <SurveyLayout
      currentStep={currentStep}
      totalSteps={totalSteps}
      onBack={onBack}
      onNext={onNext}
      nextDisabled={hasMedication === null}
      backLabel={backLabel}
    >
      <h2 className="text-[24px] font-bold text-[#1E293B] tracking-[-0.24px] leading-snug mb-8">
        현재 처방 받거나 복용 중인 약물이 있나요?
      </h2>

      <div className="flex flex-col gap-3">
        {[
          { value: true,  label: '네, 복용 중인 약물이 있습니다.' },
          { value: false, label: '아니요, 없습니다.' },
        ].map(({ value, label }) => (
          <button
            key={String(value)}
            type="button"
            onClick={() => handleSelect(value)}
            className={`
              w-full py-4 px-5 rounded-full text-[14px] font-bold text-left transition-colors
              ${hasMedication === value
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
