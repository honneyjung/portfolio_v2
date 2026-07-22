import { useSurveyStore } from '../../../lib/store/surveyStore'
import { SurveyLayout } from '../components/SurveyLayout'

interface Props {
  currentStep: number
  totalSteps:  number
  onNext:      () => void
  onBack?:     () => void
}

export function StepMedicationInput({ currentStep, totalSteps, onNext, onBack }: Props) {
  const { medications, setMedications } = useSurveyStore()

  return (
    <SurveyLayout
      currentStep={currentStep}
      totalSteps={totalSteps}
      onBack={onBack}
      onNext={onNext}
      nextDisabled={medications.trim().length === 0}
    >
      <h2 className="text-[24px] font-bold text-[#1E293B] tracking-[-0.24px] leading-snug mb-2">
        현재 복용 중인 약물을 작성해주세요
      </h2>
      <p className="text-[14px] font-medium text-[#64748B] tracking-[-0.14px] mb-6">
        쉼표(,)로 구분하여 작성해주세요. (예: 메트포르민, 아스피린)
      </p>

      <textarea
        value={medications}
        onChange={(e) => setMedications(e.target.value)}
        placeholder="복용 중인 약물을 입력해주세요"
        className="w-full rounded-2xl border border-[#94A3B8] bg-transparent p-4 text-[14px] text-[#1E293B] min-h-[120px] resize-none focus:outline-none focus:border-[#1E293B] placeholder:text-[#94A3B8]"
      />
    </SurveyLayout>
  )
}
