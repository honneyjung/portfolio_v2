import apiClient from './client'
import type { ApiResponse, PointWallet, PointTransaction, PointTransactionStatus } from '../../types'

export const pointApi = {
  getWallet: () =>
    apiClient.get<ApiResponse<PointWallet>>('/points/me/wallet'),

  getTransactions: (params?: { status?: PointTransactionStatus; limit?: number; offset?: number }) =>
    apiClient.get<ApiResponse<{ items: PointTransaction[] }>>('/points/me/transactions', { params }),
}
