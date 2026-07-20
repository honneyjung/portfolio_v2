import apiClient from './client'
import type { ApiResponse, MypageSummary, Challenge, ChallengeStatus } from '../../types'

export const mypageApi = {
  getSummary: () =>
    apiClient.get<ApiResponse<MypageSummary>>('/mypage'),

  getReports: () =>
    apiClient.get<ApiResponse<{ items: { report_id: string; created_at: string }[] }>>('/mypage/reports'),

  getChallenges: (params?: { status?: ChallengeStatus | 'abandoned' }) =>
    apiClient.get<ApiResponse<{ items: Challenge[] }>>('/mypage/challenges', { params }),
}
