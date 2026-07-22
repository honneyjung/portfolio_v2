import apiClient from './client'
import type { ApiResponse, User, HemilianManager, ConsentItem } from '../../types'

export interface UpdateProfileRequest {
  name?: string
  nickname?: string
  gender?: 'male' | 'female'
  birth_year?: number
  care_type?: string
}

export const usersApi = {
  getMe: () =>
    apiClient.get<ApiResponse<User>>('/users/me'),

  updateProfile: (data: UpdateProfileRequest) =>
    apiClient.patch<ApiResponse<{ id: string; updated: boolean }>>('/users/me/profile', data),

  getHemilianManager: () =>
    apiClient.get<ApiResponse<HemilianManager>>('/users/me/hemilian-manager'),

  connectHemilianManager: (hemilian_code: string) =>
    apiClient.post<ApiResponse<HemilianManager>>('/users/me/hemilian-manager', { hemilian_code }),

  requestChangeHemilianManager: (hemilian_code: string, reason: string) =>
    apiClient.put<ApiResponse<{ status: string }>>('/users/me/hemilian-manager', { hemilian_code, reason }),

  saveConsents: (items: ConsentItem[]) =>
    apiClient.post<ApiResponse<{ saved: boolean }>>('/consents', { items }),

  getConsents: () =>
    apiClient.get<ApiResponse<{ items: ConsentItem[] }>>('/users/me/consents'),

  updateInfoShare: (info_share_agreed: boolean) =>
    apiClient.patch<ApiResponse<{ info_share_agreed: boolean }>>('/users/me/info-share', { info_share_agreed }),
}
