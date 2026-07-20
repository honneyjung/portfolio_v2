import { useState, useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { useSurveyStore, calcAgeGroup } from '../../../lib/store/surveyStore'
import { useAuthStore } from '../../../lib/store/authStore'
import { usersApi } from '../../../lib/api/users'
import { SurveyLayout } from '../components/SurveyLayout'
import type { User } from '../../../types'

interface Props {
  currentStep: number
  totalSteps:  number
  onNext:      () => void
  onBack?:     () => void
}

export function Step1Profile({ currentStep, totalSteps, onNext, onBack }: Props) {
  const { t } = useTranslation('survey')
  const { gender, birthDate, setGender, setBirthDate } = useSurveyStore()
  const { user } = useAuthStore()

  // surveyStore > authStore > 빈 값 순으로 초기값 결정
  const initBd = birthDate || user?.birth_date || ''
  const [year,  setYear]  = useState(initBd ? initBd.slice(0, 4)  : '')
  const [month, setMonth] = useState(initBd ? initBd.slice(5, 7)  : '')
  const [day,   setDay]   = useState(initBd ? initBd.slice(8, 10) : '')

  // 마운트 시 authStore 값으로 store 동기화 (surveyStore에 없을 때만)
  useEffect(() => {
    if (user?.birth_date && !birthDate) setBirthDate(user.birth_date)
    if (user?.gender && !gender && (user.gender === 'male' || user.gender === 'female')) {
      setGender(user.gender as 'male' | 'female')
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // /users/me 비동기 응답으로 추가 업데이트 (백엔드가 birth_date/gender를 반환하는 경우)
  // 백엔드는 UserProfileResponse를 flat하게 반환 (ApiResponse 래퍼 없음)
  const { data: profileData } = useQuery({
    queryKey: ['users-me-profile'],
    queryFn: () => usersApi.getMe().then((r) => r.data as unknown as User),
    staleTime: Infinity,
  })
  useEffect(() => {
    const profile = profileData
    if (!profile) return

    const bd = profile.birth_date
    if (bd && !birthDate) {
      setYear(bd.slice(0, 4))
      setMonth(bd.slice(5, 7))
      setDay(bd.slice(8, 10))
      setBirthDate(bd)
    }

    const g = profile.gender
    if (g && !gender && (g === 'male' || g === 'female')) {
      setGender(g)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profileData])

  const ageGroupKey = useMemo(() => {
    if (year.length === 4 && month.length >= 1 && day.length >= 1) {
      const m   = month.padStart(2, '0')
      const d   = day.padStart(2, '0')
      const iso = `${year}-${m}-${d}`
      const date = new Date(iso)
      if (!isNaN(date.getTime()) && date.getFullYear() > 1900) {
        return calcAgeGroup(iso)
      }
    }
    return ''
  }, [year, month, day])

  useEffect(() => {
    if (year.length === 4 && month.length >= 1 && day.length >= 1) {
      const m   = month.padStart(2, '0')
      const d   = day.padStart(2, '0')
      const iso = `${year}-${m}-${d}`
      const date = new Date(iso)
      if (!isNaN(date.getTime()) && date.getFullYear() > 1900) {
        setBirthDate(iso)
      }
    }
  }, [year, month, day, setBirthDate])

  const isValid =
    !!gender &&
    year.length === 4 &&
    month.length >= 1 && parseInt(month) >= 1 && parseInt(month) <= 12 &&
    day.length >= 1   && parseInt(day)   >= 1 && parseInt(day)   <= 31

  const name = (user as { name?: string } | null)?.name ?? ''

  const title = name
    ? `${name} ${t('step1.titleSuffix')}`
    : t('step1.titleNoName')

  return (
    <SurveyLayout
      currentStep={currentStep}
      totalSteps={totalSteps}
      onBack={onBack}
      onNext={onNext}
      nextDisabled={!isValid}
    >
      {/* 타이틀 */}
      <div className="mb-0">
        <h2 className="text-[24px] font-bold text-[#1E293B] tracking-[-0.24px] leading-snug whitespace-pre-line mb-1.5">
          {title}
        </h2>
        <p className="text-label text-sub-text tracking-[-0.14px]">{t('step1.subtitle')}</p>
      </div>

      {/* 기본 프로필 카드 */}
      <div className="bg-[#F8FAFF] border border-[#94A3B8] rounded-2xl px-5 py-4 mt-8 mb-4">
        <p className="text-label text-sub-text tracking-[-0.14px] mb-4">{t('step1.cardTitle')}</p>

        {/* 성별 */}
        <div className="flex items-center justify-between mb-5">
          <span className="text-label text-sub-text tracking-[-0.14px] text-right">{t('step1.genderLabel')}</span>
          <div className="flex gap-2">
            {(['male', 'female'] as const).map((g) => (
              <button
                key={g}
                type="button"
                onClick={() => setGender(g)}
                className={`
                  px-5 py-2 rounded-lg text-body-sm font-bold transition-colors
                  ${gender === g
                    ? 'bg-blue text-white'
                    : 'bg-gray-100 text-gray-500'
                  }
                `}
              >
                {t(`gender.${g}`)}
              </button>
            ))}
          </div>
        </div>

        {/* 구분선 */}
        <div className="h-px bg-[#94A3B8] mb-5" />

        {/* 생년월일 */}
        <div className="flex items-center justify-between">
          <span className="text-label text-sub-text tracking-[-0.14px] text-right">{t('step1.birthdateLabel')}</span>
          <div className="flex items-center gap-1.5">
            <input
              type="number"
              placeholder="YYYY"
              value={year}
              onChange={(e) => setYear(e.target.value.slice(0, 4))}
              className="w-[56px] text-center text-body-sm font-bold text-blue bg-transparent
                         focus:outline-none [appearance:textfield]
                         [&::-webkit-outer-spin-button]:appearance-none
                         [&::-webkit-inner-spin-button]:appearance-none"
            />
            <span className="text-blue font-bold">/</span>
            <input
              type="number"
              placeholder="MM"
              value={month}
              min={1} max={12}
              onChange={(e) => setMonth(e.target.value.slice(0, 2))}
              className="w-[32px] text-center text-body-sm font-bold text-blue bg-transparent
                         focus:outline-none [appearance:textfield]
                         [&::-webkit-outer-spin-button]:appearance-none
                         [&::-webkit-inner-spin-button]:appearance-none"
            />
            <span className="text-blue font-bold">/</span>
            <input
              type="number"
              placeholder="DD"
              value={day}
              min={1} max={31}
              onChange={(e) => setDay(e.target.value.slice(0, 2))}
              className="w-[32px] text-center text-body-sm font-bold text-blue bg-transparent
                         focus:outline-none [appearance:textfield]
                         [&::-webkit-outer-spin-button]:appearance-none
                         [&::-webkit-inner-spin-button]:appearance-none"
            />
          </div>
        </div>
      </div>

      {/* 계산된 나이대 카드 */}
      {ageGroupKey && (
        <div className="bg-blue rounded-2xl px-5 py-4 flex items-center justify-between shadow-sm">
          <div>
            <p className="text-body-sm font-bold text-white">{t('step1.ageGroupCard')}</p>
            <p className="text-label text-blue-light/80 mt-0.5">
              {t('step1.ageGroupNote')}
            </p>
          </div>
          <span className="text-[28px] font-black text-white">
            {t(`ageGroup.${ageGroupKey}` as Parameters<typeof t>[0])}
          </span>
        </div>
      )}
    </SurveyLayout>
  )
}
