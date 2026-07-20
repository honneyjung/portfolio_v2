import apiClient from './client'
import type { ApiResponse, Recognition } from '../../types'

export const recognitionApi = {
  upload: (formData: FormData) =>
    apiClient.post<ApiResponse<{ job_id: string; status: string }>>('/recognitions', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  getStatus: (job_id: string) =>
    apiClient.get<ApiResponse<Recognition>>(`/recognitions/${job_id}`),

  // 원본 이미지 (인증 필요 → blob으로 받아 objectURL 생성). 타임라인 썸네일/상세에 사용
  getImageBlob: (job_id: string) =>
    apiClient.get<Blob>(`/recognitions/${job_id}/image`, { responseType: 'blob' }),
  // 인증샷 승인/반려(검수)는 별도 어드민 시스템에서 처리한다. 멤버 앱에는 검수 액션이 없다.
}
