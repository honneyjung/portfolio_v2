import apiClient from './client'
import type { ApiResponse, Notification } from '../../types'

export const notificationApi = {
  getList: (params?: { is_read?: boolean; limit?: number; offset?: number }) =>
    apiClient.get<ApiResponse<{ items: Notification[] }>>('/notifications', { params }),

  markRead: (notification_id: string) =>
    apiClient.patch<ApiResponse<{ id: string; is_read: boolean }>>(
      `/notifications/${notification_id}/read`
    ),

  markAllRead: () =>
    apiClient.patch<ApiResponse<{ updated_count: number }>>('/notifications/read-all'),
}
