import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQuery } from '@tanstack/react-query'

import { useSurveyStore } from '../../lib/store/surveyStore'
import { surveyApi, diseasesApi } from '../../lib/api/survey'
import type { DiseaseItem } from '../../lib/api/survey'
import { CANCER_TYPES_NEW, CHRONIC_TYPES_NEW } from '../../constants'
import { usersApi } from '../../lib/api/users'

// system_name 우선, 없으면 disease_name(한글)으로 조회
function findDisease(value: string, list: DiseaseItem[]): DiseaseItem | undefined {
  return list.find((d) => d.system_name === value) ?? list.find((d) => d.disease_name === value)
}

import { StepComplete }           from './steps/StepComplete'
import { Step1Profile }          from './steps/Step1Profile'
import { StepCancerYN }          from './steps/StepCancerYN'
import { StepCancerType }        from './steps/StepCancerType'
import { StepCancerStage }       from './steps/StepCancerStage'
import { StepChronicYN }         from './steps/StepChronicYN'
import { StepChronicType }       from './steps/StepChronicType'
import { StepChronicStage }      from './steps/StepChronicStage'
import { StepSymptoms }          from './steps/StepSymptoms'
import { StepMedicationYN }      from './steps/StepMedicationYN'
import { StepMedicationInput }   from './steps/StepMedicationInput'
import { StepGoals }             from './steps/StepGoals'

// ── 스텝 ID ───────────────────────────────────────────────
type StepId =
  | 'profile'
  | 'cancer_yn'
  | 'cancer_type'
  | 'cancer_stage'
  | 'chronic_yn'
  | 'chronic_type'
  | 'chronic_stage'
  | 'symptoms'
  | 'medication_yn'
  | 'medication_input'
  | 'goals'

// 메이저 스텝 매핑 (인디케이터 표시용)
function getMajorStep(stepId: StepId): number {
  if (stepId === 'profile')       return 0   // 인디케이터 숨김
  if (stepId === 'cancer_yn')     return 1
  if (
    stepId === 'cancer_type'   ||
    stepId === 'cancer_stage'  ||
    stepId === 'chronic_yn'    ||
    stepId === 'chronic_type'  ||
    stepId === 'chronic_stage'
  )                               return 2
  if (stepId === 'symptoms')      return 3
  if (
    stepId === 'medication_yn' ||
    stepId === 'medication_input'
  )                               return 4
  // goals
  return 5
}

// ── 다음 스텝 계산 ────────────────────────────────────────
function getNextStep(
  current: StepId,
  hasCancer: boolean | null,
  hasChronic: boolean | null,
  hasMedication: boolean | null,
  selectedCancers: string[],
  selectedChronics: string[],
  wantsGeneralCare: boolean,
): StepId | null {
  switch (current) {
    case 'profile':        return 'cancer_yn'
    case 'cancer_yn':
      // 개인 건강관리(일반인) → 질환 분기 건너뛰고 바로 목표로
      if (wantsGeneralCare) return 'goals'
      return hasCancer ? 'cancer_type' : 'chronic_yn'
    case 'cancer_type':
      return selectedCancers.length > 0 ? 'cancer_stage' : 'chronic_yn'
    case 'cancer_stage':   return 'chronic_yn'
    case 'chronic_yn':
      return hasChronic ? 'chronic_type' : 'symptoms'
    case 'chronic_type':
      return selectedChronics.length > 0 ? 'chronic_stage' : 'symptoms'
    case 'chronic_stage':  return 'symptoms'
    case 'symptoms':       return 'medication_yn'
    case 'medication_yn':
      return hasMedication ? 'medication_input' : 'goals'
    case 'medication_input': return 'goals'
    case 'goals':          return null  // 마지막
  }
}

// 이전 스텝 계산
function getPrevStep(
  current: StepId,
  hasCancer: boolean | null,
  hasChronic: boolean | null,
  hasMedication: boolean | null,
  selectedCancers: string[],
  selectedChronics: string[],
  wantsGeneralCare: boolean,
): StepId | null {
  switch (current) {
    case 'profile':          return null
    case 'cancer_yn':        return 'profile'
    case 'cancer_type':      return 'cancer_yn'
    case 'cancer_stage':     return 'cancer_type'
    case 'chronic_yn':
      if (hasCancer) {
        return selectedCancers.length > 0 ? 'cancer_stage' : 'cancer_type'
      }
      return 'cancer_yn'
    case 'chronic_type':     return 'chronic_yn'
    case 'chronic_stage':    return 'chronic_type'
    case 'symptoms':
      if (hasChronic) {
        return selectedChronics.length > 0 ? 'chronic_stage' : 'chronic_type'
      }
      return 'chronic_yn'
    case 'medication_yn':    return 'symptoms'
    case 'medication_input': return 'medication_yn'
    case 'goals':
      if (wantsGeneralCare) return 'cancer_yn'
      return hasMedication ? 'medication_input' : 'medication_yn'
  }
}

