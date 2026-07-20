import { useTranslation } from 'react-i18next'
import { useSurveyStore } from '../../../lib/store/surveyStore'
import { GENERAL_HEALTH_GOALS } from '../../../constants'
import { SurveyLayout } from '../components/SurveyLayout'

interface Props {
  currentStep: number
  totalSteps:  number
  onNext:      () => void
  onBack:      () => void
  gender?:     'male' | 'female' | 'other'
  isLoading?:  boolean
}

export function Step3cGoals({ currentStep, totalSteps, onNext, onBack, gender, isLoading }: Props) {
  const { t } = useTranslation('survey')
  const { healthGoals, toggleHealthGoal } = useSurveyStore()

  const visibleGoals = GENERAL_HEALTH_GOALS.filter(
    (g) => !('femaleOnly' in g && g.femaleOnly) || gender === 'female'
  )

  return (
    <SurveyLayout
      currentStep={currentStep}
      totalSteps={totalSteps}
      onBack={onBack}
      onNext={onNext}
      nextLabel={t('step3c_goals.next')}
      nextDisabled={healthGoals.length === 0}
      isLoading={isLoading}
    >
      <h2 className="text-[24px] font-bold text-[#1E293B] tracking-[-0.24px] leading-snug whitespace-pre-line mb-6">
        {t('step3c_goals.title')}
      </h2>

      {/* 전체 너비 리스트 버튼 */}
      <div className="space-y-3">
        {visibleGoals.map(({ value }) => {
          const selected = healthGoals.includes(value)
          return (
            <button
              key={value}
              type="button"
              onClick={() => toggleHealthGoal(value)}
              className={`
                w-full h-[52px] rounded-xl border text-left px-5 text-body-sm font-medium
                transition-colors active:scale-[0.99]
                ${selected
                  ? 'bg-blue border-blue text-white'
                  : 'bg-white border-gray-200 text-gray-800'
                }
              `}
            >
              {t(`generalGoal.${value}` as Parameters<typeof t>[0])}
            </button>
          )
        })}
      </div>

      <p className="mt-6 text-caption text-gray-300 text-center">{t('step3c_goals.disclaimer')}</p>
    </SurveyLayout>
  )
}
