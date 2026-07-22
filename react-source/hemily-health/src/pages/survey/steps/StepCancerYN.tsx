import { useSurveyStore } from '../../../lib/store/surveyStore'
import { SurveyLayout } from '../components/SurveyLayout'

interface Props {
  currentStep: number
  totalSteps:  number
  onNext:      () => void
  onBack?:     () => void
}

type Choice = 'cancer' | 'other' | 'general'

export function StepCancerYN({ currentStep, totalSteps, onNext, onBack }: Props) {
  const { hasCancer, wantsGeneralCare, setHasCancer, setWantsGeneralCare, clearCancers, clearChronics } =
    useSurveyStore()

  const activeChoice: Choice | null = wantsGeneralCare
    ? 'general'
    : hasCancer === true
      ? 'cancer'
      : hasCancer === false
        ? 'other'
        : null

  const handleSelect = (choice: Choice) => {
    if (choice === 'cancer') {
      setHasCancer(true)
      setWantsGeneralCare(false)
    } else if (choice === 'other') {
      setHasCancer(false)
      setWantsGeneralCare(false)
    } else {
      // 개인 건강관리 → 일반인 유형, 질환 선택 초기화 후 바로 목표로
      setHasCancer(false)
      setWantsGeneralCare(true)
      clearCancers()
      clearChronics()
    }
  }

  const options: { choice: Choice; label: string }[] = [
    { choice: 'cancer',  label: '네, 투병 중입니다.' },
    { choice: 'other',   label: '아니요, 다른 질환을 가지고 있어요.' },
    { choice: 'general', label: '개인 건강관리를 하고싶어요.' },
  ]

  return (
    <SurveyLayout
      currentStep={currentStep}
      totalSteps={totalSteps}
      onBack={onBack}
      onNext={onNext}
      nextDisabled={activeChoice === null}
      footerBackHidden
    >
      <h2 className="text-[24px] font-bold text-[#1E293B] tracking-[-0.24px] leading-snug mb-8">
        현재<br />암 투병 중이신가요?
      </h2>

      <div className="flex flex-col gap-3">
        {options.map(({ choice, label }) => (
          <button
            key={choice}
            type="button"
            onClick={() => handleSelect(choice)}
            className={`
              w-full py-4 px-5 rounded-full text-[14px] font-bold text-left transition-colors
              ${activeChoice === choice
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
