import apiClient from './client'
import type { ApiResponse, HemilianDashboard, User, Case, CaseUserType, HemilianCaseListItem, HemilianCaseDetail } from '../../types'

export interface CreateCaseRequest {
  case_type: CaseUserType
  member_id?: string          // case_type === 'member'
  customer_name?: string      // case_type === 'non_member' (백엔드 HemilianCaseCreate.customer_name)
  customer_phone?: string     // case_type === 'non_member'
  case_category?: string      // 백엔드 HemilianCaseCreate.case_category
  disease_type?: string       // 백엔드 미저장(추후 지원 예정) — 무시됨
  treatment_stage?: string    // 백엔드 미저장(추후 지원 예정) — 무시됨
  memo?: string
}

export interface UpdateCaseRequest {
  category?: string
  followup_status?: string
  memo?: string
}

export const hemilianApi = {
  getDashboard: () =>
    apiClient.get<ApiResponse<HemilianDashboard>>('/hemilians/dashboard'),

  getMembers: (params?: { keyword?: string; info_share?: boolean; limit?: number; offset?: number }) =>
    apiClient.get<ApiResponse<{ items: User[] }>>('/hemilians/members', { params }),

  searchMembers: (keyword: string) =>
    apiClient.get<ApiResponse<{ items: Array<Pick<User, 'id' | 'name' | 'email'> & { info_share_agreed?: boolean }> }>>(
      '/hemilians/members/search',
      { params: { keyword } }
    ),

  getMemberDetail: (member_id: string) =>
    apiClient.get<ApiResponse<{ member: Pick<User, 'id' | 'name' | 'email'> & { care_type?: string | null }; info_share_agreed: boolean; reports: unknown[]; challenges: unknown[]; memos: unknown[] }>>(
      `/hemilians/members/${member_id}`
    ),

  getCases: (params?: { case_type?: CaseUserType; category?: string; keyword?: string; limit?: number; offset?: number }) =>
    apiClient.get<ApiResponse<{ items: HemilianCaseListItem[]; total: number }>>('/hemilians/cases', { params }),

  createCase: (data: CreateCaseRequest) =>
    apiClient.post<ApiResponse<Case>>('/hemilians/cases', data),

  getCaseDetail: (case_id: string) =>
    apiClient.get<ApiResponse<HemilianCaseDetail>>(`/hemilians/cases/${case_id}`),

  updateCase: (case_id: string, data: UpdateCaseRequest) =>
    apiClient.patch<ApiResponse<{ case_id: string; updated: boolean }>>(
      `/hemilians/cases/${case_id}`,
      data
    ),

  saveMemo: (member_id: string, content: string) =>
    apiClient.post(`/hemilians/members/${member_id}/memos`, { content }),
}
