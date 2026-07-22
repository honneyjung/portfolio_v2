import { useTranslation } from 'react-i18next'
import { SurveyLayout } from '../components/SurveyLayout'

export type HealthType = 'cancer' | 'chronic' | 'general' | 'wellness'

const HEALTH_TYPES: HealthType[] = ['chronic', 'cancer', 'general', 'wellness']

interface Props {
  value:    HealthType | null
  onChange: (type: HealthType) => void
  onNext:   () => void
}

export function Step1HealthType({ value, onChange, onNext }: Props) {
  const { t } = useTranslation('survey')

  return (
    <SurveyLayout
      currentStep={1}
      totalSteps={3}
      onNext={onNext}
      nextDisabled={!value}
    >
      {/* 질문 */}
      <div className="mb-6">
        <h2 className="text-[24px] font-bold text-[#1E293B] tracking-[-0.24px] leading-snug whitespace-pre-line mb-2">
          {t('step0.title')}
        </h2>
        <p className="text-label text-sub-text tracking-[-0.14px]">{t('step0.subtitle')}</p>
      </div>

      {/* 선택 카드 */}
      <div className="space-y-3">
        {HEALTH_TYPES.map((type) => {
          const selected = value === type
          return (
            <button
              key={type}
              type="button"
              onClick={() => onChange(type)}
              className={`w-full rounded-2xl px-6 py-5 flex flex-col justify-center text-left
                transition-colors active:scale-[0.99] shadow-sm
                ${selected
                  ? 'bg-blue'
                  : 'bg-transparent border border-[#93AFC7]'
                }`}
            >
              <span className={`text-body-sm font-bold ${selected ? 'text-white' : 'text-gray-900'}`}>
                {t(`step0.${type}.title`)}
              </span>
              <span className={`text-label font-normal mt-0.5 ${selected ? 'text-blue-light/90' : 'text-gray-500'}`}>
                {t(`step0.${type}.sub`)}
              </span>
            </button>
          )
        })}
      </div>
    </SurveyLayout>
  )
}