// ── SurveyPage ────────────────────────────────────────────
export default function SurveyPage() {
  const navigate = useNavigate()

  const {
    selectedCancers, selectedChronics,
    cancerDetails, chronicDetails,
    hasCancer, hasChronic, symptoms, hasMedication, medications,
    healthGoals,
    wantsGeneralCare,
    reset,
  } = useSurveyStore()

  const [currentStep,        setCurrentStep]        = useState<StepId>('profile')
  const [completedSurveyId, setCompletedSurveyId]  = useState<string | null>(null)
  const [submitError,        setSubmitError]        = useState<string | null>(null)

  // 질환 마스터 — 설문 시작 시점에 미리 로드해 제출 때 UUID/KCD 코드 조회에 사용
  const { data: diseasesRes } = useQuery({
    queryKey: ['diseases'],
    queryFn: () => diseasesApi.list(),
    staleTime: 24 * 60 * 60 * 1000,
  })
  const allDiseases: DiseaseItem[] = diseasesRes?.data?.items ?? []

  // 일반인(개인 건강관리)은 2단계 흐름: 유형 질문 → 목표
  const totalSteps = wantsGeneralCare ? 2 : 5
  const majorStep  = wantsGeneralCare
    ? (currentStep === 'profile' ? 0 : currentStep === 'goals' ? 2 : 1)
    : getMajorStep(currentStep)

  // ── 제출 뮤테이션 ───────────────────────────────────────
  const submitMutation = useMutation({
    mutationFn: () => {
      const cancerList  = allDiseases.filter((d) => d.disease_category === 'cancer')
      const chronicList = allDiseases.filter((d) => d.disease_category === 'chronic')

      const diseases = [
        ...selectedCancers.map((value) => {
          const found = findDisease(value, cancerList)
          return {
            disease_type:           'cancer' as const,
            disease_id:             found?.id,
            disease_code:           (found?.disease_code ?? value).slice(0, 20),
            name:                   found?.disease_name ?? (CANCER_TYPES_NEW.find((t) => t.value === value)?.label ?? value),
            disease_stage:          cancerDetails[value]?.treatmentStage ?? 'PRE_SURGERY',
            cancer_treatment_stage: cancerDetails[value]?.treatmentStage ?? 'PRE_SURGERY',
          }
        }),
        ...selectedChronics.map((value) => {
          const found = findDisease(value, chronicList)
          return {
            disease_type:           'chronic' as const,
            disease_id:             found?.id,
            disease_code:           (found?.disease_code ?? value).slice(0, 20),
            name:                   found?.disease_name ?? (CHRONIC_TYPES_NEW.find((t) => t.value === value)?.label ?? value),
            disease_stage:          chronicDetails[value]?.managementStage ?? 'initial',
            cancer_treatment_stage: null,
          }
        }),
      ]

      const payload = {
        is_cancer_patient:  hasCancer  ?? false,
        is_chronic_patient: hasChronic ?? false,
        symptoms:           symptoms.length > 0 ? symptoms : null,
        using_medications:  hasMedication && medications.trim() ? [medications.trim()] : null,
        health_goals:       healthGoals.length > 0 ? healthGoals : null,
        diseases:           diseases.length > 0 ? diseases : null,
      }
      console.log('[Survey submit payload]', payload)

      return surveyApi.submitFirst(payload)
    },
    onSuccess: (res) => {
      setSubmitError(null)
      const care_type = hasCancer ? 'cancer' : hasChronic ? 'chronic' : 'general'
      usersApi.updateProfile({ care_type }).catch(() => {})
      reset()
      // 백엔드는 SurveyCreateResponse flat: { survey_id, next_step }
      setCompletedSurveyId(res.data.survey_id)
    },
    onError: (err: unknown) => {
      const axiosErr = err as { response?: { status?: number; data?: unknown } }
      console.error('[Survey submit error]', axiosErr?.response?.status, axiosErr?.response?.data)
      const detail = (axiosErr?.response?.data as { detail?: string })?.detail
      setSubmitError(detail ?? '설문 제출에 실패했어요. 잠시 후 다시 시도해주세요.')
    },
  })

  // ── 네비게이션 ──────────────────────────────────────────
  const goNext = () => {
    const next = getNextStep(
      currentStep, hasCancer, hasChronic, hasMedication, selectedCancers, selectedChronics, wantsGeneralCare
    )
    if (next === null) {
      submitMutation.mutate()
    } else {
      setCurrentStep(next)
    }
  }

  const goBack = () => {
    const prev = getPrevStep(
      currentStep, hasCancer, hasChronic, hasMedication, selectedCancers, selectedChronics, wantsGeneralCare
    )
    if (prev === null) {
      navigate(-1)
    } else {
      setCurrentStep(prev)
    }
  }

  const commonProps = {
    currentStep: majorStep,
    totalSteps:  majorStep === 0 ? 0 : totalSteps,
    onNext:      goNext,
    onBack:      goBack,
  }

  // ── 렌더 ───────────────────────────────────────────────
  if (completedSurveyId) {
    return <StepComplete surveyId={completedSurveyId} />
  }

  if (currentStep === 'profile') {
    return <Step1Profile {...commonProps} />
  }

  if (currentStep === 'cancer_yn') {
    return <StepCancerYN {...commonProps} />
  }

  if (currentStep === 'cancer_type') {
    return <StepCancerType {...commonProps} />
  }

  if (currentStep === 'cancer_stage') {
    return <StepCancerStage {...commonProps} />
  }

  if (currentStep === 'chronic_yn') {
    return (
      <StepChronicYN
        {...commonProps}
        backLabel="돌아가기"
      />
    )
  }

  if (currentStep === 'chronic_type') {
    return <StepChronicType {...commonProps} />
  }

  if (currentStep === 'chronic_stage') {
    return <StepChronicStage {...commonProps} />
  }

  if (currentStep === 'symptoms') {
    return <StepSymptoms {...commonProps} />
  }

  if (currentStep === 'medication_yn') {
    return (
      <StepMedicationYN
        {...commonProps}
        backLabel="돌아가기"
      />
    )
  }

  if (currentStep === 'medication_input') {
    return <StepMedicationInput {...commonProps} />
  }

  if (currentStep === 'goals') {
    return (
      <StepGoals
        {...commonProps}
        isLoading={submitMutation.isPending}
        errorMessage={submitError ?? undefined}
      />
    )
  }

  return null
}
