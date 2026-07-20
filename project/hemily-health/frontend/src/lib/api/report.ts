import apiClient from './client'
import type { ApiResponse, Report, ReportComparison } from '../../types'

export interface GenerateReportRequest {
  survey_id: string
  previous_report_id?: string | null
}

export const reportApi = {
  generate: (data: GenerateReportRequest) =>
    // 백엔드 ReportGenerateResponse flat: { report_id, status }
    apiClient.post<{ report_id: string; status: string }>('/reports/generate', data),

  getMyReports: (params?: { limit?: number; offset?: number }) =>
    apiClient.get<ApiResponse<{ items: Pick<Report, 'id' | 'createdAt'>[] }>>('/reports/me', { params }),

  getById: (report_id: string) =>
    apiClient.get<ApiResponse<Report>>(`/reports/${report_id}`),

  getComparison: (report_id: string) =>
    apiClient.get<ApiResponse<ReportComparison>>(`/reports/${report_id}/comparison`),
}
