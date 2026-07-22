import apiClient from './client'
import type { ApiResponse, Survey } from '../../types'

// ── 질환 마스터 (GET /diseases) ─────────────────────────────
export interface DiseaseItem {
  id: string
  disease_category: string   // 'cancer' | 'chronic'
  disease_name: string
  disease_code: string | null  // KCD 코드 (C50, E11 등)
  display_order: number
  system_name: string | null
}

// ── 최초 설문 제출 (백엔드 SurveyCreate 스키마와 일치) ──────
export interface SurveyDiseasePayload {
  disease_type:            'cancer' | 'chronic'
  disease_id?:             string    // diseases.id (UUID) — 리포트 매칭의 핵심 키
  disease_code:            string    // KCD 코드 (C50, E11 등)
  name:                    string
  disease_stage:           string
  cancer_treatment_stage?: string | null
}

export interface FirstSurveyRequest {
  is_cancer_patient:  boolean
  is_chronic_patient: boolean
  symptoms?:          string[] | null
  using_medications?: string[] | null
  health_goals?:      string[] | null
  diseases?:          SurveyDiseasePayload[] | null
}

// 백엔드 SurveyCreateResponse (flat, no ApiResponse wrapper)
export interface SurveyCreateResult {
  survey_id: string
  next_step: string
}

export interface FollowUpSurveyRequest {
  challenge_id:    string
  disease_ids:     string[]
  cancer_details?: Record<string, unknown>
  chronic_details?: Record<string, unknown>
  health_goals?:   string[]
}

export const diseasesApi = {
  list: (category?: string) =>
    apiClient.get<{ items: DiseaseItem[] }>('/diseases', {
      params: category ? { category } : undefined,
    }),
}

export const surveyApi = {
  submitFirst: (data: FirstSurveyRequest) =>
    apiClient.post<SurveyCreateResult>('/surveys', data),

  checkFollowUpEligibility: (challenge_id: string) =>
    apiClient.get<ApiResponse<{ eligible: boolean; last_survey_id: string; challenge_id: string }>>(
      '/surveys/follow-up/eligibility',
      { params: { challenge_id } }
    ),

  submitFollowUp: (data: FollowUpSurveyRequest) =>
    apiClient.post<ApiResponse<Survey>>('/surveys/follow-up', data),
}
