import apiClient from './client'
import type { ApiResponse, Product, UserProduct } from '../../types'

export const productApi = {
  getList: (params?: { dna_stage?: 'D' | 'N' | 'A'; tier_type?: 'basic' | 'premium' }) =>
    apiClient.get<ApiResponse<{ items: Product[] }>>('/products', { params }),

  getById: (product_id: string) =>
    apiClient.get<ApiResponse<Product>>(`/products/${product_id}`),
}

export const userProductApi = {
  getMyList: (is_active?: boolean) =>
    apiClient.get<ApiResponse<{ items: UserProduct[] }>>('/user-products', { params: { is_active } }),

  add: (data: { product_id: string; intake_timing: string }) =>
    apiClient.post<ApiResponse<UserProduct>>('/user-products', data),

  update: (id: string, data: { is_active?: boolean; intake_timing?: string }) =>
    apiClient.patch<ApiResponse<{ id: string; updated: boolean }>>(`/user-products/${id}`, data),

  remove: (id: string) =>
    apiClient.delete<ApiResponse<{ deleted: boolean }>>(`/user-products/${id}`),
}
