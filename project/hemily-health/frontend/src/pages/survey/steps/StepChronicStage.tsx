import { useSurveyStore } from '../../../lib/store/surveyStore'
import { SurveyLayout } from '../components/SurveyLayout'
import { CHRONIC_TYPES_NEW, CHRONIC_STAGE_LIST } from '../../../constants'

interface Props {
  currentStep: number
  totalSteps:  number
  onNext:      () => void
  onBack?:     () => void
}

export function StepChronicStage({ currentStep, totalSteps, onNext, onBack }: Props) {
  const { selectedChronics, chronicDetails, setChronicDetail } = useSurveyStore()

  const allFilled = selectedChronics.every(
    (c) => !!chronicDetails[c]?.managementStage
  )

  const getLabelFor = (value: string) =>
    CHRONIC_TYPES_NEW.find((t) => t.value === value)?.label ?? value

  return (
    <SurveyLayout
      currentStep={currentStep}
      totalSteps={totalSteps}
      onBack={onBack}
      onNext={onNext}
      nextDisabled={!allFilled}
    >
      <h2 className="text-[24px] font-bold text-[#1E293B] tracking-[-0.24px] leading-snug mb-8">
        현재 관리 단계를 선택해주세요
      </h2>

      <div className="flex flex-col gap-6">
        {selectedChronics.map((chronic) => (
          <div key={chronic}>
            <p className="text-[13px] font-medium text-[#3B82F6] mb-2">
              {getLabelFor(chronic)} 관리 단계
            </p>
            <select
              value={chronicDetails[chronic]?.managementStage ?? ''}
              onChange={(e) => setChronicDetail(chronic, { managementStage: e.target.value })}
              className="w-full border border-[#94A3B8] rounded-xl px-4 py-3 text-[14px] text-[#1E293B] bg-transparent focus:outline-none focus:border-[#1E293B]"
            >
              <option value="" disabled>단계를 선택해주세요</option>
              {CHRONIC_STAGE_LIST.map(({ value, label }) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>
        ))}
      </div>
    </SurveyLayout>
  )
}
