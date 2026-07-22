import { useState } from 'react'
import { useSurveyStore } from '../../../lib/store/surveyStore'
import { SurveyLayout } from '../components/SurveyLayout'
import { HEALTH_GOAL_LIST, GENERAL_GOAL_LIST } from '../../../constants'

interface Props {
  currentStep:   number
  totalSteps:    number
  onNext:        () => void
  onBack?:       () => void
  isLoading?:    boolean
  errorMessage?: string
}

export function StepGoals({ currentStep, totalSteps, onNext, onBack, isLoading, errorMessage }: Props) {
  const { healthGoals, toggleHealthGoal, wantsGeneralCare } = useSurveyStore()
  const [otherText, setOtherText] = useState('')

  // 일반인: 영양 카테고리 13종 (복수 선택·최대 3개 권장) / 그 외: 기존 건강 목표
  const goalList = wantsGeneralCare ? GENERAL_GOAL_LIST : HEALTH_GOAL_LIST
  const MAX_GENERAL = 3

  const hasOther = healthGoals.includes('other')
  const isValid = healthGoals.length > 0 && (!hasOther || otherText.trim().length > 0)

  const handleToggle = (value: string) => {
    const selected = healthGoals.includes(value)
    // 일반인은 최대 3개까지만 추가 선택 (해제는 항상 허용)
    if (!selected && wantsGeneralCare && healthGoals.length >= MAX_GENERAL) return
    toggleHealthGoal(value)
  }

  return (
    <SurveyLayout
      currentStep={currentStep}
      totalSteps={totalSteps}
      onBack={onBack}
      onNext={onNext}
      nextDisabled={!isValid}
      nextLabel="다음(제출)"
      isLoading={isLoading}
    >
      {errorMessage && (
        <p className="mb-4 text-[13px] text-red font-medium text-center">{errorMessage}</p>
      )}

      <h2 className="text-[24px] font-bold text-[#1E293B] tracking-[-0.24px] leading-snug mb-2">
        건강 관리 목표를 선택해주세요
      </h2>
      <p className="text-[13px] text-[#64748B] mb-8">
        {wantsGeneralCare ? '복수 선택 가능 · 최대 3개까지 선택 권장' : '복수 선택 가능'}
      </p>

      <div className="flex flex-col gap-3">
        {goalList.map(({ value, label }) => {
          const selected = healthGoals.includes(value)
          return (
            <div key={value}>
              <button
                type="button"
                onClick={() => handleToggle(value)}
                className={`
                  w-full py-4 px-5 rounded-full text-[14px] font-bold text-left transition-colors
                  ${selected
                    ? 'bg-blue text-white'
                    : 'bg-transparent border border-[#94A3B8] text-[#1E293B]'
                  }
                `}
              >
                {label}
              </button>
              {value === 'other' && selected && (
                <input
                  type="text"
                  value={otherText}
                  onChange={(e) => setOtherText(e.target.value)}
                  placeholder="직접 입력해주세요"
                  className="mt-2 w-full border border-[#94A3B8] rounded-xl px-4 py-3 text-[14px] text-[#1E293B] bg-transparent focus:outline-none focus:border-[#1E293B] placeholder:text-[#94A3B8]"
                />
              )}
            </div>
          )
        })}
      </div>
    </SurveyLayout>
  )
}
