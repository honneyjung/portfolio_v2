import apiClient from './client'
import type { User } from '../../types'

// 가입 시 선택 가능한 계정 유형 (백엔드: general | hemilian)
export type AccountType = 'general' | 'hemilian'

export interface ConsentItem {
  consent_type: string
  is_agreed: boolean
}

export interface RegisterRequest {
  account_type:           AccountType
  userid:                 string        // 영소문자+숫자 8~19자
  name:                   string
  email?:                 string
  password:               string
  password_confirm:       string
  phone_number?:          string
  gender?:                string
  birth_date?:            string        // YYYY-MM-DD
  hemilian_referral_code?: string       // 일반회원이 담당 해밀리안 연결 시
  hemilian_code?:         string        // 해밀리안 본인 코드
  consents:               ConsentItem[] // 빈 배열 허용 (S-05 동의 페이지에서 별도 처리)
}

export interface LoginRequest {
  userid: string
  password: string
}

export interface AuthTokenResponse {
  access_token: string
  refresh_token: string
}

export interface RegisterTokenResponse extends AuthTokenResponse {
  user_id: string
  next_step: string
  hemilian_code?: string
}

export const authApi = {
  register: (data: RegisterRequest) =>
    apiClient.post<RegisterTokenResponse>('/auth/register', data),

  login: (data: LoginRequest) =>
    apiClient.post<AuthTokenResponse>('/auth/login', data),

  me: () =>
    apiClient.get<User>('/auth/me'),

  // 해밀리안 코드 존재 확인 (available=false → 해당 코드의 해밀리안 존재 = 연결 가능)
  checkHemilianCode: (code: string) =>
    apiClient.get<{ available: boolean }>('/auth/check-hemilian-code', { params: { code } }),

  // 해밀리안 코드로 이름 조회 (회원가입 시 연결 대상 확인용)
  getHemilianInfo: (code: string) =>
    apiClient.get<{ hemilian_code: string; name: string }>('/auth/hemilian-info', { params: { code } }),

  logout: (refresh_token: string) =>
    apiClient.post<{ message: string }>('/auth/logout', { refresh_token }),
}
